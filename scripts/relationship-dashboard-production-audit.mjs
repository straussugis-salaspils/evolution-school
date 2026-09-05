import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = "https://evolution.yourbalancerestored.com/18-18-18/relationship-statistics/";
const periods = process.argv.slice(2);
assert.ok(periods.length, "Pass date ranges as YYYY-MM-DD:YYYY-MM-DD");
const reports = [];
const counts = (row) => Object.fromEntries(row.funnel.map((step) => [step.key, step.count]));
for (const range of periods) {
  const [from, to] = range.split(":");
  const url = new URL(base);
  url.search = new URLSearchParams({ data: "1", date_from: from, date_to: to });
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.report_version, "2026-09-05-all-visits");
  assert.equal(data.date_from, from);
  assert.equal(data.date_to, to);
  const total = counts(data);
  for (const field of ["by_landing", "by_landing_source", "by_source", "by_campaign", "by_ad"]) {
    for (const [key, expected] of Object.entries(total)) {
      assert.equal(data[field].reduce((sum, row) => sum + counts(row)[key], 0), expected, `${range} ${field} ${key}`);
    }
  }
  assert.equal(data.linked_landing_visits + data.untracked_landing_visits, total.landing);
  for (const landing of data.by_landing) {
    const sources = data.by_landing_source.filter((row) => row.landing_id === landing.landing_id);
    for (const [key, value] of Object.entries(counts(landing))) {
      assert.ok(Number.isInteger(value) && value >= 0);
      assert.equal(sources.reduce((sum, row) => sum + counts(row)[key], 0), value);
    }
    assert.equal(sources.reduce((sum, row) => sum + row.untracked_landing_visits, 0), landing.untracked_landing_visits);
  }
  const tests = data.test_activity.map((test) => ({
    name: test.label,
    started: test.telegram_started,
    member: test.group_joined + test.group_member_observed,
    questions: test.questions.map((q) => q.answered),
    completed: test.completed,
    resultScreens: [0, 1, 2, 3].map((index) => test.result_versions.reduce((sum, version) => sum + (version.screens.find((s) => s.screen_index === index)?.viewed || 0), 0)),
    weekClicks: test.registration_cta_clicked,
  }));
  for (const test of tests) {
    assert.ok(test.member <= test.started);
    assert.ok(test.completed <= test.started);
    assert.ok(test.questions.every((n) => n <= test.started));
    assert.ok(test.resultScreens.every((n) => n <= test.completed));
    assert.ok(test.weekClicks <= test.completed);
  }
  const summary = {
    from, to, generated: data.generated_at, joinedInPeriod: data.channel_joined_total,
    total, untracked: data.untracked_landing_visits,
    rows: data.by_landing_source.map((row) => ({landing: row.landing_id, source: row.source,
      counts: Object.fromEntries(Object.entries(counts(row)).filter(([key]) => ["landing", "cta", "group_joined", "test_started", "completed"].includes(key))),
      untracked: row.untracked_landing_visits, untrackedClicks: row.untracked_cta_clicks})),
    tests,
  };
  reports.push(summary);
  console.log(JSON.stringify(summary));
}
await fs.mkdir("../outputs", { recursive: true });
await fs.writeFile("../outputs/statistics-audit-2026-09-05.json", JSON.stringify(reports, null, 2));
console.log("PASS: every funnel step and source total reconciled for all requested periods.");
