import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { reikiVisuals } from "./reiki-visual-config.mjs";

const siteRoot = path.resolve(import.meta.dirname, "..");
const artifactRoot = path.join(
  siteRoot,
  "artifacts",
  "reiki-internal-visual-production",
);
const screenshotRoot = path.join(artifactRoot, "screenshots");
const baseUrl =
  process.env.REIKI_VISUAL_BASE_URL || "http://127.0.0.1:3024";
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

const routes = [
  "chto-takoe-reiki",
  "iniciaciya-reiki",
  "pervaya-stupen-reiki",
  "21-den-posle-iniciacii-reiki",
  "reiki-1-i-2-stupen-raznica",
  "mozhno-li-nauchitsya-reiki-samostoyatelno",
  "samoseans-reiki",
  "oschuscheniya-vo-vremya-reiki",
  "opasno-li-reiki",
  "kak-vybrat-mastera-reiki",
  "oshibki-nachinayuschih-reiki",
  "master-uchitel-reiki",
  "chto-posle-reiki-2",
  "tretya-stupen-reiki",
  "smena-mastera-reiki",
  "gotovnost-k-tretey-stupeni-reiki",
  "master-reiki-dlya-sebya",
  "pereiniciaciya-reiki",
];
const viewports = [
  ["desktop-1440", 1440, 1100],
  ["desktop-1280", 1280, 1000],
  ["tablet-768", 768, 1024],
  ["mobile-430", 430, 932],
  ["mobile-390", 390, 844],
  ["mobile-360", 360, 800],
];

fs.mkdirSync(screenshotRoot, { recursive: true });

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "");
}

function contactSheet(items) {
  const insertCount = reikiVisuals.reduce(
    (total, visual) => total + visual.inserts.length,
    0,
  );
  const cards = items
    .map(
      (item) => `<article>
        <header><span>Статья ${String(item.number).padStart(2, "0")}</span><strong>${item.id}</strong><em>${item.type}</em></header>
        <a href="${item.url}"><img src="./screenshots/${item.desktop}" alt="${item.description}"></a>
        <details><summary>Mobile 390 px</summary><img class="mobile" src="./screenshots/${item.mobile}" alt="${item.description} на мобильном экране"></details>
      </article>`,
    )
    .join("");
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${insertCount} внутренних визуалов статей о Рейки</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f4eddf;color:#2d271f;font-family:Arial,sans-serif}
    .intro{padding:42px clamp(18px,6vw,76px);background:#fffdf8;border-bottom:1px solid #d8c7a5}
    h1{max-width:980px;margin:0;font:500 clamp(36px,6vw,68px)/1 Georgia,serif}
    .intro p{max-width:780px;line-height:1.6;color:#695e50}
    main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;width:min(1500px,100%);margin:auto;padding:30px clamp(16px,4vw,56px) 72px}
    article{min-width:0;padding:14px;background:#fffdf8;border:1px solid #d9c8a7;border-radius:4px 4px 24px 4px}
    header{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:baseline;margin-bottom:12px}
    header span,header em{font-size:11px;font-style:normal;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a6427}
    header strong{font:500 17px/1.2 Georgia,serif}
    a{display:block;overflow:hidden;background:#eee5d4;border-radius:3px 3px 16px 3px}
    img{display:block;width:100%;height:auto}details{margin-top:10px;color:#315d48}summary{cursor:pointer;font-weight:700}
    .mobile{width:min(390px,100%);margin:10px auto 0;border:1px solid #ddd2bd}
    @media(max-width:1000px){main{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:620px){main{grid-template-columns:1fr}.intro{padding-top:30px}}
  </style>
</head>
<body>
  <header class="intro"><h1>${insertCount} разных смысловых объектов</h1><p>Каждый кадр снят из реальной статьи. Нажатие открывает страницу; mobile-превью находится под кадром.</p></header>
  <main>${cards}</main>
</body>
</html>`;
}

const browser = await chromium.launch({ headless: true });
const results = [];
const contactItems = [];

try {
  for (let index = 0; index < routes.length; index += 1) {
    const number = index + 1;
    const visual = reikiVisuals[index];
    const route = routes[index];
    for (const [viewport, width, height] of viewports) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      await page.addInitScript(() => {
        localStorage.setItem("eh_consent_v2", "essential_only");
      });
      const errors = [];
      const failedRequests = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) => {
        failedRequests.push(
          `${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`,
        );
      });

      const url = `${baseUrl}/biblioteka/reiki/${route}/`;
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      const pageInserts = page.locator("[data-reiki-insert]");
      for (
        let insertIndex = 0;
        insertIndex < (await pageInserts.count());
        insertIndex += 1
      ) {
        await pageInserts.nth(insertIndex).scrollIntoViewIfNeeded();
      }
      await page.evaluate(async () => {
        const images = [...document.images];
        for (const image of images) {
          image.scrollIntoView({ block: "center" });
          if (image.complete) continue;
          await new Promise((resolve) => {
            const finish = () => resolve();
            image.addEventListener("load", finish, { once: true });
            image.addEventListener("error", finish, { once: true });
            setTimeout(finish, 1500);
          });
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(120);
      const metrics = await page.evaluate(() => {
        const inserts = [...document.querySelectorAll("[data-reiki-insert]")];
        const allIds = [...document.querySelectorAll("[id]")]
          .map((element) => element.id)
          .filter(Boolean);
        const idCounts = allIds.reduce((counts, id) => {
          counts[id] = (counts[id] || 0) + 1;
          return counts;
        }, {});
        const idReferences = [
          ...document.querySelectorAll(
            "[aria-labelledby], [aria-describedby], a[href^='#'], use[href^='#'], use[xlink\\:href^='#']",
          ),
        ].flatMap((element) => {
          const references = [];
          for (const attribute of ["aria-labelledby", "aria-describedby"]) {
            const value = element.getAttribute(attribute);
            if (value) references.push(...value.trim().split(/\s+/));
          }
          for (const attribute of ["href", "xlink:href"]) {
            const value = element.getAttribute(attribute);
            if (value?.startsWith("#")) references.push(value.slice(1));
          }
          return references;
        });
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          insertIds: inserts.map((item) => item.dataset.reikiInsert),
          duplicateIds: Object.entries(idCounts)
            .filter(([, count]) => count > 1)
            .map(([id, count]) => ({ id, count })),
          brokenIdReferences: [
            ...new Set(
              idReferences.filter(
                (id) => id && !document.getElementById(id),
              ),
            ),
          ],
          incompleteImages: [...document.images]
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src),
          clippedText: inserts.flatMap((insert) =>
            [...insert.querySelectorAll("*")]
              .filter((element) => {
                if (!element.textContent?.trim()) return false;
                const style = getComputedStyle(element);
                const isScreenReaderOnly =
                  element.matches(
                    ".sr-only, [class*='__sr'], [class*='-sr-only']",
                  ) ||
                  (style.position === "absolute" &&
                    style.clip !== "auto" &&
                    element.clientWidth <= 1 &&
                    element.clientHeight <= 1);
                if (isScreenReaderOnly || style.display === "none") return false;
                const hasTextElementChild = [...element.children].some(
                  (child) => child.textContent?.trim(),
                );
                if (hasTextElementChild) return false;
                const clipsX = ["hidden", "clip"].includes(style.overflowX);
                const clipsY = ["hidden", "clip"].includes(style.overflowY);
                return (
                  (clipsX && element.scrollWidth > element.clientWidth + 1) ||
                  (clipsY && element.scrollHeight > element.clientHeight + 1)
                );
              })
              .map((element) => ({
                insert: insert.dataset.reikiInsert,
                tag: element.tagName.toLowerCase(),
                className: element.className || "",
                text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 90),
              })),
          ),
        };
      });

      if (["desktop-1440", "mobile-390"].includes(viewport)) {
        await page.addStyleTag({
          content: `
            .site-header,
            .eh-shell-header,
            .eh-consent,
            .eh-cookie-settings {
              display: none !important;
            }
          `,
        });
        const locators = page.locator("[data-reiki-insert]");
        for (let insertIndex = 0; insertIndex < (await locators.count()); insertIndex += 1) {
          const locator = locators.nth(insertIndex);
          await locator.scrollIntoViewIfNeeded();
          const id = await locator.getAttribute("data-reiki-insert");
          const filename = `${String(number).padStart(2, "0")}-${safeName(id)}-${viewport}.png`;
          await locator.screenshot({
            path: path.join(screenshotRoot, filename),
          });
          if (viewport === "desktop-1440") {
            const config = visual.inserts.find((insert) => insert.id === id);
            contactItems.push({
              number,
              id,
              type: config.type,
              description: config.description,
              url,
              desktop: filename,
              mobile: `${String(number).padStart(2, "0")}-${safeName(id)}-mobile-390.png`,
            });
          }
        }
      }

      const expectedIds = visual.inserts.map((insert) => insert.id);
      const hasExpectedInsertSet =
        metrics.insertIds.length === expectedIds.length &&
        JSON.stringify([...metrics.insertIds].sort()) ===
          JSON.stringify([...expectedIds].sort());
      const passed =
        response?.ok() === true &&
        metrics.documentWidth <= metrics.viewportWidth + 1 &&
        metrics.incompleteImages.length === 0 &&
        metrics.clippedText.length === 0 &&
        metrics.duplicateIds.length === 0 &&
        metrics.brokenIdReferences.length === 0 &&
        errors.length === 0 &&
        failedRequests.length === 0 &&
        hasExpectedInsertSet;
      results.push({
        number,
        route,
        viewport,
        url,
        status: response?.status() || 0,
        expectedIds,
        ...metrics,
        overflow: metrics.documentWidth > metrics.viewportWidth + 1,
        errors,
        failedRequests,
        passed,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

fs.mkdirSync(artifactRoot, { recursive: true });
fs.writeFileSync(
  path.join(artifactRoot, "visual-check-report.json"),
  `${JSON.stringify(results, null, 2)}\n`,
  "utf8",
);
fs.writeFileSync(
  path.join(artifactRoot, "contact-sheet.html"),
  contactSheet(contactItems),
  "utf8",
);
const contactBrowser = await chromium.launch({ headless: true });
try {
  const contactPage = await contactBrowser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await contactPage.goto(
    `${baseUrl}/artifacts/reiki-internal-visual-production/contact-sheet.html`,
    { waitUntil: "networkidle" },
  );
  await contactPage.screenshot({
    path: path.join(artifactRoot, "contact-sheet-full.png"),
    fullPage: true,
  });
} finally {
  await contactBrowser.close();
}

const insertCount = reikiVisuals.reduce(
  (total, visual) => total + visual.inserts.length,
  0,
);
const failed = results.filter((result) => !result.passed);
console.log(
  `Checked ${results.length} article viewports and ${insertCount} inserts: ${results.length - failed.length} passed, ${failed.length} failed.`,
);
if (insertCount < routes.length) {
  console.error(
    `Every article needs at least one insert; found ${insertCount} inserts for ${routes.length} articles.`,
  );
  process.exitCode = 1;
}
if (failed.length) {
  for (const result of failed) {
    console.error(
      `${String(result.number).padStart(2, "0")} ${result.viewport}: ${JSON.stringify({
        status: result.status,
        overflow: result.overflow,
        expectedIds: result.expectedIds,
        insertIds: result.insertIds,
        incompleteImages: result.incompleteImages,
        clippedText: result.clippedText,
        duplicateIds: result.duplicateIds,
        brokenIdReferences: result.brokenIdReferences,
        errors: result.errors,
        failedRequests: result.failedRequests,
      })}`,
    );
  }
  process.exitCode = 1;
}
