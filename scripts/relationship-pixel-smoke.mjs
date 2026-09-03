import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../relationship-test/relationship-test.js", import.meta.url),
  "utf8",
);
const html = fs.readFileSync(
  new URL("../relationship-test/index.html", import.meta.url),
  "utf8",
);

assert.match(html, /googletagmanager\.com\/gtag\/js\?id=AW-11049454372/);
assert.match(html, /gtag\('config', 'AW-11049454372'\)/);
assert.match(html, /AW-11049454372\/2-zbCNPu3-wcEKSW5ZQp/);

async function runClickSmoke({ query, pathname, landingId }) {
  const elements = new Map();
  const timers = [];
  const fetchCalls = [];
  const googleConversions = [];
  let assignedUrl = null;

  function element(id) {
    const node = {
      dataset: {},
      href: "",
      innerHTML: "",
      textContent: "",
      listeners: {},
      addEventListener(type, listener) {
        this.listeners[type] = listener;
      },
    };
    elements.set(id, node);
    return node;
  }

  element("hero-title");
  element("hero-lead");
  element("telegram-cta-label");
  const cta = element("telegram-cta");
  element("telegram-next-step");

  const sessionStorage = new Map();
  const document = {
    body: { dataset: {} },
    head: { append(node) { this.lastScript = node; } },
    referrer: "",
    title: "",
    visibilityState: "visible",
    createElement() { return {}; },
    getElementById(id) { return elements.get(id); },
  };
  const window = {
    crypto: { randomUUID: () => "pixel-smoke-session" },
    document,
    location: {
      href: `https://example.test${pathname}${query}`,
      pathname,
      search: query,
      assign(url) { assignedUrl = url; },
    },
    sessionStorage: {
      getItem(key) { return sessionStorage.get(key) || null; },
      setItem(key, value) { sessionStorage.set(key, value); },
    },
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
    gtag_report_conversion(url) {
      googleConversions.push(url);
      assignedUrl = url;
      return false;
    },
  };
  const context = {
    console,
    document,
    fetch: async (...args) => {
      fetchCalls.push(args);
      if (String(args[0]).includes("relationship-attribution-click")) {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return {
        ok: true,
        json: async () => ({
          token: "pixel-smoke-token",
          telegram_url: "https://t.me/+pixelSmokeInvite",
          source_code: "meta_pixel-smoke-token",
          is_meta: true,
        }),
      };
    },
    location: window.location,
    Math,
    Promise,
    URL,
    URLSearchParams,
    window,
  };

  vm.runInNewContext(source, context, { filename: "relationship-test.js" });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.head.lastScript.src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.deepEqual(Array.from(window.fbq.queue[0]), ["init", "944041014863402"]);
  assert.deepEqual(Array.from(window.fbq.queue[1]), ["track", "PageView"]);
  assert.equal(cta.href, "https://t.me/+pixelSmokeInvite");
  assert.equal(cta.textContent, "");
  assert.equal(elements.get("telegram-cta-label").textContent, "Перейти в Telegram и ПРОЙТИ ТЕСТ");
  assert.match(elements.get("telegram-next-step").innerHTML, /Telegram-канал/);
  assert.match(elements.get("telegram-next-step").innerHTML, /Архетипы в Отношениях/);
  assert.equal(fetchCalls.length, 1, "group-first landing must create an attributed invite");

  let prevented = false;
  cta.listeners.click({ preventDefault() { prevented = true; } });

  assert.equal(prevented, true);
  const conversion = window.fbq.queue[2];
  assert.equal(conversion[0], "track");
  assert.equal(conversion[1], "CompleteRegistration");
  assert.equal(conversion[2].landing_id, landingId);
  assert.equal(conversion[2].funnel_version, "group_first_v1");
  assert.match(conversion[3].eventID, new RegExp(`^group_join_click_${landingId}_`));
  assert.equal(fetchCalls.length, 2, "attributed CTA click must be recorded");
  assert.deepEqual(googleConversions, ["https://t.me/+pixelSmokeInvite"]);
  assert.equal(timers.length, 0);
  assert.equal(assignedUrl, "https://t.me/+pixelSmokeInvite");
}

await runClickSmoke({
  query: "?test=b",
  pathname: "/relationship-test/",
  landingId: "relationship_challenges",
});
await runClickSmoke({
  query: "?test=c",
  pathname: "/relationship-test/",
  landingId: "stay_or_leave",
});

console.log("Relationship Meta Pixel and Google Ads smoke: 2 landing variants passed.");
