import fs from "node:fs";
import path from "node:path";
import {
  getReikiInsertCount,
  reikiVisuals,
} from "./reiki-visual-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const reviewRoot = path.join(
  siteRoot,
  "artifacts",
  "reiki-visual-production",
);
const selectionPath = path.join(reviewRoot, "selection.json");

const titles = [
  "Что такое Рейки",
  "Что такое инициация",
  "Первая ступень Рейки",
  "21 день после инициации",
  "Рейки I и Рейки II",
  "Можно ли научиться самостоятельно",
  "Самосеанс Рейки",
  "Ощущения во время Рейки",
  "Опасно ли Рейки",
  "Как выбрать Мастера",
  "Ошибки начинающих",
  "Мастер-Учитель",
  "Что после Рейки II",
  "Третья ступень в разных школах",
  "Смена Мастера или школы",
  "Готовность к мастерской ступени",
  "Мастер Рейки для себя",
  "Нужна ли переинициация",
];

const pageStyles = `
  :root { color-scheme: light; --ink:#292319; --muted:#675e52; --gold:#8d692f; --line:#d9c9a7; --paper:#fffdf8; }
  * { box-sizing:border-box; }
  body { margin:0; background:#f6f0e3; color:var(--ink); font-family:Arial,sans-serif; }
  header { padding:42px clamp(20px,5vw,72px); border-bottom:1px solid var(--line); background:var(--paper); }
  h1,h2 { margin:0; font-family:Georgia,serif; font-weight:500; }
  header p { max-width:820px; margin:12px 0 0; color:var(--muted); line-height:1.6; }
  main { padding:32px clamp(20px,5vw,72px) 72px; }
  .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px; }
  .card { overflow:hidden; border:1px solid var(--line); border-radius:3px 3px 24px 3px; background:var(--paper); }
  .card img { display:block; width:100%; aspect-ratio:4/3; object-fit:cover; background:#ddd5c7; }
  .copy { padding:18px; }
  .number { color:var(--gold); font-size:12px; font-weight:800; letter-spacing:.12em; }
  h2 { margin-top:8px; font-size:24px; line-height:1.08; }
  .copy p { margin:10px 0 0; color:var(--muted); line-height:1.55; }
  .variants { display:grid; grid-template-columns:1fr 1fr; gap:4px; background:#ede4d2; }
  .variants figure { margin:0; background:#fff; }
  .variants figcaption { padding:7px 10px; color:var(--muted); font-size:11px; }
  .proof { display:grid; grid-template-columns:1.25fr 1fr 1fr; gap:8px; padding:8px; background:#ede4d2; }
  .proof img { height:100%; aspect-ratio:auto; }
  .explainer { margin-bottom:22px; padding:24px; border:1px solid var(--line); background:var(--paper); }
  .explainer .flow { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; margin-top:18px; }
  .step { padding:16px; border-top:3px solid #b78a3e; background:#faf6ec; }
  .step span { color:var(--gold); font-size:12px; font-weight:800; }
  .step strong { display:block; margin-top:8px; }
  .step p { color:var(--muted); line-height:1.45; }
  @media(max-width:900px){ .grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
  @media(max-width:620px){ .grid{grid-template-columns:1fr;} .proof{grid-template-columns:1fr;} }
`;

function htmlPage(title, lead, body) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title}</title>
  <style>${pageStyles}</style>
</head>
<body>
  <header><h1>${title}</h1><p>${lead}</p></header>
  <main>${body}</main>
</body>
</html>`;
}

function publicPath(filePath) {
  return `/${path.relative(siteRoot, filePath).replaceAll("\\", "/")}`;
}

function findCandidate(number, letter) {
  const roots = ["01-06", "07-12", "13-18"];
  for (const group of roots) {
    const directory = path.join(
      reviewRoot,
      "candidates",
      group,
      String(number).padStart(2, "0"),
    );
    if (!fs.existsSync(directory)) continue;
    const file = fs
      .readdirSync(directory)
      .find((name) => name.toLowerCase().startsWith(`candidate-${letter}.`));
    if (file) return publicPath(path.join(directory, file));
  }
  return "";
}

function renderStoryboard() {
  const cards = reikiVisuals
    .map((visual, index) => {
      const a = findCandidate(visual.number, "a");
      const b = findCandidate(visual.number, "b");
      const images = [a, b]
        .filter(Boolean)
        .map(
          (src, candidateIndex) =>
            `<figure><img src="${src}" alt=""><figcaption>Кандидат ${candidateIndex === 0 ? "A" : "B"}</figcaption></figure>`,
        )
        .join("");
      return `<article class="card">
        <div class="variants">${images || "<p>Кандидаты ещё не созданы</p>"}</div>
        <div class="copy">
          <span class="number">СТАТЬЯ ${String(visual.number).padStart(2, "0")}</span>
          <h2>${titles[index]}</h2>
          <p>${visual.alt}</p>
        </div>
      </article>`;
    })
    .join("\n");
  return htmlPage(
    "Storyboard 18 статей о Рейки",
    "Два визуальных кандидата для каждой темы. Серия должна читаться как Рейки в обычной жизни — без эзотерического театра и повторяющихся wellness-сцен.",
    `<div class="grid">${cards}</div>`,
  );
}

function renderContactSheet(selection) {
  const cards = reikiVisuals
    .map((visual, index) => {
      const selected = selection[String(visual.number).padStart(2, "0")] || selection[String(visual.number)];
      const source = selected ? `/${selected.source.replaceAll("\\", "/")}` : "";
      return `<article class="card">
        ${source ? `<img src="${source}" alt="${visual.alt}">` : ""}
        <div class="proof">
          <img src="${visual.basePath}/hero-480.webp" alt="">
          <img src="${visual.basePath}/card-480.webp" alt="">
          <img src="${visual.basePath}/og-1200.jpg" alt="">
        </div>
        <div class="copy">
          <span class="number">СТАТЬЯ ${String(visual.number).padStart(2, "0")}</span>
          <h2>${titles[index]}</h2>
          <p>${visual.alt}</p>
          <p>${selected?.reason || ""}</p>
        </div>
      </article>`;
    })
    .join("\n");
  return htmlPage(
    "Contact sheet выбранных Hero",
    "Для каждого материала показаны исходный выбранный кадр, Hero 4:3, карточка 16:10 и OG 1200×630.",
    `<div class="grid">${cards}</div>`,
  );
}

function renderInserts() {
  const inserts = reikiVisuals
    .flatMap((visual) =>
      visual.inserts.map(
        (insert) => `<section class="explainer">
        <span class="number">СТАТЬЯ ${String(visual.number).padStart(2, "0")} · ${insert.type}</span>
        <h2>${insert.id}</h2>
        <p><strong>После раздела:</strong> ${insert.afterTitle}</p>
        <p>${insert.description}</p>
      </section>`,
      ),
    )
    .join("\n");
  return htmlPage(
    `${getReikiInsertCount()} внутренних визуалов`,
    "Инвентарь редакционных иллюстраций, маршрутов, сравнений, спектров и навигационных плакатов.",
    inserts,
  );
}

fs.mkdirSync(reviewRoot, { recursive: true });
fs.writeFileSync(path.join(reviewRoot, "storyboard.html"), renderStoryboard(), "utf8");
fs.writeFileSync(path.join(reviewRoot, "inserts.html"), renderInserts(), "utf8");

if (fs.existsSync(selectionPath)) {
  const selection = JSON.parse(fs.readFileSync(selectionPath, "utf8"));
  fs.writeFileSync(
    path.join(reviewRoot, "contact-sheet.html"),
    renderContactSheet(selection),
    "utf8",
  );
}

console.log("Built Reiki visual review pages.");
