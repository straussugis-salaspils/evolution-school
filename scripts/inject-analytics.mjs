import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = new Set([".git", "node_modules", "visual-package", "artifacts", "docs"]);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && skip.has(entry.name)) return [];
  const absolute = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});
const snippet = [
  "  <link rel=\"stylesheet\" href=\"/cookie-consent.css\">",
  "  <script src=\"/analytics-config.js\"></script>",
  "  <script src=\"/analytics.js\" defer></script>",
].join("\n");

let changed = 0;
for (const file of walk(root).filter((item) => item.toLowerCase().endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  if (html.includes("/analytics.js")) continue;
  if (!/<\/head>/i.test(html)) throw new Error(`Missing </head>: ${path.relative(root, file)}`);
  fs.writeFileSync(file, html.replace(/\s*<\/head>/i, `\n${snippet}\n</head>`), "utf8");
  changed += 1;
}
console.log(`Analytics shared layer inserted into ${changed} HTML file(s).`);
