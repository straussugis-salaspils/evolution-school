import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const siteRoot = path.resolve(import.meta.dirname, "..");
const selectionPath = path.join(
  siteRoot,
  "artifacts",
  "reiki-visual-production",
  "selection.json",
);
const outputRoot = path.join(siteRoot, "assets", "reiki-articles");

const variants = [
  { name: "hero-480", width: 480, height: 360, budget: 150_000 },
  { name: "hero-768", width: 768, height: 576, budget: 220_000 },
  { name: "hero-1200", width: 1200, height: 900, budget: 250_000 },
  { name: "hero-1600", width: 1600, height: 1200, budget: 250_000 },
  { name: "card-480", width: 480, height: 300, budget: 150_000 },
  { name: "card-800", width: 800, height: 500, budget: 180_000 },
  { name: "card-1200", width: 1200, height: 750, budget: 220_000 },
];

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

async function writeWithinBudget(image, outputPath, format, budget) {
  let quality = format === "webp" ? 78 : 82;
  let info;
  while (quality >= 54) {
    const pipeline =
      format === "webp"
        ? image.clone().webp({ quality, smartSubsample: true })
        : image.clone().jpeg({ quality, mozjpeg: true });
    info = await pipeline.toFile(outputPath);
    if (info.size <= budget) return { ...info, quality };
    quality -= 4;
  }
  return { ...info, quality };
}

async function processSelection(number, item) {
  const sourcePath = path.resolve(siteRoot, item.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing selected source for article ${number}: ${sourcePath}`);
  }

  const folder = String(number).padStart(2, "0");
  const outputDirectory = path.join(outputRoot, folder);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const source = sharp(sourcePath).rotate();
  const sourceMetadata = await source.metadata();
  const outputs = [];

  for (const variant of variants) {
    const resized = source.clone().resize(variant.width, variant.height, {
      fit: "cover",
      position: item.position || "attention",
    });
    for (const format of ["webp", "jpg"]) {
      const outputPath = path.join(outputDirectory, `${variant.name}.${format}`);
      const info = await writeWithinBudget(
        resized,
        outputPath,
        format === "jpg" ? "jpeg" : "webp",
        variant.budget,
      );
      outputs.push({
        file: path.relative(siteRoot, outputPath).replaceAll("\\", "/"),
        width: variant.width,
        height: variant.height,
        bytes: info.size,
        quality: info.quality,
        sha256: sha256(outputPath),
      });
    }
  }

  const ogPath = path.join(outputDirectory, "og-1200.jpg");
  const ogInfo = await writeWithinBudget(
    source.clone().resize(1200, 630, {
      fit: "cover",
      position: item.position || "attention",
    }),
    ogPath,
    "jpeg",
    300_000,
  );
  outputs.push({
    file: path.relative(siteRoot, ogPath).replaceAll("\\", "/"),
    width: 1200,
    height: 630,
    bytes: ogInfo.size,
    quality: ogInfo.quality,
    sha256: sha256(ogPath),
  });

  return {
    number: Number(number),
    selectedSource: item.source.replaceAll("\\", "/"),
    selectionReason: item.reason,
    promptFile: item.promptFile?.replaceAll("\\", "/") || null,
    sourceWidth: sourceMetadata.width,
    sourceHeight: sourceMetadata.height,
    sourceSha256: sha256(sourcePath),
    outputs,
  };
}

async function main() {
  if (!fs.existsSync(selectionPath)) {
    throw new Error(`Missing selection manifest: ${selectionPath}`);
  }
  const selection = JSON.parse(fs.readFileSync(selectionPath, "utf8"));
  const numbers = Object.keys(selection).sort((a, b) => Number(a) - Number(b));
  if (numbers.length !== 18) {
    throw new Error(`Expected 18 selected Hero images, found ${numbers.length}.`);
  }

  const manifest = [];
  for (const number of numbers) {
    manifest.push(await processSelection(number, selection[number]));
  }

  const manifestPath = path.join(outputRoot, "manifest.json");
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        selectionFile: path.relative(siteRoot, selectionPath).replaceAll("\\", "/"),
        articles: manifest,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`Processed ${manifest.length} Reiki visual selections.`);
}

await main();
