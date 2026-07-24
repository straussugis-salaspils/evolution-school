import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import {
  getReikiInsertCount,
  reikiVisuals,
} from "./reiki-visual-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const pilotRoot = path.join(
  siteRoot,
  "artifacts",
  "reiki-internal-visual-pilots",
);
const insertRoot = path.join(siteRoot, "assets", "reiki-articles", "inserts");
const runtimeModules = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "node",
  "node_modules",
);
const runtimeRequire = createRequire(path.join(runtimeModules, "codex-loader.cjs"));
const sharp = runtimeRequire("sharp");

const selectedFragments = [
  ["04/variant-a.html", "04/pause-line.html"],
  ["04/notes.md", "04/notes.md"],
  ["09/variant-b.html", "09/medical-boundary.html"],
  ["09/notes.md", "09/notes.md"],
  ["13/variant-a.html", "13/three-routes.html"],
  ["13/variant-b.html", "13/decision-compass.html"],
  ["13/notes.md", "13/notes.md"],
  ["14/variant-b.html", "14/third-degree-models.html"],
  ["14/notes.md", "14/notes.md"],
  ["18/variant-a.html", "18/four-situations-matrix.html"],
  ["18/notes.md", "18/notes.md"],
  ["01/provenance.md", "01/provenance.md"],
];

const requiredProductionFragments = [
  "02/initiation-sequence.html",
  "03/skill-vs-promises.html",
  "05/reiki-i-vs-ii.html",
  "06/information-vs-transmission.html",
  "07/everyday-practice.html",
  "08/sensation-spectrum.html",
  "09/worsening-action-map.html",
  "10/thirteen-questions-navigator.html",
  "10/red-flags-poster.html",
  "11/seven-traps-map.html",
  "12/master-responsibility-timeline.html",
  "12/professional-boundaries-map.html",
  "14/evolution-house-route.html",
  "15/learning-history-collage.html",
  "15/possible-decisions.html",
  "16/readiness-constellation.html",
  "16/pause-is-part-of-route.html",
  "17/master-vs-teacher.html",
  "18/red-flags-poster.html",
];

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function copySelectedPilots() {
  for (const [source, destination] of selectedFragments) {
    const sourcePath = path.join(pilotRoot, source);
    const destinationPath = path.join(insertRoot, destination);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing selected pilot: ${sourcePath}`);
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

async function writeWithinBudget(image, outputPath, format, budget) {
  let quality = format === "webp" ? 82 : 84;
  let info;
  while (quality >= 48) {
    const pipeline =
      format === "webp"
        ? image.clone().webp({ quality, smartSubsample: true })
        : image.clone().jpeg({ quality, mozjpeg: true });
    info = await pipeline.toFile(outputPath);
    if (info.size <= budget) return { ...info, quality };
    quality -= 4;
  }
  if (info.size > budget) {
    throw new Error(
      `${path.basename(outputPath)} is ${info.size} bytes; budget is ${budget}.`,
    );
  }
  return { ...info, quality };
}

async function processEditorial() {
  const sourcePath = path.join(pilotRoot, "01", "variant-a.png");
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing selected editorial master: ${sourcePath}`);
  }
  const outputDirectory = path.join(insertRoot, "01");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const source = sharp(sourcePath).rotate();
  const metadata = await source.metadata();
  const outputs = [];

  for (const width of [480, 768, 1200]) {
    const resized = source.clone().resize({
      width,
      withoutEnlargement: true,
      fit: "inside",
    });
    for (const format of ["webp", "jpg"]) {
      const outputPath = path.join(
        outputDirectory,
        `editorial-${width}.${format}`,
      );
      const info = await writeWithinBudget(
        resized,
        outputPath,
        format === "jpg" ? "jpeg" : "webp",
        width === 480 ? 120_000 : 180_000,
      );
      outputs.push({
        file: path.relative(siteRoot, outputPath).replaceAll("\\", "/"),
        width: info.width,
        height: info.height,
        bytes: info.size,
        quality: info.quality,
        sha256: sha256(outputPath),
      });
    }
  }

  return {
    source: path.relative(siteRoot, sourcePath).replaceAll("\\", "/"),
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    sourceSha256: sha256(sourcePath),
    outputs,
  };
}

function validateProductionFragments() {
  const missing = requiredProductionFragments.filter(
    (file) => !fs.existsSync(path.join(insertRoot, file)),
  );
  if (missing.length) {
    throw new Error(
      `Missing ${missing.length} production insert fragment(s):\n${missing.join("\n")}`,
    );
  }
}

async function main() {
  const expectedInsertCount = getReikiInsertCount();
  fs.mkdirSync(insertRoot, { recursive: true });
  copySelectedPilots();
  const editorial = await processEditorial();
  validateProductionFragments();
  fs.writeFileSync(
    path.join(insertRoot, "production-manifest.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        selectedPilotSet: ["01A", "04A", "09B", "13A", "14B", "18A"],
        selectedAdditionalPilot: "13B",
        expectedInsertCount,
        expectedArticleCount: reikiVisuals.length,
        editorial,
        fragments: [
          ...selectedFragments
            .filter(([, destination]) => destination.endsWith(".html"))
            .map(([, destination]) => destination),
          ...requiredProductionFragments,
        ].sort(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(
    `Prepared selected pilots and validated ${expectedInsertCount} internal inserts.`,
  );
}

await main();
