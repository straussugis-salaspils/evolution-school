import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = new Set([".git", "node_modules", "docs", "assets", "visual-package"]);
const trimTrailing = process.argv.includes("--trim-trailing");
const normalizeLf = process.argv.includes("--lf");
const normalizeCrlf = process.argv.includes("--crlf");
const matchHeadLineEndings = process.argv.includes("--match-head-line-endings");
const lfChangedImageLines = process.argv.includes("--lf-changed-image-lines");
const noFinalNewline = process.argv.includes("--no-final-newline");
const requestedFiles = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && skip.has(entry.name)) return [];
  const absolute = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const resolveImage = (htmlFile, src) => {
  if (!src || /^(?:https?:|data:|blob:|\/\/)/i.test(src)) return null;
  const pathname = decodeURIComponent(src.split(/[?#]/, 1)[0]);
  const absolute = pathname.startsWith("/")
    ? path.join(root, pathname.replace(/^\/+/, ""))
    : path.resolve(path.dirname(htmlFile), pathname);
  return absolute.startsWith(root) && fs.existsSync(absolute) ? absolute : null;
};

let filesChanged = 0;
let imagesChanged = 0;
const unresolved = [];

const htmlFiles = requestedFiles.length
  ? requestedFiles.map((file) => path.resolve(root, file))
  : walk(root).filter((candidate) => candidate.endsWith(".html"));

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  let cursor = 0;
  let output = "";
  let changed = false;

  for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    output += source.slice(cursor, match.index);
    cursor = match.index + tag.length;
    if (/\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag)) {
      output += tag;
      continue;
    }
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    const image = resolveImage(file, src);
    if (!image) {
      output += tag;
      unresolved.push(`${path.relative(root, file)}: ${src || "missing src"}`);
      continue;
    }
    const metadata = await sharp(image).metadata();
    if (!metadata.width || !metadata.height) {
      output += tag;
      unresolved.push(`${path.relative(root, file)}: ${src}`);
      continue;
    }
    const dimensions = `${/\bwidth\s*=/.test(tag) ? "" : ` width="${metadata.width}"`}${/\bheight\s*=/.test(tag) ? "" : ` height="${metadata.height}"`}`;
    output += tag.replace(/^<img\b/i, `<img${dimensions}`);
    changed = true;
    imagesChanged += 1;
  }
  output += source.slice(cursor);
  if (trimTrailing) output = output.replace(/[ \t]+(?=\r?$)/gm, "");
  if (normalizeLf) output = output.replace(/\r\n/g, "\n");
  if (normalizeCrlf) output = output.replace(/\r?\n/g, "\r\n");
  if (matchHeadLineEndings) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const head = execFileSync("git", ["show", `HEAD:${relative}`], { cwd: root }).toString("utf8");
    const endings = [...head.matchAll(/\r?\n/g)].map((match) => match[0]);
    const headLines = head.split(/\r?\n/);
    const lines = output.split(/\r?\n/);
    if (lines.length !== endings.length + 1) throw new Error(`${relative}: line count changed; cannot restore line endings safely`);
    output = lines.map((line, index) => {
      const ending = lfChangedImageLines && line !== headLines[index] && line.includes("<img") ? "\n" : (endings[index] || "");
      return line + ending;
    }).join("");
  }
  if (noFinalNewline) output = output.replace(/\r?\n$/, "");
  if (changed || output !== source) {
    fs.writeFileSync(file, output, "utf8");
    filesChanged += 1;
  }
}

console.log(`Image dimensions: ${imagesChanged} tag(s) in ${filesChanged} file(s); ${unresolved.length} unresolved.`);
for (const item of unresolved) console.warn(`UNRESOLVED ${item}`);
