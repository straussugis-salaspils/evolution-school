import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.PAYMENT_SMOKE_BASE_URL || "http://127.0.0.1:3024";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CHROME_PORT = Number(process.env.PAYMENT_SMOKE_CHROME_PORT || 9342);
const SERVER_PORT = new URL(BASE_URL).port || "3024";
const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const SCENARIOS = [
  { name: "lightness", route: "/lightness/", opener: "[onclick=\"openModal()\"]", modal: ".modal-overlay.open", stripe: "https://buy.stripe.com/3cI4grh2d1s42nl42r9Zm00" },
  { name: "strength", route: "/strength/", opener: "[onclick=\"openSingleModal()\"]", modal: ".modal-overlay.is-open", stripe: "https://buy.stripe.com/4gM00beU5b2Egeb2Yn9Zm02" },
  { name: "two-week bundle", route: "/lightness/", opener: "[onclick=\"openBundleModal()\"]", modal: ".modal-overlay.open", stripe: "https://buy.stripe.com/6oU8wH3bn9YA5zx6az9Zm03" },
  { name: "Reiki I", route: "/reiki/", opener: "[data-gc-payment-target=\"reiki-1-payment-modal\"]", modal: ".gc-payment-modal:not([hidden])", stripe: "https://buy.stripe.com/00wbIT13f8Uw7HF1Uj9Zm04" },
  { name: "Reiki II", route: "/reiki/reiki-2.html", opener: "[data-gc-payment-target=\"reiki-2-payment-modal\"]", modal: ".gc-payment-modal:not([hidden])", stripe: "https://buy.stripe.com/5kQ7sD3bn3Acfa78iH9Zm05" },
  { name: "Off-Switch", route: "/684291-off-switch-training/", opener: "[data-off-switch-checkout]", modal: ".gc-payment-modal:not([hidden])", stripe: "https://buy.stripe.com/6oUeV5bHT0o05zxcyX9Zm07" },
  { name: "quantum single", route: "/915804-kvantovaya-aktivaciya/", opener: "[data-gc-product=\"quantum-single\"]", modal: ".gc-payment-modal:not([hidden])", stripe: "https://buy.stripe.com/6oUaEP13f5Ik8LJ9mL9Zm08" },
  { name: "quantum 100", route: "/915804-kvantovaya-aktivaciya/", opener: "[data-gc-product=\"quantum-100\"]", modal: ".gc-payment-modal:not([hidden])", stripe: "https://buy.stripe.com/8x2fZ9cLXfiU1jh9mL9Zm09" },
  { name: "Navigator", route: "/urovni-zhizni/personalnyj-marshrut/", opener: "[data-gc-product=\"navigator-svetlana\"]", modal: ".gc-payment-modal:not([hidden])", stripe: "https://buy.stripe.com/4gM14ffY9daMfa7buT9Zm0a" },
  { name: "wellness day", mode: "getcourse-only", route: "/482917-zhizn-bez-nadryva/", opener: ".primary-cta--hero[data-wellness-payment-open]", modal: ".wellness-payment:not([hidden])" },
  { name: "love tea meeting", mode: "getcourse-only", route: "/818826-vypem-za-lyubov-chayu/", opener: "[data-love-payment-open]", modal: ".love-payment:not([hidden])" },
];

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
];

if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found: ${CHROME}`);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evolution-house-payment-"));
const server = spawn(process.execPath, ["scripts/static-server.mjs"], {
  cwd: ROOT,
  env: { ...process.env, PORT: SERVER_PORT },
  stdio: "ignore",
  windowsHide: true,
});
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${CHROME_PORT}`,
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
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) break;
    } catch { /* Static server is starting. */ }
    await wait(100);
  }

  const endpoint = `http://127.0.0.1:${CHROME_PORT}`;
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
  const requestedUrls = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      return message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
    if (message.method === "Network.requestWillBeSent" && message.params?.request?.url) {
      requestedUrls.push(message.params.request.url);
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
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
    return result.result.value;
  };

  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `globalThis.__paymentSmokeErrors = [];
      addEventListener('error', (event) => globalThis.__paymentSmokeErrors.push(String(event.message || event.error || 'window error')));
      addEventListener('unhandledrejection', (event) => globalThis.__paymentSmokeErrors.push(String(event.reason || 'unhandled rejection')));`,
  });

  const results = [];
  for (const viewport of VIEWPORTS) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    for (const scenario of SCENARIOS) {
      requestedUrls.length = 0;
      const loaded = once("Page.loadEventFired");
      await send("Page.navigate", { url: `${BASE_URL}${scenario.route}` });
      await Promise.race([loaded, wait(8000)]);
      await wait(180);

      const initial = await evaluate(`(() => ({
        opener: Boolean(document.querySelector(${JSON.stringify(scenario.opener)})),
        scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
        innerWidth: window.innerWidth
      }))()`);
      const initialGetCourseRequests = requestedUrls.filter((url) => url.includes("smarttraining.getcourse.ru")).length;
      const opened = await evaluate(`(() => {
        const opener = document.querySelector(${JSON.stringify(scenario.opener)});
        if (!opener) return false;
        opener.click();
        return true;
      })()`);
      await wait(100);

      const modalState = await evaluate(`(() => {
        const modal = document.querySelector(${JSON.stringify(scenario.modal)});
        const primary = modal?.querySelector('.gc-payment-choice__primary, .payment-choice .btn--primary');
        const secondary = modal?.querySelector('[data-gc-payment-russian], .payment-choice__russian');
        const merchant = modal?.querySelector('.gc-payment-choice__merchant, .payment-choice__merchant');
        const primaryColor = primary ? getComputedStyle(primary).color : '';
        if (secondary) secondary.click();
        return {
          modal: Boolean(modal),
          primary: primary?.href || '',
          secondary: Boolean(secondary),
          merchant: merchant?.textContent?.trim() || '',
          primaryColor,
          hasPaymentChoice: Boolean(modal?.querySelector('.gc-payment-choice, .payment-choice'))
        };
      })()`);
      await wait(650);

      const finalState = await evaluate(`(() => ({
        runtimeErrors: globalThis.__paymentSmokeErrors || [],
        scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
        innerWidth: window.innerWidth,
        widgetIframe: Boolean(document.querySelector(${JSON.stringify(scenario.modal)})?.querySelector('iframe'))
      }))()`);
      const finalGetCourseRequests = requestedUrls.filter((url) => url.includes("smarttraining.getcourse.ru")).length;

      const problems = [];
      if (!initial.opener || !opened) problems.push("payment CTA missing");
      if (initialGetCourseRequests !== 0) problems.push("GetCourse loaded before payment click");
      if (!modalState.modal) problems.push("payment modal did not open");
      if (scenario.mode === "getcourse-only") {
        if (modalState.primary || modalState.secondary || modalState.hasPaymentChoice) problems.push("unexpected payment-provider choice");
        if (finalGetCourseRequests < 1) problems.push("GetCourse did not load after payment click");
        if (!finalState.widgetIframe) problems.push("GetCourse widget iframe missing");
      } else {
        if (modalState.primary !== scenario.stripe) problems.push(`wrong Stripe URL: ${modalState.primary || "missing"}`);
        if (modalState.primary.includes("/test_")) problems.push("Sandbox URL present");
        if (!modalState.secondary) problems.push("Russian-card option missing");
        if (!modalState.merchant.includes("Resulta Consulting FZ-LLC")) problems.push("merchant disclosure missing");
        if (modalState.primaryColor !== "rgb(255, 255, 255)") problems.push(`primary button text is not white: ${modalState.primaryColor}`);
        if (finalGetCourseRequests < 1) problems.push("GetCourse did not load after secondary choice");
      }
      if (finalState.runtimeErrors.length) problems.push(`${finalState.runtimeErrors.length} runtime error(s)`);
      if (initial.scrollWidth > initial.innerWidth + 2 || finalState.scrollWidth > finalState.innerWidth + 2) problems.push("horizontal overflow");
      results.push({ viewport: viewport.name, scenario: scenario.name, problems });
    }
  }

  let failures = 0;
  for (const result of results) {
    if (result.problems.length) failures += 1;
    console.log(`${result.problems.length ? "FAIL" : "PASS"} ${result.viewport} ${result.scenario}${result.problems.length ? `: ${result.problems.join(", ")}` : ""}`);
  }
  console.log(`Payment smoke: ${results.length} checks, ${failures} failures.`);
  process.exitCode = failures ? 1 : 0;
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  server.kill();
  const safeTempRoot = `${path.resolve(os.tmpdir())}${path.sep}`.toLowerCase();
  const resolvedProfile = path.resolve(profile).toLowerCase();
  if (resolvedProfile.startsWith(safeTempRoot)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Chrome may briefly retain a lock. */ }
  }
}
