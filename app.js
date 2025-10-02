const KEY = "vocab_words_v1";
let words = JSON.parse(localStorage.getItem(KEY) || "[]");
const $ = (s) => document.querySelector(s);
const view = $("#view");

// 初回ロード時
if (words.length === 0) {
  fetch("words.json")
    .then(r => r.json())
    .then(d => { words = d; save(); renderLearn(); });
} else {
  renderLearn();
}
function save() { localStorage.setItem(KEY, JSON.stringify(words)); }

$("#modeLearn").onclick = renderLearn;
$("#modeList").onclick = renderList;
$("#modeAdd").onclick = renderAdd;

function renderLearn() {
  if (words.length === 0) return view.innerHTML = "<p>単語がありません</p>";
  const q = words[Math.floor(Math.random() * words.length)];
  view.innerHTML = `
    <h2>${q.en}</h2>
    <input id="answer" placeholder="答えは？" />
    <button id="check">答え合わせ</button>
    <p id="result"></p>
  `;
  $("#check").onclick = () => {
    const ans = $("#answer").value.trim().toLowerCase();
    const ok = ans === q.ja.toLowerCase();
    $("#result").textContent = ok ? "✅ 正解" : `❌ 正解は ${q.ja}`;
  };
}

function renderList() {
  view.innerHTML = "<ul>" +
    words.map(w => `<li>${w.en} - ${w.ja}</li>`).join("") +
    "</ul>";
}

function renderAdd() {
  view.innerHTML = `
    <input id="en" placeholder="英語" />
    <input id="ja" placeholder="日本語" />
    <button id="add">追加</button>
  `;
  $("#add").onclick = () => {
    words.push({ en: $("#en").value, ja: $("#ja").value });
    save(); alert("追加しました"); renderList();
  };
}
