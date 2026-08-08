import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = new Set([".git", "node_modules", "visual-package", "artifacts", "docs", "gtm"]);
const sourceOnlyDirectories = new Set([
  path.join("assets", "reiki-articles", "inserts"),
]);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && skip.has(entry.name)) return [];
  const absolute = path.join(dir, entry.name);
  if (
    entry.isDirectory() &&
    sourceOnlyDirectories.has(path.relative(root, absolute))
  ) {
    return [];
  }
  return entry.isDirectory() ? walk(absolute) : [absolute];
});
const htmlFiles = walk(root).filter((file) => (
  file.endsWith(".html") &&
  !/^yandex_[a-f0-9]+\.html$/i.test(path.basename(file))
));
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
const errors = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const styles = (html.match(/\/cookie-consent\.css/g) || []).length;
  const scripts = (html.match(/\/analytics\.js/g) || []).length;
  if (styles !== 1 || scripts !== 1) errors.push(`${relative}: analytics includes ${styles}/${scripts}, expected 1/1`);
  if (/GTM-WNV2B49K|\/gtm\.js\?|<noscript[^>]*>[^<]*<iframe/i.test(html)) errors.push(`${relative}: GTM code must not be present`);
  if (/google-analytics\.com|mc\.yandex\.ru|connect\.facebook\.net|\bym\s*\(|\bfbq\s*\(|\bttq\./i.test(html)) errors.push(`${relative}: direct third-party analytics or pixel code is not allowed`);
}

for (const eventName of ["generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete", "telegram_click", "program_cta_click", "payment_click", "outbound_click", "article_view", "related_article_click", "cta_impression", "product_click", "lead_start", "lead_submit", "ai_referral_visit"]) {
  if (!analytics.includes(`"${eventName}"`)) errors.push(`analytics.js: missing ${eventName}`);
}
for (const fragment of [
  'const GA4_ID = "G-RSEE3PKS5V"',
  "const METRIKA_ID = 111024711",
  'https://www.googletagmanager.com/gtag/js?id=',
  "https://mc.yandex.ru/metrika/tag.js",
  'script.dataset.ehGa4 = "true"',
  'script.dataset.ehMetrika = "true"',
  "window.dataLayer = window.dataLayer || []",
  'consentDefault();',
  'consentUpdate(true);',
  'gtag("config", GA4_ID, { send_page_view: true })',
  'window.ym(METRIKA_ID, "init"',
  'window.ym(METRIKA_ID, "reachGoal", eventName, parameters)',
  "clickmap: false",
  "trackLinks: false",
  "webvisor: false",
  'consentUpdate(analytics);',
  'clearGoogleAnalyticsCookies();',
  "const yandexLoaded = loadYandexMetrika();",
  'if (allowed() && ga4Loaded && typeof window.gtag === "function")',
  "Чтобы нужное находилось быстрее",
  "По этим данным мы упрощаем навигацию",
  '>Разрешить</button>',
  '>Google без cookies</button>',
]) {
  if (!analytics.includes(fragment)) errors.push(`analytics.js: missing analytics-layer requirement: ${fragment}`);
}
if (!/loadGoogleTag\(\);\s*loadYandexMetrika\(\);/.test(analytics)) {
  errors.push("analytics.js: Google and Yandex loaders must both run during initialization");
}
if (!analytics.includes("if (ga4Loaded) return false")) errors.push("analytics.js: Google tag must load in denied cookieless mode before consent");
if (/if \(ga4Loaded \|\| !allowed\(\)\) return false/.test(analytics)) errors.push("analytics.js: Basic Consent Mode gate is still blocking Google before consent");
if (!analytics.includes("if (metrikaLoaded) return false")) errors.push("analytics.js: Yandex Metrika must load exactly once on every visit");
if (/metrikaLoaded\s*\|\|\s*!allowed\(\)|allowed\(\)\s*\?\s*loadYandexMetrika/.test(analytics)) errors.push("analytics.js: Yandex Metrika must not be gated by the Google analytics choice");
if (/if \(!allowed\(\) \|\| !EVENTS\.has\(eventName\)\)/.test(analytics)) errors.push("analytics.js: custom events must continue to Yandex before the Google analytics choice");
if (/panel\.innerHTML\s*=\s*'[^']*Яндекс Метрика/.test(analytics)) errors.push("analytics.js: the Google choice panel must not mention Yandex Metrika");
if (/panel\.innerHTML\s*=\s*'[^']*рекламного отслеживания/.test(analytics)) errors.push("analytics.js: the removed advertising-tracking copy must not return");
for (const key of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
  if (!analytics.includes(`${key}: analytics ? "granted" : "denied"`) && key === "analytics_storage") errors.push("analytics.js: analytics_storage consent state is missing");
  if (key !== "analytics_storage" && !analytics.includes(`${key}: "denied"`)) errors.push(`analytics.js: ${key} must remain denied`);
}
if (/GTM-WNV2B49K|loadGtm|ehAddConsentListener|data-eh-gtm|\/gtm\.js\?/i.test(analytics)) errors.push("analytics.js: GTM runtime code must not be present");
if (/clickmap:\s*true|webvisor:\s*true|\becommerce\s*:/i.test(analytics)) errors.push("analytics.js: disallowed Yandex Metrika feature is enabled");
if (!analytics.includes("const PII")) errors.push("analytics.js: PII guard is missing");
for (const source of ["chatgpt", "perplexity", "copilot", "claude", "gemini", "grok", "deepseek", "mistral", "meta_ai"]) {
  if (!analytics.includes(`"${source}"`)) errors.push(`analytics.js: ${source} referral detection is missing`);
}
if (!analytics.includes('track("ai_referral_visit"')) errors.push("analytics.js: AI referral event dispatch is missing");

console.log(`Analytics audit: ${htmlFiles.length} HTML files, ${errors.length} error(s).`);
for (const error of errors) console.error(`ERROR ${error}`);
process.exitCode = errors.length ? 1 : 0;
