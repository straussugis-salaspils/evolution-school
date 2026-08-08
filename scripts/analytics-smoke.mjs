import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = Number(process.env.ANALYTICS_SMOKE_PORT || 3035);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9343;
const GA4_ID = "G-RSEE3PKS5V";
const METRIKA_ID = 111024711;
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
    nextId += 1;
    pending.set(nextId, {
      resolve,
      reject: (error) => reject(new Error(`${method}: ${error.message}; params=${JSON.stringify(params)}`)),
    });
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  const navigate = async (url) => { requests.length = 0; await send("Page.navigate", { url }); await wait(650); };
  const googleRequests = () => requests.filter((url) => /googletagmanager\.com|google-analytics\.com/i.test(url));
  const yandexRequests = () => requests.filter((url) => /mc\.yandex\.ru/i.test(url));
  const collectRequests = () => requests.filter((url) => /\/g\/collect|\/collect\?/i.test(url));
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Network.setBlockedURLs", { urls: ["*://mc.yandex.ru/metrika/tag.js*"] });
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate(`${BASE_URL}/?utm_source=smoke&utm_medium=automated&utm_campaign=analytics`);

  const checks = [];
  const check = (name, value) => { checks.push({ name, value: Boolean(value) }); };
  const gaScript = "document.querySelectorAll('script[data-eh-ga4]').length";
  const metrikaScript = "document.querySelectorAll('script[data-eh-metrika]').length";
  const gaCookies = "!/(?:^|;\\s*)_(?:ga|gid)(?:_|=)/i.test(document.cookie)";

  check("cookie banner is visible before a choice", await evaluate("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
  check("Google choice uses the approved copy and action order", await evaluate("(() => { const copy = document.querySelector('.eh-consent__copy')?.textContent || ''; const buttons = [...document.querySelectorAll('.eh-consent__button')]; return copy.includes('Чтобы нужное находилось быстрее') && copy.includes('Google Analytics') && copy.includes('По этим данным мы упрощаем навигацию') && !copy.includes('рекламного отслеживания') && !copy.includes('Яндекс') && buttons[0]?.textContent.trim() === 'Разрешить' && buttons[1]?.textContent.trim() === 'Google без cookies'; })()"));
  check("Google permission is visually dominant", await evaluate("(() => { const primary = document.querySelector('.eh-consent__button--primary'); const secondary = document.querySelector('.eh-consent__button--secondary'); const primaryStyle = getComputedStyle(primary); const secondaryStyle = getComputedStyle(secondary); return primaryStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && secondaryStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && Number.parseFloat(primaryStyle.fontSize) > Number.parseFloat(secondaryStyle.fontSize); })()"));
  for (const viewport of [{ width: 375, height: 667 }, { width: 414, height: 896 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 1000 }]) {
    await send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1, mobile: viewport.width < 768 });
    await wait(40);
    check(`Google choice fits ${viewport.width}px with touch-sized actions`, await evaluate("(() => { const rect = document.querySelector('.eh-consent').getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.width <= innerWidth && [...document.querySelectorAll('.eh-consent__button')].every((node) => node.getBoundingClientRect().height >= 44); })()"));
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  check("one Google tag is present before a choice", await evaluate(`${gaScript} === 1 && typeof window.gtag === 'function' && Array.isArray(window.dataLayer)`));
  check("Google sends cookieless requests before consent", googleRequests().length > 0);
  check("denied consent is queued before the Google config", await evaluate(`window.dataLayer?.[0]?.[0] === 'consent' && window.dataLayer?.[0]?.[1] === 'default' && Object.values(window.dataLayer?.[0]?.[2] || {}).length === 4 && Object.values(window.dataLayer?.[0]?.[2] || {}).every((value) => value === 'denied') && window.dataLayer.findIndex((item) => item?.[0] === 'config' && item?.[1] === '${GA4_ID}') > 0`));
  check("one Yandex Metrika tag is present before a choice", await evaluate(`${metrikaScript} === 1 && typeof window.ym === 'function'`));
  check("Yandex Metrika requests its standard tag before a choice", yandexRequests().some((url) => /\/metrika\/tag\.js/i.test(url)));
  check("Yandex Metrika initializes once before a choice", await evaluate(`window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'init').length === 1`));
  check("no Google Analytics cookie before consent", await evaluate(gaCookies));
  check("UTM is not persisted before consent", await evaluate("!localStorage.getItem('eh_first_touch_v1')"));
  check("cookie controls are touch-sized", await evaluate("[...document.querySelectorAll('.eh-consent__button')].every((node) => node.getBoundingClientRect().height >= 44)"));
  const beforeChoiceEvent = await evaluate(`(() => { const googleBefore = window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'navigator_complete').length; const yandexBefore = window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'reachGoal' && args?.[2] === 'navigator_complete').length; const sent = window.ehAnalytics.track('navigator_complete', { result_path: 'always_on_smoke', entry_page: location.pathname }); return { sent, googleDelta: window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'navigator_complete').length - googleBefore, yandexDelta: window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'reachGoal' && args?.[2] === 'navigator_complete').length - yandexBefore }; })()`);
  check("before-choice custom event goes to Yandex but not GA4", beforeChoiceEvent.sent && beforeChoiceEvent.googleDelta === 0 && beforeChoiceEvent.yandexDelta === 1);

  await evaluate("document.querySelector('[data-eh-consent=\"essential_only\"]').click()");
  await wait(100);
  check("essential-only choice persists", await evaluate("localStorage.getItem('eh_consent_v2') === 'essential_only'"));
  check("essential-only choice is mirrored in the consent cookie", await evaluate("document.cookie.includes('eh_consent_v2=essential_only')"));
  check("reject keeps Google in cookieless mode", googleRequests().length > 0);
  check("reject keeps one direct Google tag", await evaluate(`${gaScript} === 1 && typeof window.gtag === 'function'`));
  check("Google-only rejection keeps Yandex Metrika active", await evaluate(`${metrikaScript} === 1 && typeof window.ym === 'function'`));
  await navigate(`${BASE_URL}/?after=essential-only`);
  check("gtag.js remains present after an essential-only refresh", await evaluate(`${gaScript} === 1 && typeof window.gtag === 'function'`));
  check("essential-only refresh creates cookieless Google requests", googleRequests().length > 0);
  check("Yandex Metrika remains active after a Google-without-cookies refresh", await evaluate(`${metrikaScript} === 1 && typeof window.ym === 'function'`));
  check("essential-only refresh requests Yandex Metrika", yandexRequests().some((url) => /\/metrika\/tag\.js/i.test(url)));
  check("essential-only refresh creates no Google Analytics cookies", await evaluate(gaCookies));

  await evaluate("document.querySelector('.eh-cookie-settings').click()");
  check("footer settings reopens banner", await evaluate("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
  await evaluate("document.querySelector('[data-eh-consent=\"analytics_granted\"]').click()");
  await wait(300);
  check("analytics choice persists", await evaluate("localStorage.getItem('eh_consent_v2') === 'analytics_granted'"));
  check("analytics choice is mirrored in the consent cookie", await evaluate("document.cookie.includes('eh_consent_v2=analytics_granted')"));
  check("exactly one direct Google tag is appended after consent", await evaluate(`${gaScript} === 1`));
  check("direct Google tag uses the approved measurement ID", await evaluate(`document.querySelector('script[data-eh-ga4]')?.src.includes('${GA4_ID}')`));
  check("exactly one Yandex Metrika tag is appended after consent", await evaluate(`${metrikaScript} === 1`));
  check("Yandex Metrika uses the approved counter ID", await evaluate(`window.ehAnalytics.metrikaId === ${METRIKA_ID}`));
  check("Yandex Metrika tag uses mc.yandex.ru", await evaluate("document.querySelector('script[data-eh-metrika]')?.src === 'https://mc.yandex.ru/metrika/tag.js'"));
  check("Yandex Metrika initializes once with optional features disabled", await evaluate(`window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'init' && args?.[2]?.clickmap === false && args?.[2]?.trackLinks === false && args?.[2]?.webvisor === false).length === 1`));
  check("Consent Mode defaults precede config and the granted update follows it", await evaluate("(() => { const defaultIndex = window.dataLayer.findIndex((item) => item?.[0] === 'consent' && item?.[1] === 'default'); const configIndex = window.dataLayer.findIndex((item) => item?.[0] === 'config'); const updateIndex = window.dataLayer.findIndex((item) => item?.[0] === 'consent' && item?.[1] === 'update' && item?.[2]?.analytics_storage === 'granted'); const update = window.dataLayer?.[updateIndex]?.[2]; return defaultIndex === 0 && configIndex > defaultIndex && updateIndex > configIndex && ['ad_storage','ad_user_data','ad_personalization'].every((key) => update?.[key] === 'denied'); })()"));
  check("one GA4 config command creates one page_view", await evaluate(`window.dataLayer.filter((item) => item?.[0] === 'config' && item?.[1] === '${GA4_ID}').length === 1`));
  check("no duplicate direct Google tag requests", requests.filter((url) => /googletagmanager\.com\/gtag\/js/i.test(url)).length <= 1);
  check("no duplicate Yandex Metrika tag requests", yandexRequests().filter((url) => /\/metrika\/tag\.js/i.test(url)).length === 1);
  check("first-touch attribution persists after consent", await evaluate("Boolean(JSON.parse(localStorage.getItem('eh_first_touch_v1')).source)"));

  await evaluate("window.ehAnalytics.track('telegram_click', { link_label: 'hello@example.com', page_path: '/' })");
  check("PII-like event value is removed", await evaluate("!window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'telegram_click').at(-1)?.[2]?.link_label"));
  await evaluate("window.ehAnalytics.track('telegram_click', { link_label: '@username', page_path: '/' })");
  check("Telegram username is removed from event value", await evaluate("!window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'telegram_click').at(-1)?.[2]?.link_label"));
  await evaluate("window.ehAnalytics.track('program_cta_click', { cta_label: 'Safe CTA', page_path: '/' }); window.ehAnalytics.track('payment_click', { program_name: 'Safe', value: 300, currency: 'EUR', page_path: '/' }); window.ehAnalytics.track('outbound_click', { destination_domain: 'example.org', page_path: '/' })");
  check("custom events are dispatched exactly once with safe parameters", await evaluate("['program_cta_click','payment_click','outbound_click'].every((eventName) => window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === eventName).length === 1)"));
  check("custom events reach Yandex goals exactly once", await evaluate(`['program_cta_click','payment_click','outbound_click'].every((eventName) => window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'reachGoal' && args?.[2] === eventName).length === 1)`));

  await navigate(`${BASE_URL}/arhetipy/afina/`);
  check("article_view fires with the complete route contract", await evaluate("(() => { const event = window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'article_view').at(-1)?.[2]; return ['route_id','product_id','cta_variant','placement'].every((key) => Boolean(event?.[key])); })()"));
  await evaluate("document.querySelector('[data-article-product-cta]').scrollIntoView({ block: 'center' })");
  await wait(250);
  check("cta_impression fires after the CTA becomes visible", await evaluate("window.dataLayer.some((item) => item?.[0] === 'event' && item?.[1] === 'cta_impression')"));
  await evaluate("(() => { const node = document.querySelector('[data-related-route-id]'); node.addEventListener('click', (event) => event.preventDefault(), { once: true }); node.click(); })() ");
  check("related_article_click fires from an editorial graph link", await evaluate("window.dataLayer.some((item) => item?.[0] === 'event' && item?.[1] === 'related_article_click')"));
  const productHref = await evaluate("(() => { const node = document.querySelector('.article-product-cta a[data-product-id]'); if (!node) return ''; const href = node.href; node.addEventListener('click', (event) => event.preventDefault(), { once: true, capture: true }); node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return href; })() ");
  if (!productHref) throw new Error(`Article product href not found on ${await evaluate("location.href")}; body=${await evaluate("document.body?.className")}; ctas=${await evaluate("document.querySelectorAll('.article-product-cta').length")}; links=${await evaluate("document.querySelectorAll('a[data-product-id]').length")}`);
  check("product_click fires and saves route attribution", await evaluate("window.dataLayer.some((item) => item?.[0] === 'event' && item?.[1] === 'product_click') && Boolean(sessionStorage.getItem('eh_article_product_attribution_v1'))"));
  await navigate(productHref);
  await evaluate("(() => { const node = document.querySelector('.btn,.button,[class*=\"cta\"]'); if (!node) return false; node.addEventListener('click', (event) => event.preventDefault(), { once: true }); node.click(); return true; })() ");
  check("lead_start fires on the attributed product page", await evaluate("window.dataLayer.some((item) => item?.[0] === 'event' && item?.[1] === 'lead_start')"));
  await evaluate("document.dispatchEvent(new CustomEvent('eh:lead-success'))");
  check("lead_submit success hook fires with complete attribution", await evaluate("(() => { const event = window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'lead_submit').at(-1)?.[2]; return ['route_id','product_id','cta_variant','placement'].every((key) => Boolean(event?.[key])); })()"));

  await navigate(`${BASE_URL}/biblioteka/perehody/kak-ponyat-chego-ya-hochu/`);
  check("transition article exposes the P01 route contract", await evaluate("document.body.dataset.routeId === 'P01' && document.body.dataset.primaryProductId === 'mentoring' && document.body.dataset.ctaVariant === 'transition_bridge_v1'"));
  check("transition article_view fires with P01 attribution", await evaluate("(() => { const event = window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'article_view').at(-1)?.[2]; return event?.route_id === 'P01' && event?.product_id === 'mentoring' && event?.cta_variant === 'transition_bridge_v1'; })()"));
  await evaluate("document.querySelector('[data-article-product-cta]').scrollIntoView({ block: 'center' })");
  await wait(250);
  check("transition cta_impression carries P01", await evaluate("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'cta_impression').at(-1)?.[2]?.route_id === 'P01'"));
  await evaluate("(() => { const node = document.querySelector('[data-placement=\"related_materials\"]'); node.addEventListener('click', (event) => event.preventDefault(), { once: true }); node.click(); })() ");
  check("transition related_article_click carries source and destination", await evaluate("(() => { const event = window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'related_article_click').at(-1)?.[2]; return event?.route_id === 'P01' && Boolean(event?.related_route_id); })()"));
  const transitionProductHref = await evaluate("(() => { const node = document.querySelector('.article-product-cta__primary'); const href = node?.href || ''; node?.addEventListener('click', (event) => event.preventDefault(), { once: true, capture: true }); node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return href; })() ");
  check("transition product URL carries explicit attribution", /source=transition_article/.test(transitionProductHref) && /route_id=P01/.test(transitionProductHref));
  check("transition product_click carries P01", await evaluate("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'product_click').at(-1)?.[2]?.route_id === 'P01'"));

  await navigate(`${BASE_URL}/pervyi-shag.html`);
  check("saved permission initializes one direct tag", await evaluate(`${gaScript} === 1 && window.dataLayer.filter((item) => item?.[0] === 'config' && item?.[1] === '${GA4_ID}').length === 1`));
  check("saved permission initializes one Yandex Metrika tag", await evaluate(`${metrikaScript} === 1 && window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'init').length === 1`));
  check("saved permission preserves Consent Mode order", await evaluate("window.dataLayer?.[0]?.[1] === 'default' && window.dataLayer?.[1]?.[1] === 'update' && window.dataLayer?.[1]?.[2]?.analytics_storage === 'granted'"));
  check("navigator entry control is present", await evaluate("Boolean(document.querySelector('[data-start-territory]'))"));
  await evaluate("document.querySelector('[data-start-territory]').click(); document.querySelector('[data-start-condition]').click(); document.querySelector('[data-start-diagnostic]').click()");
  await wait(150);
  check("navigator_start fires once", await evaluate("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'navigator_start').length === 1"));
  check("navigator_complete fires once", await evaluate("window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'navigator_complete').length === 1"));

  const revoke = await evaluate(`(() => { window.ehAnalytics.setConsent('essential_only'); const googleBefore = window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'program_cta_click').length; const yandexBefore = window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'reachGoal' && args?.[2] === 'program_cta_click').length; const eventSent = window.ehAnalytics.track('program_cta_click', { cta_label: 'test' }); return { denied: window.dataLayer?.filter((item) => item?.[0] === 'consent' && item?.[1] === 'update').at(-1)?.[2], eventSent, googleBlocked: window.dataLayer.filter((item) => item?.[0] === 'event' && item?.[1] === 'program_cta_click').length === googleBefore, yandexGoal: window.ym.a.filter((args) => args?.[0] === ${METRIKA_ID} && args?.[1] === 'reachGoal' && args?.[2] === 'program_cta_click').length === yandexBefore + 1 }; })()`);
  check("revoke updates all four Consent Mode v2 states to denied", Object.values(revoke.denied || {}).length === 4 && Object.values(revoke.denied || {}).every((value) => value === "denied"));
  check("revoke blocks GA4 custom events while Yandex goals continue", revoke.eventSent && revoke.googleBlocked && revoke.yandexGoal);
  await navigate(`${BASE_URL}/?after=revoke`);
  check("gtag.js remains present in denied mode after revocation and refresh", await evaluate(`${gaScript} === 1 && typeof window.gtag === 'function'`));
  check("Yandex Metrika remains active after revocation and refresh", await evaluate(`${metrikaScript} === 1 && typeof window.ym === 'function'`));
  check("rejection persists after revocation", await evaluate("localStorage.getItem('eh_consent_v2') === 'essential_only'"));
  check("revoke refresh creates cookieless Google requests", googleRequests().length > 0);
  check("revoke refresh requests Yandex Metrika", yandexRequests().some((url) => /\/metrika\/tag\.js/i.test(url)));
  check("revoke refresh creates no Google Analytics cookies", await evaluate(gaCookies));
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
