import fs from "node:fs";
import path from "node:path";

const siteRoot = path.resolve(import.meta.dirname, "..");
const pilotRoot = path.join(
  siteRoot,
  "artifacts",
  "reiki-internal-visual-pilots",
);

const pilots = [
  {
    number: "01",
    slug: "chto-takoe-reiki",
    title: "Что такое Рейки",
    target: "Сеанс, обучение и инициация",
    mode: "image",
    caption:
      "Три разные ситуации: получить сеанс, учиться с Мастером и продолжать практику самостоятельно.",
  },
  {
    number: "04",
    slug: "21-den-posle-iniciacii-reiki",
    title: "21 день после инициации",
    target: "А если я пропустил день",
    mode: "fragment",
  },
  {
    number: "09",
    slug: "opasno-li-reiki",
    title: "Опасно ли Рейки",
    target: "Рядом с лечением — не вместо лечения",
    mode: "fragment",
  },
  {
    number: "13",
    slug: "chto-posle-reiki-2",
    title: "Что после Рейки II",
    target: "Как устроен путь дальше",
    mode: "fragment",
  },
  {
    number: "14",
    slug: "tretya-stupen-reiki",
    title: "Третья ступень в разных школах",
    target: "Три модели мастерской ступени, которые важно различать",
    mode: "fragment",
  },
  {
    number: "18",
    slug: "pereiniciaciya-reiki",
    title: "Нужна ли переинициация",
    target: "Четыре ситуации, которые важно не смешивать",
    mode: "fragment",
  },
];

function textOf(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function articleContext(pilot) {
  const file = path.join(
    siteRoot,
    "biblioteka",
    "reiki",
    pilot.slug,
    "index.html",
  );
  const html = fs.readFileSync(file, "utf8");
  const sections = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/gi)].map(
    (match) => match[0],
  );
  const index = sections.findIndex((section) => {
    const h2 = section.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/i)?.[0] || "";
    return textOf(h2) === pilot.target;
  });
  if (index < 0) {
    throw new Error(`Could not find "${pilot.target}" in ${pilot.slug}.`);
  }
  return {
    before: sections[index],
    after: sections[index + 1] || "",
  };
}

function visualMarkup(pilot, variant) {
  const directory = path.join(pilotRoot, pilot.number);
  if (pilot.mode === "image") {
    const imagePath = path.join(directory, `variant-${variant}.png`);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Missing ${imagePath}`);
    }
    const publicPath = `/${path
      .relative(siteRoot, imagePath)
      .replaceAll("\\", "/")}`;
    return `<figure class="pilot-editorial">
      <img src="${publicPath}" alt="${pilot.caption}" width="1536" height="1024">
      <figcaption>${pilot.caption}</figcaption>
    </figure>`;
  }
  const fragmentPath = path.join(directory, `variant-${variant}.html`);
  if (!fs.existsSync(fragmentPath)) {
    throw new Error(`Missing ${fragmentPath}`);
  }
  return fs.readFileSync(fragmentPath, "utf8");
}

function page(pilot, variant) {
  const context = articleContext(pilot);
  const visual = visualMarkup(pilot, variant);
  const label = variant.toUpperCase();
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${pilot.number}${label} · ${pilot.title}</title>
  <link rel="stylesheet" href="/styles.css?v=20260724-pilot">
  <link rel="stylesheet" href="/article-library.css?v=20260724-pilot">
  <style>
    body { background:#f8f2e5; }
    .pilot-header { padding:22px clamp(16px,4vw,48px); background:#233e32; color:#fff; }
    .pilot-header span { display:block; font-size:12px; letter-spacing:.13em; text-transform:uppercase; opacity:.76; }
    .pilot-header strong { display:block; margin-top:5px; font:500 clamp(22px,3vw,34px)/1.08 Georgia,serif; }
    .pilot-shell { width:min(100% - 28px,760px); margin:34px auto 72px; }
    .pilot-shell .article-body { width:100%; }
    .pilot-visual-slot { margin:30px 0 38px; }
    .pilot-editorial { overflow:hidden; margin:0; border-radius:4px 4px 28px 4px; background:#e9dfca; box-shadow:0 18px 44px rgba(67,51,30,.12); }
    .pilot-editorial img { display:block; width:100%; height:auto; aspect-ratio:3/2; object-fit:cover; }
    .pilot-editorial figcaption { padding:14px 18px 16px; color:#4c4438; font-size:14px; line-height:1.5; background:#fffdf7; }
    .pilot-next { opacity:.72; }
    @media(max-width:520px) {
      .pilot-shell { width:min(100% - 20px,760px); margin-top:22px; }
      .pilot-visual-slot { margin:24px 0 30px; }
      .pilot-editorial { border-radius:3px 3px 20px 3px; }
    }
  </style>
</head>
<body class="article-page eh-context--reiki">
  <header class="pilot-header">
    <span>Пилот ${pilot.number} · вариант ${label} · отдельный preview</span>
    <strong>${pilot.title}</strong>
  </header>
  <main class="pilot-shell">
    <article class="article-body">
      ${context.before}
      <div class="pilot-visual-slot">${visual}</div>
      <div class="pilot-next">${context.after}</div>
    </article>
  </main>
</body>
</html>`;
}

function indexPage() {
  const cards = pilots
    .flatMap((pilot) =>
      ["a", "b"].map(
        (variant) => `<a class="pilot-card" href="./preview-${pilot.number}-${variant}.html">
          <span>Статья ${pilot.number} · вариант ${variant.toUpperCase()}</span>
          <strong>${pilot.title}</strong>
          <small>Открыть in-page preview</small>
        </a>`,
      ),
    )
    .join("");
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Пилоты внутренних визуалов Рейки</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f6efe1;color:#2b241b;font-family:Arial,sans-serif}
    header{padding:44px clamp(20px,6vw,78px);background:#fffdf8;border-bottom:1px solid #d8c7a5}
    h1{margin:0;font:500 clamp(34px,5vw,64px)/1 Georgia,serif}p{max-width:780px;line-height:1.6;color:#665b4c}
    main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:30px clamp(20px,6vw,78px) 70px}
    .pilot-card{min-height:170px;padding:22px;border:1px solid #d7c49f;border-radius:4px 4px 24px 4px;background:#fffdf8;color:inherit;text-decoration:none;transition:.2s}
    .pilot-card:hover,.pilot-card:focus-visible{transform:translate(5px,-7px);background:#eef4e6;box-shadow:0 18px 34px rgba(55,45,31,.13)}
    .pilot-card span,.pilot-card small{display:block;color:#8d682c;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .pilot-card strong{display:block;margin:18px 0;font:500 25px/1.08 Georgia,serif}
    @media(max-width:860px){main{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){main{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header><h1>Шесть пилотов, два варианта</h1><p>Отдельная доска для выбора визуального языка. Ни один пилот пока не встроен в генератор статей.</p></header>
  <main>${cards}</main>
</body>
</html>`;
}

fs.mkdirSync(pilotRoot, { recursive: true });
for (const pilot of pilots) {
  for (const variant of ["a", "b"]) {
    fs.writeFileSync(
      path.join(pilotRoot, `preview-${pilot.number}-${variant}.html`),
      page(pilot, variant),
      "utf8",
    );
  }
}
fs.writeFileSync(path.join(pilotRoot, "index.html"), indexPage(), "utf8");
console.log("Built 12 internal visual pilot previews.");
