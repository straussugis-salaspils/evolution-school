import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const productionOrigin = "https://evolution.yourbalancerestored.com";
const vercelConfig = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8"));
const virtualRoutes = new Set([
  ...(vercelConfig.rewrites ?? []).map((item) => item.source),
  ...(vercelConfig.redirects ?? []).map((item) => item.source),
]);
const textExtensions = new Set([".css", ".html", ".js"]);
const missing = new Map();

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function addMissing(source, reference) {
  const relativeSource = path.relative(output, source).replaceAll("\\", "/");
  const key = `${relativeSource} -> ${reference}`;
  missing.set(key, true);
}

function verifyReference(source, rawReference, kind) {
  const trimmed = rawReference.trim();
  if (
    !trimmed ||
    trimmed.startsWith(("#")) ||
    /^(?:data|mailto|tel|javascript):/i.test(trimmed) ||
    trimmed.startsWith("//")
  ) {
    return;
  }

  let reference = trimmed;
  if (reference.startsWith(productionOrigin + "/")) {
    reference = reference.slice(productionOrigin.length);
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(reference)) {
    return;
  }

  reference = reference.split(/[?#]/, 1)[0];
  if (!reference || reference.startsWith("/api/")) return;
  if (reference.startsWith("/") && virtualRoutes.has(reference)) return;
  try {
    reference = decodeURIComponent(reference);
  } catch {
    // Keep the literal URL when it contains a malformed escape.
  }

  const candidate = reference.startsWith("/")
    ? path.join(output, reference.slice(1))
    : path.resolve(path.dirname(source), reference);
  const relative = path.relative(output, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return;

  const candidates = [candidate];
  if (reference.endsWith("/")) candidates.push(path.join(candidate, "index.html"));
  if (kind === "href" && !path.extname(reference)) {
    candidates.push(path.join(candidate, "index.html"));
    candidates.push(`${candidate}.html`);
  }
  if (!candidates.some((item) => existsSync(item) && statSync(item).isFile())) {
    addMissing(source, rawReference);
  }
}

if (!existsSync(output)) throw new Error("dist does not exist; run the staging build first");

const files = walk(output);
for (const file of files) {
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const text = readFileSync(file, "utf8");

  if (file.endsWith(".html")) {
    for (const match of text.matchAll(/\b(src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
      verifyReference(file, match[2], match[1].toLowerCase());
    }
    for (const match of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
      for (const candidate of match[1].split(",")) {
        verifyReference(file, candidate.trim().split(/\s+/, 1)[0], "src");
      }
    }
    for (const match of text.matchAll(/\bcontent\s*=\s*["']([^"']+)["']/gi)) {
      if (match[1].startsWith(productionOrigin + "/")) verifyReference(file, match[1], "src");
    }
  }

  if (file.endsWith(".css") || file.endsWith(".html")) {
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      verifyReference(file, match[1], "src");
    }
  }
}

if (missing.size) {
  throw new Error(`Broken references in Vercel output:\n${[...missing.keys()].join("\n")}`);
}

const htmlCount = files.filter((file) => file.endsWith(".html")).length;
console.log(`Vercel output verification: ${htmlCount} HTML files, 0 broken local references.`);
