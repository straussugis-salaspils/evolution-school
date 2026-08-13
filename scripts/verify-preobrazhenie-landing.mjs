import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const route = "916428-preobrazhenie";
const pagePath = path.join(root, route, "index.html");
const cssPath = path.join(root, route, "styles.css");
const scriptPath = path.join(root, route, "script.js");
const sitemapPath = path.join(root, "sitemap.xml");

const failures = [];
const pass = (condition, message) => {
  if (!condition) failures.push(message);
};

const [html, css, script, sitemap] = await Promise.all([
  readFile(pagePath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(scriptPath, "utf8"),
  readFile(sitemapPath, "utf8"),
]);

const canonical = "https://evolution.yourbalancerestored.com/916428-preobrazhenie/";
const title = "Преображение — архетипическая мистерия со Светланой Страусс в Москве";
const description =
  "живой камерный формат 19 августа в Ampermy: звук, движение, телесная настройка, четыре архетипические энергии и проживание другого качества жизни.";

pass(html.includes(`<title>${title}</title>`), "SEO title does not match the approved value");
pass(
  html.includes(`<meta name="description" content="${description}">`),
  "Meta description does not match the approved value",
);
pass(html.includes('<meta name="robots" content="noindex, nofollow">'), "Hidden landing must remain noindex, nofollow");
pass(html.includes(`<link rel="canonical" href="${canonical}">`), "Canonical is missing or incorrect");
pass(html.includes(`<meta property="og:url" content="${canonical}">`), "OG URL is missing or incorrect");
pass(html.includes("og-preobrazhenie.jpg"), "Unique OG image is missing");
pass((html.match(/<h1\b/g) || []).length === 1, "The page must contain exactly one H1");
pass(!sitemap.includes(`/${route}/`), "Hidden landing must not be present in sitemap.xml before publication approval");
pass(!html.includes('href="#"'), "Fake hash links are not allowed");

const requiredCopy = [
  "Не ещё одна цель. Другой вкус жизни.",
  "19 августа. Преображение, которое становится телом",
  "Представьте одну сцену",
  "Четыре архетипические энергии",
  "Мы будем создавать сцены возможной жизни",
  "Какое качество жизни создают ваши деньги?",
  "Участие — с персональным разбором или без",
  "Только 10 участников",
  "Как пройдёт вечер",
  "Для тех, кому уже мало просто достигать",
  "Светлана Страусс",
  "Я могу открыть дверь.",
  "Острова везения",
  "Москва, Большой Каретный переулок, 19, стр. 2",
  "12 200 ₽ — участие",
  "18 800 ₽ — участие с разбором",
  "Персональный код архетипов",
  "Отдельно такой разбор стоит 10 000 ₽.",
];

for (const text of requiredCopy) {
  pass(html.includes(text), `Approved copy is missing: ${text}`);
}

const paymentButtons = [...html.matchAll(/data-payment-choice="([^"]+)"/g)].map((match) => match[1]);
pass(paymentButtons.filter((value) => value === "reserve12200").length === 2, "12,200 payment action must appear twice");
pass(paymentButtons.filter((value) => value === "choose18800").length === 3, "18,800 payment action must appear three times");
pass(script.includes("reserve12200"), "12,200 payment config is missing");
pass(script.includes("choose18800"), "18,800 payment config is missing");
pass(script.includes('directUrl: ""'), "Unapproved payment destinations must stay empty");
pass(
  script.includes('widgetScriptId: "a3074d7ab071154456c99b32d5b6a7fbea144525"'),
  "12,200 GetCourse widget script ID is missing",
);
pass(
  script.includes('widgetUrl: "https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1642546"'),
  "12,200 GetCourse widget URL is missing",
);
pass(
  script.includes('widgetScriptId: "766c10570d7ee0cbbd80e85b9692d87641b68761"'),
  "18,800 GetCourse widget script ID is missing",
);
pass(
  script.includes('widgetUrl: "https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1642555"'),
  "18,800 GetCourse widget URL is missing",
);
pass(
  script.includes("document.dispatchEvent(new Event(`StartWidget${config.widgetScriptId}`))"),
  "Dynamically loaded GetCourse widgets must receive their start event",
);

pass(css.includes("prefers-reduced-motion: reduce"), "Reduced-motion support is missing");
pass(css.includes(":focus-visible"), "Keyboard focus styles are missing");
pass(script.includes('event.key === "Escape"'), "Payment dialog Escape handling is missing");

const imageTags = [...html.matchAll(/<img\s+[^>]*>/g)].map((match) => match[0]);
pass(imageTags.length >= 10, "Expected visual assets are missing");

for (const tag of imageTags) {
  const src = tag.match(/src="([^"]+)"/)?.[1];
  pass(Boolean(tag.match(/alt="[^"]+"/)), `Image alt text is missing: ${src || tag}`);
  if (!src || src.startsWith("http") || src.startsWith("/")) continue;
  pass(/width="\d+"/.test(tag) && /height="\d+"/.test(tag), `Image dimensions are missing: ${src}`);
  await access(path.join(root, route, src)).catch(() => failures.push(`Local image does not exist: ${src}`));
}

const belowFoldImages = imageTags.filter(
  (tag) => tag.includes('src="assets/') && !tag.includes("transformation-motion.webp"),
);
for (const tag of belowFoldImages) {
  pass(tag.includes('loading="lazy"'), `Below-the-fold image is not lazy-loaded: ${tag}`);
  pass(tag.includes('decoding="async"'), `Below-the-fold image does not decode asynchronously: ${tag}`);
}

pass(
  html.includes('fetchpriority="high"'),
  "Hero image must retain high fetch priority",
);
pass(
  !/src="https?:\/\/(?!fonts\.)/.test(html),
  "Landing contains a hotlinked external image or script",
);

if (failures.length) {
  console.error(`Preobrazhenie landing verification failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Preobrazhenie landing verification passed.");
console.log(`- route: /${route}/`);
console.log(`- local images: ${imageTags.length}`);
console.log(`- payment actions: ${paymentButtons.length} (2 for 12,200; 3 for 18,800)`);
console.log("- sitemap: unchanged; hidden landing excluded");
