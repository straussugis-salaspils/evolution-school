import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const baseUrl = "https://evolution.yourbalancerestored.com";
const hub = "/biblioteka/perehody/";
const routes = [
  "/biblioteka/perehody/kak-ponyat-chego-ya-hochu/",
  "/biblioteka/perehody/zhizn-zashla-v-tupik/",
  "/biblioteka/perehody/ne-mogu-prinyat-reshenie/",
  "/biblioteka/perehody/kak-nachat-zhizn-zanovo/",
  "/biblioteka/perehody/zhivu-ne-svoyu-zhizn/",
  "/biblioteka/perehody/kak-nayti-sebya-posle-40/",
  "/biblioteka/perehody/vse-est-no-nichego-ne-raduet/",
  "/biblioteka/perehody/kak-reshitsya-na-peremeny/",
  "/biblioteka/perehody/novaya-zhizn-posle-razvoda/",
  "/biblioteka/perehody/deti-vyrosli-chto-dalshe/",
  "/biblioteka/perehody/cel-dostignuta-chto-dalshe/",
  "/biblioteka/perehody/vse-ponimayu-no-nichego-ne-menyaetsya/",
];

function fileFor(route) {
  return path.join(root, route.replace(/^\//, ""), "index.html");
}

function matches(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

const failures = [];
const incoming = new Map(routes.map((route) => [route, 0]));
const titles = new Set();
const descriptions = new Set();

for (const route of [hub, ...routes]) {
  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    failures.push(`${route}: file is missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const canonical = `${baseUrl}${route}`;
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    failures.push(`${route}: wrong canonical`);
  }
  if (!html.includes('<meta name="robots" content="index, follow">')) {
    failures.push(`${route}: missing index, follow`);
  }
  if (matches(html, /<h1\b/g) !== 1) failures.push(`${route}: must have exactly one H1`);
  if (html.includes("Редакторские примечания")) {
    failures.push(`${route}: editorial notes leaked into HTML`);
  }
  if (html.includes("/biblioteka/perehody/boyus-peremen/")) {
    failures.push(`${route}: forbidden route boyus-peremen is present`);
  }
  if (!html.includes("Статьи о пересборке жизни и переходах")) {
    failures.push(`${route}: transition navigation is missing`);
  }
  if (!html.includes('type="application/ld+json"')) {
    failures.push(`${route}: structured data is missing`);
  }
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  if (!title || titles.has(title)) failures.push(`${route}: missing or duplicate title`);
  if (!description || descriptions.has(description)) {
    failures.push(`${route}: missing or duplicate description`);
  }
  if (title) titles.add(title);
  if (description) descriptions.add(description);
  for (const target of routes) {
    const count = matches(html, new RegExp(`href="${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g"));
    incoming.set(target, incoming.get(target) + count);
  }
  for (const image of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    const candidates = image[1]
      .split(",")
      .map((item) => item.trim().split(/\s+/)[0])
      .filter((item) => item.startsWith("/"));
    for (const candidate of candidates) {
      const local = path.join(root, candidate.replace(/^\//, "").split("?")[0]);
      if (!fs.existsSync(local)) failures.push(`${route}: missing asset ${candidate}`);
    }
  }
}

for (const [route, count] of incoming) {
  if (count < 1) failures.push(`${route}: no incoming link inside the transition cluster`);
}

const directionPages = [
  "/urovni-zhizni/",
  "/urovni-zhizni/metod/",
  "/urovni-zhizni/kvantovaya-aktivaciya/",
  "/urovni-zhizni/individualnyj-retrit/",
  "/urovni-zhizni/personalnyj-marshrut/",
];
for (const route of directionPages) {
  const html = fs.readFileSync(fileFor(route), "utf8");
  if (!html.includes(`href="${hub}"`)) {
    failures.push(`${route}: navigation link to transition articles is missing`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Transition SEO audit passed: ${routes.length} articles, hub, metadata, schema, assets and internal links.`);
}
