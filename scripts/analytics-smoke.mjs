import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sitePort = Number(process.env.ANALYTICS_SMOKE_PORT || 3024);
const debugPort = Number(process.env.ANALYTICS_CHROME_DEBUG_PORT || 9341);
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${sitePort}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await new Promise((resolve) => server.listen(sitePort, "127.0.0.1", resolve));
if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evolution-house-analytics-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "about:blank",
], { stdio: "ignore", windowsHide: true });

let socket;
try {
  const endpoint = `http://127.0.0.1:${debugPort}`;
  let version;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) { version = await response.json(); break; }
    } catch { /* Chrome is starting. */ }
    await wait(125);
  }
  if (!version) throw new Error("Chrome DevTools endpoint did not start");
  const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const events = new Map();
  const requests = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      return message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
    if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
    const waiters = events.get(message.method);
    if (waiters?.length) waiters.shift()(message.params);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((resolve) => events.set(method, [...(events.get(method) || []), resolve]));
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;

  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: `http://127.0.0.1:${sitePort}/?consent-preview=1&utm_source=instagram&utm_medium=organic_social&utm_campaign=analytics_smoke` });
  await Promise.race([loaded, wait(8000)]);
  await wait(250);

  const initial = await evaluate(`(() => ({
    bannerVisible: Boolean(document.querySelector('.eh-consent:not([hidden])')),
    gtmScripts: document.querySelectorAll('script[src*="googletagmanager.com"]').length,
    firstTouch: window.ehAnalytics?.getFirstTouch?.(),
    storedFirstTouch: localStorage.getItem('eh_first_touch_v1'),
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth + 2,
    settingsTargets: [...document.querySelectorAll('.eh-consent__button,.eh-cookie-settings')].every((node) => {
      const rect = node.getBoundingClientRect(); return rect.width >= 44 && rect.height >= 44;
    })
  }))()`);
  if (!initial.bannerVisible) throw new Error("Consent preview banner is not visible");
  if (initial.gtmScripts !== 0) throw new Error("GTM loaded without a configured ID");
  if (initial.firstTouch?.source !== "instagram" || initial.firstTouch?.campaign !== "analytics_smoke") throw new Error("First-touch UTM data was not stored correctly");
  if (initial.storedFirstTouch !== null) throw new Error("First-touch analytics data was persisted before consent");
  if (initial.overflow) throw new Error("Consent UI causes horizontal overflow at 390px");
  if (!initial.settingsTargets) throw new Error("Consent controls are smaller than 44x44px");

  await evaluate(`document.querySelector('[data-eh-consent="essential_only"]').click()`);
  const rejected = await evaluate(`({ stored: localStorage.getItem('eh_consent_v1'), hidden: document.querySelector('.eh-consent').hidden })`);
  if (rejected.stored !== "essential_only" || !rejected.hidden) throw new Error("Reject consent flow failed");

  await evaluate(`document.querySelector('.eh-cookie-settings').click()`);
  await evaluate(`document.querySelector('[data-eh-consent="analytics_granted"]').click()`);
  const accepted = await evaluate(`(() => {
    window.ehAnalytics.track('telegram_click', { link_location: 'content', link_label: 'hello@example.com', destination_type: 'telegram', page_path: location.pathname });
    const item = [...dataLayer].reverse().find((entry) => entry?.event === 'telegram_click');
    return { stored: localStorage.getItem('eh_consent_v1'), event: item, gtmScripts: document.querySelectorAll('script[src*="googletagmanager.com"]').length };
  })()`);
  if (accepted.stored !== "analytics_granted") throw new Error("Accept consent flow failed");
  if (!accepted.event || accepted.event.link_label) throw new Error("Event layer or PII guard failed");
  if (accepted.gtmScripts !== 0) throw new Error("GTM loaded even though the ID is absent");

  const delegated = await evaluate(`(() => {
    window.dataLayer = dataLayer.filter((entry) => !['telegram_click','payment_click','program_cta_click','outbound_click'].includes(entry?.event));
    const definitions = [
      ['a', { href: 'https://t.me/evolution_house' }, 'Telegram'],
      ['button', { 'data-gc-product': 'off-switch-training' }, 'Получить тренинг'],
      ['a', { href: '/napravleniya.html', class: 'button' }, 'Посмотреть программу'],
      ['a', { href: 'https://example.com/resource' }, 'Внешний ресурс']
    ];
    for (const [tag, attrs, label] of definitions) {
      const node = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => key === 'class' ? node.className = value : node.setAttribute(key, value));
      node.textContent = label;
      node.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); });
      document.body.appendChild(node);
      node.click();
      node.remove();
    }
    return ['telegram_click','payment_click','program_cta_click','outbound_click'].map((name) => ({
      name,
      events: dataLayer.filter((entry) => entry?.event === name)
    }));
  })()`);
  for (const item of delegated) {
    if (item.events.length !== 1) throw new Error(`${item.name} fired ${item.events.length} time(s), expected once`);
  }
  const paymentEvent = delegated.find((item) => item.name === "payment_click").events[0];
  if (paymentEvent.value !== 300 || paymentEvent.currency !== "EUR" || paymentEvent.payment_provider !== "GetCourse") {
    throw new Error("Known payment metadata was not emitted correctly");
  }

  const navigatorLoaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: `http://127.0.0.1:${sitePort}/pervyi-shag.html?consent-preview=1` });
  await Promise.race([navigatorLoaded, wait(8000)]);
  await wait(250);
  const navigatorEvents = await evaluate(`(async () => {
    const click = async (selector) => {
      const node = document.querySelector(selector);
      if (!node) return false;
      node.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return true;
    };
    await click('[data-start-territory]');
    await click('[data-start-condition]');
    await click('[data-start-diagnostic]');
    const gender = document.querySelector('[data-start-gender]');
    if (gender && !gender.closest('[hidden]')) await click('[data-start-gender]');
    return {
      starts: dataLayer.filter((entry) => entry?.event === 'navigator_start'),
      completes: dataLayer.filter((entry) => entry?.event === 'navigator_complete'),
      firstTouch: window.ehAnalytics.getFirstTouch()
    };
  })()`);
  if (navigatorEvents.starts.length !== 1 || navigatorEvents.completes.length !== 1) throw new Error("Navigator events did not fire exactly once");
  if (navigatorEvents.firstTouch?.source !== "instagram") throw new Error("First-touch source was overwritten during internal navigation");
  if (requests.some((url) => /googletagmanager\.com|google-analytics\.com/i.test(url))) throw new Error("A Google analytics request was made without a configured ID");

  console.log("Analytics smoke: consent flows, delegated events, Navigator events, UTM first-touch, PII guard, touch targets and no-ID vendor blocking passed.");
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  server.close();
  const safeTempRoot = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  const resolvedProfile = path.resolve(profile).toLowerCase();
  if (resolvedProfile.startsWith(safeTempRoot)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Windows may keep a short-lived Chrome lock. */ }
  }
}
