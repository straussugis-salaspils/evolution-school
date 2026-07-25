import fs from "node:fs";
import path from "node:path";
import { getTransitionVisual } from "./transition-article-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const draftsRoot = path.join(
  siteRoot,
  "docs",
  "seo",
  "transitions",
  "production",
  "drafts",
);
const baseUrl = "https://evolution.yourbalancerestored.com";
const publishedDate = "2026-07-24";
const author = "Светлана Страус";
const hubRoute = "/biblioteka/perehody/";
const hubTitle = "Статьи о пересборке жизни и переходах | Evolution House";
const hubDescription =
  "Статьи Светланы Страус о жизненных переходах: как увидеть следующий этап, принять решение, начать заново и пересобрать жизнь без резких обещаний.";

const sourceOrder = [
  "kak-ponyat-chego-ya-hochu.md",
  "zhizn-zashla-v-tupik.md",
  "ne-mogu-prinyat-reshenie.md",
  "kak-nachat-zhizn-zanovo.md",
  "zhivu-ne-svoyu-zhizn.md",
  "kak-nayti-sebya-posle-40.md",
  "vse-est-no-nichego-ne-raduet.md",
  "kak-reshitsya-na-peremeny.md",
  "novaya-zhizn-posle-razvoda.md",
  "deti-vyrosli-chto-dalshe.md",
  "cel-dostignuta-chto-dalshe.md",
  "vse-ponimayu-no-nichego-ne-menyaetsya.md",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function unquote(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function topField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? unquote(match[1]) : "";
}

function nestedObject(frontmatter, key) {
  const lines = frontmatter.replace(/\r/g, "").split("\n");
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) return null;
  const result = {};
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !line.startsWith(" ")) break;
    const match = line.match(/^\s{2}([a-z_]+):\s*(.*)$/);
    if (match) result[match[1]] = unquote(match[2]);
  }
  return Object.keys(result).length ? result : null;
}

function nestedObjectArray(frontmatter, key) {
  const lines = frontmatter.replace(/\r/g, "").split("\n");
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) return [];
  const output = [];
  let current = null;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !line.startsWith(" ")) break;
    const startItem = line.match(/^\s{2}-\s+([a-z_]+):\s*(.*)$/);
    if (startItem) {
      current = { [startItem[1]]: unquote(startItem[2]) };
      output.push(current);
      continue;
    }
    const field = line.match(/^\s{4}([a-z_]+):\s*(.*)$/);
    if (field && current) current[field[1]] = unquote(field[2]);
  }
  return output;
}

function splitSource(source, filename) {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter in ${filename}.`);
  return { frontmatter: match[1], markdown: match[2] };
}

function parseInline(value) {
  const tokens = [];
  let text = String(value).replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, label, href) => {
      const token = `\u0000LINK${tokens.length}\u0000`;
      tokens.push(
        `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`,
      );
      return token;
    },
  );
  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  return text.replace(/\u0000LINK(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}

function renderTable(lines) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim()),
  );
  const header = rows[0];
  const body = rows.slice(2);
  return `<div class="article-table-wrap"><table>
            <thead><tr>${header.map((cell) => `<th>${parseInline(cell)}</th>`).join("")}</tr></thead>
            <tbody>${body
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${parseInline(cell)}</td>`).join("")}</tr>`,
              )
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
      !/^(### |>|[-*]\s+|\d+\.\s+|\|)/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${parseInline(paragraph.join(" "))}</p>`);
  }
  return output.join("\n          ");
}

function extractFaq(section) {
  const items = [];
  for (let index = 0; index < section.lines.length; index += 1) {
    const line = section.lines[index].trim();
    if (!line.startsWith("### ") || !line.endsWith("?")) continue;
    const question = line.slice(4).trim();
    const answer = [];
    for (let cursor = index + 1; cursor < section.lines.length; cursor += 1) {
      const next = section.lines[cursor].trim();
      if (next.startsWith("### ")) break;
      if (next) answer.push(next);
    }
    if (answer.length) items.push({ question, answer: answer.join(" ") });
  }
  return items;
}

function parseDraft(filename) {
  const source = fs.readFileSync(path.join(draftsRoot, filename), "utf8");
  const { frontmatter, markdown: rawMarkdown } = splitSource(source, filename);
  const markdown = rawMarkdown
    .split(/\n## Редакторские примечания/)[0]
    .trim();
  const lines = markdown.split("\n");
  const h1Index = lines.findIndex((line) => line.startsWith("# "));
  if (h1Index < 0) throw new Error(`Missing H1 in ${filename}.`);
  const h1 = lines[h1Index].slice(2).trim();
  const number = Number(topField(frontmatter, "article_number"));
  const route = topField(frontmatter, "slug");
  const declaredH1 = topField(frontmatter, "h1");
  if (declaredH1 && declaredH1 !== h1) {
    throw new Error(`Frontmatter H1 differs from article H1 in ${filename}.`);
  }
  const sections = [];
  let current = { title: "", lines: [] };
  for (const line of lines.slice(h1Index + 1)) {
    if (line.startsWith("## ")) {
      if (current.title || current.lines.some((item) => item.trim())) sections.push(current);
      current = { title: line.slice(3).trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title || current.lines.some((item) => item.trim())) sections.push(current);
  const intro = sections[0]?.title === "" ? sections.shift() : { title: "", lines: [] };
  const mainCta = nestedObject(frontmatter, "main_cta");
  const secondaryCta =
    nestedObject(frontmatter, "secondary_cta") ||
    nestedObject(frontmatter, "soft_alternative");
  const related = nestedObjectArray(frontmatter, "future_internal_links");
  let ctaIndex = -1;
  if (mainCta?.url) {
    ctaIndex = sections.findIndex((section) =>
      section.lines.join("\n").includes(`](${mainCta.url})`),
    );
  }
  const wordCount = markdown
    .replace(/[#*_[\]()`>|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return {
    number,
    filename,
    route,
    h1,
    seoTitle: `${topField(frontmatter, "seo_title")} | Evolution House`,
    description: topField(frontmatter, "meta_description"),
    mainCta,
    secondaryCta,
    related,
    relatedIntro: topField(frontmatter, "related_materials_intro"),
    intro,
    sections,
    ctaIndex,
    minutes: Math.max(5, Math.round(wordCount / 170)),
    visual: getTransitionVisual(number),
  };
}

function commonShell() {
  const sample = fs.readFileSync(
    path.join(siteRoot, "biblioteka", "reiki", "chto-takoe-reiki", "index.html"),
    "utf8",
  );
  const sourceHeader = sample.match(/<header class="eh-shell-header[\s\S]*?<\/header>/)?.[0];
  const footer = sample.match(
    /<footer class="eh-global-footer"[\s\S]*?<\/footer>\s*<script src="\/script\.js"><\/script>/,
  )?.[0];
  if (!sourceHeader || !footer) throw new Error("Could not extract shared article shell.");
  const localStrip = `<nav class="eh-local-strip" aria-label="Маршрут направления Пересборка жизни">
      <div class="eh-shell-container">
        <a href="/urovni-zhizni/">Пересборка жизни</a>
        <a href="/urovni-zhizni/metod/">Метод уровней эволюции</a>
        <a href="/urovni-zhizni/kvantovaya-aktivaciya/">Квантовая активация</a>
        <a href="/urovni-zhizni/individualnyj-retrit/">Индивидуальный ретрит</a>
        <a href="/urovni-zhizni/personalnyj-marshrut/">Маршрут 6–9 месяцев</a>
        <a class="eh-local-strip__articles" href="${hubRoute}" aria-current="page">Статьи о пересборке жизни</a>
      </div>
    </nav>`;
  const header = sourceHeader
    .replace(/eh-context--reiki/g, "eh-context--levels")
    .replace(/<nav class="eh-local-strip"[\s\S]*?<\/nav>/, localStrip);
  return { header, footer };
}

function renderResponsiveImage(article, variant, options = {}) {
  const isHero = variant === "hero";
  const widths = isHero ? [480, 768, 1200, 1600] : [480, 800, 1200];
  const dimensions = isHero ? { width: 1200, height: 900 } : { width: 800, height: 500 };
  const sizes = isHero
    ? "(max-width: 900px) calc(100vw - 40px), 42vw"
    : "(max-width: 720px) calc(100vw - 40px), 31vw";
  const srcset = widths
    .map((width) => `${article.visual.basePath}/${variant}-${width}.webp ${width}w`)
    .join(", ");
  const attrs = [
    `src="${article.visual.basePath}/${variant}-${dimensions.width}.jpg"`,
    `alt="${escapeHtml(article.visual.alt)}"`,
    `width="${dimensions.width}"`,
    `height="${dimensions.height}"`,
    `sizes="${sizes}"`,
    'decoding="async"',
  ];
  if (options.lazy) attrs.push('loading="lazy"');
  if (options.priority) attrs.push('fetchpriority="high"');
  return `<picture class="article-responsive-image article-responsive-image--${variant}">
            <source type="image/webp" srcset="${srcset}" sizes="${sizes}">
            <img ${attrs.join(" ")}>
          </picture>`;
}

function localFile(publicPath) {
  return path.join(siteRoot, publicPath.replace(/^\//, ""));
}

function renderTransitionInsert(insert) {
  const sourcePath = localFile(insert.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing transition insert source: ${sourcePath}`);
  }
  const source = fs.readFileSync(sourcePath, "utf8");
  const escapedId = insert.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(
      `<figure class="visual" id="visual-${escapedId}">([\\s\\S]*?)<\\/figure>`,
    ),
  );
  if (!match) {
    throw new Error(`Missing transition insert visual-${insert.id}.`);
  }
  const stage = match[1]
    .replace(
      /^\s*<figcaption class="visual__head">[\s\S]*?<\/figcaption>\s*/,
      "",
    )
    .trim();
  const captionId = `transition-insert-caption-${insert.id}`;
  return `<figure class="article-insert article-insert--editorial article-visual-insert article-visual-insert--family-map article-visual-insert--tone-default transition-article-insert transition-article-insert--${escapeHtml(insert.type)}" data-visual-family="map" data-visual-tone="default" data-transition-insert="${escapeHtml(insert.id)}" data-provenance="${escapeHtml(insert.provenance)}" aria-labelledby="${captionId}">
            ${stage}
            <figcaption class="transition-article-insert__caption" id="${captionId}">
              <strong>${escapeHtml(insert.caption)}</strong>
              <span>${escapeHtml(insert.description)}</span>
            </figcaption>
          </figure>`;
}

function renderFaq(section) {
  const items = extractFaq(section);
  if (items.length < 2) return null;
  return `<div class="article-faq">
            ${items
              .map(
                (item) => `<div class="article-faq__item">
              <h3>${parseInline(item.question)}</h3>
              <p>${parseInline(item.answer)}</p>
            </div>`,
              )
              .join("\n            ")}
          </div>`;
}

function renderRelated(article, articles) {
  if (!article.related.length) return "";
  const intro =
    article.number === 7
      ? article.relatedIntro ||
        "К материалам о желаниях, идентичности и следующей цели переходите только тогда, когда вы способны заботиться о себе и выполнять обычные дела, состояние не ухудшается и не требует профессиональной оценки"
      : "";
  return `<aside class="article-related" aria-labelledby="article-related-title-${article.number}">
          <div class="article-related__head">
            <div>
              <p class="article-related__eyebrow">Продолжить разбираться</p>
              <h2 id="article-related-title-${article.number}">Связанные материалы</h2>
              ${intro ? `<p class="article-related__intro">${escapeHtml(intro)}</p>` : ""}
            </div>
            <a href="${hubRoute}">Все статьи о переходах →</a>
          </div>
          <div class="article-related__grid">
            ${article.related
              .map((link) => {
                const target = articles.find((item) => item.route === link.url);
                if (!target) throw new Error(`Missing related article ${link.url}.`);
                return `<a class="article-related__card clickable-card" href="${target.route}">
              <span>Статья ${String(target.number).padStart(2, "0")}</span>
              <strong>${escapeHtml(link.label || target.h1)}</strong>
              <em>Читать →</em>
            </a>`;
              })
              .join("\n            ")}
          </div>
        </aside>`;
}

function articleSchema(article) {
  const canonical = `${baseUrl}${article.route}`;
  const faq = article.sections.flatMap(extractFaq);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        headline: article.h1,
        description: article.description,
        datePublished: publishedDate,
        dateModified: publishedDate,
        inLanguage: "ru",
        mainEntityOfPage: canonical,
        image: `${baseUrl}${article.visual.basePath}/og-1200.jpg`,
        author: { "@type": "Person", name: author, url: `${baseUrl}/o-shkole.html` },
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
            name: "Пересборка жизни и переходы",
            item: `${baseUrl}${hubRoute}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.h1,
            item: canonical,
          },
        ],
      },
      ...(faq.length >= 2
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
                },
              })),
            },
          ]
        : []),
    ],
  };
}

function renderArticle(article, articles, shell) {
  const canonical = `${baseUrl}${article.route}`;
  const imageUrl = `${baseUrl}${article.visual.basePath}/og-1200.jpg`;
  const header = shell.header.replace('aria-current="page">Статьи о пересборке', 'aria-current="location">Статьи о пересборке');
  const related = renderRelated(article, articles);
  const toc = article.sections
    .map(
      (section, index) =>
        `<li><a href="#section-${index + 1}">${escapeHtml(section.title)}</a></li>`,
    )
    .join("");
  const insertedVisuals = new Set();
  const sections = article.sections
    .map((section, index) => {
      const faq = renderFaq(section);
      const classes = [];
      if (index === article.ctaIndex) classes.push("article-next-step");
      if (/помощ|безопас|специалист|врач|депресс/i.test(section.title)) {
        classes.push("article-boundary");
      }
      const eyebrow =
        index === article.ctaIndex
          ? '<p class="article-next-step__eyebrow">Следующий шаг в пересборке жизни</p>'
          : "";
      const inserts = article.visual.inserts
        .filter((insert) => insert.afterTitle === section.title)
        .map((insert) => {
          insertedVisuals.add(insert.id);
          return renderTransitionInsert(insert);
        })
        .join("\n          ");
      const markup = `<section id="section-${index + 1}"${classes.length ? ` class="${classes.join(" ")}"` : ""}>
          ${eyebrow}
          <h2>${parseInline(section.title)}</h2>
          ${inserts}
          ${faq || renderBlocks(section.lines)}
        </section>`;
      return index === article.ctaIndex && article.number !== 7
        ? `${markup}\n\n        ${related}`
        : markup;
    })
    .join("\n\n        ");
  if (insertedVisuals.size !== article.visual.inserts.length) {
    const missing = article.visual.inserts
      .filter((insert) => !insertedVisuals.has(insert.id))
      .map((insert) => `${insert.id} after "${insert.afterTitle}"`)
      .join(", ");
    throw new Error(`Transition article ${article.number} is missing inserts: ${missing}`);
  }
  const relatedAtEnd =
    article.number === 7 || article.ctaIndex < 0 ? related : "";
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(article.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <meta name="author" content="${author}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(article.seoTitle.replace(" | Evolution House", ""))}">
  <meta property="og:description" content="${escapeHtml(article.description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(article.visual.alt)}">
  <meta property="og:url" content="${canonical}">
  <meta property="article:published_time" content="${publishedDate}">
  <meta property="article:modified_time" content="${publishedDate}">
  <meta property="article:author" content="${author}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260724-transitions-1">
  <link rel="stylesheet" href="/assets/transition-articles/inserts/transition-inserts.css?v=20260725-1">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">
${JSON.stringify(articleSchema(article), null, 2)}
  </script>
</head>
<body class="article-page article-page--transitions eh-context--levels">
  ${header}
  <main>
    <nav class="library-breadcrumb" aria-label="Путь страницы">
      <div class="eh-shell-container">
        <a href="/biblioteka.html">Библиотека</a><span>→</span>
        <a href="${hubRoute}">Пересборка жизни и переходы</a><span>→</span>
        <span>${escapeHtml(article.h1)}</span>
      </div>
    </nav>
    <header class="article-hero${article.h1.length > 62 ? " article-hero--long-title" : ""}">
      <div class="eh-shell-container article-hero__grid">
        <div>
          <a class="article-back-link" href="${hubRoute}">← Все статьи о переходах</a>
          <p class="article-kicker">Материал ${String(article.number).padStart(2, "0")} · Пересборка жизни</p>
          <h1>${escapeHtml(article.h1)}</h1>
          <p class="article-hero__lead">${escapeHtml(article.description)}</p>
          <div class="article-meta">
            <span>${author}</span>
            <span><time datetime="${publishedDate}">24.07.2026</time></span>
            <span>${article.minutes} минут чтения</span>
          </div>
        </div>
        <figure class="article-hero__visual">${renderResponsiveImage(article, "hero", { priority: true })}</figure>
      </div>
    </header>
    <div class="eh-shell-container article-layout">
      <nav class="article-toc" aria-label="Содержание статьи">
        <strong>В статье</strong>
        <ol>${toc}</ol>
      </nav>
      <article class="article-body">
        <div class="article-intro">${renderBlocks(article.intro.lines)}</div>
        ${sections}
        ${relatedAtEnd}
        <aside class="article-author" aria-label="Об авторе">
          <img src="/assets/svetlana-home-transition-crop.jpg" alt="${author}" width="1200" height="1200" loading="lazy">
          <div>
            <p class="article-author__label">Автор статьи</p>
            <h2>${author}</h2>
            <p>Основатель Evolution House, автор метода уровней эволюции и направления «Пересборка жизни». Помогает увидеть завершившийся этап, опоры перехода и следующий шаг, который можно проверить в реальной жизни.</p>
          </div>
        </aside>
      </article>
    </div>
  </main>
  ${shell.footer}
</body>
</html>`;
}

function renderFeaturedCard(article) {
  return `<a class="article-card clickable-card" href="${article.route}">
            ${renderResponsiveImage(article, "card", { lazy: true })}
            <div class="article-card__copy">
              <span class="article-card__meta">Статья ${String(article.number).padStart(2, "0")} · ${article.minutes} минут</span>
              <h2>${escapeHtml(article.h1)}</h2>
              <p>${escapeHtml(article.description)}</p>
              <span class="article-card__link">Читать статью →</span>
            </div>
          </a>`;
}

function renderCompactCard(article) {
  return `<a class="article-compact-card clickable-card" href="${article.route}">
            <span class="article-compact-card__number">${String(article.number).padStart(2, "0")}</span>
            <div>
              <h3>${escapeHtml(article.h1)}</h3>
              <p>${escapeHtml(article.description)}</p>
              <span>Читать →</span>
            </div>
          </a>`;
}

function renderHub(articles, shell) {
  const canonical = `${baseUrl}${hubRoute}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Статьи о пересборке жизни и переходах",
    description: hubDescription,
    url: canonical,
    inLanguage: "ru",
    hasPart: articles.map((article) => ({
      "@type": "Article",
      name: article.h1,
      url: `${baseUrl}${article.route}`,
    })),
  };
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${hubTitle}</title>
  <meta name="description" content="${hubDescription}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Статьи о пересборке жизни и переходах">
  <meta property="og:description" content="${hubDescription}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${baseUrl}/assets/transition-articles/01/og-1200.jpg">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260724-transitions-1">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body class="library-page library-page--transitions eh-context--levels">
  ${shell.header}
  <main>
    <nav class="library-breadcrumb" aria-label="Путь страницы">
      <div class="eh-shell-container"><a href="/biblioteka.html">Библиотека</a><span>→</span><span>Пересборка жизни и переходы</span></div>
    </nav>
    <section class="article-list-hero">
      <div class="eh-shell-container article-list-hero__grid">
        <div>
          <p class="library-kicker">Библиотека · Пересборка жизни</p>
          <h1>Статьи о пересборке жизни и переходах</h1>
          <p>Ответы на вопросы, которые появляются, когда прежний этап уже закончился, а следующий ещё не собран. Без требования немедленно начать всё заново.</p>
        </div>
        <span class="article-list-hero__count"><strong>12</strong>материалов</span>
      </div>
    </section>
    <section class="library-section library-section--paper">
      <div class="eh-shell-container">
        <div class="library-section__head">
          <h2>С чего начать</h2>
          <p>Три материала для первого знакомства: увидеть свою точку, разобраться с тупиком и отделить решение от требования немедленной гарантии.</p>
        </div>
        <div class="article-card-grid">${articles.slice(0, 3).map(renderFeaturedCard).join("\n")}</div>
      </div>
    </section>
    <section class="library-section library-section--sage">
      <div class="eh-shell-container">
        <div class="library-section__head">
          <h2>Другие вопросы о переходах</h2>
          <p>Можно начать с любой ситуации, которая сейчас ближе: новый этап, чужой сценарий, развод, завершённая цель или перемены, на которые трудно решиться.</p>
        </div>
        <div class="article-compact-grid">${articles.slice(3).map(renderCompactCard).join("\n")}</div>
      </div>
    </section>
    <section class="library-section library-section--paper">
      <div class="eh-shell-container">
        <aside class="reiki-path-bridge transition-path-bridge">
          <div>
            <p class="reiki-path-bridge__eyebrow">Когда ответов уже достаточно</p>
            <h2>Увидеть карту своего перехода</h2>
            <p>Статьи помогают назвать происходящее. Метод уровней эволюции показывает, что в прежней системе жизни завершилось, на что можно опереться и какой следующий этап уже собирается.</p>
          </div>
          <div class="reiki-path-bridge__actions">
            <a class="button button--primary" href="/urovni-zhizni/metod/">Посмотреть метод</a>
            <a class="button button--secondary" href="/pervyi-shag.html">Подобрать первый шаг</a>
          </div>
        </aside>
      </div>
    </section>
  </main>
  ${shell.footer}
</body>
</html>`;
}

function clean(html) {
  return html.replace(/[ \t]+$/gm, "");
}

function main() {
  const articles = sourceOrder.map(parseDraft).sort((a, b) => a.number - b.number);
  if (articles.length !== 12) throw new Error(`Expected 12 articles, found ${articles.length}.`);
  const routes = new Set(articles.map((article) => article.route));
  if (routes.size !== articles.length) throw new Error("Duplicate transition article route.");
  const shell = commonShell();
  for (const article of articles) {
    const directory = path.join(siteRoot, article.route.replace(/^\//, ""));
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "index.html"),
      clean(renderArticle(article, articles, shell)),
      "utf8",
    );
  }
  const hubDirectory = path.join(siteRoot, hubRoute.replace(/^\//, ""));
  fs.mkdirSync(hubDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(hubDirectory, "index.html"),
    clean(renderHub(articles, shell)),
    "utf8",
  );
  console.log(`Generated ${articles.length} transition articles and the transition hub.`);
}

main();
