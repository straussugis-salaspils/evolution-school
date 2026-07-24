import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoot =
  process.env.REIKI_SEO_SOURCE ||
  "C:\\Users\\Ugis\\Documents\\000 LifeOS\\ugis-aiu-memory\\Sveta\\SEO\\docs\\seo\\reiki";
const metadataPath = path.join(
  sourceRoot,
  "research",
  "publication-metadata-and-links.md",
);
const draftsRoot = path.join(sourceRoot, "drafts");
const baseUrl = "https://evolution.yourbalancerestored.com";
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

const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&nbsp;", " ");
}

function normalize(value) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>|]/g, " ")
    .replace(/^[-\d.]+\s+/gm, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTableRow(line) {
  const cells = [];
  let cell = "";
  for (let index = 1; index < line.length - 1; index += 1) {
    if (line[index] === "\\" && line[index + 1] === "|") {
      cell += "|";
      index += 1;
    } else if (line[index] === "|") {
      cells.push(cell.trim().replace(/^`|`$/g, ""));
      cell = "";
    } else {
      cell += line[index];
    }
  }
  cells.push(cell.trim().replace(/^`|`$/g, ""));
  return cells;
}

function parseMap(markdown) {
  const articles = [];
  const related = {};
  let mode = "";
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("## URL, title")) mode = "metadata";
    else if (line.startsWith("## Карта article-to-article")) mode = "links";
    else if (line.startsWith("## ")) mode = "";
    if (!line.startsWith("|") || /^\|\s*:?-/.test(line)) continue;
    const cells = splitTableRow(line);
    if (mode === "metadata" && /^\d+$/.test(cells[0])) {
      articles.push({
        number: Number(cells[0]),
        route: cells[1],
        title: cells[2],
        description: cells[3],
      });
    }
    if (mode === "links" && /^\d+$/.test(cells[0])) {
      related[Number(cells[0])] = cells[1]
        .split(",")
        .map((item) => Number(item.trim()));
    }
  }
  return { articles, related };
}

function extractAttribute(html, pattern, label) {
  const match = html.match(pattern);
  if (!match) {
    fail(`Missing ${label}.`);
    return "";
  }
  return decodeHtml(match[1]);
}

const metadata = fs.readFileSync(metadataPath, "utf8");
const { articles, related } = parseMap(metadata);
if (articles.length !== 18) fail(`Metadata contains ${articles.length}, not 18 articles.`);

const htmlByNumber = new Map();
const routeToNumber = new Map(articles.map((article) => [article.route, article.number]));

for (const article of articles) {
  const source = sources[article.number - 1];
  const draftPath = path.join(draftsRoot, source);
  const htmlPath = path.join(root, article.route.replace(/^\//, ""), "index.html");
  if (!fs.existsSync(draftPath)) {
    fail(`Article ${article.number}: missing final draft ${source}.`);
    continue;
  }
  if (!fs.existsSync(htmlPath)) {
    fail(`Article ${article.number}: missing HTML ${htmlPath}.`);
    continue;
  }

  const draft = fs.readFileSync(draftPath, "utf8").replace(/\r/g, "");
  const html = fs.readFileSync(htmlPath, "utf8");
  htmlByNumber.set(article.number, html);
  const canonical = `${baseUrl}${article.route}`;
  const h1 = draft.match(/^# (.+)$/m)?.[1]?.trim() || "";

  const title = extractAttribute(html, /<title>([\s\S]*?)<\/title>/i, `title for ${article.number}`);
  const description = extractAttribute(
    html,
    /<meta name="description" content="([^"]*)"/i,
    `description for ${article.number}`,
  );
  const canonicalActual = extractAttribute(
    html,
    /<link rel="canonical" href="([^"]+)"/i,
    `canonical for ${article.number}`,
  );
  const ogUrl = extractAttribute(
    html,
    /<meta property="og:url" content="([^"]+)"/i,
    `og:url for ${article.number}`,
  );
  const h1Actual = extractAttribute(html, /<h1>([\s\S]*?)<\/h1>/i, `H1 for ${article.number}`);

  if (title !== article.title) fail(`Article ${article.number}: title mismatch.`);
  if (description !== article.description) fail(`Article ${article.number}: description mismatch.`);
  if (canonicalActual !== canonical) fail(`Article ${article.number}: canonical mismatch.`);
  if (ogUrl !== canonical) fail(`Article ${article.number}: og:url mismatch.`);
  if (h1Actual !== h1) fail(`Article ${article.number}: H1 mismatch.`);
  if (!html.includes('"@type": "Article"')) fail(`Article ${article.number}: Article schema missing.`);
  if (!html.includes('"@type": "BreadcrumbList"')) fail(`Article ${article.number}: breadcrumb schema missing.`);
  if (!html.includes('<aside class="article-author"')) fail(`Article ${article.number}: author block missing.`);
  if (!html.includes('<nav class="library-breadcrumb"')) fail(`Article ${article.number}: visible breadcrumbs missing.`);
  if (!html.includes('class="article-next-step"')) fail(`Article ${article.number}: product CTA styling missing.`);
  if (html.includes("/blog/chto-takoe-reiki.html")) fail(`Article ${article.number}: obsolete blog URL found.`);

  const articleBody = html.match(/<article class="article-body">([\s\S]*?)<aside class="article-author"/)?.[1] || "";
  const sourceLines = draft
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        line !== "---" &&
        !line.startsWith("# ") &&
        !/^\|\s*:?-/.test(line),
    );
  const bodyText = normalize(
    articleBody
      .replace(/<aside class="article-related"[\s\S]*?<\/aside>/, " ")
      .replace(/<p class="article-next-step__eyebrow"[\s\S]*?<\/p>/, " "),
  );
  for (const line of sourceLines) {
    const pieces = line.startsWith("|")
      ? splitTableRow(line).filter(Boolean)
      : [line];
    for (const piece of pieces) {
      const expected = normalize(piece);
      if (expected.length > 2 && !bodyText.includes(expected)) {
        fail(`Article ${article.number}: source text missing: "${expected.slice(0, 90)}".`);
      }
    }
  }

  const relatedAside = html.match(/<aside class="article-related"[\s\S]*?<\/aside>/)?.[0] || "";
  if (article.number === 11) {
    if (relatedAside) fail("Article 11: duplicate template related component found.");
  } else {
    if (!relatedAside) fail(`Article ${article.number}: related component missing.`);
    const actualTargets = [...relatedAside.matchAll(/href="(\/biblioteka\/reiki\/[^"]+\/)"/g)]
      .map((match) => routeToNumber.get(match[1]))
      .filter(Boolean)
      .sort((a, b) => a - b);
    const expectedTargets = [...(related[article.number] || [])].sort((a, b) => a - b);
    if (JSON.stringify(actualTargets) !== JSON.stringify(expectedTargets)) {
      fail(
        `Article ${article.number}: related targets ${actualTargets.join(",")} != ${expectedTargets.join(",")}.`,
      );
    }
  }
}

const incoming = new Map(articles.map((article) => [article.number, 0]));
for (const [sourceNumber, html] of htmlByNumber) {
  for (const match of html.matchAll(/href="(\/biblioteka\/reiki\/[^"]+\/)"/g)) {
    const target = routeToNumber.get(match[1]);
    if (target && target !== sourceNumber) incoming.set(target, incoming.get(target) + 1);
  }
}
for (const [number, count] of incoming) {
  if (count < 1) fail(`Article ${number}: no inbound link from another article.`);
}

const hubPath = path.join(root, "biblioteka", "reiki", "index.html");
const hub = fs.readFileSync(hubPath, "utf8");
for (const article of articles) {
  if (!hub.includes(`href="${article.route}"`)) {
    fail(`Hub: missing link to article ${article.number}.`);
  }
}
if (!hub.includes("<strong>18</strong>")) fail("Hub: article count is not 18.");
if (fs.existsSync(path.join(root, "biblioteka", "reiki", "article-19"))) {
  fail("Article 19 exists but must not be created.");
}

const article09 = fs.readFileSync(
  path.join(root, articles[8].route.replace(/^\//, ""), "index.html"),
  "utf8",
);
for (const phrase of ["не должна заменять", "не является клиническим доказательством", "медицин"]) {
  if (!normalize(article09).toLowerCase().includes(phrase)) {
    fail(`Article 09: required medical boundary missing (${phrase}).`);
  }
}

const article10 = normalize(
  fs.readFileSync(path.join(root, articles[9].route.replace(/^\//, ""), "index.html"), "utf8"),
).toLowerCase();
for (const forbidden of ["возврат оплаты", "правила возврата", "перенос оплаты"]) {
  if (article10.includes(forbidden)) fail(`Article 10: forbidden publication term found (${forbidden}).`);
}

const article18 = normalize(
  fs.readFileSync(path.join(root, articles[17].route.replace(/^\//, ""), "index.html"), "utf8"),
).toLowerCase();
for (const forbidden of ["скидк", "формат оплаты", "стоимость переинициации", "цена переинициации"]) {
  if (article18.includes(forbidden)) fail(`Article 18: forbidden commercial detail found (${forbidden}).`);
}

notes.push(
  `Checked ${articles.length} routes, final Markdown parity, metadata, schema, CTA, related links and inbound links.`,
);
notes.push(
  `Inbound links per article: ${[...incoming].map(([number, count]) => `${number}:${count}`).join(" ")}`,
);

if (errors.length) {
  console.error(`Reiki article audit failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Reiki article audit passed.");
notes.forEach((note) => console.log(`- ${note}`));
