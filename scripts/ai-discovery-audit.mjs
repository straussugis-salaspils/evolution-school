import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
const key = "461ad9efbb3d475437cc1bba9b0ac0d47f3374a408514a77";

for (const agent of ["OAI-SearchBot", "GPTBot", "Claude-SearchBot", "Claude-User", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
  if (!robots.includes(`User-agent: ${agent}`)) errors.push(`robots.txt: missing ${agent}`);
}
if (!analytics.includes('"ai_referral_visit"')) errors.push("analytics.js: missing ai_referral_visit");
for (const source of ["chatgpt", "perplexity", "copilot", "claude", "gemini", "grok", "deepseek", "mistral", "meta_ai"]) {
  if (!analytics.includes(`"${source}"`)) errors.push(`analytics.js: missing ${source} referral detection`);
}
if (!fs.existsSync(path.join(root, `${key}.txt`))) errors.push("IndexNow key file is missing");
const citationPages = [
  "arhetipy/chto-eto/index.html",
  "biblioteka/perehody/kak-nachat-zhizn-zanovo/index.html",
  "biblioteka/reiki/chto-takoe-reiki/index.html",
];
for (const page of citationPages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  if (!html.includes("data-ai-summary")) errors.push(`${page}: missing semantic answer summary`);
  if (!html.includes("#svetlana-strauss")) errors.push(`${page}: missing stable author entity`);
}

console.log(`AI discovery audit: ${errors.length} error(s).`);
for (const error of errors) console.error(`ERROR ${error}`);
process.exitCode = errors.length ? 1 : 0;
