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
const baseUrl = process.env.LOVE_TEA_PREVIEW_URL || "http://127.0.0.1:3037";
const route = "/818826-vypem-za-lyubov-chayu/";
const root = path.resolve(import.meta.dirname, "..");
const screenshotRoot = path.join(root, "artifacts", "love-tea-landing");
const widths = [1440, 1280, 768, 430, 390, 360];
const failures = [];

fs.mkdirSync(screenshotRoot, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => {});
  const state = await page.evaluate(() => {
    const title = document.querySelector("h1");
    const titleStyle = title ? getComputedStyle(title) : null;
    const titleLines = title && titleStyle
      ? Math.round(title.getBoundingClientRect().height / Number.parseFloat(titleStyle.lineHeight))
      : 0;
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      h1: title?.textContent?.trim() || "",
      titleLines,
      ctaCount: document.querySelectorAll("[data-love-payment-open]").length,
      oldOnlineFormat: document.body.textContent.includes("8 880 ₽ · онлайн"),
      paymentScriptBeforeClick: Boolean(document.querySelector("script[src*='id=1638498']")),
    };
  });
  if (
    response?.status() !== 200 ||
    state.overflow ||
    state.brokenImages.length ||
    runtimeErrors.length ||
    !state.h1 ||
    state.titleLines > 4 ||
    state.ctaCount !== 2 ||
    state.oldOnlineFormat ||
    state.paymentScriptBeforeClick
  ) {
    failures.push({ width, status: response?.status(), ...state, runtimeErrors });
  }
  if (width === 1440 || width === 390) {
    await page.screenshot({
      path: path.join(screenshotRoot, `love-tea-${width}.png`),
      fullPage: true,
    });
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(
  path.join(screenshotRoot, "responsive-report.json"),
  JSON.stringify({ route, widths, failures }, null, 2),
);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Love tea landing audit passed: ${widths.length} responsive checks.`);
}
