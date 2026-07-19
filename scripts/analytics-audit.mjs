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
const files = walk(root);
const htmlFiles = files.filter((file) => file.toLowerCase().endsWith(".html"));
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
const config = fs.readFileSync(path.join(root, "analytics-config.js"), "utf8");
const errors = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const configCount = (html.match(/\/analytics-config\.js/g) || []).length;
  const scriptCount = (html.match(/\/analytics\.js/g) || []).length;
  const styleCount = (html.match(/\/cookie-consent\.css/g) || []).length;
  if (configCount !== 1 || scriptCount !== 1 || styleCount !== 1) {
    errors.push(`${rel}: shared analytics includes are ${configCount}/${scriptCount}/${styleCount}, expected 1/1/1`);
  }
  if (/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|\bfbq\s*\(|\bttq\./i.test(html)) {
    errors.push(`${rel}: contains a direct analytics/pixel integration outside the shared layer`);
  }
}

const requiredConsent = ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"];
for (const key of requiredConsent) {
  if (!new RegExp(`${key}: \\\"denied\\\"`).test(analytics)) errors.push(`analytics.js: missing default denied for ${key}`);
}
if (!analytics.includes("if (!VALID_GTM_ID || gtmLoaded || !hasAnalyticsConsent())")) {
  errors.push("analytics.js: GTM loading is not guarded by both ID validity and analytics consent");
}
if (!analytics.includes("PII_PATTERN") || !analytics.includes("ALLOWED_EVENTS")) {
  errors.push("analytics.js: event allowlist or PII guard is missing");
}
for (const eventName of ["generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete", "telegram_click", "program_cta_click", "payment_click", "outbound_click"]) {
  if (!analytics.includes(`\"${eventName}\"`)) errors.push(`analytics.js: missing event contract ${eventName}`);
}
if (!/gtmId:\s*\"\"/.test(config) && !/gtmId:\s*\"GTM-[A-Z0-9]+\"/.test(config)) {
  errors.push("analytics-config.js: GTM ID is neither empty nor valid");
}
if (/GTM-X+|G-X+/i.test(config)) errors.push("analytics-config.js: placeholder identifier found");

console.log(`Analytics audit: ${htmlFiles.length} HTML files, ${errors.length} error(s).`);
for (const error of errors) console.error(`ERROR ${error}`);
process.exitCode = errors.length ? 1 : 0;
