import fs from "node:fs";
import path from "node:path";
import {
  archetypeArticleInserts,
  archetypeCharacters,
} from "./archetype-article-inserts.mjs";

const root = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(root, "docs", "seo", "archetypes", "production");
const draftsRoot = path.join(productionRoot, "drafts");
const manifestPath = path.join(productionRoot, "portfolio-routes.json");
const baseUrl = "https://evolution.yourbalancerestored.com";
const publishedDate = "2026-07-27";
const author = "Светлана Страусс";
const authorUrl = "/o-shkole.html";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const articles = manifest.assets.filter((item) => item.index_state === "index");
const byId = new Map(articles.map((item) => [item.route_id, item]));

const visualAlt = {
  L01: "Женщина отделяет живое желание от накопившихся обязательств",
  R01: "Женщина замечает первый самостоятельный шаг на развилке",
  R02: "Женщина выбирает цвета и фактуры, сверяясь со своим вкусом",
  R03: "Женщина идёт по своему маршруту, сохраняя близость и границы",
  R04: "Женщина собирает ясную систему из нескольких решений",
  R05: "Партнёры согласуют общий план, сохраняя равную ответственность",
  L03: "Две женщины передают друг другу целую задачу вместо части нагрузки",
  L05: "Женщина снимает требование заслуживать одобрение",
  L04: "Женщина замечает напряжение в спокойной повседневной обстановке",
  L06: "Женщина возвращает себе личное пространство в отношениях",
  S05: "Три обычные жизненные сцены показывают разные способы действовать",
  R06: "Женщина сохраняет внутренний центр среди обычных домашних дел",
  R07: "Забота передаёт опору, но не забирает самостоятельность",
  R08: "Женщина спокойно выбирает путь в ситуации неопределённости",
  L07: "Женщина отказывает в лишней нагрузке и сохраняет контакт",
  L08: "Женщина возвращает место собственному делу в жизни семьи",
  L09: "Забота за общим столом распределяется между несколькими людьми",
  S06: "Одна и та же функция показана как опора и как перегрузка",
  S04: "Мужчины разных возрастов используют разные способы действовать",
  L10: "Женщина отделяет свою ответственность от задач других людей",
  L12: "Женщина принимает помощь, не отказываясь от своей ответственности",
  L13: "После завершённого проекта женщина замечает пространство для нового",
  L15: "Женщина переводит желание в одно конкретное действие",
  L16: "Женщина добавляет вкус и живой выбор в точную стратегию",
};

const hubTeasers = {
  S05: "Понятная карта архетипов: как узнавать повторяющиеся способы действовать, выбирать и строить отношения с жизнью.",
  S06: "Один архетип может быть точной опорой или создавать перегрузку. Разбираем, как заметить переход между этими состояниями.",
  L01: "От жизни, собранной из обязательств, — к первому живому желанию, которое можно проверить конкретным действием.",
  R01: "Персефона помогает услышать желание, повзрослеть в выборе и превратить внутреннее «хочу» в собственный шаг.",
  R02: "Афродита возвращает чувствительность к красоте, телу и удовольствию — и помогает снова почувствовать вкус своей жизни.",
  R03: "Артемида соединяет направление, границы и действие: как двигаться к цели, сохраняя контакт с собой и другими.",
  R04: "Афина видит структуру и собирает стратегию. Материал о ясных решениях, последовательности и живом выборе внутри плана.",
  R05: "Гера раскрывает зрелый союз: общие решения, договорённости, верность своему выбору и равное место двух людей.",
  R06: "Гестия создаёт внутренний центр — тихое пространство, из которого легче слышать себя и возвращаться к главному.",
  R07: "Деметра показывает заботу, которая питает самостоятельность: поддержать, передать опору и сохранить место для собственной жизни.",
  R08: "Геката помогает завершать, различать развилки и придавать замыслу форму, когда прежний путь уже закончился.",
  L03: "Когда вся система держится на вас: как увидеть реальный объём нагрузки и передать другому человеку целую зону ответственности.",
  L05: "От привычки заслуживать одобрение — к собственному выбору, спокойному несогласию и праву занимать своё место.",
  L04: "Почему напряжение остаётся даже в тишине и как вернуть телу ощущение завершённости, опоры и безопасной паузы.",
  L06: "Как вернуть себе голос, желания и личное пространство в отношениях, сохраняя близость и уважение к партнёру.",
  L07: "Практика спокойного отказа: взять паузу, обозначить границу и ответить ясно, сохраняя контакт с человеком.",
  L08: "Как снова включить собственные желания в расписание жизни и перейти от инерции к заботе из наполненности.",
  L09: "Помощь, которая оставляет человеку его силу: определить объём участия, разделить ответственность и сохранить свой ресурс.",
  L10: "Сильная позиция опирается на ясную зону ответственности. Разбираем, где заканчивается руководство и начинается давление.",
  L12: "Передать задачу целиком, принять помощь и перестать всё переделывать самой: практическая карта ответственности и доверия.",
  L13: "Цель достигнута, а впереди тишина. Как завершить прежний маршрут и заметить, из чего начинает собираться следующий этап.",
  L15: "Желание становится движением, когда появляется ясный первый шаг. Разбираем путь от внутреннего импульса к действию.",
  L16: "Когда система работает идеально, но жизнь потеряла вкус: как вернуть в стратегию любопытство, удовольствие и личный выбор.",
  S04: "Восемь мужских архетипов как восемь функций действия, силы, порядка, глубины, творчества и контакта с жизнью.",
};

const groups = [
  {
    id: "start",
    title: "С чего начать",
    description: "Сначала разобраться в языке метода и увидеть общую карту.",
    ids: ["S05", "S06", "S03"],
  },
  {
    id: "women",
    title: "Восемь женских архетипов",
    description: "Восемь функций, которые помогают желать, выбирать, действовать, заботиться, строить союз и сохранять внутренний центр.",
    ids: ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08"],
  },
  {
    id: "themes",
    title: "Жизненные темы",
    description: "Практические материалы о желаниях, границах, отношениях, нагрузке, выборе и следующем этапе жизни.",
    ids: ["L01", "L03", "L05", "L04", "L06", "L07", "L08", "L09", "L10", "L12", "L13", "L15", "L16"],
  },
  {
    id: "men",
    title: "Мужская система",
    description: "Карта восьми функций, связанных с действием, силой, порядком, глубиной, творчеством и масштабом.",
    ids: ["S04"],
  },
];

const hubOrder = [
  "S05",
  "S06",
  "L01",
  "R01",
  "R02",
  "R03",
  "R04",
  "R05",
  "R06",
  "R07",
  "R08",
  "L03",
  "L05",
  "L04",
  "L06",
  "L07",
  "L08",
  "L09",
  "L10",
  "L12",
  "L13",
  "L15",
  "L16",
  "S04",
];
const hubNumber = new Map(hubOrder.map((routeId, index) => [routeId, index + 1]));
const featuredRouteIds = new Set(hubOrder.slice(0, 3));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripHtml(value) {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseInline(value) {
  const tokens = [];
  let text = String(value).replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, label, href) => {
      const token = `\u0000LINK${tokens.length}\u0000`;
      tokens.push(`<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`);
      return token;
    },
  );
  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  return text.replace(/\u0000LINK(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function renderTable(lines) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim()),
  );
  return `<div class="article-table-wrap"><table>
    <thead><tr>${rows[0].map((cell) => `<th>${parseInline(cell)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .slice(2)
      .map((row) => `<tr>${row.map((cell) => `<td>${parseInline(cell)}</td>`).join("")}</tr>`)
      .join("")}</tbody>
  </table></div>`;
}

function renderBlocks(lines) {
  const output = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line || line === "---") {
      index += 1;
      continue;
    }
    if (/^<!--[\s\S]*-->$/.test(line)) {
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      output.push(`<h3>${parseInline(line.slice(4))}</h3>`);
      index += 1;
      continue;
    }
    if (line.startsWith(">")) {
      const quote = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      output.push(`<blockquote>${quote.map((item) => `<p>${parseInline(item)}</p>`).join("")}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      output.push(`<ul>${items.map((item) => `<li>${parseInline(item)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      output.push(`<ol>${items.map((item) => `<li>${parseInline(item)}</li>`).join("")}</ol>`);
      continue;
    }
    if (line.startsWith("|")) {
      const table = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        table.push(lines[index].trim());
        index += 1;
      }
      output.push(renderTable(table));
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(### |>|[-*]\s+|\d+\.\s+|\||<!--)/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${parseInline(paragraph.join(" "))}</p>`);
  }
  return output.join("\n");
}

function parseDraft(article) {
  const source = fs
    .readFileSync(path.join(productionRoot, article.source), "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "");
  const lines = source.split("\n");
  const h1Index = lines.findIndex((line) => line.startsWith("# "));
  if (h1Index < 0) throw new Error(`Missing H1 in ${article.source}.`);
  const h1 = lines[h1Index].slice(2).trim();
  const sections = [];
  const intro = [];
  let current = null;
  for (const line of lines.slice(h1Index + 1)) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.slice(3).trim(), lines: [] };
      continue;
    }
    (current ? current.lines : intro).push(line);
  }
  if (current) sections.push(current);
  return { h1, intro, sections, source };
}

function characterPicture(slug) {
  const character = archetypeCharacters[slug];
  const base = `/assets/archetype-articles/inserts/characters/${slug}`;
  return `<figure class="archetype-insert__character archetype-insert__character--${slug}">
    <picture>
      <source type="image/webp" srcset="${base}/portrait-360.webp 360w, ${base}/portrait-560.webp 560w, ${base}/portrait-760.webp 760w" sizes="(max-width: 720px) 42vw, 270px">
      <img src="${base}/portrait-560.jpg" alt="${escapeHtml(character.alt)}" width="560" height="700" loading="lazy" decoding="async">
    </picture>
    <figcaption>${escapeHtml(character.name)}</figcaption>
  </figure>`;
}

function renderArchetypeInsert(article) {
  const insert = archetypeArticleInserts[article.route_id];
  if (!insert) return "";
  const routeClass = `archetype-insert--route-${article.route_id.toLowerCase()}`;
  const layoutClass = insert.layout ? ` archetype-insert--layout-${insert.layout}` : "";
  const characters = insert.characters.map(characterPicture).join("");
  const characterNames = insert.characters
    .map((slug) => archetypeCharacters[slug].name)
    .join(" · ");
  const nodes = insert.items
    .map(
      ([title, text], index) => `<li style="--node-index:${index}">
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(text)}</strong>
      </li>`,
    )
    .join("");
  return `<figure class="archetype-insert archetype-insert--${insert.type} ${routeClass}${layoutClass}" aria-labelledby="archetype-insert-${article.route_id}">
    <div class="archetype-insert__portrait${insert.characters.length > 1 ? " archetype-insert__portrait--multi" : ""}" aria-label="Архетипические образы">
      ${characters}
      ${insert.characters.length > 1 ? `<p class="archetype-insert__character-legend">${escapeHtml(characterNames)}</p>` : ""}
    </div>
    <div class="archetype-insert__explanation">
      <p class="archetype-insert__eyebrow">${escapeHtml(insert.eyebrow)}</p>
      <h3 id="archetype-insert-${article.route_id}">${escapeHtml(insert.title)}</h3>
      <p class="archetype-insert__description">${escapeHtml(insert.description)}</p>
      <ol class="archetype-insert__nodes">${nodes}</ol>
    </div>
  </figure>`;
}

function renderSection(section, index, article) {
  const marker = section.lines.findIndex((line) => line.includes("ROUTE_CTA"));
  const lines = marker >= 0 ? section.lines.filter((_, lineIndex) => lineIndex !== marker) : section.lines;
  const insert = archetypeArticleInserts[article.route_id]?.after === section.title
    ? renderArchetypeInsert(article)
    : "";
  return `<section id="section-${index + 1}">
    <h2>${parseInline(section.title)}</h2>
    ${renderBlocks(lines)}
    ${insert}
  </section>`;
}

function shell() {
  const source = fs.readFileSync(
    path.join(root, "biblioteka", "reiki", "chto-takoe-reiki", "index.html"),
    "utf8",
  );
  let header = source.slice(source.indexOf("<header"), source.indexOf("</header>") + 9);
  let footer = source.slice(source.indexOf("<footer"), source.indexOf("<script src=\"/script.js\""));
  const localStrip = `<nav class="eh-local-strip" aria-label="Навигация по Пути архетипов">
      <div class="eh-shell-container">
        <a href="/arhetipy.html">Карта пути</a>
        <a href="/arhetipy-method.html">Метод архетипов</a>
        <a href="/lightness/">Вкус лёгкости</a>
        <a href="/strength/">Вкус силы</a>
        <a href="/mentoring/">Высокая Глубина</a>
        <a href="/retreats/">Ретриты</a>
        <a class="eh-local-strip__articles" href="/arhetipy/">Статьи об архетипах</a>
      </div>
    </nav>`;
  header = header.replace(/<nav class="eh-local-strip"[\s\S]*?<\/nav>/, localStrip);
  return { header, footer };
}

function responsivePicture(article, variant = "hero") {
  const id = article.route_id.toLowerCase();
  const base = `/assets/archetype-articles/${id}`;
  if (variant === "card") {
    return `<picture class="article-responsive-image article-responsive-image--card">
      <source type="image/webp" srcset="${base}/card-480.webp 480w, ${base}/card-800.webp 800w, ${base}/card-1200.webp 1200w" sizes="(max-width: 720px) calc(100vw - 40px), 360px">
      <img src="${base}/card-800.jpg" alt="${escapeHtml(visualAlt[article.route_id])}" width="800" height="500" loading="lazy" decoding="async">
    </picture>`;
  }
  return `<picture class="article-responsive-image article-responsive-image--hero">
    <source type="image/webp" srcset="${base}/hero-480.webp 480w, ${base}/hero-768.webp 768w, ${base}/hero-1200.webp 1200w, ${base}/hero-1600.webp 1600w" sizes="(max-width: 900px) calc(100vw - 40px), 42vw">
    <img src="${base}/hero-1200.jpg" alt="${escapeHtml(visualAlt[article.route_id])}" width="1200" height="900" decoding="async" fetchpriority="high">
  </picture>`;
}

function relatedArticles(article) {
  const index = articles.findIndex((item) => item.route_id === article.route_id);
  const candidates = [
    articles[(index + 1) % articles.length],
    articles[(index + articles.length - 1) % articles.length],
    byId.get(article.route_id.startsWith("R") ? "S06" : "S05"),
  ].filter(Boolean);
  const unique = [...new Map(candidates.map((item) => [item.route_id, item])).values()]
    .filter((item) => item.route_id !== article.route_id)
    .slice(0, 3);
  return `<aside class="article-related" aria-labelledby="related-${article.route_id}">
    <div class="article-related__head">
      <div>
        <p class="article-related__eyebrow">Продолжить разбираться</p>
        <h2 id="related-${article.route_id}">Связанные материалы</h2>
      </div>
      <a href="/arhetipy/">Все статьи об архетипах →</a>
    </div>
    <div class="article-related__grid">
      ${unique
        .map((item) => {
          const draft = parseDraft(item);
          return `<a class="article-related__card clickable-card" href="${item.canonical}">
            <span>Материал</span>
            <strong>${escapeHtml(draft.h1)}</strong>
            <em>Читать →</em>
          </a>`;
        })
        .join("")}
    </div>
  </aside>`;
}

function schemaFor(article, draft) {
  const canonical = `${baseUrl}${article.canonical}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        headline: draft.h1,
        description: article.meta_description,
        datePublished: publishedDate,
        dateModified: publishedDate,
        inLanguage: "ru",
        mainEntityOfPage: canonical,
        image: `${baseUrl}/assets/archetype-articles/${article.route_id.toLowerCase()}/og-1200.jpg`,
        author: {
          "@type": "Person",
          name: author,
          url: `${baseUrl}${authorUrl}`,
        },
        publisher: {
          "@type": "Organization",
          name: "Evolution House",
          url: `${baseUrl}/`,
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/assets/evolution-house-logo-approved.png`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Библиотека",
            item: `${baseUrl}/biblioteka.html`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Архетипы",
            item: `${baseUrl}/arhetipy/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: draft.h1,
            item: canonical,
          },
        ],
      },
    ],
  };
}

function articleHtml(article) {
  const draft = parseDraft(article);
  const canonical = `${baseUrl}${article.canonical}`;
  const image = `${baseUrl}/assets/archetype-articles/${article.route_id.toLowerCase()}/og-1200.jpg`;
  const sourceWords = stripHtml(draft.source).split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(4, Math.round(sourceWords / 180));
  const shellParts = shell();
  const articleBreadcrumb = `<nav class="library-breadcrumb library-breadcrumb--header" aria-label="Путь страницы">
      <div class="eh-shell-container">
        <a href="/biblioteka.html">Библиотека</a><span>→</span>
        <a href="/arhetipy/#stati">Архетипы</a><span>→</span>
        <span>${escapeHtml(draft.h1)}</span>
      </div>
    </nav>`;
  const themedHeader = shellParts.header
    .replaceAll("eh-context--reiki", "eh-context--archetypes")
    .replace(
      'class="eh-local-strip__articles" href="/arhetipy/"',
      'class="eh-local-strip__articles" href="/arhetipy/" aria-current="location"',
    );
  const localStrip = themedHeader.match(/<nav class="eh-local-strip"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const header = themedHeader.replace(/<nav class="eh-local-strip"[\s\S]*?<\/nav>/, "");
  const introHtml = renderBlocks(draft.intro);
  const articleBodyClass = introHtml
    ? "article-body"
    : "article-body article-body--without-intro";
  const toc = draft.sections
    .map(
      (section, index) =>
        `<li><a href="#section-${index + 1}">${escapeHtml(section.title)}</a></li>`,
    )
    .join("");
  const body = draft.sections
    .map((section, index) => renderSection(section, index, article))
    .join("");
  const outputPath = path.join(root, article.canonical.replace(/^\/|\/$/g, ""), "index.html");

  return {
    outputPath,
    html: `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(article.seo_title)}</title>
  <meta name="description" content="${escapeHtml(article.meta_description)}">
  <meta name="author" content="${author}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(draft.h1)}">
  <meta property="og:description" content="${escapeHtml(article.meta_description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(visualAlt[article.route_id])}">
  <meta property="og:url" content="${canonical}">
  <meta property="article:published_time" content="${publishedDate}">
  <meta property="article:modified_time" content="${publishedDate}">
  <meta property="article:author" content="${author}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260727-archetypes-visual-audit">
  <link rel="stylesheet" href="/assets/archetype-articles/inserts/archetype-inserts.css?v=20260727-visual-audit">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(schemaFor(article, draft), null, 2)}</script>
</head>
<body class="article-page article-page--archetypes eh-context--archetypes">
  ${header}
  ${localStrip}
  ${articleBreadcrumb}
  <main>
    <header class="article-hero">
      <div class="eh-shell-container article-hero__grid">
        <div>
          <a class="article-back-link" href="/arhetipy/">← Все статьи об архетипах</a>
          <p class="article-kicker">Библиотека · Путь архетипов</p>
          <h1>${escapeHtml(draft.h1)}</h1>
          <p class="article-hero__lead">${escapeHtml(article.meta_description)}</p>
          <div class="article-meta">
            <span>${author}</span>
            <span><time datetime="${publishedDate}">27.07.2026</time></span>
            <span>${readingTime} минут чтения</span>
          </div>
        </div>
        <figure class="article-hero__visual">${responsivePicture(article)}</figure>
      </div>
    </header>
    <div class="eh-shell-container article-layout">
      <nav class="article-toc" aria-label="Содержание статьи">
        <strong>В этой статье</strong>
        <ol>${toc}</ol>
      </nav>
      <article class="${articleBodyClass}">${introHtml ? `
        <div class="article-intro">${introHtml}</div>` : ""}
        ${body}
        ${relatedArticles(article)}
        <aside class="article-author" aria-label="Об авторе">
          <div class="article-author__portrait">
            <img src="/assets/svetlana-archetype-yellow.jpg" alt="${author}" width="1200" height="1600" loading="lazy">
          </div>
          <div>
            <p class="article-author__label">Автор статьи</p>
            <h2>${author}</h2>
            <p>Основательница Evolution House и автор прикладной системы архетипов. Использует архетипический язык как карту для наблюдения и выбора, а не как диагноз или обещание судьбы.</p>
            <a href="${authorUrl}">Об авторе и школе →</a>
          </div>
        </aside>
      </article>
    </div>
  </main>
  ${shellParts.footer}
  <script src="/archetype-route.js?v=20260727-archetypes-visual-audit" defer></script>
  <script src="/script.js"></script>
</body>
</html>`,
  };
}

function card(article, featured = false) {
  const draft = parseDraft(article);
  return `<a class="article-list-card clickable-card${featured ? " article-list-card--featured" : ""}" href="${article.canonical}">
    <div class="article-list-card__visual">${responsivePicture(article, "card")}</div>
    <div class="article-list-card__body">
      <span class="article-list-card__eyebrow">Материал · ${article.route_id}</span>
      <h3>${escapeHtml(draft.h1)}</h3>
      <p>${escapeHtml(hubTeasers[article.route_id] || article.meta_description)}</p>
      <span class="article-list-card__link">Читать →</span>
    </div>
  </a>`;
}

function readingMinutes(article) {
  const draft = parseDraft(article);
  const sourceWords = stripHtml(draft.source).split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(sourceWords / 180));
}

function hubFeaturedCard(article) {
  const draft = parseDraft(article);
  const number = String(hubNumber.get(article.route_id)).padStart(2, "0");
  return `<a class="article-card clickable-card" href="${article.canonical}">
    ${responsivePicture(article, "card")}
    <div class="article-card__copy">
      <span class="article-card__meta">Статья ${number} · ${readingMinutes(article)} минут</span>
      <h2>${escapeHtml(draft.h1)}</h2>
      <p>${escapeHtml(hubTeasers[article.route_id])}</p>
      <span class="article-card__link">Читать статью →</span>
    </div>
  </a>`;
}

function hubCompactCard(article) {
  const draft = parseDraft(article);
  const number = String(hubNumber.get(article.route_id)).padStart(2, "0");
  return `<a class="article-compact-card clickable-card" href="${article.canonical}">
    <span class="article-compact-card__number">${number}</span>
    <div>
      <h3>${escapeHtml(draft.h1)}</h3>
      <p>${escapeHtml(hubTeasers[article.route_id])}</p>
      <span>Читать →</span>
    </div>
  </a>`;
}

function collectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Статьи об архетипах",
    url: `${baseUrl}/arhetipy/`,
    isPartOf: { "@type": "WebSite", name: "Evolution House", url: `${baseUrl}/` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}${article.canonical}`,
      })),
    },
  };
}

function hubHtml() {
  const shellParts = shell();
  const header = shellParts.header.replace(
    'class="eh-local-strip__articles" href="/arhetipy/"',
    'class="eh-local-strip__articles" href="/arhetipy/" aria-current="page"',
  );
  const featured = hubOrder
    .slice(0, 3)
    .map((id) => hubFeaturedCard(byId.get(id)))
    .join("");
  const sections = groups
    .filter((group) => group.id !== "start")
    .map((group, index) => {
      const ids = group.ids.filter((id) => !featuredRouteIds.has(id));
      const tone = index % 2 === 0 ? "library-section--sage" : "library-section--paper";
      return `<section id="${group.id}" class="library-section ${tone}">
        <div class="eh-shell-container">
          <div class="library-section__head">
            <div><p class="library-kicker">Путь архетипов</p><h2>${group.title}</h2></div>
            <p>${group.description}</p>
          </div>
          <div class="article-compact-grid">${ids.map((id) => hubCompactCard(byId.get(id))).join("")}</div>
        </div>
      </section>`;
    })
    .join("");
  const formats = [
    {
      eyebrow: "мягкий старт",
      title: "Вкус лёгкости",
      description:
        "Онлайн-неделя женских архетипов: короткий формат с практиками, чтобы вернуть контакт с телом, желанием, вкусом и живым «я хочу».",
      href: "/lightness/",
      image: "/assets/archetype-lightness.webp",
    },
    {
      eyebrow: "сила и опора",
      title: "Вкус силы",
      description:
        "Онлайн-неделя мужских архетипов: формат про границы, действие, опору, масштаб и способность держать свой следующий шаг.",
      href: "/strength/",
      image: "/assets/archetype-strength.webp",
    },
    {
      eyebrow: "глубокая тема",
      title: "Высокая Глубина",
      description:
        "Онлайн-менторинг, где вокруг одной важной темы собирается индивидуальный маршрут, практика и сопровождение.",
      href: "/mentoring/",
      image: "/assets/archetype-mentoring.jpg",
    },
    {
      eyebrow: "живое погружение",
      title: "Острова Везения",
      description:
        "Ретриты, в которых архетипическая работа соединяется с телом, движением, практикой и живой группой.",
      href: "/retreats/",
      image: "/assets/retreat-phuket-line-of-luck.png",
    },
  ];
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Архетипы: статьи, метод и карта пути | Evolution House</title>
  <meta name="description" content="Статьи Светланы Страусс об архетипах, жизненных темах, ресурсе и тени. Карта женской и мужской системы и вход в расчёт кода.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Статьи об архетипах | Evolution House">
  <meta property="og:description" content="Архетипы как карта жизненных функций, текущих тем и следующего шага.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${baseUrl}/assets/archetype-articles/s05/og-1200.jpg">
  <meta property="og:url" content="${baseUrl}/arhetipy/">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${baseUrl}/arhetipy/">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260727-archetypes-purple">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(collectionSchema(), null, 2)}</script>
</head>
<body class="library-page library-page--archetypes eh-context--archetypes">
  ${header}
  <main>
    <nav class="library-breadcrumb" aria-label="Путь страницы">
      <div class="eh-shell-container"><a href="/biblioteka.html">Библиотека</a><span>→</span><span>Архетипы</span></div>
    </nav>
    <section class="article-list-hero" id="stati">
      <div class="eh-shell-container article-list-hero__grid">
        <div>
          <p class="library-kicker">Библиотека · Путь архетипов</p>
          <h1>Статьи об архетипах</h1>
          <p>Понятный язык жизненных функций: желания, выбора, границ, заботы, действия и внутреннего центра.</p>
        </div>
        <p class="article-list-hero__count"><strong>${articles.length}</strong> материала</p>
      </div>
    </section>
    <section class="library-section library-section--paper">
      <div class="eh-shell-container">
        <div class="library-section__head"><div><p class="library-kicker">Начать здесь</p><h2>Сначала — общая карта</h2></div><p>Три входа: понять термин, различить ресурс и тень, увидеть тему «хочу» и «надо».</p></div>
        <div class="article-card-grid">${featured}</div>
      </div>
    </section>
    ${sections}
    <section class="library-section library-section--formats">
      <div class="eh-shell-container">
        <div class="library-section__head"><div><p class="library-kicker">Форматы пути</p><h2>От чтения — к практике</h2></div><p>Статьи помогают разобраться. Формат выбирается отдельно — по теме, готовности и нужной глубине сопровождения.</p></div>
        <div class="archetype-format-grid">
          ${formats
            .map(
              (item) => `<a class="archetype-format-card clickable-card" href="${item.href}">
                <img src="${item.image}" alt="" width="1200" height="750" loading="lazy">
                <div><span>${item.eyebrow}</span><h3>${item.title}</h3><p>${item.description}</p><em>Посмотреть формат →</em></div>
              </a>`,
            )
            .join("")}
        </div>
      </div>
    </section>
    <section class="archetype-path-bridge">
      <div class="eh-shell-container archetype-path-bridge__grid">
        <div><p class="library-kicker">Продолжить путь</p><h2>От статьи — к карте направления</h2><p>Карта пути показывает действующие форматы работы с архетипами и помогает выбрать подходящую глубину знакомства с методом.</p></div>
        <div class="archetype-path-bridge__actions"><a class="button button--primary" href="/arhetipy.html">Открыть карту пути</a><a class="button button--secondary" href="/arhetipy-method.html">Как устроен метод</a></div>
      </div>
    </section>
  </main>
  ${shellParts.footer}
  <script src="/script.js"></script>
</body>
</html>`;
}

function womenHubHtml() {
  const shellParts = shell();
  const women = ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08"].map((id) => byId.get(id));
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Женские архетипы: 8 функций и их значение | Evolution House</title>
  <meta name="description" content="Персефона, Афродита, Артемида, Афина, Гера, Гестия, Деметра и Геката: восемь функций женской архетипической системы, их ресурсы и жизненные проявления.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Женские архетипы | Evolution House">
  <meta property="og:description" content="Восемь функций женской архетипической системы — ресурс, перегрузка и жизненное проявление.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${baseUrl}/assets/archetype-articles/r01/og-1200.jpg">
  <meta property="og:url" content="${baseUrl}/zhenskie-arhetipy/">
  <meta name="robots" content="index, follow">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${baseUrl}/zhenskie-arhetipy/">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260727-archetypes-purple">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
</head>
<body class="library-page library-page--archetypes eh-context--archetypes">
  ${shellParts.header}
  <main>
    <nav class="library-breadcrumb" aria-label="Путь страницы"><div class="eh-shell-container"><a href="/arhetipy/">Архетипы</a><span>→</span><span>Женские архетипы</span></div></nav>
    <section class="article-list-hero"><div class="eh-shell-container article-list-hero__grid"><div><p class="library-kicker">Карта системы</p><h1>Восемь женских архетипов</h1><p>Восемь функций, которые по-разному проявляются в ресурсе, выборе, отношениях и повседневных действиях.</p></div><p class="article-list-hero__count"><strong>8</strong> функций</p></div></section>
    <section class="library-section library-section--paper"><div class="eh-shell-container"><div class="article-list-grid">${women.map((item) => card(item)).join("")}</div></div></section>
    <section class="archetype-path-bridge"><div class="eh-shell-container archetype-path-bridge__grid"><div><p class="library-kicker">Продолжить путь</p><h2>От архетипов — к действующим форматам</h2><p>Карта направления помогает увидеть весь путь: от знакомства с методом до практики, сопровождения и живых форматов.</p></div><div class="archetype-path-bridge__actions"><a class="button button--primary" href="/arhetipy.html">Открыть карту пути</a><a class="button button--secondary" href="/arhetipy-method.html">Как устроен метод</a></div></div></section>
  </main>
  ${shellParts.footer}<script src="/script.js"></script>
</body>
</html>`;
}

function cleanGeneratedHtml(html) {
  return html
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

for (const article of articles) {
  const output = articleHtml(article);
  fs.mkdirSync(path.dirname(output.outputPath), { recursive: true });
  fs.writeFileSync(output.outputPath, cleanGeneratedHtml(output.html), "utf8");
}
fs.mkdirSync(path.join(root, "arhetipy"), { recursive: true });
fs.writeFileSync(
  path.join(root, "arhetipy", "index.html"),
  cleanGeneratedHtml(hubHtml()),
  "utf8",
);
fs.mkdirSync(path.join(root, "zhenskie-arhetipy"), { recursive: true });
fs.writeFileSync(
  path.join(root, "zhenskie-arhetipy", "index.html"),
  cleanGeneratedHtml(womenHubHtml()),
  "utf8",
);
console.log(`Generated ${articles.length} archetype articles and 2 system pages.`);
