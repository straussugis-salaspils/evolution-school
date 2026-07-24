import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { transitionVisuals } from "./transition-article-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const runtimeModules =
  process.env.CODEX_NODE_MODULES ||
  "C:\\Users\\Ugis\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const require = createRequire(path.join(runtimeModules, "package.json"));
const sharp = require("sharp");

const variants = [
  { name: "hero", widths: [480, 768, 1200, 1600], ratio: [4, 3] },
  { name: "card", widths: [480, 800, 1200], ratio: [8, 5] },
  { name: "og", widths: [1200], ratio: [40, 21] },
];

function sourceFile(publicPath) {
  return path.join(siteRoot, publicPath.replace(/^\//, ""));
}

async function renderVariant(visual, variant, width, outputDir) {
  const height = Math.round((width * variant.ratio[1]) / variant.ratio[0]);
  const base = sharp(sourceFile(visual.source))
    .rotate()
    .resize(width, height, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    });

  await base
    .clone()
    .webp({ quality: variant.name === "og" ? 82 : 80, effort: 5 })
    .toFile(path.join(outputDir, `${variant.name}-${width}.webp`));
  await base
    .clone()
    .jpeg({ quality: variant.name === "og" ? 80 : 72, progressive: true })
    .toFile(path.join(outputDir, `${variant.name}-${width}.jpg`));
}

async function main() {
  for (const visual of transitionVisuals) {
    const slug = String(visual.number).padStart(2, "0");
    const outputDir = path.join(siteRoot, "assets", "transition-articles", slug);
    fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(sourceFile(visual.source))) {
      throw new Error(`Missing source image: ${visual.source}`);
    }
    for (const variant of variants) {
      for (const width of variant.widths) {
        await renderVariant(visual, variant, width, outputDir);
      }
    }
  }
  console.log(`Prepared responsive assets for ${transitionVisuals.length} transition articles.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
