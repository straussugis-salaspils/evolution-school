import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { archetypeArticleInserts } from "./archetype-article-inserts.mjs";

const playwrightPath = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "node",
  "node_modules",
  "playwright",
  "index.mjs",
);
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const root = path.resolve(import.meta.dirname, "..");
const baseUrl = process.env.ARCHETYPE_PREVIEW_URL || "http://127.0.0.1:4177";
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs", "seo", "archetypes", "production", "portfolio-routes.json"),
    "utf8",
  ),
);
const articles = manifest.assets.filter((item) => item.index_state === "index");
const artifactRoot = path.join(root, "artifacts", "archetype-article-inserts");
fs.mkdirSync(artifactRoot, { recursive: true });

const missingConfig = articles
  .filter((article) => !archetypeArticleInserts[article.route_id])
  .map((article) => article.route_id);
if (missingConfig.length) {
  throw new Error(`Missing insert config: ${missingConfig.join(", ")}`);
}

const browser = await chromium.launch({ headless: true });
const failures = [];
const samples = new Set(articles.map((article) => article.route_id));

for (const width of [1440, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    localStorage.setItem("eh_consent_v2", "essential_only");
  });
  const page = await context.newPage();
  for (const article of articles) {
    const insertConfig = archetypeArticleInserts[article.route_id];
    const isSplitInsert = Boolean(insertConfig.sceneAfter || insertConfig.diagramAfter);
    const response = await page.goto(`${baseUrl}${article.canonical}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    const state = await page.evaluate((expected) => {
      const insert = document.querySelector(".archetype-insert");
      const story = document.querySelector(".archetype-story-image");
      const diagramSection = insert?.closest("section");
      const storySection = story?.closest("section");
      const images = [...document.querySelectorAll(".archetype-insert img, .archetype-story-image img")];
      const nodes = insert ? [...insert.querySelectorAll(".archetype-insert__nodes li")] : [];
      return {
        insertCount: document.querySelectorAll(".archetype-insert").length,
        storyCount: document.querySelectorAll(".archetype-story-image").length,
        diagramSectionHeading:
          diagramSection?.querySelector(":scope > h2")?.textContent?.trim() || "",
        storySectionHeading:
          storySection?.querySelector(":scope > h2")?.textContent?.trim() || "",
        pageOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        brokenImages: images
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc),
        clippedNodes: nodes.filter((node) => node.scrollHeight > node.clientHeight + 1).length,
        insertWidth: insert?.getBoundingClientRect().width || 0,
        storyWidth: story?.getBoundingClientRect().width || 0,
        expected,
      };
    }, {
      isSplitInsert,
      diagramHeading: insertConfig.diagramAfter || insertConfig.after,
      storyHeading: insertConfig.sceneAfter || "",
    });

    if (
      response?.status() !== 200 ||
      state.insertCount !== 1 ||
      state.diagramSectionHeading !== state.expected.diagramHeading ||
      (isSplitInsert && state.storyCount !== 1) ||
      (!isSplitInsert && state.storyCount !== 0) ||
      (isSplitInsert && state.storySectionHeading !== state.expected.storyHeading) ||
      state.pageOverflow ||
      state.brokenImages.length ||
      state.clippedNodes ||
      state.insertWidth <= 0 ||
      (isSplitInsert && state.storyWidth <= 0)
    ) {
      failures.push({
        width,
        routeId: article.route_id,
        route: article.canonical,
        status: response?.status(),
        ...state,
      });
    }

    if (samples.has(article.route_id)) {
      const insert = page.locator(".archetype-insert");
      await insert.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      await insert.screenshot({
        path: path.join(
          artifactRoot,
          `${article.route_id.toLowerCase()}-${width}.png`,
        ),
      });
      if (isSplitInsert) {
        const story = page.locator(".archetype-story-image");
        await story.scrollIntoViewIfNeeded();
        await page.waitForTimeout(120);
        await story.screenshot({
          path: path.join(
            artifactRoot,
            `${article.route_id.toLowerCase()}-story-${width}.png`,
          ),
        });
      }
    }
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(
  path.join(artifactRoot, "audit-report.json"),
  JSON.stringify(
    {
      baseUrl,
      articleCount: articles.length,
      configuredInsertCount: Object.keys(archetypeArticleInserts).length,
      widths: [1440, 390],
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Archetype insert audit passed: ${articles.length} articles × 2 widths.`);
}
