import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

const siteRoot = path.resolve(import.meta.dirname, "..");
const baseUrl = process.env.REIKI_PREVIEW_URL || "http://127.0.0.1:3024";
const articleRoot = path.join(siteRoot, "biblioteka", "reiki");
const artifactRoot = path.join(
  siteRoot,
  "artifacts",
  "reiki-visual-production",
);
const screenshotRoot = path.join(artifactRoot, "screenshots");
const viewports = [1440, 1280, 768, 430, 390, 360];
const articleSlugs = fs
  .readdirSync(articleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const representativeScreenshots = new Map([
  ["chto-takoe-reiki:1440", "article-01-desktop-1440.png"],
  ["chto-takoe-reiki:390", "article-01-mobile-390.png"],
  ["opasno-li-reiki:1440", "article-09-desktop-1440.png"],
  ["opasno-li-reiki:390", "article-09-mobile-390.png"],
  ["chto-posle-reiki-2:1440", "article-13-desktop-1440.png"],
  ["chto-posle-reiki-2:390", "article-13-mobile-390.png"],
  ["pereiniciaciya-reiki:390", "article-18-mobile-390.png"],
]);

fs.mkdirSync(screenshotRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of viewports) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("requestfailed", (request) =>
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || "request failed",
    }),
  );

  for (const slug of articleSlugs) {
    runtimeErrors.length = 0;
    failedRequests.length = 0;
    const url = `${baseUrl}/biblioteka/reiki/${slug}/`;
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const state = await page.evaluate(() => {
      const hero = document.querySelector(".article-hero__visual picture img");
      const images = [...document.images];
      const html = document.documentElement;
      return {
        title: document.title,
        horizontalOverflow: html.scrollWidth > html.clientWidth + 1,
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        heroPresent: Boolean(hero),
        heroComplete: Boolean(hero?.complete),
        heroNaturalWidth: hero?.naturalWidth || 0,
        heroLoading: hero?.getAttribute("loading"),
        heroFetchPriority: hero?.getAttribute("fetchpriority"),
        brokenImages: images
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      };
    });

    const screenshotName = representativeScreenshots.get(`${slug}:${width}`);
    if (screenshotName) {
      await page.screenshot({
        path: path.join(screenshotRoot, screenshotName),
        fullPage: true,
      });
    }

    results.push({
      slug,
      width,
      status: response?.status() || null,
      ...state,
      runtimeErrors: [...runtimeErrors],
      failedRequests: [...failedRequests],
    });
  }

  await context.close();
}

await browser.close();

const failures = results.filter(
  (result) =>
    result.status !== 200 ||
    result.horizontalOverflow ||
    !result.heroPresent ||
    !result.heroComplete ||
    result.heroNaturalWidth === 0 ||
    result.heroLoading === "lazy" ||
    result.heroFetchPriority !== "high" ||
    result.brokenImages.length > 0 ||
    result.runtimeErrors.length > 0 ||
    result.failedRequests.length > 0,
);

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  articleCount: articleSlugs.length,
  viewports,
  checks: results.length,
  failureCount: failures.length,
  failures,
};
fs.writeFileSync(
  path.join(artifactRoot, "responsive-verification.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

if (articleSlugs.length !== 18 || failures.length > 0) {
  console.error(
    `Reiki page verification failed: ${articleSlugs.length} articles, ${failures.length} failing checks.`,
  );
  process.exit(1);
}

console.log(
  `Reiki page verification passed: ${articleSlugs.length} articles × ${viewports.length} viewports (${results.length} checks).`,
);
