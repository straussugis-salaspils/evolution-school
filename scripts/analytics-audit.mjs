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
const htmlFiles = walk(root).filter((file) => file.endsWith(".html"));
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
const errors = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const styles = (html.match(/\/cookie-consent\.css/g) || []).length;
  const scripts = (html.match(/\/analytics\.js/g) || []).length;
  if (styles !== 1 || scripts !== 1) errors.push(`${relative}: analytics includes ${styles}/${scripts}, expected 1/1`);
  if (/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|\bfbq\s*\(|\bttq\./i.test(html)) errors.push(`${relative}: direct analytics or pixel code is not allowed`);
}
for (const key of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
  if (!new RegExp(`${key}: "denied"`).test(analytics)) errors.push(`analytics.js: ${key} is not denied by default`);
}
for (const eventName of ["generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete", "telegram_click", "program_cta_click", "payment_click", "outbound_click"]) {
  if (!analytics.includes(`"${eventName}"`)) errors.push(`analytics.js: missing ${eventName}`);
}
if (!analytics.includes("if (gtmLoaded || !allowed()) return false")) errors.push("analytics.js: GTM is not guarded by consent");
if (!analytics.includes("const PII")) errors.push("analytics.js: PII guard is missing");
console.log(`Analytics audit: ${htmlFiles.length} HTML files, ${errors.length} error(s).`);
for (const error of errors) console.error(`ERROR ${error}`);
process.exitCode = errors.length ? 1 : 0;
