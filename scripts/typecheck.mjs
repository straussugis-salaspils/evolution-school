import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = new Set([".git", "node_modules", "visual-package", "artifacts"]);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && skip.has(entry.name)) return [];
  const absolute = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});
const typeSources = walk(root).filter((file) => /\.(?:ts|tsx)$/i.test(file));
if (typeSources.length) {
  console.error(`Typecheck cannot run: ${typeSources.length} TypeScript file(s) found but no TypeScript toolchain is configured.`);
  process.exitCode = 1;
} else {
  const audit = spawnSync(process.execPath, [path.join(root, "scripts", "analytics-audit.mjs")], { cwd: root, encoding: "utf8" });
  process.stdout.write(audit.stdout || "");
  process.stderr.write(audit.stderr || "");
  if (audit.status !== 0) process.exitCode = audit.status || 1;
  else console.log("Typecheck: static JavaScript project; no TypeScript sources. Analytics event schema audit passed.");
}
