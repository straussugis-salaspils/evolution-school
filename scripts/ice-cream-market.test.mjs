import test from "node:test";
import assert from "node:assert/strict";
import { calculateMarket, MarketInputError } from "../trainer/ice-cream-market/market.js";

const sample = [
  { name: "A", investment: 5000, requested: 80000, tieOrder: 1 },
  { name: "B", investment: 3000, requested: 50000, tieOrder: 2 },
  { name: "C", investment: 2000, requested: 70000, tieOrder: 3 },
  { name: "D", investment: 1500, requested: 60000, tieOrder: 4 },
  { name: "E", investment: 1000, requested: 40000, tieOrder: 5 },
  { name: "F", investment: 1000, requested: 60000, tieOrder: 6 },
];

test("trainer's winter example allocates exactly 330,000 units", () => {
  const result = calculateMarket({ season: "winter", actualMarket: 336000, teams: sample });
  assert.equal(result.saleableCapacity, 330000);
  assert.equal(result.unassignableRemainder, 6000);
  assert.equal(result.totalRequested, 360000);
  assert.equal(result.totalAllocated, 330000);
  assert.equal(result.totalRevenue, 660000);
  assert.deepEqual(result.cutSequence, ["F", "E", "D"]);
  assert.deepEqual(result.rows.map((row) => row.allocated), [80000, 50000, 70000, 50000, 30000, 50000]);
});

test("no shortage fulfills requests and leaves unsold market", () => {
  const teams = sample.map((team) => ({ ...team, requested: 10000 }));
  const result = calculateMarket({ season: "spring", actualMarket: 360000, teams });
  assert.equal(result.totalCuts, 0);
  assert.equal(result.totalAllocated, 60000);
  assert.equal(result.unusedSaleableCapacity, 300000);
});

test("bottom-to-top cuts skip exhausted requests across passes", () => {
  const teams = sample.map((team, index) => ({ ...team, requested: index === 5 ? 0 : 80000 }));
  const result = calculateMarket({ season: "winter", actualMarket: 224000, teams });
  assert.equal(result.saleableCapacity, 220000);
  assert.equal(result.totalAllocated, 220000);
  assert.equal(result.cutSequence[0], "E");
  assert.equal(result.rows.find((row) => row.name === "F").allocated, 0);
});

test("trainer tie order controls equal-bid ranking", () => {
  const teams = sample.map((team) => ({ ...team }));
  teams[4].tieOrder = 6;
  teams[5].tieOrder = 5;
  const result = calculateMarket({ season: "winter", actualMarket: 336000, teams });
  assert.deepEqual(result.rows.slice(-2).map((row) => row.name), ["F", "E"]);
  assert.deepEqual(result.cutSequence, ["E", "F", "D"]);
});

test("invalid range, request and missing bid are reported", () => {
  assert.throws(() => calculateMarket({ season: "winter", actualMarket: 350000, teams: sample }), MarketInputError);
  assert.throws(() => calculateMarket({ season: "winter", actualMarket: 336000, teams: sample.map((team, index) =>
    index === 0 ? { ...team, requested: 15000 } : team) }), MarketInputError);
  assert.throws(() => calculateMarket({ season: "winter", actualMarket: 336000, teams: sample.map((team, index) =>
    index === 0 ? { ...team, investment: "  " } : team) }), MarketInputError);
});
