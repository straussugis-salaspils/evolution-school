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
const consentTemplate = fs.readFileSync(path.join(root, "gtm", "evolution-house-consent-mode-v2.tpl"), "utf8");
const container = fs.readFileSync(path.join(root, "gtm", "evolution-house-container.json"), "utf8");
const errors = [];
const templateSection = (name, next) => {
  const start = consentTemplate.indexOf(`___${name}___`);
  const end = consentTemplate.indexOf(`___${next}___`);
  if (start < 0 || end < 0 || end <= start) return null;
  return consentTemplate.slice(start + name.length + 6, end).trim();
};
for (const [name, next] of [["INFO", "TEMPLATE_PARAMETERS"], ["TEMPLATE_PARAMETERS", "SANDBOXED_JS_FOR_WEB_TEMPLATE"], ["WEB_PERMISSIONS", "TESTS"]]) {
  const section = templateSection(name, next);
  if (!section) errors.push(`Consent Mode template: missing ${name} section`);
  else {
    try { JSON.parse(section); } catch { errors.push(`Consent Mode template: invalid JSON in ${name}`); }
  }
}
try { JSON.parse(container); } catch { errors.push("GTM container: invalid JSON"); }
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const styles = (html.match(/\/cookie-consent\.css/g) || []).length;
  const scripts = (html.match(/\/analytics\.js/g) || []).length;
  if (styles !== 1 || scripts !== 1) errors.push(`${relative}: analytics includes ${styles}/${scripts}, expected 1/1`);
  if (/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|\bfbq\s*\(|\bttq\./i.test(html)) errors.push(`${relative}: direct analytics or pixel code is not allowed`);
}
for (const key of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
  if (!new RegExp(`${key}: 'denied'`).test(consentTemplate)) errors.push(`Consent Mode template: ${key} is not denied by default`);
}
for (const eventName of ["generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete", "telegram_click", "program_cta_click", "payment_click", "outbound_click"]) {
  if (!analytics.includes(`"${eventName}"`)) errors.push(`analytics.js: missing ${eventName}`);
}
if (!analytics.includes("if (gtmLoaded || !allowed()) return false")) errors.push("analytics.js: GTM is not guarded by consent");
if (!analytics.includes("const PII")) errors.push("analytics.js: PII guard is missing");
for (const api of ["setDefaultConsentState", "updateConsentState", "getCookieValues", "callInWindow"]) {
  if (!consentTemplate.includes(`require('${api}')`)) errors.push(`Consent Mode template: missing ${api} API`);
}
if (!consentTemplate.includes("Consent Initialization")) errors.push("Consent Mode template: missing Consent Initialization instruction");
if (/\bgtag\s*\(/.test(analytics) || analytics.includes("window.gtag")) errors.push("analytics.js: consent must not be sent through gtag()");
if (container.includes("consentSettings")) errors.push("GTM container: additional consent checks must not be set on GA4 tags");
if (/\bgtag\s*\(/.test(consentTemplate)) errors.push("Consent Mode template: gtag() is not allowed");
console.log(`Analytics audit: ${htmlFiles.length} HTML files, ${errors.length} error(s).`);
for (const error of errors) console.error(`ERROR ${error}`);
process.exitCode = errors.length ? 1 : 0;
