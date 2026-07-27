import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const baseUrl = "https://evolution.yourbalancerestored.com";
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs", "seo", "archetypes", "production", "portfolio-routes.json"),
    "utf8",
  ),
);
const articles = manifest.assets.filter((item) => item.index_state === "index");
const systemRoutes = ["/arhetipy/", "/zhenskie-arhetipy/", "/test-arhetipov/"];
const routes = [...systemRoutes, ...articles.map((item) => item.canonical)];
const failures = [];
const incoming = new Map(articles.map((item) => [item.canonical, 0]));
const titles = new Set();
const descriptions = new Set();

function fileFor(route) {
  return path.join(root, route.replace(/^\/|\/$/g, ""), "index.html");
}

for (const route of routes) {
  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    failures.push(`${route}: file is missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const canonical = `${baseUrl}${route}`;
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    failures.push(`${route}: canonical is not self-referencing`);
  }
  if (route !== "/zhenskie-arhetipy/" && !html.includes('<meta name="robots" content="index, follow">')) {
    failures.push(`${route}: index, follow is missing`);
  }
  if ((html.match(/<h1\b/g) || []).length !== 1) {
    failures.push(`${route}: expected exactly one H1`);
  }
  if (html.includes("ROUTE_CTA")) failures.push(`${route}: route marker leaked`);
  if (/Маргарит/i.test(html)) failures.push(`${route}: forbidden Margarita reference`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  if (!title || titles.has(title)) failures.push(`${route}: missing or duplicate title`);
  if (!description || descriptions.has(description)) {
    failures.push(`${route}: missing or duplicate description`);
  }
  if (title) titles.add(title);
  if (description) descriptions.add(description);

  for (const article of articles) {
    const escaped = article.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    incoming.set(
      article.canonical,
      incoming.get(article.canonical) + (html.match(new RegExp(`href="${escaped}"`, "g")) || []).length,
    );
  }
  for (const match of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    for (const candidate of match[1].split(",").map((item) => item.trim().split(/\s+/)[0])) {
      if (!candidate.startsWith("/")) continue;
      const local = path.join(root, candidate.replace(/^\//, "").split("?")[0]);
      if (!fs.existsSync(local)) failures.push(`${route}: missing asset ${candidate}`);
    }
  }
}

for (const article of articles) {
  const html = fs.readFileSync(fileFor(article.canonical), "utf8");
  if (!html.includes('type="application/ld+json"')) {
    failures.push(`${article.canonical}: Article and Breadcrumb schema missing`);
  }
  if (!html.includes(`href="/arhetipy/#stati"`)) {
    failures.push(`${article.canonical}: return link to archetype hub missing`);
  }
  if (!html.includes('class="article-author"')) {
    failures.push(`${article.canonical}: author block missing`);
  }
  if ((incoming.get(article.canonical) || 0) < 1) {
    failures.push(`${article.canonical}: no incoming cluster link`);
  }
}

for (const hold of manifest.consolidations) {
  if (fs.existsSync(fileFor(hold.proposed_canonical))) {
    failures.push(`${hold.proposed_canonical}: consolidation hold rendered as a page`);
  }
}

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Archetype SEO audit passed: ${articles.length} articles, 3 system pages, metadata, schema, assets and incoming links.`,
  );
}
