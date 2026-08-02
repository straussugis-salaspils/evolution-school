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
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);
const root = path.resolve(import.meta.dirname, "..");
const baseUrl = process.env.TRANSITION_PREVIEW_URL || "http://127.0.0.1:3026";
const articleRoot = path.join(root, "biblioteka", "perehody");
const artifactRoot = path.join(root, "artifacts", "transition-articles");
const screenshotRoot = path.join(artifactRoot, "screenshots");
const viewports = [1440, 1280, 768, 430, 390, 360];
const slugs = fs
  .readdirSync(articleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

fs.mkdirSync(screenshotRoot, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const failures = [];

for (const width of viewports) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  for (const slug of ["", ...slugs]) {
    const url = slug
      ? `${baseUrl}/biblioteka/perehody/${slug}/`
      : `${baseUrl}/biblioteka/perehody/`;
    const runtimeErrors = [];
    const failedRequests = [];
    page.removeAllListeners();
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(request.url()));
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    const state = await page.evaluate(() => ({
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      heroWidth:
        document.querySelector(".article-hero__visual img")?.naturalWidth || 0,
    }));
    if (
      response?.status() !== 200 ||
      state.overflow ||
      state.brokenImages.length ||
      runtimeErrors.length ||
      failedRequests.length ||
      !state.h1
    ) {
      failures.push({
        width,
        slug: slug || "hub",
        status: response?.status(),
        ...state,
        runtimeErrors,
        failedRequests,
      });
    }
    if (
      (slug === "" || slug === "vse-est-no-nichego-ne-raduet" || slug === "vse-ponimayu-no-nichego-ne-menyaetsya") &&
      (width === 1440 || width === 390)
    ) {
      await page.screenshot({
        path: path.join(
          screenshotRoot,
          `${slug || "hub"}-${width}.png`,
        ),
        fullPage: true,
      });
    }
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(
  path.join(artifactRoot, "responsive-report.json"),
  JSON.stringify({ checked: (slugs.length + 1) * viewports.length, failures }, null, 2),
);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Transition responsive audit passed: ${(slugs.length + 1) * viewports.length} page/viewport checks.`);
}
