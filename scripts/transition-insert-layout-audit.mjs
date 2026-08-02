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
const reportPath = path.join(
  root,
  "artifacts",
  "transition-articles",
  "insert-layout-report.json",
);
const screenshotRoot = path.join(
  root,
  "artifacts",
  "transition-articles",
  "insert-screenshots",
);
const widths = [1440, 768, 390];
const slugs = fs
  .readdirSync(articleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const findings = [];
fs.mkdirSync(screenshotRoot, { recursive: true });

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const slug of slugs) {
    await page.goto(`${baseUrl}/biblioteka/perehody/${slug}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await page.addStyleTag({
      content:
        ".eh-consent, .cookie-consent, .cookie-banner, [data-cookie-consent], #cookie-consent { display: none !important; }",
    });
    const result = await page.evaluate(() => {
      const insert = document.querySelector("[data-transition-insert]");
      if (!insert) return null;
      const textNodes = [...insert.querySelectorAll("*")].filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.closest(".sr-only")) return false;
        if (!element.textContent?.trim()) return false;
        if (element.children.length && !["LI", "P", "SPAN", "STRONG", "H3"].includes(element.tagName)) {
          return false;
        }
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      const overflow = textNodes
        .map((element) => {
          const elementRect = element.getBoundingClientRect();
          const directTextNodes = [...element.childNodes].filter(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          );
          const textRects = directTextNodes.flatMap((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return [...range.getClientRects()];
          });
          if (!textRects.length) return null;
          const textBounds = {
            left: Math.min(...textRects.map((rect) => rect.left)),
            top: Math.min(...textRects.map((rect) => rect.top)),
            right: Math.max(...textRects.map((rect) => rect.right)),
            bottom: Math.max(...textRects.map((rect) => rect.bottom)),
          };
          const outside =
            textBounds.left < elementRect.left - 1 ||
            textBounds.top < elementRect.top - 1 ||
            textBounds.right > elementRect.right + 1 ||
            textBounds.bottom > elementRect.bottom + 1;
          if (!outside) return null;
          return {
            selector: [
              element.tagName.toLowerCase(),
              ...element.classList,
            ].join("."),
            text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 180),
            element: [
              Math.round(elementRect.left),
              Math.round(elementRect.top),
              Math.round(elementRect.right),
              Math.round(elementRect.bottom),
            ],
            textBounds: [
              Math.round(textBounds.left),
              Math.round(textBounds.top),
              Math.round(textBounds.right),
              Math.round(textBounds.bottom),
            ],
          };
        })
        .filter(Boolean);
      return {
        id: insert.getAttribute("data-transition-insert"),
        overflow,
      };
    });

    if (result?.overflow.length) {
      findings.push({ width, slug, ...result });
    }
    if (result && (width === 1440 || width === 390)) {
      await page.locator("[data-transition-insert]").screenshot({
        path: path.join(screenshotRoot, `${result.id}-${slug}-${width}.png`),
      });
    }
  }
  await context.close();
}

await browser.close();
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ checked: slugs.length * widths.length, findings }, null, 2));

if (findings.length) {
  console.error(JSON.stringify(findings, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Transition insert layout audit passed: ${slugs.length * widths.length} checks.`);
}
