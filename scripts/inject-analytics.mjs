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
const includes = '  <link rel="stylesheet" href="/cookie-consent.css">\n  <script src="/analytics.js" defer></script>';
let changed = 0;
for (const file of walk(root).filter((file) => file.endsWith(".html"))) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("/analytics.js")) continue;
  if (!/<\/head>/i.test(source)) throw new Error(`Missing </head>: ${path.relative(root, file)}`);
  fs.writeFileSync(file, source.replace(/\s*<\/head>/i, `\n${includes}\n</head>`), "utf8");
  changed += 1;
}
console.log(`Analytics shared layer inserted into ${changed} HTML file(s).`);
