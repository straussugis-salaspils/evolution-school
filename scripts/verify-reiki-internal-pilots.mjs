import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const siteRoot = path.resolve(import.meta.dirname, "..");
const pilotRoot = path.join(
  siteRoot,
  "artifacts",
  "reiki-internal-visual-pilots",
);
const screenshotRoot = path.join(pilotRoot, "screenshots");
const baseUrl =
  process.env.REIKI_PILOT_BASE_URL ||
  "http://127.0.0.1:3024/artifacts/reiki-internal-visual-pilots";
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

const pilots = [
  ["01", "Что такое Рейки"],
  ["04", "21 день после инициации"],
  ["09", "Опасно ли Рейки"],
  ["13", "Что после Рейки II"],
  ["14", "Третья ступень в разных школах"],
  ["18", "Нужна ли переинициация"],
];
const viewports = [
  ["desktop", 1440, 1100],
  ["mobile", 390, 980],
];

fs.mkdirSync(screenshotRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const [number, title] of pilots) {
    for (const variant of ["a", "b"]) {
      for (const [viewport, width, height] of viewports) {
        const page = await browser.newPage({
          viewport: { width, height },
          deviceScaleFactor: 1,
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

        const url = `${baseUrl}/preview-${number}-${variant}.html`;
        const response = await page.goto(url, { waitUntil: "networkidle" });
        const metrics = await page.evaluate(() => {
          const slot = document.querySelector(".pilot-visual-slot");
          const rect = slot?.getBoundingClientRect();
          return {
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
            slotWidth: rect?.width || 0,
            slotHeight: rect?.height || 0,
            imageCount: document.images.length,
            incompleteImages: [...document.images]
              .filter((image) => !image.complete || image.naturalWidth === 0)
              .map((image) => image.currentSrc || image.src),
            clippedText: [...(slot?.querySelectorAll("*") || [])]
              .filter((element) => {
                if (!element.textContent?.trim()) return false;
                const style = getComputedStyle(element);
                const clipsX = ["hidden", "clip"].includes(style.overflowX);
                const clipsY = ["hidden", "clip"].includes(style.overflowY);
                return (
                  (clipsX && element.scrollWidth > element.clientWidth + 1) ||
                  (clipsY && element.scrollHeight > element.clientHeight + 1)
                );
              })
              .map((element) => ({
                tag: element.tagName.toLowerCase(),
                className: element.className || "",
                text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 90),
              })),
          };
        });

        const filename = `${number}-${variant}-${viewport}.png`;
        await page.locator(".pilot-visual-slot").screenshot({
          path: path.join(screenshotRoot, filename),
        });

        results.push({
          number,
          title,
          variant,
          viewport,
          url,
          status: response?.status() || 0,
          overflow: metrics.documentWidth > metrics.viewportWidth + 1,
          ...metrics,
          errors,
          failedRequests,
          passed:
            response?.ok() === true &&
            metrics.documentWidth <= metrics.viewportWidth + 1 &&
            metrics.slotWidth > 0 &&
            metrics.slotHeight > 0 &&
            metrics.incompleteImages.length === 0 &&
            metrics.clippedText.length === 0 &&
            errors.length === 0 &&
            failedRequests.length === 0,
        });
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(
  path.join(pilotRoot, "visual-check-report.json"),
  `${JSON.stringify(results, null, 2)}\n`,
  "utf8",
);

const cards = pilots
  .map(
    ([number, title]) => `<section class="pilot-pair">
      <header><span>Статья ${number}</span><h2>${title}</h2></header>
      <div class="pair-grid">
        ${["a", "b"]
          .map(
            (variant) => `<article>
          <h3>Вариант ${variant.toUpperCase()}</h3>
          <a href="./preview-${number}-${variant}.html">
            <img src="./screenshots/${number}-${variant}-desktop.png" alt="Вариант ${variant.toUpperCase()} для статьи ${number}">
          </a>
          <details>
            <summary>Mobile 390 px</summary>
            <img class="mobile-shot" src="./screenshots/${number}-${variant}-mobile.png" alt="Мобильный вариант ${variant.toUpperCase()} для статьи ${number}">
          </details>
        </article>`,
          )
          .join("")}
      </div>
    </section>`,
  )
  .join("");

const contactSheet = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Сравнение пилотов внутренних визуалов Рейки</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#f6efe1;color:#29231b;font-family:Arial,sans-serif}
    .intro{padding:44px clamp(20px,6vw,78px);background:#fffdf8;border-bottom:1px solid #d8c7a5}
    h1,h2,h3{font-family:Georgia,serif;font-weight:500}
    h1{margin:0;font-size:clamp(34px,5vw,62px);line-height:1}
    .intro p{max-width:760px;color:#675b4c;line-height:1.65}
    main{width:min(1440px,100%);margin:auto;padding:34px clamp(16px,4vw,56px) 72px}
    .pilot-pair{margin-bottom:28px;padding:24px;background:#fffdf8;border:1px solid #d9c8a7;border-radius:5px 5px 30px 5px}
    .pilot-pair>header{display:flex;align-items:baseline;gap:14px;margin-bottom:18px}
    .pilot-pair span{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8f6524}
    .pilot-pair h2{margin:0;font-size:28px}
    .pair-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
    article{min-width:0}
    h3{margin:0 0 10px;font-size:19px}
    a{display:block;background:#eee4d3;border-radius:3px 3px 18px 3px;overflow:hidden}
    img{display:block;width:100%;height:auto}
    details{margin-top:10px;color:#3c5b46}
    summary{cursor:pointer;font-weight:700}
    .mobile-shot{width:min(390px,100%);margin:10px auto 0;border:1px solid #ded4c0}
    @media(max-width:720px){
      .pair-grid{grid-template-columns:1fr}
      .pilot-pair>header{display:block}
      .pilot-pair h2{margin-top:6px;font-size:24px}
      .pilot-pair{padding:16px}
    }
  </style>
</head>
<body>
  <header class="intro">
    <h1>Шесть пилотов, два варианта</h1>
    <p>Каждый кадр снят из реального места вставки внутри статьи. Нажатие на изображение открывает полный контекст; mobile-превью доступно под ним.</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;

fs.writeFileSync(
  path.join(pilotRoot, "contact-sheet.html"),
  contactSheet,
  "utf8",
);

const failed = results.filter((result) => !result.passed);
console.log(
  `Checked ${results.length} pilot viewports: ${results.length - failed.length} passed, ${failed.length} failed.`,
);
if (failed.length) {
  for (const result of failed) {
    console.error(
      `${result.number}${result.variant.toUpperCase()} ${result.viewport}: ${JSON.stringify({
        status: result.status,
        overflow: result.overflow,
        incompleteImages: result.incompleteImages,
        clippedText: result.clippedText,
        errors: result.errors,
        failedRequests: result.failedRequests,
      })}`,
    );
  }
  process.exitCode = 1;
}
