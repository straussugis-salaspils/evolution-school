import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(root, "docs", "seo", "archetypes", "production");
const manifest = JSON.parse(fs.readFileSync(path.join(productionRoot, "portfolio-routes.json"), "utf8"));
const articles = manifest.assets.filter((item) => item.index_state === "index");
const routing = manifest.corpus_routing;
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const hub = fs.readFileSync(path.join(root, "arhetipy", "index.html"), "utf8");
const inbound = new Map(articles.map((article) => [article.route_id, 0]));

for (const article of articles) {
  for (const link of routing[article.route_id].related) {
    inbound.set(link.route_id, (inbound.get(link.route_id) || 0) + 1);
  }
}

const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const columns = [
  "route_id", "canonical", "primary_query", "search_intent", "query_owner_scope", "priority",
  "title", "h1", "meta_description", "canonical_ok", "indexable", "in_sitemap",
  "hub_click_depth", "contextual_inbound", "contextual_outbound", "product_links_in_main",
  "primary_product", "secondary_product", "cta_variant",
  "gsc_clicks_28d", "gsc_impressions_28d", "gsc_ctr_28d", "gsc_position_28d",
  "yandex_clicks_28d", "yandex_impressions_28d", "yandex_ctr_28d", "yandex_position_28d",
  "ga4_organic_sessions_28d", "ga4_product_clicks_28d", "performance_evidence",
];

const rows = articles.map((article) => {
  const route = routing[article.route_id];
  const file = path.join(root, article.canonical.replace(/^\/|\/$/g, ""), "index.html");
  const html = fs.readFileSync(file, "utf8");
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "";
  const primary = route.cta.primary.kind === "product" ? route.cta.primary.product_id : route.cta.primary.kind;
  const secondary = route.cta.secondary?.kind === "product" ? route.cta.secondary.product_id : route.cta.secondary?.kind || "";
  return {
    route_id: article.route_id,
    canonical: article.canonical,
    primary_query: route.primary_query,
    search_intent: route.search_intent,
    query_owner_scope: route.query_owner_scope,
    priority: route.priority,
    title,
    h1,
    meta_description: description,
    canonical_ok: html.includes(`<link rel="canonical" href="https://evolution.yourbalancerestored.com${article.canonical}">`) ? "yes" : "no",
    indexable: html.includes('<meta name="robots" content="index, follow">') ? "yes" : "no",
    in_sitemap: sitemap.includes(`<loc>https://evolution.yourbalancerestored.com${article.canonical}</loc>`) ? "yes" : "no",
    hub_click_depth: hub.includes(`href="${article.canonical}"`) ? 1 : "n/a",
    contextual_inbound: inbound.get(article.route_id) || 0,
    contextual_outbound: route.related.length,
    product_links_in_main: (main.match(/<a\b[^>]*data-product-id="(?!related_article)[^"]+"/g) || []).length,
    primary_product: primary,
    secondary_product: secondary,
    cta_variant: route.cta.variant,
    gsc_clicks_28d: "n/a",
    gsc_impressions_28d: "n/a",
    gsc_ctr_28d: "n/a",
    gsc_position_28d: "n/a",
    yandex_clicks_28d: "n/a",
    yandex_impressions_28d: "n/a",
    yandex_ctr_28d: "n/a",
    yandex_position_28d: "n/a",
    ga4_organic_sessions_28d: "n/a",
    ga4_product_clicks_28d: "n/a",
    performance_evidence: "n/a — Search Console, Yandex Webmaster and GA4 exports were not available in the repository",
  };
});

const destination = path.join(productionRoot, "corpus-system", "00-baseline.csv");
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `${columns.join(",")}\n${rows.map((row) => columns.map((column) => quote(row[column])).join(",")).join("\n")}\n`, "utf8");
console.log(`Archetype baseline written: ${rows.length} routes, performance fields marked n/a.`);
