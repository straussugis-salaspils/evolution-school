import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { transitionVisuals } from "./transition-article-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const assetRoot = path.join(siteRoot, "assets", "transition-articles");
const articleRoot = path.join(siteRoot, "biblioteka", "perehody");
const provenancePath = path.join(
  siteRoot,
  "docs",
  "seo",
  "transitions",
  "hero-provenance.md",
);
const errors = [];

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
  ["og-1200.webp", 220_000],
  ["og-1200.jpg", 300_000],
];

function fail(message) {
  errors.push(message);
}

function hash(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

if (transitionVisuals.length !== 12) {
  fail(`Expected 12 transition visual configs, found ${transitionVisuals.length}.`);
}

const sourceHashes = new Map();
const outputHashes = new Map();
const provenance = fs.existsSync(provenancePath)
  ? fs.readFileSync(provenancePath, "utf8")
  : "";
if (!provenance) {
  fail("Missing tracked Hero provenance manifest.");
}
for (const visual of transitionVisuals) {
  const folder = String(visual.number).padStart(2, "0");
  const sourcePath = path.join(siteRoot, visual.source.replace(/^\//, ""));
  if (!fs.existsSync(sourcePath)) {
    fail(`Missing selected Hero source ${visual.source}.`);
  } else {
    const sourceHash = hash(sourcePath);
    const duplicate = sourceHashes.get(sourceHash);
    if (duplicate) {
      fail(`Articles ${duplicate} and ${visual.number} use identical Hero sources.`);
    }
    sourceHashes.set(sourceHash, visual.number);
    const sourceName = path.basename(sourcePath);
    if (
      provenance &&
      (!provenance.includes(sourceName) || !provenance.includes(sourceHash))
    ) {
      fail(
        `Hero provenance manifest is missing ${sourceName} or its SHA-256 hash.`,
      );
    }
  }
  if (
    typeof visual.focal?.x !== "number" ||
    typeof visual.focal?.y !== "number" ||
    visual.focal.x < 0 ||
    visual.focal.x > 1 ||
    visual.focal.y < 0 ||
    visual.focal.y > 1
  ) {
    fail(`Article ${visual.number} has an invalid focal point.`);
  }
  if (visual.inserts.length > 1) {
    fail(`Article ${visual.number} may have at most one internal visual.`);
  }
  for (const [filename, budget] of requiredAssets) {
    const assetPath = path.join(assetRoot, folder, filename);
    if (!fs.existsSync(assetPath)) {
      fail(`Missing assets/transition-articles/${folder}/${filename}.`);
      continue;
    }
    const bytes = fs.statSync(assetPath).size;
    if (bytes > budget) {
      fail(
        `assets/transition-articles/${folder}/${filename} is ${bytes} bytes; budget is ${budget}.`,
      );
    }
  }
  const outputPath = path.join(assetRoot, folder, "hero-1200.webp");
  if (fs.existsSync(outputPath)) {
    const outputHash = hash(outputPath);
    const duplicate = outputHashes.get(outputHash);
    if (duplicate) {
      fail(`Articles ${duplicate} and ${visual.number} have identical Hero outputs.`);
    }
    outputHashes.set(outputHash, visual.number);
  }
}

const insertSourcePath = path.join(
  assetRoot,
  "inserts",
  "visual-source.fragment",
);
const insertCssPath = path.join(
  assetRoot,
  "inserts",
  "transition-inserts.css",
);
if (!fs.existsSync(insertSourcePath)) {
  fail("Missing transition insert visual source.");
} else {
  const source = fs.readFileSync(insertSourcePath, "utf8");
  if (/<script\b|https?:\/\/|<link\b/i.test(source)) {
    fail("Transition insert source must be local and script-free.");
  }
  if (/\brole="img"/i.test(source)) {
    fail(
      "Transition insert source must keep its explanatory text available as normal document content.",
    );
  }
  for (const visual of transitionVisuals) {
    const id = String(visual.number).padStart(2, "0");
    const matches = source.match(
      new RegExp(`<figure class="visual" id="visual-${id}">`, "g"),
    );
    if (matches?.length !== 1) {
      fail(`Expected one visual-${id} source figure, found ${matches?.length || 0}.`);
    }
  }
}
if (!fs.existsSync(insertCssPath)) {
  fail("Missing transition insert stylesheet.");
} else {
  const css = fs.readFileSync(insertCssPath, "utf8");
  if (/^(?:body|:root|\.gallery)\b/m.test(css) || /^\.visual\s*\{/m.test(css)) {
    fail("Transition insert stylesheet leaks prototype-level global selectors.");
  }
  if (!css.includes("@scope (.transition-article-insert)")) {
    fail("Transition insert stylesheet is missing its explicit component scope.");
  }
}

const articleFiles = fs
  .readdirSync(articleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(articleRoot, entry.name, "index.html"))
  .filter((filePath) => fs.existsSync(filePath));
if (articleFiles.length !== 12) {
  fail(`Expected 12 transition article HTML files, found ${articleFiles.length}.`);
}

const seenInsertIds = new Set();
for (const filePath of articleFiles) {
  const html = fs.readFileSync(filePath, "utf8");
  const heroMatch = html.match(
    /\/assets\/transition-articles\/(\d{2})\/hero-1200\.jpg/,
  );
  if (!heroMatch) {
    fail(`${path.relative(siteRoot, filePath)} has no responsive transition Hero.`);
    continue;
  }
  const visual = transitionVisuals.find(
    (item) => String(item.number).padStart(2, "0") === heroMatch[1],
  );
  if (!visual) {
    fail(`${path.relative(siteRoot, filePath)} references an unknown Hero.`);
    continue;
  }
  if (!html.includes('fetchpriority="high"')) {
    fail(`${path.relative(siteRoot, filePath)} Hero is missing fetchpriority.`);
  }
  if (
    html.match(
      /article-responsive-image--hero[\s\S]{0,700}loading="lazy"/,
    )
  ) {
    fail(`${path.relative(siteRoot, filePath)} lazy-loads its Hero.`);
  }
  if (!html.includes(`alt="${visual.alt}"`)) {
    fail(`${path.relative(siteRoot, filePath)} has the wrong Hero alt.`);
  }
  const ids = [
    ...html.matchAll(/data-transition-insert="([^"]+)"/g),
  ].map((match) => match[1]);
  const expectedIds = visual.inserts.map((insert) => insert.id);
  if (
    ids.length !== expectedIds.length ||
    JSON.stringify([...ids].sort()) !==
      JSON.stringify([...expectedIds].sort())
  ) {
    fail(
      `${path.relative(siteRoot, filePath)} inserts ${JSON.stringify(ids)} do not match ${JSON.stringify(expectedIds)}.`,
    );
  }
  ids.forEach((id) => seenInsertIds.add(id));
}

const expectedInsertCount = transitionVisuals.reduce(
  (count, visual) => count + visual.inserts.length,
  0,
);
if (seenInsertIds.size !== expectedInsertCount) {
  fail(
    `Expected ${expectedInsertCount} unique configured internal visual IDs, found ${seenInsertIds.size}.`,
  );
}

const processor = fs.readFileSync(
  path.join(siteRoot, "scripts", "process-transition-visuals.mjs"),
  "utf8",
);
if (!processor.includes("focalCrop") || /position:\s*["']centre["']/.test(processor)) {
  fail("Transition visual processor does not use focal-aware cropping.");
}

if (errors.length) {
  console.error(
    `Transition visual audit failed with ${errors.length} issue(s):`,
  );
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Transition visual audit passed: 12 unique Hero sources, ${expectedInsertCount} configured internal visuals, focal-aware crops and all responsive assets within budget.`,
);
