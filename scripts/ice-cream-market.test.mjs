import test from "node:test";
import assert from "node:assert/strict";
import { calculateMarket, MARKET_FORECASTS, MarketInputError } from "../trainer/ice-cream-market/market.js";

const sample = [
  { name: "A", investment: 5000, requested: 80000, tieOrder: 1 },
  { name: "B", investment: 3000, requested: 50000, tieOrder: 2 },
  { name: "C", investment: 2000, requested: 70000, tieOrder: 3 },
  { name: "D", investment: 1500, requested: 60000, tieOrder: 4 },
  { name: "E", investment: 1000, requested: 40000, tieOrder: 5 },
  { name: "F", investment: 1000, requested: 60000, tieOrder: 6 },
];

test("trainer's winter example allocates exactly 330,000 units", () => {
  const result = calculateMarket({ year: 1, season: "winter", actualMarket: 336000, teams: sample });
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
  const result = calculateMarket({ year: 1, season: "spring", actualMarket: 360000, teams });
  assert.equal(result.totalCuts, 0);
  assert.equal(result.totalAllocated, 60000);
  assert.equal(result.unusedSaleableCapacity, 300000);
});

test("bottom-to-top cuts skip exhausted requests across passes", () => {
  const teams = sample.map((team, index) => ({ ...team, requested: index === 5 ? 0 : 80000 }));
  const result = calculateMarket({ year: 1, season: "winter", actualMarket: 224000, teams });
  assert.equal(result.saleableCapacity, 220000);
  assert.equal(result.totalAllocated, 220000);
  assert.equal(result.cutSequence[0], "E");
  assert.equal(result.rows.find((row) => row.name === "F").allocated, 0);
});

test("trainer tie order controls equal-bid ranking", () => {
  const teams = sample.map((team) => ({ ...team }));
  teams[4].tieOrder = 6;
  teams[5].tieOrder = 5;
  const result = calculateMarket({ year: 1, season: "winter", actualMarket: 336000, teams });
  assert.deepEqual(result.rows.slice(-2).map((row) => row.name), ["F", "E"]);
  assert.deepEqual(result.cutSequence, ["E", "F", "D"]);
});

test("invalid range, request and missing bid are reported", () => {
  assert.throws(() => calculateMarket({ year: 1, season: "winter", actualMarket: 350000, teams: sample }), MarketInputError);
  assert.throws(() => calculateMarket({ year: 1, season: "winter", actualMarket: 336000, teams: sample.map((team, index) =>
    index === 0 ? { ...team, requested: 15000 } : team) }), MarketInputError);
  assert.throws(() => calculateMarket({ year: 1, season: "winter", actualMarket: 336000, teams: sample.map((team, index) =>
    index === 0 ? { ...team, investment: "  " } : team) }), MarketInputError);
});

test("all twelve forecasts match the participant materials", () => {
  assert.deepEqual(MARKET_FORECASTS[1], { winter: 280000, spring: 360000, summer: 400000, autumn: 320000 });
  assert.deepEqual(MARKET_FORECASTS[2], { winter: 410000, spring: 550000, summer: 650000, autumn: 470000 });
  assert.deepEqual(MARKET_FORECASTS[3], { winter: 540000, spring: 750000, summer: 900000, autumn: 620000 });
  for (const year of [1, 2, 3]) {
    for (const season of ["winter", "spring", "summer", "autumn"]) {
      const result = calculateMarket({ year, season, actualMarket: MARKET_FORECASTS[year][season], teams: sample });
      assert.equal(result.year, year);
      assert.equal(result.season, season);
      assert.equal(result.forecast, MARKET_FORECASTS[year][season]);
    }
  }
});

test("Year 2 winter handles the lower 20% market boundary", () => {
  const result = calculateMarket({ year: 2, season: "winter", actualMarket: 328000, teams: sample });
  assert.equal(result.forecast, 410000);
  assert.equal(result.saleableCapacity, 320000);
  assert.equal(result.unassignableRemainder, 8000);
  assert.equal(result.totalAllocated, 320000);
});

test("Year 3 summer handles the upper 20% boundary and repeated cuts", () => {
  const teams = sample.map((team) => ({ ...team, requested: 200000 }));
  const result = calculateMarket({ year: 3, season: "summer", actualMarket: 1080000, teams });
  assert.equal(result.forecast, 900000);
  assert.equal(result.totalAllocated, 1080000);
  assert.equal(result.totalRevenue, 2160000);
  assert.deepEqual(result.rows.map((row) => row.allocated), [180000, 180000, 180000, 180000, 180000, 180000]);
});

test("rejects an absent year, Year 4 and wrong Year 3 range", () => {
  assert.throws(() => calculateMarket({ season: "winter", actualMarket: 540000, teams: sample }), MarketInputError);
  assert.throws(() => calculateMarket({ year: 4, season: "winter", actualMarket: 540000, teams: sample }), MarketInputError);
  assert.throws(() => calculateMarket({ year: 3, season: "autumn", actualMarket: 495999, teams: sample }), MarketInputError);
});
