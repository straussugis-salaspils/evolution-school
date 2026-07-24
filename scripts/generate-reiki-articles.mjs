import fs from "node:fs";
import path from "node:path";
import {
  getReikiInsertCount,
  getReikiVisual,
} from "./reiki-visual-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const sourceRoot =
  process.env.REIKI_SEO_SOURCE ||
  "C:\\Users\\Ugis\\Documents\\000 LifeOS\\ugis-aiu-memory\\Sveta\\SEO\\docs\\seo\\reiki";
const draftsRoot = path.join(sourceRoot, "drafts");
const metadataPath = path.join(
  sourceRoot,
  "research",
  "publication-metadata-and-links.md",
);
const baseUrl = "https://evolution.yourbalancerestored.com";
const modifiedDate = "2026-07-24";
const author = "\u0421\u0432\u0435\u0442\u043b\u0430\u043d\u0430 \u0421\u0442\u0440\u0430\u0443\u0441";
const hubTitle = "\u0421\u0442\u0430\u0442\u044c\u0438 \u043e \u0420\u0435\u0439\u043a\u0438 | Evolution House";
const hubDescription =
  "\u0421\u0442\u0430\u0442\u044c\u0438 \u0421\u0432\u0435\u0442\u043b\u0430\u043d\u044b \u0421\u0442\u0440\u0430\u0443\u0441 \u043e \u0420\u0435\u0439\u043a\u0438: \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0430, \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435, \u0438\u043d\u0438\u0446\u0438\u0430\u0446\u0438\u044f, \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u044c \u0438 \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u043a\u0438\u0439 \u043f\u0443\u0442\u044c.";
const hubOgDescription =
  "\u0420\u0430\u0437\u0431\u0438\u0440\u0430\u0435\u043c\u0441\u044f \u0432 \u0420\u0435\u0439\u043a\u0438 \u0431\u0435\u0437 \u0442\u0443\u043c\u0430\u043d\u043d\u044b\u0445 \u043e\u0431\u0435\u0449\u0430\u043d\u0438\u0439: \u043e\u0442 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0437\u043d\u0430\u043a\u043e\u043c\u0441\u0442\u0432\u0430 \u0434\u043e \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u043a\u043e\u0433\u043e \u043f\u0443\u0442\u0438.";

const sources = [
  "article-01-what-is-reiki-draft-v4.md",
  "article-02-reiki-initiation-draft-v2.md",
  "article-03-reiki-first-level-draft-v2.md",
  "article-04-reiki-21-days-draft-v2.md",
  "article-05-reiki-i-vs-ii-draft-v2.md",
  "article-06-reiki-self-learning-draft-v2.md",
  "article-07-reiki-self-practice-draft-v2.md",
  "article-08-reiki-sensations-draft.md",
  "article-09-reiki-safety-draft-v2.md",
  "article-10-choose-reiki-master-draft-v2.md",
  "article-11-beginner-mistakes-draft.md",
  "article-12-master-teacher-responsibility-draft-v2.md",
  "article-13-after-reiki-ii-draft-v3.md",
  "article-14-reiki-third-degree-differences-draft.md",
  "article-15-change-reiki-master-school-draft.md",
  "article-16-ready-for-reiki-master-level-draft.md",
  "article-17-reiki-master-for-self-draft.md",
  "article-18-reiki-reinitiation-draft.md",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderResponsiveImage(article, variant, options = {}) {
  const isHero = variant === "hero";
  const widths = isHero ? [480, 768, 1200, 1600] : [480, 800, 1200];
  const dimensions = isHero
    ? { width: 1200, height: 900 }
    : { width: 800, height: 500 };
  const srcset = widths
    .map((width) => `${article.visual.basePath}/${variant}-${width}.webp ${width}w`)
    .join(", ");
  const sizes = isHero
    ? "(max-width: 900px) calc(100vw - 40px), 42vw"
    : "(max-width: 720px) calc(100vw - 40px), 31vw";
  const attributes = [
    `src="${article.visual.basePath}/${variant}-${dimensions.width}.jpg"`,
    `alt="${escapeHtml(article.visual.alt)}"`,
    `width="${dimensions.width}"`,
    `height="${dimensions.height}"`,
    `sizes="${sizes}"`,
    'decoding="async"',
  ];
  if (options.lazy) attributes.push('loading="lazy"');
  if (options.priority) attributes.push('fetchpriority="high"');

  return `<picture class="article-responsive-image article-responsive-image--${variant}">
            <source type="image/webp" srcset="${srcset}" sizes="${sizes}">
            <img ${attributes.join(" ")}>
          </picture>`;
}

function localFile(publicPath) {
  return path.join(siteRoot, publicPath.replace(/^\//, ""));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namespaceInsertIds(markup, css, insertId) {
  const prefix = `reiki-${insertId.replace(/[^a-z0-9_-]+/gi, "-")}`;
  const ids = [
    ...new Set(
      [...markup.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]),
    ),
  ];
  const idMap = new Map(ids.map((id) => [id, `${prefix}--${id}`]));

  const namespacedMarkup = markup
    .replace(/\bid="([^"]+)"/gi, (match, id) =>
      idMap.has(id) ? `id="${idMap.get(id)}"` : match,
    )
    .replace(
      /\b(aria-labelledby|aria-describedby)="([^"]+)"/gi,
      (match, attribute, value) =>
        `${attribute}="${value
          .split(/\s+/)
          .map((id) => idMap.get(id) || id)
          .join(" ")}"`,
    )
    .replace(/\b(href|xlink:href)="#([^"]+)"/gi, (match, attribute, id) =>
      idMap.has(id) ? `${attribute}="#${idMap.get(id)}"` : match,
    )
    .replace(/url\(#([^)]+)\)/gi, (match, id) =>
      idMap.has(id) ? `url(#${idMap.get(id)})` : match,
    );

  let namespacedCss = css;
  for (const [id, namespacedId] of idMap) {
    namespacedCss = namespacedCss.replace(
      new RegExp(`#${escapeRegExp(id)}\\b`, "g"),
      `#${namespacedId}`,
    );
  }

  return { markup: namespacedMarkup, css: namespacedCss };
}

function extractScopedInsertDocument(source, sourcePath, insertId) {
  const figureSource = source.match(/<figure\b[\s\S]*?<\/figure>/i)?.[0];
  if (!figureSource) {
    throw new Error(`Reiki insert must contain one figure: ${sourcePath}`);
  }
  const figureCount = (source.match(/<figure\b/gi) || []).length;
  if (figureCount !== 1) {
    throw new Error(
      `Reiki insert must contain exactly one figure: ${sourcePath}`,
    );
  }
  const figure = figureSource
    .replace(/<(\/?)section\b/gi, "<$1div")
    .replace(
      /<h1\b/gi,
      '<h3 data-insert-heading="primary"',
    )
    .replace(/<\/h1>/gi, "</h3>")
    .replace(
      /<h2\b/gi,
      '<h3 data-insert-heading="secondary"',
    )
    .replace(/<\/h2>/gi, "</h3>");
  const rawCss = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .join("\n\n")
    .replaceAll(":root", ":scope")
    .replace(
      /\bh1(?=\s*(?:[,{>+~.:#\[]|$))/g,
      '[data-insert-heading="primary"]',
    )
    .replace(
      /\bh2(?=\s*(?:[,{>+~.:#\[]|$))/g,
      '[data-insert-heading="secondary"]',
    )
    .replace(
      /\bsection(?=\s*(?:[,{>+~.:#\[]|$))/g,
      "div",
    );
  const { markup: namespacedFigure, css } = namespaceInsertIds(
    figure,
    rawCss,
    insertId,
  );
  const cssInsertId = insertId.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const scopeSelector = `[data-reiki-insert="${cssInsertId}"]`;
  const scopedStyle = css
    ? `<style>@scope (${scopeSelector}) {\n${css}\n}</style>`
    : "";
  return `${scopedStyle}\n${namespacedFigure}`;
}

function renderInsert(insert) {
  const family = insert.family;
  const tone = insert.tone;
  if (!family || !tone) {
    throw new Error(`Missing visual family or tone for Reiki insert ${insert.id}.`);
  }
  const systemClasses = [
    `article-visual-insert--${escapeHtml(insert.type)}`,
    `article-visual-insert--family-${escapeHtml(family)}`,
    `article-visual-insert--tone-${escapeHtml(tone)}`,
  ].join(" ");

  if (insert.source) {
    const sourcePath = localFile(insert.source);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing Reiki insert source: ${sourcePath}`);
    }
    const source = fs.readFileSync(sourcePath, "utf8").trim();
    if (/<script\b|https?:\/\/|<link\b/i.test(source)) {
      throw new Error(`Reiki insert must be self-contained: ${sourcePath}`);
    }
    const fragment = extractScopedInsertDocument(
      source,
      sourcePath,
      insert.id,
    );
    return `<div class="article-visual-insert ${systemClasses}" data-visual-family="${escapeHtml(family)}" data-visual-tone="${escapeHtml(tone)}" data-reiki-insert="${escapeHtml(insert.id)}" data-provenance="${escapeHtml(insert.provenance)}">
            ${fragment}
          </div>`;
  }

  if (insert.type !== "editorial" || !insert.assetBase) {
    throw new Error(`Unsupported Reiki insert configuration: ${insert.id}`);
  }
  const descriptionId = `${insert.id}-description`;
  return `<figure class="article-insert article-insert--editorial article-visual-insert ${systemClasses}" data-visual-family="${escapeHtml(family)}" data-visual-tone="${escapeHtml(tone)}" data-reiki-insert="${escapeHtml(insert.id)}" data-provenance="${escapeHtml(insert.provenance)}" role="group" aria-describedby="${descriptionId}">
            <picture class="article-insert__picture">
              <source type="image/webp" srcset="${insert.assetBase}-480.webp 480w, ${insert.assetBase}-768.webp 768w, ${insert.assetBase}-1200.webp 1200w" sizes="(max-width: 820px) calc(100vw - 40px), 760px">
              <img src="${insert.assetBase}-768.jpg" srcset="${insert.assetBase}-480.jpg 480w, ${insert.assetBase}-768.jpg 768w, ${insert.assetBase}-1200.jpg 1200w" sizes="(max-width: 820px) calc(100vw - 40px), 760px" alt="${escapeHtml(insert.alt)}" width="1200" height="675" loading="lazy" decoding="async">
            </picture>
            <figcaption>
              <strong>${escapeHtml(insert.caption)}</strong>
              <span id="${descriptionId}">${escapeHtml(insert.description)}</span>
            </figcaption>
          </figure>`;
}

function cleanCell(value) {
  return value.trim().replaceAll("\\|", "|").replace(/^`|`$/g, "");
}

function splitTableRow(line) {
  const cells = [];
  let cell = "";
  for (let index = 1; index < line.length - 1; index += 1) {
    const character = line[index];
    if (character === "\\" && line[index + 1] === "|") {
      cell += "|";
      index += 1;
    } else if (character === "|") {
      cells.push(cleanCell(cell));
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cleanCell(cell));
  return cells;
}

function parseMetadata(markdown) {
  const metadata = [];
  const links = {};
  let inMetadata = false;
  let inLinks = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("## URL, title")) {
      inMetadata = true;
      inLinks = false;
      continue;
    }
    if (line.startsWith("## Карта article-to-article")) {
      inMetadata = false;
      inLinks = true;
      continue;
    }
    if (line.startsWith("## ") && !line.startsWith("## URL, title") && !line.startsWith("## Карта article-to-article")) {
      inMetadata = false;
      inLinks = false;
    }
    if (!line.startsWith("|") || /^\|\s*:?-/.test(line)) continue;
    const cells = splitTableRow(line);
    if (inMetadata && /^\d+$/.test(cells[0])) {
      metadata.push({
        number: Number(cells[0]),
        route: cells[1],
        seoTitle: cells[2],
        description: cells[3],
      });
    }
    if (inLinks && /^\d+$/.test(cells[0])) {
      const targets = cells[1].split(",").map((item) => Number(item.trim()));
      const anchors = cells[2]
        .split(";")
        .map((item) => item.trim().replace(/^«|»$/g, ""));
      links[Number(cells[0])] = targets.map((target, index) => ({
        target,
        anchor: anchors[index] || "",
      }));
    }
  }

  if (metadata.length !== 18) {
    throw new Error(`Expected 18 metadata rows, found ${metadata.length}.`);
  }
  return { metadata, links };
}

function parseInline(source) {
  const tokens = [];
  let text = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const token = `@@TOKEN${tokens.length}@@`;
    tokens.push(
      `<a href="${escapeHtml(href)}">${parseInline(label)}</a>`,
    );
    return token;
  });
  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?])/g, "$1<em>$2</em>");
  tokens.forEach((token, index) => {
    text = text.replace(`@@TOKEN${index}@@`, token);
  });
  return text;
}

function isTableSeparator(line) {
  return /^\|\s*:?-{3,}/.test(line);
}

function renderTable(lines) {
  const rows = lines
    .filter((line) => !isTableSeparator(line))
    .map(splitTableRow);
  const [head, ...body] = rows;
  return `<div class="article-table-wrap">
            <table>
              <thead><tr>${head.map((cell) => `<th>${parseInline(cell)}</th>`).join("")}</tr></thead>
              <tbody>${body
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${parseInline(cell)}</td>`).join("")}</tr>`,
                )
                .join("")}</tbody>
            </table>
          </div>`;
}

function renderBlocks(lines) {
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
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
      output.push(`<blockquote>${parseInline(quote.join(" "))}</blockquote>`);
      continue;
    }
    if (line.startsWith("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      const table = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        table.push(lines[index].trim());
        index += 1;
      }
      output.push(renderTable(table));
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
    if (line === "---") {
      output.push("<hr>");
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(### |>|[-*]\s+|\d+\.\s+|\|)/.test(lines[index].trim()) &&
      lines[index].trim() !== "---"
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
    if (answer.length) {
      items.push({ question, answer: answer.join(" ") });
    }
  }
  return items;
}

function parseDraft(markdown, article) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const h1Index = lines.findIndex((line) => line.startsWith("# "));
  if (h1Index < 0) throw new Error(`Missing H1 in ${article.source}.`);
  const h1 = lines[h1Index].slice(2).trim();
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
  const productPattern = /\]\(\/(?:reiki(?:\/|$)|o-shkole\.html|reiki-napravlenie\.html)/;
  let ctaIndex = -1;
  sections.forEach((section, index) => {
    if (productPattern.test(section.lines.join("\n"))) ctaIndex = index;
  });
  if (ctaIndex < 0) ctaIndex = sections.length - 1;

  const wordCount = markdown
    .replace(/[#*_[\]()`>|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    ...article,
    h1,
    intro,
    sections,
    ctaIndex,
    minutes: Math.max(5, Math.round(wordCount / 170)),
  };
}

function commonShell() {
  const samplePath = path.join(
    siteRoot,
    "biblioteka",
    "reiki",
    "chto-takoe-reiki",
    "index.html",
  );
  const sample = fs.readFileSync(samplePath, "utf8");
  const sourceHeader = sample.match(
    /<header class="eh-shell-header[\s\S]*?<\/header>/,
  )?.[0];
  const footer = sample.match(/<footer class="eh-global-footer"[\s\S]*?<\/footer>\s*<script src="\/script\.js"><\/script>/)?.[0];
  if (!sourceHeader || !footer) {
    throw new Error("Could not extract shared article shell.");
  }
  const reikiLocalStrip = `<nav class="eh-local-strip" aria-label="Навигация по Пути Рейки">
      <div class="eh-shell-container">
        <a href="/reiki-napravlenie.html">Карта пути</a>
        <a href="/reiki/method.html">Метод Рейки</a>
        <a href="/reiki/">Рейки I</a>
        <a href="/reiki/reiki-2.html">Рейки II</a>
        <a href="/reiki/master-life.html">Мастер жизни</a>
        <a href="/reiki/master-teacher.html">Мастер-Учитель Рейки</a>
        <a href="/reiki/multidimensional-master.html">Многомерный Мастер</a>
        <a class="eh-local-strip__articles" href="/biblioteka/reiki/" aria-current="page">Статьи про Рейки</a>
      </div>
    </nav>`;
  const header = sourceHeader.replace(
    /<nav class="eh-local-strip"[\s\S]*?<\/nav>/,
    reikiLocalStrip,
  );
  return { header, footer };
}

function renderRelated(article, allArticles, relatedMap) {
  if (article.number === 11) return "";
  const links = relatedMap[article.number] || [];
  return `<aside class="article-related" aria-labelledby="article-related-title">
          <div class="article-related__head">
            <div>
              <p class="article-related__eyebrow">&#1055;&#1088;&#1086;&#1076;&#1086;&#1083;&#1078;&#1080;&#1090;&#1100; &#1088;&#1072;&#1079;&#1073;&#1080;&#1088;&#1072;&#1090;&#1100;&#1089;&#1103;</p>
              <h2 id="article-related-title">&#1057;&#1074;&#1103;&#1079;&#1072;&#1085;&#1085;&#1099;&#1077; &#1084;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083;&#1099;</h2>
            </div>
            <a href="/biblioteka/reiki/">&#1042;&#1089;&#1077; &#1089;&#1090;&#1072;&#1090;&#1100;&#1080; &#1086; &#1056;&#1077;&#1081;&#1082;&#1080; &#8594;</a>
          </div>
          <div class="article-related__grid">
            ${links
              .map(({ target, anchor }) => {
                const linked = allArticles.find((item) => item.number === target);
                if (!linked) throw new Error(`Missing related target ${target}.`);
                return `<a class="article-related__card clickable-card" href="${linked.route}">
              <span>&#1057;&#1090;&#1072;&#1090;&#1100;&#1103; ${String(target).padStart(2, "0")}</span>
              <strong>${escapeHtml(anchor || linked.h1)}</strong>
              <em>&#1063;&#1080;&#1090;&#1072;&#1090;&#1100; &#8594;</em>
            </a>`;
              })
              .join("\n            ")}
          </div>
        </aside>`;
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

function renderArticle(article, allArticles, relatedMap, shell) {
  const canonical = `${baseUrl}${article.route}`;
  const imageUrl = `${baseUrl}${article.visual.basePath}/og-1200.jpg`;
  const articleHeader = shell.header.replace(
    'class="eh-local-strip__articles" href="/biblioteka/reiki/" aria-current="page"',
    'class="eh-local-strip__articles" href="/biblioteka/reiki/" aria-current="location"',
  );
  const faq = article.sections.flatMap(extractFaq);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        headline: article.h1,
        description: article.description,
        datePublished: article.publishedDate,
        dateModified: modifiedDate,
        inLanguage: "ru",
        mainEntityOfPage: canonical,
        image: imageUrl,
        author: {
          "@type": "Person",
          name: author,
          url: `${baseUrl}/o-shkole.html`,
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
            name: "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430",
            item: `${baseUrl}/biblioteka.html`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "\u0420\u0435\u0439\u043a\u0438",
            item: `${baseUrl}/biblioteka/reiki/`,
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

  const toc = article.sections
    .map(
      (section, index) =>
        `<li><a href="#section-${index + 1}">${escapeHtml(section.title)}</a></li>`,
    )
    .join("\n          ");
  const related = renderRelated(article, allArticles, relatedMap);
  const insertedVisuals = new Set();
  const sections = article.sections
    .map((section, index) => {
      const faqMarkup = renderFaq(section);
      const classes = [];
      if (index === article.ctaIndex) classes.push("article-next-step");
      if (/границ|безопасн/i.test(section.title)) classes.push("article-boundary");
      const eyebrow =
        index === article.ctaIndex
          ? '<p class="article-next-step__eyebrow">&#1057;&#1083;&#1077;&#1076;&#1091;&#1102;&#1097;&#1080;&#1081; &#1096;&#1072;&#1075; &#1074; &#1055;&#1091;&#1090;&#1080; &#1056;&#1077;&#1081;&#1082;&#1080;</p>'
          : "";
      const inserts = article.visual.inserts
        .filter(
          (insert) =>
            !insertedVisuals.has(insert.id) &&
            section.title.includes(insert.afterTitle),
        )
        .map((insert) => {
          insertedVisuals.add(insert.id);
          return renderInsert(insert);
        })
        .join("\n          ");
      const sectionMarkup = `<section id="section-${index + 1}"${classes.length ? ` class="${classes.join(" ")}"` : ""}>
          ${eyebrow}
          <h2>${parseInline(section.title)}</h2>
          ${faqMarkup || renderBlocks(section.lines)}
          ${inserts}
        </section>`;
      return index === article.ctaIndex && related
        ? `${sectionMarkup}\n\n        ${related}`
        : sectionMarkup;
    })
    .join("\n\n        ");
  if (insertedVisuals.size !== article.visual.inserts.length) {
    const missing = article.visual.inserts
      .filter((insert) => !insertedVisuals.has(insert.id))
      .map((insert) => `${insert.id} after "${insert.afterTitle}"`);
    throw new Error(
      `Could not place ${missing.length} insert(s) for article ${article.number}: ${missing.join(", ")}.`,
    );
  }

  const publishedLabel =
    article.publishedDate === "2026-07-23" ? "23.07.2026" : "24.07.2026";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(article.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <meta name="author" content="${escapeHtml(author)}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(article.seoTitle.replace(" | Evolution House", ""))}">
  <meta property="og:description" content="${escapeHtml(article.description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(article.visual.ogAlt)}">
  <meta property="og:url" content="${canonical}">
  <meta property="article:published_time" content="${article.publishedDate}">
  <meta property="article:modified_time" content="${modifiedDate}">
  <meta property="article:author" content="${escapeHtml(author)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260724-2">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>
<body class="article-page eh-context--reiki">
  ${articleHeader}

  <main>
    <nav class="library-breadcrumb" aria-label="&#1055;&#1091;&#1090;&#1100; &#1089;&#1090;&#1088;&#1072;&#1085;&#1080;&#1094;&#1099;">
      <div class="eh-shell-container">
        <a href="/biblioteka.html">&#1041;&#1080;&#1073;&#1083;&#1080;&#1086;&#1090;&#1077;&#1082;&#1072;</a>
        <span>&#8594;</span>
        <a href="/biblioteka/reiki/">&#1042;&#1089;&#1077; &#1089;&#1090;&#1072;&#1090;&#1100;&#1080; &#1086; &#1056;&#1077;&#1081;&#1082;&#1080;</a>
        <span>&#8594;</span>
        <span>${escapeHtml(article.h1)}</span>
      </div>
    </nav>

    <header class="article-hero">
      <div class="eh-shell-container article-hero__grid">
        <div>
          <a class="article-back-link" href="/biblioteka/reiki/">&#8592; &#1042;&#1089;&#1077; &#1089;&#1090;&#1072;&#1090;&#1100;&#1080; &#1086; &#1056;&#1077;&#1081;&#1082;&#1080;</a>
          <p class="article-kicker">&#1052;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083; ${String(article.number).padStart(2, "0")} &#183; &#1055;&#1091;&#1090;&#1100; &#1056;&#1077;&#1081;&#1082;&#1080;</p>
          <h1>${escapeHtml(article.h1)}</h1>
          <p class="article-hero__lead">${escapeHtml(article.description)}</p>
          <div class="article-meta">
            <span>${escapeHtml(author)}</span>
            <span><time datetime="${article.publishedDate}">${publishedLabel}</time></span>
            <span>${article.minutes} &#1084;&#1080;&#1085;&#1091;&#1090; &#1095;&#1090;&#1077;&#1085;&#1080;&#1103;</span>
          </div>
        </div>
        <figure class="article-hero__visual">
          ${renderResponsiveImage(article, "hero", { priority: true })}
        </figure>
      </div>
    </header>

    <div class="eh-shell-container article-layout">
      <nav class="article-toc" aria-label="&#1057;&#1086;&#1076;&#1077;&#1088;&#1078;&#1072;&#1085;&#1080;&#1077; &#1089;&#1090;&#1072;&#1090;&#1100;&#1080;">
        <strong>&#1042; &#1089;&#1090;&#1072;&#1090;&#1100;&#1077;</strong>
        <ol>${toc}</ol>
      </nav>

      <article class="article-body">
        <div class="article-intro">
          ${renderBlocks(article.intro.lines)}
        </div>

        ${sections}

        <aside class="article-author" aria-label="&#1054;&#1073; &#1072;&#1074;&#1090;&#1086;&#1088;&#1077;">
          <img src="/assets/svetlana-reiki-calm.jpg" alt="${escapeHtml(author)}" width="768" height="1344" loading="lazy">
          <div>
            <p class="article-author__label">&#1040;&#1074;&#1090;&#1086;&#1088; &#1089;&#1090;&#1072;&#1090;&#1100;&#1080;</p>
            <h2>${escapeHtml(author)}</h2>
            <p>&#1054;&#1089;&#1085;&#1086;&#1074;&#1072;&#1090;&#1077;&#1083;&#1100; Evolution House, &#1052;&#1072;&#1089;&#1090;&#1077;&#1088;-&#1059;&#1095;&#1080;&#1090;&#1077;&#1083;&#1100; &#1056;&#1077;&#1081;&#1082;&#1080;. &#1055;&#1088;&#1072;&#1082;&#1090;&#1080;&#1082;&#1091;&#1077;&#1090; &#1056;&#1077;&#1081;&#1082;&#1080; &#1089; 1997 &#1075;&#1086;&#1076;&#1072; &#1080; &#1088;&#1072;&#1089;&#1089;&#1082;&#1072;&#1079;&#1099;&#1074;&#1072;&#1077;&#1090; &#1086; &#1090;&#1088;&#1072;&#1076;&#1080;&#1094;&#1080;&#1080;, &#1074; &#1082;&#1086;&#1090;&#1086;&#1088;&#1086;&#1081; &#1091;&#1095;&#1080;&#1083;&#1072;&#1089;&#1100; &#1080; &#1088;&#1072;&#1073;&#1086;&#1090;&#1072;&#1077;&#1090; &#1089;&#1072;&#1084;&#1072;.</p>
          </div>
        </aside>
      </article>
    </div>
  </main>

  ${shell.footer}
</body>
</html>
`;
}

function renderFeaturedCard(article) {
  return `<a class="article-card clickable-card" href="${article.route}">
            ${renderResponsiveImage(article, "card", { lazy: true })}
            <div class="article-card__copy">
              <span class="article-card__meta">&#1057;&#1090;&#1072;&#1090;&#1100;&#1103; ${String(article.number).padStart(2, "0")} &#183; ${article.minutes} &#1084;&#1080;&#1085;&#1091;&#1090;</span>
              <h2>${escapeHtml(article.h1)}</h2>
              <p>${escapeHtml(article.description)}</p>
              <span class="article-card__link">&#1063;&#1080;&#1090;&#1072;&#1090;&#1100; &#1089;&#1090;&#1072;&#1090;&#1100;&#1102; &#8594;</span>
            </div>
          </a>`;
}

function renderCompactCard(article) {
  return `<a class="article-compact-card clickable-card" href="${article.route}">
            <span class="article-compact-card__number">${String(article.number).padStart(2, "0")}</span>
            <div>
              <h3>${escapeHtml(article.h1)}</h3>
              <p>${escapeHtml(article.description)}</p>
              <span>&#1063;&#1080;&#1090;&#1072;&#1090;&#1100; &#8594;</span>
            </div>
          </a>`;
}

function renderHub(allArticles, shell) {
  const canonical = `${baseUrl}/biblioteka/reiki/`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "\u0421\u0442\u0430\u0442\u044c\u0438 \u043e \u0420\u0435\u0439\u043a\u0438",
        url: canonical,
        isPartOf: {
          "@type": "WebSite",
          name: "Evolution House",
          url: `${baseUrl}/`,
        },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: allArticles.map((article) => ({
            "@type": "ListItem",
            position: article.number,
            url: `${baseUrl}${article.route}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430",
            item: `${baseUrl}/biblioteka.html`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "\u0421\u0442\u0430\u0442\u044c\u0438 \u043e \u0420\u0435\u0439\u043a\u0438",
            item: canonical,
          },
        ],
      },
    ],
  };
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(hubTitle)}</title>
  <meta name="description" content="${escapeHtml(hubDescription)}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(hubTitle)}">
  <meta property="og:description" content="${escapeHtml(hubOgDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Evolution House">
  <meta property="og:image" content="${baseUrl}/assets/reiki-articles/01/og-1200.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Статьи Evolution House о практике и обучении Рейки">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/evolution-house-logo-approved.png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/article-library.css?v=20260724-2">
  <link rel="stylesheet" href="/cookie-consent.css">
  <script src="/analytics.js" defer></script>
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>
<body class="library-page eh-context--reiki">
  ${shell.header}

  <main>
    <nav class="library-breadcrumb" aria-label="&#1055;&#1091;&#1090;&#1100; &#1089;&#1090;&#1088;&#1072;&#1085;&#1080;&#1094;&#1099;">
      <div class="eh-shell-container">
        <a href="/biblioteka.html">&#1041;&#1080;&#1073;&#1083;&#1080;&#1086;&#1090;&#1077;&#1082;&#1072;</a>
        <span>&#8594;</span>
        <span>&#1056;&#1077;&#1081;&#1082;&#1080;</span>
      </div>
    </nav>

    <section class="article-list-hero">
      <div class="eh-shell-container article-list-hero__grid">
        <div>
          <p class="library-kicker">&#1041;&#1080;&#1073;&#1083;&#1080;&#1086;&#1090;&#1077;&#1082;&#1072; &#183; &#1055;&#1091;&#1090;&#1100; &#1056;&#1077;&#1081;&#1082;&#1080;</p>
          <h1>&#1057;&#1090;&#1072;&#1090;&#1100;&#1080; &#1086; &#1056;&#1077;&#1081;&#1082;&#1080;</h1>
          <p>&#1055;&#1086;&#1085;&#1103;&#1090;&#1085;&#1099;&#1077; &#1086;&#1090;&#1074;&#1077;&#1090;&#1099; &#1086; &#1087;&#1088;&#1072;&#1082;&#1090;&#1080;&#1082;&#1077;, &#1086;&#1073;&#1091;&#1095;&#1077;&#1085;&#1080;&#1080; &#1080; &#1080;&#1085;&#1080;&#1094;&#1080;&#1072;&#1094;&#1080;&#1080; &#8212; &#1076;&#1083;&#1103; &#1090;&#1077;&#1093;, &#1082;&#1090;&#1086; &#1093;&#1086;&#1095;&#1077;&#1090; &#1089;&#1085;&#1072;&#1095;&#1072;&#1083;&#1072; &#1088;&#1072;&#1079;&#1086;&#1073;&#1088;&#1072;&#1090;&#1100;&#1089;&#1103;, &#1072; &#1087;&#1086;&#1090;&#1086;&#1084; &#1087;&#1088;&#1080;&#1085;&#1080;&#1084;&#1072;&#1090;&#1100; &#1088;&#1077;&#1096;&#1077;&#1085;&#1080;&#1077;.</p>
        </div>
        <p class="article-list-hero__count"><strong>18</strong> &#1084;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083;&#1086;&#1074;</p>
      </div>
    </section>

    <section class="library-section library-section--paper">
      <div class="eh-shell-container">
        <div class="library-section__head">
          <h2>&#1057; &#1095;&#1077;&#1075;&#1086; &#1085;&#1072;&#1095;&#1072;&#1090;&#1100;</h2>
          <p>&#1058;&#1088;&#1080; &#1084;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083;&#1072; &#1076;&#1083;&#1103; &#1087;&#1077;&#1088;&#1074;&#1086;&#1075;&#1086; &#1079;&#1085;&#1072;&#1082;&#1086;&#1084;&#1089;&#1090;&#1074;&#1072;: &#1084;&#1077;&#1090;&#1086;&#1076;, &#1080;&#1085;&#1080;&#1094;&#1080;&#1072;&#1094;&#1080;&#1103; &#1080; &#1087;&#1077;&#1088;&#1074;&#1072;&#1103; &#1089;&#1090;&#1091;&#1087;&#1077;&#1085;&#1100;.</p>
        </div>
        <div class="article-card-grid">
          ${allArticles.slice(0, 3).map(renderFeaturedCard).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="library-section library-section--sage">
      <div class="eh-shell-container">
        <div class="library-section__head">
          <h2>&#1055;&#1088;&#1072;&#1082;&#1090;&#1080;&#1082;&#1072;, &#1086;&#1097;&#1091;&#1097;&#1077;&#1085;&#1080;&#1103; &#1080; &#1073;&#1077;&#1079;&#1086;&#1087;&#1072;&#1089;&#1085;&#1086;&#1089;&#1090;&#1100;</h2>
          <p>&#1054;&#1090; &#1087;&#1077;&#1088;&#1074;&#1099;&#1093; 21 &#1076;&#1085;&#1077;&#1081; &#1076;&#1086; &#1074;&#1099;&#1073;&#1086;&#1088;&#1072; &#1052;&#1072;&#1089;&#1090;&#1077;&#1088;&#1072; &#1080; &#1075;&#1088;&#1072;&#1085;&#1080;&#1094; &#1084;&#1077;&#1090;&#1086;&#1076;&#1072;.</p>
        </div>
        <div class="article-compact-grid">
          ${allArticles.slice(3, 11).map(renderCompactCard).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="library-section library-section--paper">
      <div class="eh-shell-container">
        <div class="library-section__head">
          <h2>&#1052;&#1072;&#1089;&#1090;&#1077;&#1088;&#1089;&#1082;&#1080;&#1081; &#1087;&#1091;&#1090;&#1100;</h2>
          <p>&#1063;&#1090;&#1086; &#1087;&#1086;&#1089;&#1083;&#1077; &#1056;&#1077;&#1081;&#1082;&#1080; II, &#1082;&#1072;&#1082; &#1091;&#1089;&#1090;&#1088;&#1086;&#1077;&#1085;&#1099; &#1052;&#1072;&#1089;&#1090;&#1077;&#1088; &#1078;&#1080;&#1079;&#1085;&#1080; &#1080; &#1052;&#1072;&#1089;&#1090;&#1077;&#1088;-&#1059;&#1095;&#1080;&#1090;&#1077;&#1083;&#1100; &#1080; &#1082;&#1072;&#1082; &#1087;&#1088;&#1086;&#1076;&#1086;&#1083;&#1078;&#1080;&#1090;&#1100; &#1087;&#1091;&#1090;&#1100; &#1087;&#1086;&#1089;&#1083;&#1077; &#1076;&#1088;&#1091;&#1075;&#1086;&#1081; &#1096;&#1082;&#1086;&#1083;&#1099;.</p>
        </div>
        <div class="article-compact-grid">
          ${allArticles.slice(11).map(renderCompactCard).join("\n          ")}
        </div>

        <aside class="reiki-path-bridge">
          <div>
            <p class="reiki-path-bridge__eyebrow">&#1050;&#1086;&#1075;&#1076;&#1072; &#1086;&#1090;&#1074;&#1077;&#1090;&#1086;&#1074; &#1091;&#1078;&#1077; &#1076;&#1086;&#1089;&#1090;&#1072;&#1090;&#1086;&#1095;&#1085;&#1086;</p>
            <h2>&#1055;&#1088;&#1086;&#1076;&#1086;&#1083;&#1078;&#1080;&#1090;&#1100; &#1074; &#1055;&#1091;&#1090;&#1100; &#1056;&#1077;&#1081;&#1082;&#1080;</h2>
            <p>&#1057;&#1090;&#1072;&#1090;&#1100;&#1080; &#1087;&#1086;&#1084;&#1086;&#1075;&#1072;&#1102;&#1090; &#1088;&#1072;&#1079;&#1086;&#1073;&#1088;&#1072;&#1090;&#1100;&#1089;&#1103;. &#1050;&#1072;&#1088;&#1090;&#1072; &#1087;&#1091;&#1090;&#1080; &#1087;&#1086;&#1082;&#1072;&#1079;&#1099;&#1074;&#1072;&#1077;&#1090;, &#1089; &#1082;&#1072;&#1082;&#1086;&#1075;&#1086; &#1096;&#1072;&#1075;&#1072; &#1085;&#1072;&#1095;&#1072;&#1090;&#1100; &#1087;&#1088;&#1072;&#1082;&#1090;&#1080;&#1082;&#1091; &#1080; &#1082;&#1072;&#1082; &#1091;&#1089;&#1090;&#1088;&#1086;&#1077;&#1085;&#1099; &#1089;&#1090;&#1091;&#1087;&#1077;&#1085;&#1080; &#1086;&#1073;&#1091;&#1095;&#1077;&#1085;&#1080;&#1103;.</p>
          </div>
          <div class="reiki-path-bridge__actions">
            <a class="button button--primary" href="/reiki-napravlenie.html">&#1054;&#1090;&#1082;&#1088;&#1099;&#1090;&#1100; &#1082;&#1072;&#1088;&#1090;&#1091; &#1055;&#1091;&#1090;&#1080; &#1056;&#1077;&#1081;&#1082;&#1080;</a>
            <a class="button button--secondary" href="/reiki/method.html">&#1055;&#1086;&#1085;&#1103;&#1090;&#1100; &#1084;&#1077;&#1090;&#1086;&#1076; &#1056;&#1077;&#1081;&#1082;&#1080;</a>
          </div>
        </aside>
      </div>
    </section>
  </main>

  ${shell.footer}
</body>
</html>
`;
}

function cleanGeneratedHtml(html) {
  return html.replace(/[ \t]+$/gm, "");
}

function main() {
  const insertCount = getReikiInsertCount();
  if (insertCount < 18) {
    throw new Error(
      `Every Reiki article needs at least one insert; found ${insertCount}.`,
    );
  }
  const metadataMarkdown = fs.readFileSync(metadataPath, "utf8");
  const { metadata, links } = parseMetadata(metadataMarkdown);
  const shell = commonShell();
  const articles = metadata.map((item, index) => {
    const source = sources[index];
    const sourcePath = path.join(draftsRoot, source);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing approved draft: ${sourcePath}`);
    }
    const visual = getReikiVisual(item.number);
    return parseDraft(fs.readFileSync(sourcePath, "utf8"), {
      ...item,
      source,
      visual,
      publishedDate: index < 3 ? "2026-07-23" : "2026-07-24",
    });
  });

  for (const article of articles) {
    const outputDirectory = path.join(siteRoot, article.route.replace(/^\//, ""));
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(outputDirectory, "index.html"),
      cleanGeneratedHtml(renderArticle(article, articles, links, shell)),
      "utf8",
    );
  }

  fs.writeFileSync(
    path.join(siteRoot, "biblioteka", "reiki", "index.html"),
    cleanGeneratedHtml(renderHub(articles, shell)),
    "utf8",
  );
  console.log(
    `Generated ${articles.length} Reiki articles, ${insertCount} internal visuals and the Reiki hub.`,
  );
}

main();
