import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const excludedRootDirectories = new Set([
  ".git",
  ".github",
  ".vercel",
  "api",
  "dist",
  "docs",
  "node_modules",
  "scripts",
]);
const excludedDirectoryNames = new Set([".git", ".vercel", "dist", "node_modules"]);
const excludedRootFiles = new Set([
  ".gitignore",
  ".vercelignore",
  "package-lock.json",
  "package.json",
  "vercel.json",
]);
const deployableExtensions = new Set([
  ".avif",
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mp3",
  ".mp4",
  ".ogg",
  ".otf",
  ".svg",
  ".ttf",
  ".txt",
  ".wav",
  ".webmanifest",
  ".webp",
  ".woff",
  ".woff2",
  ".xml",
]);
const textExtensions = new Set([".css", ".html", ".js"]);
const pngReferencePattern = /((?:\/|\.\.?\/)?[^\s"'()<>]+?\.png)(?:[?#][^\s"'()<>]*)?/gi;
const productionOrigin = "https://evolution.yourbalancerestored.com";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (
      entry.isDirectory() &&
      (excludedDirectoryNames.has(entry.name) ||
        (directory === root && excludedRootDirectories.has(entry.name)))
    ) {
      continue;
    }
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function resolveReference(source, reference) {
  if (reference.startsWith(productionOrigin + "/")) {
    reference = reference.slice(productionOrigin.length);
  } else if (reference.includes("://") || reference.startsWith("//") || reference.startsWith("data:")) {
    return null;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(reference.replaceAll("\\", "/"));
  } catch {
    decoded = reference.replaceAll("\\", "/");
  }
  const absolute = decoded.startsWith("/")
    ? path.join(root, decoded.slice(1))
    : path.resolve(path.dirname(source), decoded);
  const relative = path.relative(root, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return path.normalize(absolute);
}

async function requiredPngFiles(files) {
  const required = new Set();
  for (const file of files) {
    if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(pngReferencePattern)) {
      const resolved = resolveReference(file, match[1]);
      if (resolved) required.add(resolved);
    }
  }
  return required;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const sourceFiles = await walk(root);
const requiredPngs = await requiredPngFiles(sourceFiles);
const missingPngs = [];
let copiedFiles = 0;
let copiedBytes = 0;
let omittedPngs = 0;
let omittedPngBytes = 0;

for (const source of sourceFiles) {
  const relative = path.relative(root, source);
  if (!relative.includes(path.sep) && excludedRootFiles.has(relative)) continue;
  const extension = path.extname(source).toLowerCase();
  const normalized = path.normalize(source);
  if (extension === ".png") {
    if (!requiredPngs.has(normalized)) {
      omittedPngs += 1;
      omittedPngBytes += (await stat(source)).size;
      continue;
    }
  } else if (!deployableExtensions.has(extension)) {
    continue;
  }
  const destination = path.join(output, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
  copiedFiles += 1;
  copiedBytes += (await stat(source)).size;
}

for (const png of requiredPngs) {
  try {
    await stat(png);
  } catch {
    missingPngs.push(path.relative(root, png));
  }
}

if (missingPngs.length) {
  throw new Error(`Missing referenced PNG files:\n${missingPngs.join("\n")}`);
}

console.log(`Vercel output files: ${copiedFiles}`);
console.log(`Vercel output size: ${(copiedBytes / 1024 / 1024).toFixed(2)} MiB`);
console.log(`Omitted PNG sources: ${omittedPngs}`);
console.log(`Omitted PNG source size: ${(omittedPngBytes / 1024 / 1024).toFixed(2)} MiB`);
