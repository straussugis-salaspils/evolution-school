import assert from "node:assert/strict";
import vm from "node:vm";

import { RELATIONSHIP_FUNNEL_V2_PAGE } from "../api/_relationship-funnel-v2-page.js";

const script = RELATIONSHIP_FUNNEL_V2_PAGE.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "dashboard script must be present");

function element() {
  return {
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
    disabled: false,
    hidden: false,
    innerHTML: "",
    setAttribute() {},
    textContent: "",
    value: "",
  };
}

const elements = new Map([
  "dashboard",
  "test-activity",
  "meta-snapshot",
  "updated",
  "period",
  "refresh",
  "channel-joined",
  "channel-subscribers",
  "invite-tracking",
  "untracked-visits",
  "untracked-clicks",
  "date-from",
  "date-to",
  "ranges",
  "date-form",
].map((id) => [id, element()]));

const funnel = (landing, cta, joined, started, completed) => [
  { key: "landing", count: landing },
  { key: "cta", count: cta },
  { key: "group_joined", count: joined },
  { key: "test_started", count: started },
  { key: "completed", count: completed },
];

const data = {
  generated_at: "2026-09-05T00:00:00Z",
  channel_joined_total: 3,
  channel_subscribers_current: 148,
  individual_invites_started_at: "2026-09-03T21:10:00Z",
  untracked_landing_visits: 0,
  untracked_cta_clicks: 0,
  by_landing: [
    { landing_id: "relationship_challenges", funnel: funnel(106, 11, 5, 2, 1) },
    { landing_id: "youtube_tired_function", funnel: funnel(9, 2, 1, 1, 1) },
    { landing_id: "stay_or_leave", funnel: funnel(12, 4, 1, 1, 1) },
  ],
  by_landing_source: [
    { landing_id: "relationship_challenges", source: "google", funnel: funnel(100, 10, 4, 1, 1) },
    { landing_id: "relationship_challenges", source: "youtube", funnel: funnel(1, 0, 0, 0, 0) },
    { landing_id: "relationship_challenges", source: "meta", funnel: funnel(5, 1, 1, 1, 0) },
    { landing_id: "youtube_tired_function", source: "direct", funnel: funnel(4, 0, 0, 0, 0) },
    { landing_id: "youtube_tired_function", source: "youtube", funnel: funnel(3, 1, 1, 1, 1) },
    { landing_id: "youtube_tired_function", source: "meta", funnel: funnel(2, 1, 0, 0, 0) },
    { landing_id: "stay_or_leave", source: "meta", funnel: funnel(8, 2, 1, 1, 1) },
    { landing_id: "stay_or_leave", source: " facebook ", funnel: funnel(3, 2, 0, 0, 0) },
    { landing_id: "stay_or_leave", source: "telegram", funnel: funnel(1, 0, 0, 0, 0) },
  ],
  test_activity: [],
};

const context = {
  Date,
  Intl,
  URL,
  console,
  document: {
    getElementById(id) {
      assert.ok(elements.has(id), `unexpected element lookup: ${id}`);
      return elements.get(id);
    },
    querySelectorAll() {
      return [];
    },
  },
  fetch: async () => ({ ok: true, json: async () => data }),
  location: { pathname: "/18-18-18/relationship-statistics/" },
};

vm.runInNewContext(script, context, { filename: "relationship-funnel-v2-dashboard.js" });
await new Promise((resolve) => setImmediate(resolve));

const html = elements.get("dashboard").innerHTML;
const relationshipStart = html.indexOf("Почему мне плохо");
const youtubeLandingStart = html.indexOf("Уставшая функция · YouTube");
const relationshipSection = html.slice(relationshipStart, youtubeLandingStart);
const youtubeLandingSection = html.slice(youtubeLandingStart);

assert.ok(relationshipStart >= 0 && youtubeLandingStart > relationshipStart);
assert.match(relationshipSection, /Почему мне плохо[\s\S]*?<strong>106<\/strong>/);
assert.match(relationshipSection, /Facebook \/ Instagram[\s\S]*?<strong>5<\/strong>/);
assert.match(relationshipSection, /YouTube[\s\S]*?<strong>101<\/strong>[\s\S]*?<strong>10<\/strong>/);
assert.match(youtubeLandingSection, /Уставшая функция · YouTube[\s\S]*?<strong>9<\/strong>[\s\S]*?<strong>2<\/strong>/);
assert.match(youtubeLandingSection, /Facebook \/ Instagram[\s\S]*?<strong>2<\/strong>/);
assert.match(youtubeLandingSection, /YouTube \/ Google[\s\S]*?<strong>3<\/strong>[\s\S]*?<strong>1<\/strong>/);
assert.match(youtubeLandingSection, /Прямой \/ не определён[\s\S]*?<strong>4<\/strong>/);
assert.match(elements.get("invite-tracking").textContent, /4 сентября.*00:10/);

const rows = [...html.matchAll(/<tr class="([^"]+)">([\s\S]*?)<\/tr>/g)].map(([, type, content]) => ({
  type, counts: [...content.matchAll(/<strong>(\d+)<\/strong>/g)].map((match) => Number(match[1])),
}));
assert.equal(rows.length, 15);
for (let start = 0; start < rows.length; start += 5) {
  rows[start].counts.forEach((total, step) => {
    assert.equal(rows.slice(start + 1, start + 5).reduce((sum, row) => sum + row.counts[step], 0), total);
  });
}
assert.deepEqual(rows[1].counts, [11, 4, 1, 1, 1]);

const pending = [];
context.fetch = (url) => new Promise((resolve) => pending.push({url, resolve}));
vm.runInNewContext(script, context);
const selectRange = (range) => elements.get("ranges").listeners.click({target:{closest:()=>({dataset:{range}})}});
selectRange("yesterday");
const reply = (request, count) => {
  const url = new URL(request.url, "https://example.test");
  return {ok:true, json:async()=>({...data, date_from:url.searchParams.get("date_from"), date_to:url.searchParams.get("date_to"), channel_joined_total:count})};
};
pending[1].resolve(reply(pending[1], 20));
await new Promise((resolve) => setImmediate(resolve));
pending[0].resolve(reply(pending[0], 99));
await new Promise((resolve) => setImmediate(resolve));
assert.equal(elements.get("channel-joined").textContent, 20);
assert.equal(elements.get("refresh").disabled, false);
selectRange("7d");
assert.equal(elements.get("channel-joined").textContent, "—");
pending[2].resolve({ok:false,status:502});
await new Promise((resolve) => setImmediate(resolve));
assert.match(elements.get("dashboard").innerHTML, /Не удалось загрузить/);
assert.equal(elements.get("channel-joined").textContent, "—");

console.log("Dashboard audit: all source totals, Riga dates, stale responses and loading errors passed.");
