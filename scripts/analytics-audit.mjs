import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = new Set([".git", "node_modules", "visual-package", "artifacts", "docs", "gtm"]);
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
  if (/GTM-WNV2B49K|\/gtm\.js\?|<noscript[^>]*>[^<]*<iframe/i.test(html)) errors.push(`${relative}: GTM code must not be present`);
  if (/google-analytics\.com|connect\.facebook\.net|\bfbq\s*\(|\bttq\./i.test(html)) errors.push(`${relative}: direct third-party analytics or pixel code is not allowed`);
}

for (const eventName of ["generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete", "telegram_click", "program_cta_click", "payment_click", "outbound_click"]) {
  if (!analytics.includes(`"${eventName}"`)) errors.push(`analytics.js: missing ${eventName}`);
}
for (const fragment of [
  'const GA4_ID = "G-RSEE3PKS5V"',
  'https://www.googletagmanager.com/gtag/js?id=',
  'script.dataset.ehGa4 = "true"',
  'consentDefault();',
  'consentUpdate(true);',
  'gtag("config", GA4_ID, { send_page_view: true })',
  'consentUpdate(false);',
  'clearAnalyticsCookies();',
  'if (!ga4Loaded || typeof window.gtag !== "function") return false',
]) {
  if (!analytics.includes(fragment)) errors.push(`analytics.js: missing direct-GA4 requirement: ${fragment}`);
}
for (const key of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
  if (!analytics.includes(`${key}: analytics ? "granted" : "denied"`) && key === "analytics_storage") errors.push("analytics.js: analytics_storage consent state is missing");
  if (key !== "analytics_storage" && !analytics.includes(`${key}: "denied"`)) errors.push(`analytics.js: ${key} must remain denied`);
}
if (/GTM-WNV2B49K|loadGtm|ehAddConsentListener|data-eh-gtm|\/gtm\.js\?/i.test(analytics)) errors.push("analytics.js: GTM runtime code must not be present");
if (!analytics.includes("const PII")) errors.push("analytics.js: PII guard is missing");

console.log(`Analytics audit: ${htmlFiles.length} HTML files, ${errors.length} error(s).`);
for (const error of errors) console.error(`ERROR ${error}`);
process.exitCode = errors.length ? 1 : 0;
