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
const root = path.resolve(import.meta.dirname, "..");
const baseUrl = process.env.ARCHETYPE_PREVIEW_URL || "http://127.0.0.1:3032";
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs", "seo", "archetypes", "production", "portfolio-routes.json"),
    "utf8",
  ),
);
const articleRoutes = manifest.assets
  .filter((item) => item.index_state === "index")
  .map((item) => item.canonical);
const routes = ["/arhetipy/", "/zhenskie-arhetipy/", "/test-arhetipov/", ...articleRoutes];
const viewports = [1440, 1280, 768, 430, 390, 360];
const screenshotRoutes = new Set(["/arhetipy/", "/arhetipy/chto-eto/", "/zhizn/cherez-nado/"]);
const artifactRoot = path.join(root, "artifacts", "archetype-articles");
fs.mkdirSync(artifactRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];
for (const width of viewports) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  for (const route of routes) {
    const runtimeErrors = [];
    page.removeAllListeners();
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (route !== "/test-arhetipov/") {
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    }
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      h1: document.querySelectorAll("h1").length,
    }));
    if (
      response?.status() !== 200 ||
      state.overflow ||
      state.brokenImages.length ||
      state.h1 !== 1 ||
      runtimeErrors.length
    ) {
      failures.push({ width, route, status: response?.status(), ...state, runtimeErrors });
    }
    if (screenshotRoutes.has(route) && (width === 1440 || width === 390)) {
      await page.evaluate(async () => {
        const step = Math.max(320, Math.round(window.innerHeight * 0.7));
        for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
          window.scrollTo(0, top);
          await new Promise((resolve) => setTimeout(resolve, 35));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(250);
      const name = route === "/arhetipy/" ? "hub" : route.split("/").filter(Boolean).at(-1);
      await page.screenshot({
        path: path.join(artifactRoot, `${name}-${width}.png`),
        fullPage: true,
      });
    }
  }
  await context.close();
}
await browser.close();

fs.writeFileSync(
  path.join(artifactRoot, "responsive-report.json"),
  JSON.stringify({ baseUrl, viewports, routes, failures }, null, 2),
);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Archetype responsive audit passed: ${routes.length} routes × ${viewports.length} widths.`);
}
