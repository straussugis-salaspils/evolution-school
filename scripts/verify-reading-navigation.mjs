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
const baseUrl =
  process.env.ARTICLE_PREVIEW_URL || "http://127.0.0.1:4177";
const routes = [
  "/arhetipy/chto-eto/",
  "/biblioteka/reiki/chto-takoe-reiki/",
  "/biblioteka/perehody/kak-ponyat-chego-ya-hochu/",
];
const viewports = [1440, 390];
const artifactRoot = path.join(root, "artifacts", "reading-navigation");
fs.mkdirSync(artifactRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

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
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await page.evaluate(() => {
      document.getElementById("section-3")?.scrollIntoView();
      window.scrollBy(0, 280);
    });
    await page.waitForTimeout(180);

    const state = await page.evaluate(() => {
      const header = document.querySelector(".eh-shell-header")?.getBoundingClientRect();
      const localStrip = document.querySelector(".eh-local-strip")?.getBoundingClientRect();
      const breadcrumb = document
        .querySelector(".library-breadcrumb--header")
        ?.getBoundingClientRect();
      const active = document.querySelector(
        '.article-toc a[aria-current="location"]',
      );
      const localStyle = document.querySelector(".eh-local-strip")
        ? getComputedStyle(document.querySelector(".eh-local-strip"))
        : null;

      return {
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
        breadcrumbInHeader: Boolean(
          document.querySelector(
            ".eh-shell-header .library-breadcrumb--header",
          ),
        ),
        headerTop: header?.top ?? null,
        localStripWithinHeader:
          Boolean(header && localStrip) &&
          localStrip.top >= header.top - 1 &&
          localStrip.bottom <= header.bottom + 1,
        breadcrumbWithinHeader:
          Boolean(header && breadcrumb) &&
          breadcrumb.top >= header.top - 1 &&
          breadcrumb.bottom <= header.bottom + 1,
        activeHref: active?.getAttribute("href") || null,
        localBackground:
          localStyle?.backgroundImage || localStyle?.backgroundColor || "",
      };
    });

    results.push({
      route,
      width,
      status: response?.status() || null,
      ...state,
      runtimeErrors,
    });
  }
  await context.close();
}

await browser.close();

const failures = results.filter(
  (result) =>
    result.status !== 200 ||
    result.overflow ||
    !result.breadcrumbInHeader ||
    Math.abs(result.headerTop ?? 999) > 1 ||
    !result.localStripWithinHeader ||
    !result.breadcrumbWithinHeader ||
    result.activeHref !== "#section-3" ||
    result.runtimeErrors.length > 0,
);

fs.writeFileSync(
  path.join(artifactRoot, "report.json"),
  `${JSON.stringify({ baseUrl, results, failures }, null, 2)}\n`,
  "utf8",
);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    `Reading navigation audit passed: ${routes.length} series × ${viewports.length} widths.`,
  );
}
