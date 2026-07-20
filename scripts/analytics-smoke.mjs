import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = 3025;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9343;
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
    nextId += 1; pending.set(nextId, { resolve, reject });
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: `${BASE_URL}/?utm_source=smoke&utm_medium=automated&utm_campaign=analytics` });
  await wait(700);

  const checks = [];
  const check = (name, value) => { checks.push({ name, value: Boolean(value) }); };
  const googleBeforeConsent = () => requests.filter((url) => /googletagmanager\.com|google-analytics\.com/i.test(url));
  check("cookie banner is visible before a choice", await evaluate("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
  check("no Google analytics request before consent", googleBeforeConsent().length === 0);
  check("UTM is not persisted before consent", await evaluate("!localStorage.getItem('eh_first_touch_v1')"));
  check("cookie controls are touch-sized", await evaluate("[...document.querySelectorAll('.eh-consent__button')].every((node) => node.getBoundingClientRect().height >= 44)"));

  await evaluate("document.querySelector('[data-eh-consent=\"essential_only\"]').click()")
  await wait(100);
  check("essential-only choice persists", await evaluate("localStorage.getItem('eh_consent_v2') === 'essential_only'"));
  check("reject keeps Google requests blocked", googleBeforeConsent().length === 0);
  await evaluate("document.querySelector('.eh-cookie-settings').click()")
  check("footer settings reopens banner", await evaluate("Boolean(document.querySelector('.eh-consent:not([hidden])'))"));
  await evaluate("document.querySelector('[data-eh-consent=\"analytics_granted\"]').click()")
  await wait(250);
  check("analytics choice persists", await evaluate("localStorage.getItem('eh_consent_v2') === 'analytics_granted'"));
  check("exactly one GTM script is appended after consent", await evaluate("document.querySelectorAll('script[data-eh-gtm]').length === 1"));
  check("UTM persists after consent", await evaluate("JSON.parse(localStorage.getItem('eh_first_touch_v1')).source === 'smoke'"));
  await evaluate("window.ehAnalytics.track('telegram_click', { link_label: 'hello@example.com', page_path: '/' })");
  check("PII-like event value is removed", await evaluate("!window.dataLayer.filter((item) => item?.event === 'telegram_click').at(-1)?.link_label"));
  await evaluate("window.ehAnalytics.track('telegram_click', { link_label: '@username', page_path: '/' })");
  check("Telegram username is removed from event value", await evaluate("!window.dataLayer.filter((item) => item?.event === 'telegram_click').at(-1)?.link_label"));
  check("mobile page has no horizontal overflow", await evaluate("document.documentElement.scrollWidth <= innerWidth + 2"));

  await send("Page.navigate", { url: `${BASE_URL}/pervyi-shag.html` });
  await wait(400);
  const buttons = await evaluate("({ territory: document.querySelector('[data-start-territory]')?.outerHTML || '' })");
  check("navigator entry control is present", Boolean(buttons.territory));
  await evaluate("document.querySelector('[data-start-territory]').click(); document.querySelector('[data-start-condition]').click(); document.querySelector('[data-start-diagnostic]').click()");
  await wait(150);
  check("navigator_start fires once", await evaluate("window.dataLayer.filter((item) => item?.event === 'navigator_start').length === 1"));
  check("navigator_complete fires once", await evaluate("window.dataLayer.filter((item) => item?.event === 'navigator_complete').length === 1"));

  const failures = checks.filter((check) => !check.value);
  for (const check of checks) console.log(`${check.value ? "PASS" : "FAIL"} ${check.name}`);
  console.log(`Analytics smoke: ${checks.length} checks, ${failures.length} failure(s).`);
  process.exitCode = failures.length ? 1 : 0;
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  server.kill();
  const tempRoot = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  if (path.resolve(profile).toLowerCase().startsWith(tempRoot)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Chrome can hold a short-lived lock on Windows. */ }
  }
}
