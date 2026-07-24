import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets/reiki-articles/inserts",
);

const files = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(current);
    else if (entry.isFile() && current.endsWith(".html")) files.push(current);
  }
}
collect(root);

const colorGroups = new Map([
  [
    "#292319",
    [
      "#20343a",
      "#233338",
      "#25372f",
      "#1f302b",
      "#24352f",
      "#25352f",
      "#26352f",
      "#302718",
      "#3a251d",
    ],
  ],
  [
    "#6d6559",
    ["#607176", "#61736b", "#63736c", "#665f53", "#5b5145"],
  ],
  [
    "#315f5b",
    [
      "#2f6370",
      "#356270",
      "#3d6a58",
      "#49725f",
      "#58745e",
      "#4a6d55",
    ],
  ],
  [
    "#b78a3e",
    ["#9a7239", "#a77a3c", "#aa7b38", "#ae7c38", "#d6b46d"],
  ],
  ["#76551f", ["#4f391b", "#67502d"]],
  [
    "#9a5f48",
    [
      "#9b473d",
      "#a94c3f",
      "#a6493f",
      "#9a654e",
      "#9f5d42",
      "#a45e45",
      "#a75f45",
    ],
  ],
  [
    "#f8f0dc",
    ["#ece9e1", "#eee9df", "#f2eee5", "#f4f0e7", "#f7f0df", "#fbf5e7"],
  ],
  ["#fffdf8", ["#fffdf7", "#fffaf0", "#fbf7ec"]],
]);

const replacements = [];
for (const [target, sources] of colorGroups) {
  for (const source of sources) {
    replacements.push([new RegExp(source.replace("#", "\\#"), "gi"), target]);
  }
}

const fontPatterns = [
  [
    /font:\s*([^;{}]*?)Arial\s*,\s*sans-serif(?=\s*[;}])/gi,
    'font:$1var(--viz-font-body, "Segoe UI", system-ui, sans-serif)',
  ],
  [
    /font:\s*([^;{}]*?)Georgia\s*,\s*serif(?=\s*[;}])/gi,
    'font:$1var(--viz-font-display, Georgia, "Times New Roman", serif)',
  ],
  [
    /font-family:\s*(?:"Trebuchet MS"|Trebuchet MS)(?:\s*,\s*Verdana)?(?:\s*,\s*Arial)?(?:\s*,\s*sans-serif)?(?=\s*[;}])/gi,
    'font-family:var(--viz-font-body, "Segoe UI", system-ui, sans-serif)',
  ],
  [
    /font-family:\s*Arial\s*,\s*sans-serif(?=\s*[;}])/gi,
    'font-family:var(--viz-font-body, "Segoe UI", system-ui, sans-serif)',
  ],
  [
    /font-family:\s*Georgia\s*,\s*(?:"Times New Roman"\s*,\s*)?serif(?=\s*[;}])/gi,
    'font-family:var(--viz-font-display, Georgia, "Times New Roman", serif)',
  ],
];

let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const [pattern, target] of replacements) {
    after = after.replace(pattern, target);
  }
  for (const [pattern, target] of fontPatterns) {
    after = after.replace(pattern, target);
  }
  after = after
    .replace(
      /font-family=(["'])Trebuchet MS(?:\s*,\s*Verdana)?(?:\s*,\s*Arial)?(?:\s*,\s*sans-serif)?\1/gi,
      'font-family="Segoe UI, system-ui, sans-serif"',
    )
    .replace(
      /font-family=(["'])Arial\s*,\s*sans-serif\1/gi,
      'font-family="Segoe UI, system-ui, sans-serif"',
    )
    .replace(
      /font-family=(["'])Georgia\s*,\s*serif\1/gi,
      'font-family="Georgia, Times New Roman, serif"',
    );
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
  }
}

console.log(
  `Normalized Reiki insert palette and typography in ${changed}/${files.length} HTML sources.`,
);
