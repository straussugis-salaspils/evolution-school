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
const routeIds = new Map(routes.map((route, index) => [route, `P${String(index + 1).padStart(2, "0")}`]));

function fileFor(route) {
  return path.join(root, route.replace(/^\//, ""), "index.html");
}

function matches(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

const failures = [];
const incoming = new Map(routes.map((route) => [route, new Set()]));
const titles = new Set();
const descriptions = new Set();
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

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
  if (!html.includes("Статьи о пересборке жизни")) {
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
  if (route !== hub) {
    const routeId = routeIds.get(route);
    const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";
    if (!html.includes(`data-route-id="${routeId}"`)) failures.push(`${route}: body route id is missing or wrong`);
    if (matches(main, /data-article-product-cta\b/g) !== 1) failures.push(`${route}: must have exactly one product CTA inside main`);
    if (matches(main, /class="article-product-cta__primary"/g) !== 1) failures.push(`${route}: must have exactly one primary product link`);
    const primary = main.match(/<a class="article-product-cta__primary"[^>]+>/)?.[0] || "";
    for (const attribute of [
      `data-route-id="${routeId}"`,
      'data-product-id="mentoring"',
      'data-cta-variant="transition_bridge_v1"',
      'data-placement="article_end"',
      'source=transition_article',
    ]) {
      if (!primary.includes(attribute)) failures.push(`${route}: primary CTA is missing ${attribute}`);
    }
    if (/href="[^"]*(?:test|individual|personalnyj-marshrut)/i.test(main)) {
      failures.push(`${route}: forbidden public test or individual route is present inside main`);
    }
    const outgoing = new Set();
    const internalTargets = new Map();
    for (const match of main.matchAll(/href="(\/[^"]+)"/g)) {
      const target = match[1].split("?")[0];
      if (target === route || target === hub || target === "/mentoring/" || target.startsWith("/assets/")) continue;
      internalTargets.set(target, (internalTargets.get(target) || 0) + 1);
    }
    for (const [target, count] of internalTargets) {
      if (count > 1) failures.push(`${route}: duplicate internal destination ${target} appears ${count} times inside main`);
    }
    for (const target of routes) {
      if (target === route) continue;
      const found = new RegExp(`href="${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(main);
      if (found) {
        outgoing.add(target);
        incoming.get(target).add(route);
      }
    }
    const articleTargetCount = [...internalTargets.keys()].filter((target) => (
      /^\/(?:biblioteka\/perehody|zhizn|arhetipy|otnosheniya|muzhskie-arhetipy)(?:\/|$)/.test(target)
    )).length;
    if (articleTargetCount < 2 || articleTargetCount > 4) {
      failures.push(`${route}: expected 2–4 unique contextual article links, found ${articleTargetCount}`);
    }
    const modified = html.match(/<meta property="article:modified_time" content="([^"]+)">/)?.[1];
    const schemaModified = html.match(/"dateModified":\s*"([^"]+)"/)?.[1];
    if (!modified || modified !== schemaModified) failures.push(`${route}: inconsistent modified date metadata`);
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

for (const [route, sources] of incoming) {
  if (sources.size < 2) failures.push(`${route}: expected at least two contextual incoming article links, found ${sources.size}`);
}

for (const route of [hub, ...routes]) {
  if (!sitemap.includes(`<loc>${baseUrl}${route}</loc>`)) failures.push(`${route}: missing from sitemap.xml`);
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
