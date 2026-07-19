import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = "https://evolution.yourbalancerestored.com";
const WRITE = process.argv.includes("--write");
const SKIP_DIRS = new Set([".git", "node_modules", "artifacts", "visual-package", "docs"]);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) return [];
  const absolute = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const htmlFiles = walk(ROOT).filter((file) => file.toLowerCase().endsWith(".html"));
const relative = (file) => path.relative(ROOT, file).replaceAll("\\", "/");
const routeForFile = (file) => {
  const rel = relative(file);
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
};

const parseAttributes = (tag) => {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    attrs[match[1].toLowerCase()] = match[3].trim();
  }
  return attrs;
};

const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => parseAttributes(m[0]));
const meta = (html, key, value) => tags(html, "meta").find((item) => item[key] === value)?.content || "";
const link = (html, rel) => tags(html, "link").find((item) => (item.rel || "").split(/\s+/).includes(rel))?.href || "";
const textOf = (html, tag) => {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : "";
};
const countTag = (html, name) => (html.match(new RegExp(`<${name}\\b`, "gi")) || []).length;
const isAbsoluteHttp = (value) => /^https:\/\//i.test(value);
const normalizePathname = (pathname) => {
  let value = decodeURI(pathname).replace(/\/{2,}/g, "/");
  if (value === "/index.html") value = "/";
  else if (value.endsWith("/index.html")) value = `${value.slice(0, -"index.html".length)}`;
  if (!path.extname(value) && !value.endsWith("/")) value += "/";
  return value || "/";
};

const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const redirects = new Map((vercel.redirects || []).map((item) => [normalizePathname(item.source), item.destination]));
const routeToFile = new Map(htmlFiles.map((file) => [normalizePathname(routeForFile(file)), file]));

const resolveSitePath = (value, currentRoute) => {
  if (!value || /^(#|mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  try {
    const target = new URL(value, `${BASE_URL}${currentRoute}`);
    if (target.origin !== BASE_URL) return null;
    return normalizePathname(target.pathname);
  } catch {
    return "INVALID_URL";
  }
};

const localTargetExists = (sitePath) => {
  if (!sitePath || sitePath === "INVALID_URL") return sitePath !== "INVALID_URL";
  if (routeToFile.has(sitePath) || redirects.has(sitePath)) return true;
  const diskPath = path.join(ROOT, sitePath.replace(/^\//, ""));
  return fs.existsSync(diskPath) && fs.statSync(diskPath).isFile();
};

const pages = htmlFiles.map((file) => {
  const html = fs.readFileSync(file, "utf8");
  const route = routeForFile(file);
  const robots = meta(html, "name", "robots").toLowerCase();
  const canonical = link(html, "canonical");
  const title = textOf(html, "title");
  const description = meta(html, "name", "description");
  const h1 = textOf(html, "h1");
  const metaRefresh = tags(html, "meta").some((item) => item["http-equiv"]?.toLowerCase() === "refresh");
  const isRedirect = redirects.has(normalizePathname(route)) || metaRefresh;
  const indexable = !isRedirect && robots.includes("index") && !robots.includes("noindex");
  const anchors = tags(html, "a").map((item) => item.href).filter(Boolean);
  const images = tags(html, "img");
  const brokenLinks = anchors
    .map((href) => ({ href, target: resolveSitePath(href, route) }))
    .filter(({ target }) => target && !localTargetExists(target));
  const brokenImages = images
    .map((image) => ({ src: image.src || "", target: resolveSitePath(image.src, route) }))
    .filter(({ src, target }) => src && target && !localTargetExists(target));
  const jsonLd = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim());
  const invalidJsonLd = jsonLd.filter((value) => {
    try { JSON.parse(value); return false; } catch { return true; }
  }).length;

  return {
    file: relative(file), route, title, description, canonical, robots, h1,
    h1Count: countTag(html, "h1"), indexable, isRedirect,
    lang: html.match(/<html\b[^>]*lang=["']([^"']+)["']/i)?.[1] || "",
    ogTitle: meta(html, "property", "og:title"),
    ogDescription: meta(html, "property", "og:description"),
    ogImage: meta(html, "property", "og:image"),
    ogUrl: meta(html, "property", "og:url"),
    twitterCard: meta(html, "name", "twitter:card"),
    twitterTitle: meta(html, "name", "twitter:title"),
    twitterDescription: meta(html, "name", "twitter:description"),
    twitterImage: meta(html, "name", "twitter:image"),
    jsonLdCount: jsonLd.length, invalidJsonLd,
    internalLinks: anchors.filter((href) => resolveSitePath(href, route)).length,
    internalTargets: anchors.map((href) => resolveSitePath(href, route)).filter(Boolean),
    brokenLinks, brokenImages,
    imagesWithoutAlt: images.filter((image) => !("alt" in image)).length,
    imagesWithoutDimensions: images.filter((image) => !(image.width && image.height)).length,
  };
}).sort((a, b) => a.route.localeCompare(b.route, "ru"));

const incoming = new Map(pages.map((page) => [normalizePathname(page.route), new Set()]));
for (const page of pages) {
  for (const target of page.internalTargets) {
    if (incoming.has(target) && target !== normalizePathname(page.route)) incoming.get(target).add(page.route);
  }
}
for (const page of pages) page.incomingLinks = incoming.get(normalizePathname(page.route))?.size || 0;

const issues = [];
const push = (severity, page, message) => issues.push({ severity, route: page.route, message });
for (const page of pages) {
  if (page.lang !== "ru") push("error", page, `html lang is '${page.lang || "missing"}'`);
  if (!page.title) push("error", page, "missing title");
  if (!page.robots) push("error", page, "missing robots meta");
  if (!page.isRedirect && !page.description) push("error", page, "missing description");
  if (page.isRedirect) {
    if (!page.canonical || !isAbsoluteHttp(page.canonical)) push("error", page, "redirect alias needs an absolute canonical");
  } else {
    if (!page.canonical || !isAbsoluteHttp(page.canonical)) push("error", page, "missing absolute canonical");
    if (page.indexable && page.canonical !== `${BASE_URL}${page.route}`) push("error", page, `indexable canonical does not match route: ${page.canonical}`);
    if (page.h1Count !== 1) push("error", page, `expected one H1, found ${page.h1Count}`);
    for (const [key, value] of Object.entries({ ogTitle: page.ogTitle, ogDescription: page.ogDescription, ogImage: page.ogImage, ogUrl: page.ogUrl, twitterCard: page.twitterCard })) {
      if (!value) push("error", page, `missing ${key}`);
    }
    if (page.ogImage && !isAbsoluteHttp(page.ogImage)) push("error", page, "og:image must be absolute HTTPS");
    if (page.indexable && page.ogUrl !== `${BASE_URL}${page.route}`) push("error", page, `og:url does not match route: ${page.ogUrl}`);
    if (page.twitterImage && !isAbsoluteHttp(page.twitterImage)) push("error", page, "twitter:image must be absolute HTTPS");
  }
  if (page.invalidJsonLd) push("error", page, `${page.invalidJsonLd} invalid JSON-LD block(s)`);
  for (const item of page.brokenLinks) push("error", page, `broken internal link: ${item.href}`);
  for (const item of page.brokenImages) push("error", page, `broken image: ${item.src}`);
  if (page.imagesWithoutAlt) push("warning", page, `${page.imagesWithoutAlt} image(s) without alt attribute`);
  if (page.imagesWithoutDimensions) push("warning", page, `${page.imagesWithoutDimensions} image(s) without width/height`);
  if (page.indexable && page.route !== "/" && page.incomingLinks === 0) push("warning", page, "indexable page has no incoming internal links");
  if (page.indexable && (page.title.length < 25 || page.title.length > 75)) push("warning", page, `title length is ${page.title.length} characters`);
  if (page.indexable && (page.description.length < 60 || page.description.length > 180)) push("warning", page, `description length is ${page.description.length} characters`);
}

const duplicates = (field) => {
  const groups = new Map();
  for (const page of pages.filter((item) => item.indexable)) {
    const value = page[field];
    if (!value) continue;
    groups.set(value, [...(groups.get(value) || []), page.route]);
  }
  return [...groups.entries()].filter(([, routes]) => routes.length > 1);
};
for (const [value, routes] of duplicates("title")) issues.push({ severity: "error", route: routes.join(", "), message: `duplicate title: ${value}` });
for (const [value, routes] of duplicates("description")) issues.push({ severity: "error", route: routes.join(", "), message: `duplicate description: ${value}` });

const sitemapPath = path.join(ROOT, "sitemap.xml");
const desiredUrls = pages
  .filter((page) => page.indexable && page.canonical && page.canonical === `${BASE_URL}${page.route}`)
  .map((page) => page.canonical)
  .sort((a, b) => a.localeCompare(b, "ru"));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${desiredUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
const currentSitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8").replace(/\r\n/g, "\n") : "";
if (currentSitemap !== sitemap) issues.push({ severity: "error", route: "/sitemap.xml", message: "sitemap is not synchronized with canonical indexable pages" });

const robotsPath = path.join(ROOT, "robots.txt");
const robotsText = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, "utf8") : "";
if (!robotsText.includes(`Sitemap: ${BASE_URL}/sitemap.xml`)) issues.push({ severity: "error", route: "/robots.txt", message: "missing absolute production sitemap directive" });

const escapeCell = (value) => String(value || "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
const inventoryHeader = `# SEO page inventory\n\nGenerated by \`npm run seo:write\` on ${new Date().toISOString().slice(0, 10)}. Production base URL: ${BASE_URL}.\n\n| URL | File | Purpose / H1 | Status | Robots | Title | Description | Canonical | H1 | Sitemap | Links in / out | Duplicate | Action |\n|---|---|---|---|---|---|---|---|---:|---|---:|---|---|\n`;
const duplicateTitles = new Set(duplicates("title").flatMap(([, routes]) => routes));
const duplicateDescriptions = new Set(duplicates("description").flatMap(([, routes]) => routes));
const inventoryRows = pages.map((page) => {
  const status = page.isRedirect ? "redirect alias" : page.indexable ? "public indexable" : "hidden / noindex";
  const duplicate = [duplicateTitles.has(page.route) ? "title" : "", duplicateDescriptions.has(page.route) ? "description" : ""].filter(Boolean).join(", ") || "—";
  const action = issues.some((issue) => issue.route === page.route && issue.severity === "error") ? "Fix technical errors" : "Keep";
  return `| ${escapeCell(page.route)} | ${escapeCell(page.file)} | ${escapeCell(page.h1 || page.title)} | ${status} | ${escapeCell(page.robots)} | ${escapeCell(page.title)} | ${escapeCell(page.description)} | ${escapeCell(page.canonical)} | ${page.h1Count} | ${desiredUrls.includes(page.canonical) ? "yes" : "no"} | ${page.incomingLinks} / ${page.internalLinks} | ${duplicate} | ${action} |`;
}).join("\n");

if (WRITE) {
  fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "docs", "seo-page-inventory.md"), `${inventoryHeader}${inventoryRows}\n`, "utf8");
  fs.writeFileSync(sitemapPath, sitemap, "utf8");
}

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");
console.log(`SEO audit: ${pages.length} pages, ${desiredUrls.length} sitemap URLs, ${errors.length} errors, ${warnings.length} warnings.`);
for (const issue of issues) console.log(`${issue.severity.toUpperCase()} ${issue.route}: ${issue.message}`);
if (WRITE) console.log("Updated docs/seo-page-inventory.md and sitemap.xml.");
process.exitCode = errors.length ? 1 : 0;
