import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const collectionRoot = path.join(root, "biblioteka", "reiki");
const hubPath = path.join(collectionRoot, "index.html");
const expectedArticleCount = 18;
const baseUrl = "https://evolution.yourbalancerestored.com";
const issues = [];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function match(html, pattern, label, route) {
  const value = html.match(pattern)?.[1]?.trim();
  if (!value) issues.push(`${route}: missing ${label}.`);
  return value || "";
}

function publicRoute(file) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  return `/${relative.replace(/index\.html$/, "")}`;
}

function localTarget(href) {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const pathname = href.split(/[?#]/, 1)[0];
  if (!pathname || pathname === "/") return path.join(root, "index.html");
  if (path.extname(pathname)) return path.join(root, pathname.slice(1));
  return path.join(root, pathname.slice(1), "index.html");
}

const articleFiles = fs
  .readdirSync(collectionRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(collectionRoot, entry.name, "index.html"))
  .filter((file) => fs.existsSync(file))
  .sort();

if (articleFiles.length !== expectedArticleCount) {
  issues.push(
    `Expected ${expectedArticleCount} Reiki articles, found ${articleFiles.length}.`,
  );
}

const pages = [hubPath, ...articleFiles].map((file) => ({
  file,
  route: publicRoute(file),
  html: read(file),
}));
const articlePages = pages.slice(1);
const uniqueFields = {
  title: new Map(),
  description: new Map(),
  canonical: new Map(),
  h1: new Map(),
};
const incoming = new Map(articlePages.map((page) => [page.route, 0]));

for (const page of pages) {
  const { html, route } = page;
  const title = match(html, /<title>([\s\S]*?)<\/title>/i, "title", route);
  const description = match(
    html,
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    "meta description",
    route,
  );
  const canonical = match(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"/i,
    "canonical",
    route,
  );
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1 = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, "").trim() || "";

  if (h1Matches.length !== 1) {
    issues.push(`${route}: expected one H1, found ${h1Matches.length}.`);
  }
  if (canonical !== `${baseUrl}${route}`) {
    issues.push(`${route}: canonical is not self-referencing (${canonical}).`);
  }
  if (!/name="robots"\s+content="index,\s*follow"/i.test(html)) {
    issues.push(`${route}: missing index, follow robots directive.`);
  }
  if (!/property="og:url"\s+content="https:\/\/evolution\.yourbalancerestored\.com\//i.test(html)) {
    issues.push(`${route}: missing absolute og:url.`);
  }
  if (!/property="og:image"\s+content="https:\/\/evolution\.yourbalancerestored\.com\//i.test(html)) {
    issues.push(`${route}: missing absolute og:image.`);
  }
  if (
    !/property="og:image:width"\s+content="1200"/i.test(html) ||
    !/property="og:image:height"\s+content="630"/i.test(html)
  ) {
    issues.push(`${route}: missing OG image dimensions.`);
  }
  if (!/name="twitter:card"\s+content="summary_large_image"/i.test(html)) {
    issues.push(`${route}: missing summary_large_image Twitter card.`);
  }
  if (!/href="\/biblioteka\/reiki\/"/i.test(html)) {
    issues.push(`${route}: missing crawlable link to the Reiki article hub.`);
  }
  if (!/class="eh-local-strip"/i.test(html)) {
    issues.push(`${route}: missing Reiki local navigation.`);
  }

  for (const [field, value] of Object.entries({
    title,
    description,
    canonical,
    h1,
  })) {
    if (!value) continue;
    if (uniqueFields[field].has(value)) {
      issues.push(
        `${route}: duplicate ${field} also used by ${uniqueFields[field].get(value)}.`,
      );
    } else {
      uniqueFields[field].set(value, route);
    }
  }

  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = image[0];
    if (!/\balt="[^"]*"/i.test(tag)) issues.push(`${route}: image without alt.`);
    if (!/\bwidth="\d+"/i.test(tag) || !/\bheight="\d+"/i.test(tag)) {
      issues.push(`${route}: image without intrinsic width and height.`);
    }
  }

  for (const link of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)) {
    const href = link[1];
    if (href === "#") issues.push(`${route}: dead href="#".`);
    if (incoming.has(href)) incoming.set(href, incoming.get(href) + 1);
    const target = localTarget(href);
    if (target && !fs.existsSync(target)) {
      issues.push(`${route}: broken internal link ${href}.`);
    }
  }
}

for (const page of articlePages) {
  const { html, route } = page;
  const schemaText = match(
    html,
    /<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i,
    "JSON-LD",
    route,
  );
  try {
    const schema = JSON.parse(schemaText);
    const graph = Array.isArray(schema["@graph"]) ? schema["@graph"] : [];
    const article = graph.find((item) => item["@type"] === "Article");
    const breadcrumbs = graph.find(
      (item) => item["@type"] === "BreadcrumbList",
    );
    if (!article) issues.push(`${route}: missing Article schema.`);
    if (!breadcrumbs) issues.push(`${route}: missing BreadcrumbList schema.`);
    if (article) {
      if (article.mainEntityOfPage !== `${baseUrl}${route}`) {
        issues.push(`${route}: Article mainEntityOfPage differs from canonical.`);
      }
      if (article.author?.name !== "Светлана Страус") {
        issues.push(`${route}: Article author is missing or incorrect.`);
      }
      if (!article.datePublished || !article.dateModified) {
        issues.push(`${route}: Article dates are incomplete.`);
      }
      const images = Array.isArray(article.image)
        ? article.image
        : [article.image].filter(Boolean);
      if (
        !images.length ||
        images.some((image) => !String(image).startsWith(`${baseUrl}/`))
      ) {
        issues.push(`${route}: Article image is missing or not absolute.`);
      }
    }
  } catch (error) {
    issues.push(`${route}: invalid JSON-LD (${error.message}).`);
  }

  if (!/class="article-back-link"\s+href="\/biblioteka\/reiki\/"/i.test(html)) {
    issues.push(`${route}: missing visible back link to all Reiki articles.`);
  }
  if (
    !/class="eh-local-strip__articles"\s+href="\/biblioteka\/reiki\/"\s+aria-current="location"/i.test(
      html,
    )
  ) {
    issues.push(`${route}: Reiki hub navigation is not marked as the current location.`);
  }
  if (!/class="article-next-step"/i.test(html)) {
    issues.push(`${route}: missing product-path next-step section.`);
  }
  if (
    !/class="article-related"/i.test(html) &&
    !route.endsWith("/oshibki-nachinayuschih-reiki/")
  ) {
    issues.push(`${route}: missing related-materials component.`);
  }
  if (!/fetchpriority="high"/i.test(html)) {
    issues.push(`${route}: Hero image is not prioritized.`);
  }
}

const hubSchemaText = match(
  pages[0].html,
  /<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i,
  "JSON-LD",
  pages[0].route,
);
try {
  const hubSchema = JSON.parse(hubSchemaText);
  const graph = Array.isArray(hubSchema["@graph"]) ? hubSchema["@graph"] : [];
  const collection = graph.find((item) => item["@type"] === "CollectionPage");
  const breadcrumbs = graph.find(
    (item) => item["@type"] === "BreadcrumbList",
  );
  if (!collection) issues.push(`${pages[0].route}: missing CollectionPage schema.`);
  if (!breadcrumbs) {
    issues.push(`${pages[0].route}: missing BreadcrumbList schema.`);
  }
  if (collection?.mainEntity?.itemListElement?.length !== expectedArticleCount) {
    issues.push(
      `${pages[0].route}: CollectionPage ItemList does not contain all articles.`,
    );
  }
} catch (error) {
  issues.push(`${pages[0].route}: invalid JSON-LD (${error.message}).`);
}

for (const [route, count] of incoming) {
  if (count < 1) issues.push(`${route}: no incoming link from the Reiki cluster.`);
}

if (issues.length) {
  console.error(`Reiki SEO audit failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(
    `Reiki SEO audit passed: ${articlePages.length} articles, unique metadata, self-canonicals, valid Article/Breadcrumb schema and complete internal discovery.`,
  );
}
