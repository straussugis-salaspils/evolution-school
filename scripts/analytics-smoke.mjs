import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = 3025;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9343;
const GA4_ID = "G-RSEE3PKS5V";
if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found: ${CHROME}`);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evolution-house-analytics-"));
const server = spawn(process.execPath, ["scripts/static-server.mjs"], {
  cwd: ROOT, stdio: "ignore", windowsHide: true, env: { ...process.env, PORT: String(PORT) },
});
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "about:blank",
], { stdio: "ignore", windowsHide: true });

let socket;
try {
  let version;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (response.ok) { version = await response.json(); break; }
    } catch { /* Chrome is still starting. */ }
    await wait(100);
  }
  if (!version) throw new Error("Chrome DevTools endpoint did not start");
  const target = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const requests = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
    if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    nextId += 1; pending.set(nextId, { resolve, reject }); socket.send(JSON.stringify({ id: nextId, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  const navigate = async (url) => { requests.length = 0; await send("Page.navigate", { url }); await wait(650); };
  const googleRequests = () => requests.filter((url) => /googletagmanager\.com|google-analytics\.com/i.test(url));
  const collectRequests = () => requests.filter((url) => /\/g\/collect|\/collect\?/i.test(url));
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate(`${BASE_URL}/?utm_source=smoke&utm_medium=automated&utm_campaign=analytics`);

  const checks = [];
  const check = (name, value) => { checks.push({ name, value: Boolean(value) }); };
  const gaScript = "document.querySelectorAll('script[data-eh-ga4]').length";
  const gaCookies = "!/(?:^|;\\s*)_(?:ga|gid)(?:_|=)/i.test(document.cookie)";

  check("cookie banner is visible before a choice", await evaluate("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
  check("gtag.js is absent before a choice", await evaluate(`${gaScript} === 0 && typeof window.gtag === 'undefined' && typeof window.dataLayer === 'undefined'`));
  check("no Google analytics request before consent", googleRequests().length === 0);
  check("no analytics cookie before consent", await evaluate(gaCookies));
  check("UTM is not persisted before consent", await evaluate("!localStorage.getItem('eh_first_touch_v1')"));
  check("cookie controls are touch-sized", await evaluate("[...document.querySelectorAll('.eh-consent__button')].every((node) => node.getBoundingClientRect().height >= 44)"));

  await evaluate("document.querySelector('[data-eh-consent=\"essential_only\"]').click()");
  await wait(100);
  check("essential-only choice persists", await evaluate("localStorage.getItem('eh_consent_v2') === 'essential_only'"));
  check("essential-only choice is mirrored in the consent cookie", await evaluate("document.cookie.includes('eh_consent_v2=essential_only')"));
  check("reject keeps Google requests blocked", googleRequests().length === 0);
  check("reject keeps gtag.js absent", await evaluate(`${gaScript} === 0 && typeof window.gtag === 'undefined'`));
  await navigate(`${BASE_URL}/?after=essential-only`);
  check("gtag.js remains absent after an essential-only refresh", await evaluate(`${gaScript} === 0 && typeof window.gtag === 'undefined'`));
  check("essential-only refresh creates no Google requests", googleRequests().length === 0);
  check("essential-only refresh creates no analytics cookies", await evaluate(gaCookies));

  await evaluate("document.querySelector('.eh-cookie-settings').click()");
  check("footer settings reopens banner", await evaluate("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
  await evaluate("document.querySelector('[data-eh-consent=\"analytics_granted\"]').click()");
  await wait(300);
  check("analytics choice persists", await evaluate("localStorage.getItem('eh_consent_v2') === 'analytics_granted'"));
  check("analytics choice is mirrored in the consent cookie", await evaluate("document.cookie.includes('eh_consent_v2=analytics_granted')"));
  check("exactly one direct Google tag is appended after consent", await evaluate(`${gaScript} === 1`));
  check("direct Google tag uses the approved measurement ID", await evaluate(`document.querySelector('script[data-eh-ga4]')?.src.includes('${GA4_ID}')`));
  check("Consent Mode defaults precede the granted update", await evaluate("window.dataLayer?.[0]?.[0] === 'consent' && window.dataLayer?.[0]?.[1] === 'default' && Object.values(window.dataLayer?.[0]?.[2] || {}).every((value) => value === 'denied') && window.dataLayer?.[1]?.[0] === 'consent' && window.dataLayer?.[1]?.[1] === 'update' && window.dataLayer?.[1]?.[2]?.analytics_storage === 'granted' && ['ad_storage','ad_user_data','ad_personalization'].every((key) => window.dataLayer?.[1]?.[2]?.[key] === 'denied')"));
  check("one GA4 config command creates one page_view", await evaluate(`window.dataLayer.filter((item) => item?.[0] === 'config' && item?.[1] === '${GA4_ID}').length === 1`));
  check("no duplicate direct Google tag requests", requests.filter((url) => /googletagmanager\.com\/gtag\/js/i.test(url)).length <= 1);
  check("first-touch attribution persists after consent", await evaluate("Boolean(JSON.parse(localStorage.getItem('eh_first_touch_v1')).source)"));

  await evaluate("window.ehAnalytics.track('telegram_click', { link_label: 'hello@example.com', page_path: '/' })");
  check("PII-like event value is removed", await evaluate("!window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'telegram_click').at(-1)?.[2]?.link_label"));
  await evaluate("window.ehAnalytics.track('telegram_click', { link_label: '@username', page_path: '/' })");
  check("Telegram username is removed from event value", await evaluate("!window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'telegram_click').at(-1)?.[2]?.link_label"));
  await evaluate("window.ehAnalytics.track('program_cta_click', { cta_label: 'Safe CTA', page_path: '/' }); window.ehAnalytics.track('payment_click', { program_name: 'Safe', value: 300, currency: 'EUR', page_path: '/' }); window.ehAnalytics.track('outbound_click', { destination_domain: 'example.org', page_path: '/' })");
  check("custom events are dispatched exactly once with safe parameters", await evaluate("['program_cta_click','payment_click','outbound_click'].every((eventName) => window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === eventName).length === 1)"));

  await navigate(`${BASE_URL}/pervyi-shag.html`);
  check("saved permission initializes one direct tag", await evaluate(`${gaScript} === 1 && window.dataLayer.filter((item) => item?.[0] === 'config' && item?.[1] === '${GA4_ID}').length === 1`));
  check("saved permission preserves Consent Mode order", await evaluate("window.dataLayer?.[0]?.[1] === 'default' && window.dataLayer?.[1]?.[1] === 'update' && window.dataLayer?.[1]?.[2]?.analytics_storage === 'granted'"));
  check("navigator entry control is present", await evaluate("Boolean(document.querySelector('[data-start-territory]'))"));
  await evaluate("document.querySelector('[data-start-territory]').click(); document.querySelector('[data-start-condition]').click(); document.querySelector('[data-start-diagnostic]').click()");
  await wait(150);
  check("navigator_start fires once", await evaluate("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'navigator_start').length === 1"));
  check("navigator_complete fires once", await evaluate("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'navigator_complete').length === 1"));

  const revoke = await evaluate("(() => { window.ehAnalytics.setConsent('essential_only'); return { denied: window.dataLayer?.filter((item) => item?.[0] === 'consent' && item?.[1] === 'update').at(-1)?.[2], eventBlocked: window.ehAnalytics.track('program_cta_click', { cta_label: 'test' }) === false }; })()");
  check("revoke updates all four Consent Mode v2 states to denied", Object.values(revoke.denied || {}).length === 4 && Object.values(revoke.denied || {}).every((value) => value === "denied"));
  check("revoke blocks subsequent analytics events", revoke.eventBlocked);
  await navigate(`${BASE_URL}/?after=revoke`);
  check("gtag.js is absent after revocation and refresh", await evaluate(`${gaScript} === 0 && typeof window.gtag === 'undefined'`));
  check("rejection persists after revocation", await evaluate("localStorage.getItem('eh_consent_v2') === 'essential_only'"));
  check("revoke refresh creates no Google requests", googleRequests().length === 0);
  check("revoke refresh creates no analytics cookies", await evaluate(gaCookies));
  check("mobile page has no horizontal overflow", await evaluate("document.documentElement.scrollWidth <= innerWidth + 2"));

  const failures = checks.filter((check) => !check.value);
  for (const check of checks) console.log(`${check.value ? "PASS" : "FAIL"} ${check.name}`);
  console.log(`Analytics smoke: ${checks.length} checks, ${failures.length} failure(s).`);
  if (collectRequests().length > 1) { console.error(`ERROR duplicate GA4 collect requests: ${collectRequests().length}`); process.exitCode = 1; }
  else process.exitCode = failures.length ? 1 : 0;
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  server.kill();
  const tempRoot = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  if (path.resolve(profile).toLowerCase().startsWith(tempRoot)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Chrome can hold a short-lived lock on Windows. */ }
  }
}
