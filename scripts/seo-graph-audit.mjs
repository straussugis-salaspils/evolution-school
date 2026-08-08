import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://evolution.yourbalancerestored.com";
const write = process.argv.includes("--write");
const skip = new Set([".git", "node_modules", "docs", "assets", "visual-package"]);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && skip.has(entry.name)) return [];
  const absolute = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const normalize = (pathname) => {
  let value = decodeURI(pathname).replace(/\/{2,}/g, "/");
  if (value === "/index.html") value = "/";
  else if (value.endsWith("/index.html")) value = value.slice(0, -"index.html".length);
  if (!path.posix.extname(value) && !value.endsWith("/")) value += "/";
  return value || "/";
};

const routeForFile = (file) => {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return normalize(`/${relative}`);
  return `/${relative}`;
};

const htmlFiles = walk(root).filter((file) => file.endsWith(".html") && !/^yandex_[a-f0-9]+\.html$/i.test(path.basename(file)));
const routeToHtml = new Map(htmlFiles.map((file) => [normalize(routeForFile(file)), fs.readFileSync(file, "utf8")]));
const graph = new Map([...routeToHtml.keys()].map((route) => [route, new Set()]));
const incoming = new Map([...routeToHtml.keys()].map((route) => [route, new Set()]));

for (const [route, html] of routeToHtml) {
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1];
    if (/^(#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const url = new URL(href, `${origin}${route}`);
      if (url.origin !== origin) continue;
      const target = normalize(url.pathname);
      if (!routeToHtml.has(target)) continue;
      graph.get(route).add(target);
      if (target !== route) incoming.get(target).add(route);
    } catch {
      // Invalid URLs are reported by the main SEO audit.
    }
  }
}

const depths = new Map([["/", 0]]);
const queue = ["/"];
while (queue.length) {
  const current = queue.shift();
  for (const target of graph.get(current) || []) {
    if (depths.has(target)) continue;
    depths.set(target, depths.get(current) + 1);
    queue.push(target);
  }
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapRoutes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => normalize(new URL(match[1]).pathname));
const rows = sitemapRoutes.map((route) => ({
  route,
  depth: depths.get(route),
  incoming: incoming.get(route)?.size || 0,
}));
const unreachable = rows.filter((row) => row.depth === undefined);
const tooDeep = rows.filter((row) => row.depth !== undefined && row.depth > 3);
const maxDepth = Math.max(...rows.map((row) => row.depth ?? 0));

if (write) {
  const report = [
    "# Internal link graph",
    "",
    `Generated ${new Date().toISOString().slice(0, 10)} from the rendered HTML and sitemap.`,
    "",
    `- Sitemap URLs: ${rows.length}`,
    `- Maximum click depth from home: ${maxDepth}`,
    `- Unreachable sitemap URLs: ${unreachable.length}`,
    `- Sitemap URLs deeper than three clicks: ${tooDeep.length}`,
    "",
    "| URL | Click depth | Distinct internal sources |",
    "|---|---:|---:|",
    ...rows.sort((a, b) => (a.depth ?? 999) - (b.depth ?? 999) || a.route.localeCompare(b.route, "ru"))
      .map((row) => `| ${row.route} | ${row.depth ?? "unreachable"} | ${row.incoming} |`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(root, "docs", "seo", "internal-link-graph.md"), report, "utf8");
}

console.log(`SEO graph: ${rows.length} sitemap URLs, max depth ${maxDepth}, ${unreachable.length} unreachable, ${tooDeep.length} deeper than 3 clicks.`);
for (const row of unreachable) console.error(`UNREACHABLE ${row.route}`);
for (const row of tooDeep) console.error(`TOO_DEEP ${row.route}: ${row.depth}`);
process.exitCode = unreachable.length || tooDeep.length ? 1 : 0;
