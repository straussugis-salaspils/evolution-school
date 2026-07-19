import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.SEO_SMOKE_BASE_URL || "http://127.0.0.1:3022";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CHROME_DEBUG_PORT || 9337);
const ROUTES = [
  "/",
  "/napravleniya.html",
  "/off-switch-method.html",
  "/reiki/",
  "/urovni-zhizni/",
];
const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "mobile-360", width: 360, height: 800, mobile: true },
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
];

if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found: ${CHROME}`);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evolution-house-seo-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const endpoint = `http://127.0.0.1:${PORT}`;
let socket;

try {
  let version;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) { version = await response.json(); break; }
    } catch { /* Chrome is starting. */ }
    await wait(125);
  }
  if (!version) throw new Error("Chrome DevTools endpoint did not start");

  const targetResponse = await fetch(`${endpoint}/json/new?about:blank`, { method: "PUT" });
  const target = await targetResponse.json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const events = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      return message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
    const waiters = events.get(message.method);
    if (waiters?.length) waiters.shift()(message.params);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((resolve) => {
    events.set(method, [...(events.get(method) || []), resolve]);
  });

  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `globalThis.__ehSmokeErrors = [];
      globalThis.__ehSmokeMetrics = { lcp: 0, cls: 0 };
      addEventListener('error', (event) => globalThis.__ehSmokeErrors.push(String(event.message || event.error || 'window error')));
      addEventListener('unhandledrejection', (event) => globalThis.__ehSmokeErrors.push(String(event.reason || 'unhandled rejection')));
      try { new PerformanceObserver((list) => { const entries = list.getEntries(); globalThis.__ehSmokeMetrics.lcp = entries.at(-1)?.startTime || 0; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
      try { new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) globalThis.__ehSmokeMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}`,
  });
  const results = [];
  for (const viewport of VIEWPORTS) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    for (const route of ROUTES) {
      const loaded = once("Page.loadEventFired");
      await send("Page.navigate", { url: `${BASE_URL}${route}` });
      await Promise.race([loaded, wait(8000)]);
      await wait(250);
      const evaluated = await send("Runtime.evaluate", {
        returnByValue: true,
        expression: `(() => ({
          title: document.title,
          innerWidth: window.innerWidth,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
          h1: document.querySelectorAll('h1').length,
          brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src),
          runtimeErrors: globalThis.__ehSmokeErrors || [],
          metrics: globalThis.__ehSmokeMetrics || { lcp: 0, cls: 0 },
          overflowingInteractive: [...document.querySelectorAll('a,button,input,select,textarea')].filter((node) => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            const visible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.01;
            const intersectsViewport = rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight;
            const insideHorizontalScroller = (() => {
              let parent = node.parentElement;
              while (parent) {
                const overflowX = getComputedStyle(parent).overflowX;
                if ((overflowX === 'auto' || overflowX === 'scroll') && parent.scrollWidth > parent.clientWidth) return true;
                parent = parent.parentElement;
              }
              return false;
            })();
            return visible && intersectsViewport && !insideHorizontalScroller && (rect.right > window.innerWidth + 2 || rect.left < -2);
          }).map((node) => {
            const rect = node.getBoundingClientRect();
            return { tag: node.tagName, className: node.className, text: node.textContent.trim().slice(0, 60), left: Math.round(rect.left), right: Math.round(rect.right) };
          })
        }))()`,
      });
      const value = evaluated.result.value;
      results.push({ viewport: viewport.name, route, ...value });
    }
  }

  let failures = 0;
  for (const result of results) {
    const problems = [];
    if (!result.title) problems.push("missing title");
    if (result.h1 !== 1) problems.push(`H1=${result.h1}`);
    if (result.scrollWidth > result.innerWidth + 2) problems.push(`horizontal overflow ${result.scrollWidth}px > ${result.innerWidth}px`);
    if (result.brokenImages.length) problems.push(`${result.brokenImages.length} broken image(s)`);
    if (result.runtimeErrors.length) problems.push(`${result.runtimeErrors.length} runtime error(s)`);
    if (result.overflowingInteractive.length) problems.push(`${result.overflowingInteractive.length} overflowing interactive element(s): ${JSON.stringify(result.overflowingInteractive)}`);
    if (problems.length) failures += 1;
    console.log(`${problems.length ? "FAIL" : "PASS"} ${result.viewport} ${result.route} LCP=${Math.round(result.metrics.lcp)}ms CLS=${result.metrics.cls.toFixed(3)}${problems.length ? `: ${problems.join(", ")}` : ""}`);
  }
  console.log(`Smoke test: ${results.length} page/viewport checks, ${failures} failures.`);
  process.exitCode = failures ? 1 : 0;
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  const safeTempRoot = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  const resolvedProfile = path.resolve(profile).toLowerCase();
  if (resolvedProfile.startsWith(safeTempRoot)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Windows may keep a short-lived Chrome lock. */ }
  }
}
