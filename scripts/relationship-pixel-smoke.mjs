import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../relationship-test/relationship-test.js", import.meta.url),
  "utf8",
);

function runClickSmoke({ query, pathname, landingId }) {
  const elements = new Map();
  const timers = [];
  const fetchCalls = [];
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
  };
  const context = {
    console,
    document,
    fetch: (...args) => { fetchCalls.push(args); },
    location: window.location,
    Math,
    Promise,
    URL,
    URLSearchParams,
    window,
  };

  vm.runInNewContext(source, context, { filename: "relationship-test.js" });

  assert.equal(document.head.lastScript.src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.deepEqual(Array.from(window.fbq.queue[0]), ["init", "944041014863402"]);
  assert.deepEqual(Array.from(window.fbq.queue[1]), ["track", "PageView"]);
  assert.equal(cta.href, "https://t.me/RelationshipArchetypes");
  assert.equal(fetchCalls.length, 0, "group-first landing must not call attribution API");

  let prevented = false;
  cta.listeners.click({ preventDefault() { prevented = true; } });

  assert.equal(prevented, true);
  const conversion = window.fbq.queue[2];
  assert.equal(conversion[0], "track");
  assert.equal(conversion[1], "CompleteRegistration");
  assert.equal(conversion[2].landing_id, landingId);
  assert.equal(conversion[2].funnel_version, "group_first_v1");
  assert.match(conversion[3].eventID, new RegExp(`^group_join_click_${landingId}_`));
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 220);
  timers[0].callback();
  assert.equal(assignedUrl, "https://t.me/RelationshipArchetypes");
}

runClickSmoke({
  query: "?test=b",
  pathname: "/relationship-test/",
  landingId: "relationship_challenges",
});
runClickSmoke({
  query: "?test=c",
  pathname: "/relationship-test/",
  landingId: "stay_or_leave",
});

console.log("Relationship Meta Pixel smoke: 2 landing variants passed.");
