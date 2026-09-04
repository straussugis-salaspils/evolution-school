import assert from "node:assert/strict";
import vm from "node:vm";

import { RELATIONSHIP_FUNNEL_V2_PAGE } from "../api/_relationship-funnel-v2-page.js";

const script = RELATIONSHIP_FUNNEL_V2_PAGE.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "dashboard script must be present");

function element() {
  return {
    addEventListener() {},
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
  individual_invites_started_at: "2026-09-03T19:10:00Z",
  untracked_landing_visits: 0,
  by_landing: [
    { landing_id: "relationship_challenges", funnel: funnel(106, 11, 5, 2, 1) },
    { landing_id: "youtube_tired_function", funnel: funnel(4, 1, 1, 1, 1) },
  ],
  by_landing_source: [
    { landing_id: "relationship_challenges", source: "google", funnel: funnel(100, 10, 4, 1, 1) },
    { landing_id: "relationship_challenges", source: "youtube", funnel: funnel(1, 0, 0, 0, 0) },
    { landing_id: "relationship_challenges", source: "meta", funnel: funnel(5, 1, 1, 1, 0) },
    { landing_id: "youtube_tired_function", source: "direct", funnel: funnel(4, 1, 1, 1, 1) },
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
assert.match(youtubeLandingSection, /Уставшая функция · YouTube[\s\S]*?<strong>4<\/strong>[\s\S]*?<strong>1<\/strong>/);
assert.match(youtubeLandingSection, /Facebook \/ Instagram[\s\S]*?<strong>0<\/strong>/);
assert.match(youtubeLandingSection, /YouTube[\s\S]*?<strong>4<\/strong>[\s\S]*?<strong>1<\/strong>/);

console.log("Relationship dashboard smoke: three landings and their traffic sources render separately.");
