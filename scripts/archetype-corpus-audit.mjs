import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const manifestFile = path.join(root, "docs", "seo", "archetypes", "production", "portfolio-routes.json");
const manifestText = fs.readFileSync(manifestFile, "utf8");
const manifest = JSON.parse(manifestText);
const articles = manifest.assets.filter((item) => item.index_state === "index");
const routing = manifest.corpus_routing || {};
const byId = new Map(articles.map((article) => [article.route_id, article]));
const inbound = new Map(articles.map((article) => [article.route_id, 0]));
const failures = [];

const fileFor = (canonical) => path.join(root, canonical.replace(/^\/|\/$/g, ""), "index.html");
const mainFor = (html) => html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";
const asideFor = (html, className) => html.match(new RegExp(`<aside class="${className}"[\\s\\S]*?<\\/aside>`))?.[0] || "";
const normaliseQuery = (value) => value.toLocaleLowerCase("ru").replace(/[«»“”"'.,!?—–-]/g, " ").replace(/\s+/g, " ").trim();

if (articles.length !== 24) failures.push(`expected 24 index articles, got ${articles.length}`);
if (Object.keys(routing).length !== articles.length) failures.push(`expected ${articles.length} routing rows, got ${Object.keys(routing).length}`);
if (/\bTEST\b|\/test(?:\/|\.html|\?)/i.test(manifestText)) failures.push("public TEST route remains in manifest");

const queryOwners = new Map();
for (const article of articles) {
  const route = routing[article.route_id];
  if (!route) {
    failures.push(`${article.route_id}: corpus routing missing`);
    continue;
  }
  const query = normaliseQuery(route.primary_query || "");
  if (!query) failures.push(`${article.route_id}: primary query missing`);
  if (queryOwners.has(query)) failures.push(`${article.route_id}: duplicate query owner with ${queryOwners.get(query)} (${query})`);
  queryOwners.set(query, article.route_id);
  if (!route.search_intent || !route.query_owner_scope) failures.push(`${article.route_id}: intent or owner scope missing`);
  if (!/^P[0-2]$/.test(route.priority || "")) failures.push(`${article.route_id}: invalid priority`);
  if (!Array.isArray(route.related) || route.related.length < 2 || route.related.length > 4) {
    failures.push(`${article.route_id}: expected 2-4 explicit related routes`);
  }
  const seen = new Set();
  for (const link of route.related || []) {
    if (!byId.has(link.route_id)) failures.push(`${article.route_id}: unknown related route ${link.route_id}`);
    if (link.route_id === article.route_id) failures.push(`${article.route_id}: self-related route`);
    if (seen.has(link.route_id)) failures.push(`${article.route_id}: duplicate related route ${link.route_id}`);
    if (!link.anchor || !link.reason) failures.push(`${article.route_id}: related link ${link.route_id} lacks anchor or reason`);
    seen.add(link.route_id);
    inbound.set(link.route_id, (inbound.get(link.route_id) || 0) + 1);
  }
  if (!route.cta?.variant || !route.cta?.primary) failures.push(`${article.route_id}: CTA definition missing`);
  if (route.cta?.secondary && Object.keys(route.cta).filter((key) => key === "secondary").length > 1) failures.push(`${article.route_id}: more than one secondary CTA`);
}

for (const id of ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "L06", "L08", "L12", "L13"]) {
  if (routing[id]?.cta?.primary?.product_id !== "mentoring") failures.push(`${id}: mentoring must be primary`);
}
if (routing.S04?.cta?.primary?.product_id !== "strength" || JSON.stringify(routing.S04?.cta || {}).includes("mentoring")) {
  failures.push("S04: male-system route must lead to strength without universal mentoring CTA");
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const hub = fs.readFileSync(path.join(root, "arhetipy", "index.html"), "utf8");
for (const article of articles) {
  const route = routing[article.route_id];
  const html = fs.readFileSync(fileFor(article.canonical), "utf8");
  const main = mainFor(html);
  const productCta = asideFor(main, "article-product-cta");
  const related = asideFor(main, "article-related");
  if (/\bTEST\b|\/test(?:\/|\.html|\?)/i.test(main)) failures.push(`${article.route_id}: public test reference in main`);
  if (/\/pervyi-shag\.html/i.test(main)) failures.push(`${article.route_id}: individual/navigator route remains in main`);
  if ((main.match(/class="article-product-cta"/g) || []).length !== 1) failures.push(`${article.route_id}: expected one product CTA inside main`);
  if ((productCta.match(/class="article-product-cta__primary"/g) || []).length !== 1) failures.push(`${article.route_id}: expected one dominant CTA`);
  if ((productCta.match(/class="article-product-cta__secondary"/g) || []).length > 1) failures.push(`${article.route_id}: more than one secondary CTA rendered`);
  if (!/<a\b[^>]*data-product-id="(?!related_article)[^"]+"/i.test(productCta)) failures.push(`${article.route_id}: no clickable product path in CTA`);
  for (const attribute of ["data-route-id", "data-product-id", "data-cta-variant", "data-placement"]) {
    if (!productCta.includes(attribute)) failures.push(`${article.route_id}: CTA missing ${attribute}`);
  }
  const renderedRelated = [...related.matchAll(/data-related-route-id="([^"]+)"/g)].map((match) => match[1]);
  const expectedRelated = route.related.map((link) => link.route_id);
  if (JSON.stringify(renderedRelated) !== JSON.stringify(expectedRelated)) failures.push(`${article.route_id}: rendered related graph differs from manifest`);
  if (/\b(?:20\d{2}|\d+[\s ]?(?:€|EUR|евро|руб))\b/i.test(productCta)) failures.push(`${article.route_id}: CTA contains a date or price`);
  if (route.cta.primary.kind !== "product" && !/<a\b[^>]*class="article-product-cta__primary"[^>]*data-related-route-id="[^"]+"[^>]*data-product-id="related_article"/i.test(productCta)) {
    failures.push(`${article.route_id}: educational primary CTA lacks related-route analytics attributes`);
  }
  if (!sitemap.includes(`<loc>https://evolution.yourbalancerestored.com${article.canonical}</loc>`)) failures.push(`${article.route_id}: missing from sitemap`);
  if (!hub.includes(`href="${article.canonical}"`)) failures.push(`${article.route_id}: article is not one click from hub`);
  if ((inbound.get(article.route_id) || 0) < 2) failures.push(`${article.route_id}: fewer than two contextual inbound links`);
}

const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
for (const eventName of ["article_view", "related_article_click", "cta_impression", "product_click", "lead_start", "lead_submit"]) {
  if (!analytics.includes(`"${eventName}"`)) failures.push(`analytics.js: missing ${eventName}`);
}
for (const parameter of ["route_id", "product_id", "cta_variant", "placement"]) {
  if (!analytics.includes(`"${parameter}"`)) failures.push(`analytics.js: missing parameter ${parameter}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Archetype corpus audit passed: ${articles.length} query owners, explicit link graph, product CTAs and analytics contract.`);
}
