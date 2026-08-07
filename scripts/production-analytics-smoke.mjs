import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.ANALYTICS_PRODUCTION_BASE_URL || "https://evolution.yourbalancerestored.com";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9344;
const ROUTES = ["/", "/pervyi-shag.html", "/684291-off-switch-training/"];
const GA4_ID = "G-RSEE3PKS5V";
const METRIKA_ID = 111024711;
if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found: ${CHROME}`);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evolution-house-production-analytics-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "about:blank",
], { stdio: "ignore", windowsHide: true });
let socket;
try {
  let version;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { const response = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (response.ok) { version = await response.json(); break; } } catch { /* Chrome is starting. */ }
    await wait(100);
  }
  if (!version) throw new Error("Chrome DevTools endpoint did not start");
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  const urls = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
    if (message.method === "Network.requestWillBeSent") urls.push(message.params.request.url);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { id += 1; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const value = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  const checks = [];
  const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
  const gaScript = "document.querySelectorAll('script[data-eh-ga4]').length";
  const metrikaScript = "document.querySelectorAll('script[data-eh-metrika]').length";
  const gaCookies = "!/(?:^|;\\s*)_(?:ga|gid)(?:_|=)/i.test(document.cookie)";
  const metrikaCookies = "!/(?:^|;\\s*)(?:_ym_|_yasc=|yuid=|ymex=)/i.test(document.cookie)";
  const google = () => urls.filter((url) => /googletagmanager\.com|google-analytics\.com/i.test(url));
  const yandex = () => urls.filter((url) => /mc\.yandex\.ru/i.test(url));
  let failures = 0;
  let skipped = 0;
  for (const route of ROUTES) {
    urls.length = 0;
    await send("Network.clearBrowserCache");
    await send("Page.navigate", { url: `${BASE_URL}${route}` });
    await wait(850);
    const protectedPreview = await value("document.title === 'Login – Vercel'");
    if (protectedPreview && new URL(BASE_URL).hostname.endsWith(".vercel.app")) {
      skipped += 1;
      console.log(`SKIP ${route}: Vercel deployment protection requires an authenticated browser session.`);
      continue;
    }
    const banner = await value("Boolean(document.querySelector('.eh-consent:not([hidden])'))");
    const settings = await value("Boolean(document.querySelector('.eh-cookie-settings'))");
    const overflow = await value("document.documentElement.scrollWidth > innerWidth + 2");
    const advancedConsentReady = await value(`${gaScript} === 1 && ${metrikaScript} === 0 && typeof window.gtag === 'function' && Array.isArray(window.dataLayer) && window.dataLayer?.[0]?.[0] === 'consent' && window.dataLayer?.[0]?.[1] === 'default' && window.dataLayer?.[0]?.[2]?.analytics_storage === 'denied' && typeof window.ym === 'undefined'`);
    const noCookies = await value(`${gaCookies} && ${metrikaCookies}`);
    const ok = banner && settings && google().length > 0 && yandex().length === 0 && advancedConsentReady && noCookies && !overflow;
    failures += ok ? 0 : 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${route}: banner=${banner}, settings=${settings}, google-cookieless=${google().length}, yandex-before-consent=${yandex().length}, advanced-consent=${advancedConsentReady}, analytics-cookies-absent=${noCookies}, overflow=${overflow}`);
  }
  if (skipped === 0) {
    urls.length = 0;
    await send("Page.navigate", { url: `${BASE_URL}/?analytics_production_smoke=1` });
    await wait(850);
    check("production banner is visible before consent", await value("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
    await value("document.querySelector('[data-eh-consent=\"analytics_granted\"]')?.click()");
    await wait(550);
    check("production loads one direct GA4 tag after consent", await value(`${gaScript} === 1 && document.querySelector('script[data-eh-ga4]')?.src.includes('${GA4_ID}')`));
    check("production loads one Yandex Metrika tag after consent", await value(`${metrikaScript} === 1 && document.querySelector('script[data-eh-metrika]')?.src === 'https://mc.yandex.ru/metrika/tag.js' && window.ehAnalytics.metrikaId === ${METRIKA_ID}`));
    check("production requests Yandex Metrika only after consent", yandex().some((url) => /\/metrika\/tag\.js/i.test(url)));
    check("production loads the Yandex Metrika tag only once", yandex().filter((url) => /\/metrika\/tag\.js/i.test(url)).length === 1);
    check("production queues denied default before config and the grant after it", await value("(() => { const defaultIndex = window.dataLayer.findIndex((item) => item?.[0] === 'consent' && item?.[1] === 'default'); const configIndex = window.dataLayer.findIndex((item) => item?.[0] === 'config'); const updateIndex = window.dataLayer.findIndex((item) => item?.[0] === 'consent' && item?.[1] === 'update' && item?.[2]?.analytics_storage === 'granted'); const update = window.dataLayer?.[updateIndex]?.[2]; return defaultIndex === 0 && configIndex > defaultIndex && updateIndex > configIndex && ['ad_storage','ad_user_data','ad_personalization'].every((key) => update?.[key] === 'denied'); })()"));
    check("production queues one GA4 config/page_view", await value(`window.dataLayer.filter((item) => item?.[0] === 'config' && item?.[1] === '${GA4_ID}').length === 1`));
    await value("window.__ehYmCalls = []; window.__ehOriginalYm = window.ym; window.ym = (...args) => { window.__ehYmCalls.push(args); return window.__ehOriginalYm(...args); }; window.ehAnalytics.track('program_cta_click', { program_name: 'production_smoke', cta_label: 'analytics_check', cta_location: 'automated', page_path: location.pathname })");
    check("production dispatches one consented custom event", await value("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'program_cta_click').length === 1"));
    check("production dispatches one matching Yandex reachGoal", await value(`window.__ehYmCalls.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'reachGoal' && args?.[2] === 'program_cta_click').length === 1`));
    const revoke = await value("(() => { window.ehAnalytics.setConsent('essential_only'); return window.dataLayer?.filter((item) => item?.[0] === 'consent' && item?.[1] === 'update').at(-1)?.[2]; })()");
    check("production revocation denies all Consent Mode v2 states", Object.values(revoke || {}).length === 4 && Object.values(revoke || {}).every((state) => state === "denied"));
    await wait(900);
    urls.length = 0;
    await send("Page.navigate", { url: `${BASE_URL}/?analytics_production_smoke=revoked` });
    await wait(850);
    check("production keeps Google cookieless and Yandex absent after revocation", await value(`${gaScript} === 1 && ${metrikaScript} === 0 && typeof window.gtag === 'function' && Array.isArray(window.dataLayer) && window.dataLayer?.[0]?.[2]?.analytics_storage === 'denied' && typeof window.ym === 'undefined'`));
    check("production clears GA cookies after revocation", await value(gaCookies));
    const remainingMetrikaCookies = await value("document.cookie.split(';').map((entry) => entry.trim().split('=')[0]).filter((name) => /^(?:_ym_|_yasc$|yuid$|ymex$)/i.test(name))");
    check("production clears Yandex Metrika cookies after revocation", remainingMetrikaCookies.length === 0);
    if (remainingMetrikaCookies.length) {
      const { cookies } = await send("Network.getAllCookies");
      const details = cookies.filter((item) => remainingMetrikaCookies.includes(item.name)).map((item) => `${item.name}@${item.domain}${item.path}`);
      console.error(`Remaining Yandex Metrika cookies: ${details.join(", ")}`);
    }
    check("production sends cookieless Google requests after revocation", google().length > 0);
    check("production sends no Yandex request after revocation", yandex().length === 0);
  }
  for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`);
  const checkFailures = checks.filter((item) => !item.pass).length;
  console.log(`Production analytics smoke: ${ROUTES.length} fresh routes, ${failures + checkFailures} failure(s), ${skipped} protected-preview skip(s).`);
  process.exitCode = failures || checkFailures ? 1 : 0;
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  const root = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  if (path.resolve(profile).toLowerCase().startsWith(root)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Chrome can retain the profile briefly. */ }
  }
}
