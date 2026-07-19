import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = Number(process.env.ANALYTICS_PRODUCTION_DEBUG_PORT || 9343);
const routes = ["/", "/pervyi-shag.html", "/684291-off-switch-training/"];
const base = "https://evolution.yourbalancerestored.com";
const vendors = /googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|analytics\.tiktok\.com/i;
if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evolution-house-prod-analytics-"));
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
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);

  for (const route of routes) {
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url: `${base}${route}` });
    await Promise.race([loaded, wait(8000)]);
    await wait(250);
  }
  const vendorRequests = requests.filter((url) => vendors.test(url));
  if (vendorRequests.length) throw new Error(`Unexpected production analytics/pixel requests: ${vendorRequests.join(", ")}`);
  console.log(`Production analytics smoke: ${routes.length} routes, ${requests.length} network requests, 0 analytics/pixel vendor requests.`);
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  const safeTempRoot = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  const resolvedProfile = path.resolve(profile).toLowerCase();
  if (resolvedProfile.startsWith(safeTempRoot)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Windows may keep a short-lived Chrome lock. */ }
  }
}
