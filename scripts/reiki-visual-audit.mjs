import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  getReikiInsertCount,
  reikiVisuals,
} from "./reiki-visual-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const articleRoot = path.join(siteRoot, "biblioteka", "reiki");
const assetRoot = path.join(siteRoot, "assets", "reiki-articles");
const errors = [];
const allowedFamilies = new Set([
  "editorial",
  "sequence",
  "comparison",
  "map",
  "spectrum",
  "warning",
]);
const allowedTones = new Set([
  "default",
  "route",
  "medical",
  "dark",
  "warning",
]);

const requiredAssets = [
  ["hero-480.webp", 150_000],
  ["hero-768.webp", 220_000],
  ["hero-1200.webp", 250_000],
  ["hero-1600.webp", 250_000],
  ["hero-480.jpg", 150_000],
  ["hero-768.jpg", 220_000],
  ["hero-1200.jpg", 250_000],
  ["hero-1600.jpg", 250_000],
  ["card-480.webp", 150_000],
  ["card-800.webp", 180_000],
  ["card-1200.webp", 220_000],
  ["card-480.jpg", 150_000],
  ["card-800.jpg", 180_000],
  ["card-1200.jpg", 220_000],
  ["og-1200.jpg", 300_000],
];

function fail(message) {
  errors.push(message);
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

const sourceHashes = new Map();
const manifestPath = path.join(assetRoot, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  fail("Missing assets/reiki-articles/manifest.json.");
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.articles?.length !== 18) {
    fail(`Expected 18 manifest entries, found ${manifest.articles?.length || 0}.`);
  }
  for (const article of manifest.articles || []) {
    const existing = sourceHashes.get(article.sourceSha256);
    if (existing) {
      fail(
        `Articles ${existing} and ${article.number} use identical selected Hero sources.`,
      );
    }
    sourceHashes.set(article.sourceSha256, article.number);
  }
}

for (const visual of reikiVisuals) {
  const folder = String(visual.number).padStart(2, "0");
  for (const insert of visual.inserts) {
    if (!allowedFamilies.has(insert.family)) {
      fail(`Insert ${insert.id} has unsupported family ${insert.family}.`);
    }
    if (!allowedTones.has(insert.tone)) {
      fail(`Insert ${insert.id} has unsupported tone ${insert.tone}.`);
    }
  }
  for (const [filename, budget] of requiredAssets) {
    const filePath = path.join(assetRoot, folder, filename);
    if (!fs.existsSync(filePath)) {
      fail(`Missing ${path.relative(siteRoot, filePath)}.`);
      continue;
    }
    const bytes = fs.statSync(filePath).size;
    if (bytes > budget) {
      fail(
        `${path.relative(siteRoot, filePath)} is ${bytes} bytes; budget is ${budget}.`,
      );
    }
  }
}

const articleFiles = fs
  .readdirSync(articleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(articleRoot, entry.name, "index.html"))
  .filter((filePath) => fs.existsSync(filePath));

if (articleFiles.length !== 18) {
  fail(`Expected 18 Reiki article HTML files, found ${articleFiles.length}.`);
}

let insertCount = 0;
for (const filePath of articleFiles) {
  const html = fs.readFileSync(filePath, "utf8");
  const match = html.match(/\/assets\/reiki-articles\/(\d{2})\/hero-1200\.jpg/);
  if (!match) {
    fail(`${path.relative(siteRoot, filePath)} has no responsive Reiki Hero.`);
    continue;
  }
  const visual = reikiVisuals.find(
    (entry) => String(entry.number).padStart(2, "0") === match[1],
  );
  if (!visual) {
    fail(`${path.relative(siteRoot, filePath)} references unknown Hero ${match[1]}.`);
    continue;
  }
  if (!html.includes(`<picture class="article-responsive-image article-responsive-image--hero">`)) {
    fail(`${path.relative(siteRoot, filePath)} is missing the Hero picture element.`);
  }
  if (!html.includes('fetchpriority="high"')) {
    fail(`${path.relative(siteRoot, filePath)} Hero is missing fetchpriority.`);
  }
  if (html.match(/article-responsive-image--hero[\s\S]{0,700}loading="lazy"/)) {
    fail(`${path.relative(siteRoot, filePath)} lazy-loads its Hero.`);
  }
  if (!html.includes(`alt="${visual.alt}"`)) {
    fail(`${path.relative(siteRoot, filePath)} does not use the approved visual alt.`);
  }
  if (html.includes("reiki-hands-initiation.jpg") || html.includes("reiki-first-weeks-practice.jpg")) {
    fail(`${path.relative(siteRoot, filePath)} still references a duplicated legacy Hero.`);
  }
  if (html.includes('class="article-explainer')) {
    fail(`${path.relative(siteRoot, filePath)} still contains a legacy explainer.`);
  }
  const ids = [
    ...html.matchAll(
      /<(?:div|figure)\b[^>]*\bdata-reiki-insert="([^"]+)"[^>]*>/g,
    ),
  ].map((match) => match[1]);
  const expectedIds = visual.inserts.map((insert) => insert.id);
  const hasExpectedInsertSet =
    ids.length === expectedIds.length &&
    JSON.stringify([...ids].sort()) ===
      JSON.stringify([...expectedIds].sort());
  if (!hasExpectedInsertSet) {
    fail(
      `${path.relative(siteRoot, filePath)} inserts ${JSON.stringify(ids)} do not match ${JSON.stringify(expectedIds)}.`,
    );
  }
  for (const insert of visual.inserts) {
    const escapedId = insert.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wrapperPattern = new RegExp(
      `class="[^"]*article-visual-insert--family-${insert.family}[^"]*article-visual-insert--tone-${insert.tone}[^"]*"[^>]*data-visual-family="${insert.family}"[^>]*data-visual-tone="${insert.tone}"[^>]*data-reiki-insert="${escapedId}"`,
    );
    if (!wrapperPattern.test(html)) {
      fail(
        `${path.relative(siteRoot, filePath)} is missing family/tone metadata for ${insert.id}.`,
      );
    }
  }
  insertCount += ids.length;
}

const insertSourceRoot = path.join(assetRoot, "inserts");
const insertSources = [];
function collectInsertSources(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) collectInsertSources(current);
    else if (
      entry.isFile() &&
      current.endsWith(".html") &&
      !/variant-[ab]\.html$/i.test(current)
    ) {
      insertSources.push(current);
    }
  }
}
collectInsertSources(insertSourceRoot);
for (const sourcePath of insertSources) {
  const source = fs.readFileSync(sourcePath, "utf8");
  if (/Trebuchet MS|font(?:-family)?\s*:[^;{}]*Arial\s*,\s*sans-serif/i.test(source)) {
    fail(
      `${path.relative(siteRoot, sourcePath)} contains a non-system Reiki body font.`,
    );
  }
}

const configuredInsertCount = getReikiInsertCount();
if (insertCount !== configuredInsertCount) {
  fail(
    `Expected ${configuredInsertCount} configured internal inserts, found ${insertCount}.`,
  );
}

const insertManifestPath = path.join(
  assetRoot,
  "inserts",
  "production-manifest.json",
);
if (!fs.existsSync(insertManifestPath)) {
  fail("Missing internal insert production manifest.");
} else {
  const manifest = JSON.parse(fs.readFileSync(insertManifestPath, "utf8"));
  if (manifest.expectedInsertCount !== configuredInsertCount) {
    fail(
      `Internal insert manifest expects ${manifest.expectedInsertCount} objects instead of ${configuredInsertCount}.`,
    );
  }
  for (const output of manifest.editorial?.outputs || []) {
    const filePath = path.join(siteRoot, output.file);
    if (!fs.existsSync(filePath)) {
      fail(`Missing ${output.file}.`);
    } else if (fs.statSync(filePath).size > 180_000) {
      fail(
        `${output.file} is ${fs.statSync(filePath).size} bytes; internal asset budget is 180000.`,
      );
    }
  }
}

const hubPath = path.join(articleRoot, "index.html");
const hubHtml = fs.readFileSync(hubPath, "utf8");
if (!hubHtml.includes("/assets/reiki-articles/01/og-1200.jpg")) {
  fail("Reiki hub still uses the legacy 2.3 MB OG image.");
}

const outputHashes = new Map();
for (const visual of reikiVisuals) {
  const folder = String(visual.number).padStart(2, "0");
  const filePath = path.join(assetRoot, folder, "hero-1200.webp");
  if (!fs.existsSync(filePath)) continue;
  const hash = sha256(filePath);
  const existing = outputHashes.get(hash);
  if (existing) {
    fail(`Articles ${existing} and ${visual.number} have identical Hero outputs.`);
  }
  outputHashes.set(hash, visual.number);
}

if (errors.length) {
  console.error(`Reiki visual audit failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Reiki visual audit passed: 18 unique Hero selections, ${configuredInsertCount} configured internal inserts and all responsive assets are within budget.`,
);
