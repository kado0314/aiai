const KEY = "vocab_words_v1";
// wordsを読み込む際、correctCountがない単語には 0 を初期値として設定
let words = JSON.parse(localStorage.getItem(KEY) || "[]").map(w => ({
    ...w,
    correctCount: w.correctCount || 0 // 既存のデータに count がなければ 0 を設定
}));

const $ = (s) => document.querySelector(s);
const view = $("#view");

// 初回ロード時
if (words.length === 0) {
  fetch("words.json")
    .then(r => r.json())
    .then(d => {
      // words.jsonからロードした単語にも correctCount: 0 を設定
      words = d.map(w => ({ ...w, correctCount: 0 }));
      save();
      renderLearn();
    })
    .catch(e => {
        console.error("Failed to load words.json:", e);
        view.innerHTML = "<p>初期データのロードに失敗しました。words.jsonを確認してください。</p>";
    });
} else {
  renderLearn();
}

function save() { 
    localStorage.setItem(KEY, JSON.stringify(words)); 
}

$("#modeLearn").onclick = renderLearn;
$("#modeList").onclick = renderList;
$("#modeAdd").onclick = renderAdd;

// --- Nextボタンと多様な出題に対応した renderLearn ---
function renderLearn() {
  if (words.length === 0) return view.innerHTML = "<p>単語がありません</p>";

  // 1. 習熟度に基づいて出題単語を選択 (correctCountが低い単語が出やすい)
  const totalWeight = words.reduce((sum, w) => sum + (3 - Math.min(w.correctCount, 2)), 0);
  let randomWeight = Math.random() * totalWeight;
  let qIndex = 0;
  for (let i = 0; i < words.length; i++) {
    const weight = 3 - Math.min(words[i].correctCount, 2);
    randomWeight -= weight;
    if (randomWeight < 0) {
      qIndex = i;
      break;
    }
  }
  const q = words[qIndex];

  // 2. 出題モードをランダムに決定
  const isEnToJa = Math.random() < 0.5; // true: 英語->日本語, false: 日本語->英語
  const questionText = isEnToJa ? q.en : q.ja;
  const answerTarget = isEnToJa ? q.ja : q.en;
  const placeholderText = isEnToJa ? "日本語の答えは？" : "英語の答えは？";
  
  view.innerHTML = `
    <h2>${questionText}</h2>
    <p style="font-size: 0.8em; color: #666;">出題方向: ${isEnToJa ? '英語 → 日本語' : '日本語 → 英語'}</p>
    <input id="answer" placeholder="${placeholderText}" />
    <div id="action-buttons">
        <button id="check">答え合わせ</button>
    </div>
    <p id="result"></p>
  `;

  $("#check").onclick = () => {
    const ans = $("#answer").value.trim().toLowerCase();
    const ok = ans === answerTarget.toLowerCase();
    
    // 結果を表示
    if (ok) {
        $("#result").textContent = "✅ 正解";
        // 習熟度を更新
        q.correctCount = (q.correctCount || 0) + 1;
    } else {
        $("#result").textContent = `❌ 不正解です。正解は ${answerTarget}`;
        // 不正解の場合はカウントをリセット（または減らす）
        q.correctCount = Math.max(0, (q.correctCount || 0) - 1);
    }
    
    save(); // 習熟度を保存

    // --- Nextボタンを動的に追加するロジック ---
    $("#check").disabled = true; // 答え合わせボタンを使えなくする
    
    // Nextボタンを追加
    $("#action-buttons").innerHTML += `<button id="next" style="background-color: #4CAF50;">Next</button>`;
    
    // Nextボタンが押されたら次の問題へ
    $("#next").onclick = renderLearn;
    // --- ------------------------------------
  };
}

// --- リスト表示機能 ---
function renderList() {
    // 習熟度の高い順にソート
    const sortedWords = [...words].sort((a, b) => b.correctCount - a.correctCount);

    view.innerHTML = "<ul>" +
        sortedWords.map(w => {
            const status = w.correctCount >= 3 ? '🎉 完璧' : 
                           w.correctCount >= 1 ? '✏️ 学習中' : 
                           '🔴 未着手';
            return `<li>
                <span style="font-weight: bold;">${w.en} - ${w.ja}</span>
                <span style="font-size: 0.8em; color: #666;">(${status} / Count: ${w.correctCount})</span>
            </li>`;
        }).join("") +
        "</ul>";
}

// --- 単語追加機能（一括インポートに対応） ---
function renderAdd() {
  view.innerHTML = `
    <h3>単語の個別追加</h3>
    <input id="en" placeholder="英語" />
    <input id="ja" placeholder="日本語" />
    <button id="add">個別に追加</button>
    
    <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
    
    <h3>単語の一括インポート</h3>
    <textarea id="bulkData" placeholder="例:&#10;apple,りんご&#10;book,本" rows="5" style="width: 100%; resize: vertical;"></textarea>
    <button id="bulkAdd">一括で追加</button>
  `;

  // 個別追加のロジック
  $("#add").onclick = () => {
    const en = $("#en").value.trim();
    const ja = $("#ja").value.trim();
    if (en && ja) {
      words.push({ en: en, ja: ja, correctCount: 0 });
      save(); 
      alert(`「${en} - ${ja}」を追加しました。`); 
      renderList();
    } else {
      alert("英語と日本語の両方を入力してください。");
    }
  };
  
  // 一括インポートのロジック
  $("#bulkAdd").onclick = () => {
    const data = $("#bulkData").value.trim();
    if (!data) return alert("データを入力してください。");
    
    const lines = data.split('\n').filter(line => line.trim() !== '');
    let addedCount = 0;
    
    lines.forEach(line => {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        words.push({ en: parts[0], ja: parts[1], correctCount: 0 });
        addedCount++;
      }
    });

    if (addedCount > 0) {
        save();
        alert(`${addedCount}件の単語を一括追加しました。`);
        renderList();
    } else {
        alert("有効な単語データが見つかりませんでした。形式を確認してください (英語,日本語)。");
    }
  };
}
