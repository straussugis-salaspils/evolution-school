import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const baseUrl = "https://evolution.yourbalancerestored.com";
const sitemapPath = path.join(root, "sitemap.xml");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs", "seo", "archetypes", "production", "portfolio-routes.json"),
    "utf8",
  ),
);

const current = fs.readFileSync(sitemapPath, "utf8");
const urls = new Set(
  [...current.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
);
urls.delete(`${baseUrl}/test-arhetipov/`);
for (const route of ["/arhetipy.html", "/arhetipy/", "/zhenskie-arhetipy/"]) {
  urls.add(`${baseUrl}${route}`);
}
for (const article of manifest.assets.filter((item) => item.index_state === "index")) {
  urls.add(`${baseUrl}${article.canonical}`);
}
for (const hold of manifest.consolidations) {
  urls.delete(`${baseUrl}${hold.proposed_canonical}`);
}

const sorted = [...urls].sort((left, right) => left.localeCompare(right, "ru"));
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(sitemapPath, xml, "utf8");
console.log(`Updated sitemap with ${sorted.length} public URLs.`);
