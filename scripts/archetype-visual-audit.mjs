import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs", "seo", "archetypes", "production", "portfolio-routes.json"),
    "utf8",
  ),
);
const articles = manifest.assets.filter((item) => item.index_state === "index");
const failures = [];
const hashes = new Map();

for (const article of articles) {
  const directory = path.join(root, "assets", "archetype-articles", article.route_id.toLowerCase());
  const required = [
    "hero-480.webp",
    "hero-768.webp",
    "hero-1200.webp",
    "hero-1600.webp",
    "hero-1200.jpg",
    "card-480.webp",
    "card-800.webp",
    "card-1200.webp",
    "card-800.jpg",
    "og-1200.jpg",
  ];
  for (const filename of required) {
    const file = path.join(directory, filename);
    if (!fs.existsSync(file)) {
      failures.push(`${article.route_id}: missing ${filename}`);
      continue;
    }
    const size = fs.statSync(file).size;
    if (filename === "hero-1200.webp" && size > 250_000) {
      failures.push(`${article.route_id}: desktop hero is over 250 KB (${size})`);
    }
    if (filename === "hero-480.webp" && size > 150_000) {
      failures.push(`${article.route_id}: mobile hero is over 150 KB (${size})`);
    }
  }
  const hero = path.join(directory, "hero-1200.webp");
  if (fs.existsSync(hero)) {
    const hash = crypto.createHash("sha256").update(fs.readFileSync(hero)).digest("hex");
    if (hashes.has(hash)) {
      failures.push(`${article.route_id}: duplicates hero from ${hashes.get(hash)}`);
    }
    hashes.set(hash, article.route_id);
  }
  const html = fs.readFileSync(
    path.join(root, article.canonical.replace(/^\/|\/$/g, ""), "index.html"),
    "utf8",
  );
  if (!html.includes("hero-480.webp") || !html.includes('fetchpriority="high"')) {
    failures.push(`${article.route_id}: responsive priority hero markup missing`);
  }
}

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Archetype visual audit passed: ${articles.length} unique responsive Hero families.`);
}
