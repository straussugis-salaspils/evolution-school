import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.ANALYTICS_PRODUCTION_BASE_URL || "https://evolution.yourbalancerestored.com";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9344;
const ROUTES = ["/", "/pervyi-shag.html", "/684291-off-switch-training/"];
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
  let failures = 0;
  for (const route of ROUTES) {
    urls.length = 0;
    await send("Network.clearBrowserCache");
    await send("Page.navigate", { url: `${BASE_URL}${route}` });
    await wait(850);
    const banner = await value("Boolean(document.querySelector('.eh-consent:not([hidden])'))");
    const settings = await value("Boolean(document.querySelector('.eh-cookie-settings'))");
    const gtm = urls.filter((url) => /googletagmanager\.com|google-analytics\.com/i.test(url));
    const overflow = await value("document.documentElement.scrollWidth > innerWidth + 2");
    const ok = banner && settings && gtm.length === 0 && !overflow;
    failures += ok ? 0 : 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${route}: banner=${banner}, settings=${settings}, google-before-consent=${gtm.length}, overflow=${overflow}`);
  }
  console.log(`Production analytics smoke: ${ROUTES.length} routes, ${failures} failure(s).`);
  process.exitCode = failures ? 1 : 0;
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  const root = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  if (path.resolve(profile).toLowerCase().startsWith(root)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Chrome can retain the profile briefly. */ }
  }
}
