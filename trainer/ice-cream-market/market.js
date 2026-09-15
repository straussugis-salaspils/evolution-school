export const BLOCK_SIZE = 10_000;
export const UNIT_PRICE = 2;
export const YEAR_ONE_FORECASTS = Object.freeze({
  winter: 280_000,
  spring: 360_000,
  summer: 400_000,
  autumn: 320_000,
});

export class MarketInputError extends Error {
  constructor(messages) {
    super(messages.join(" "));
    this.name = "MarketInputError";
    this.messages = messages;
  }
}

function wholeNumber(value, label, errors) {
  if (value === null || value === undefined || String(value).trim() === "") {
    errors.push(`${label} is required.`);
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    errors.push(`${label} must be a whole number.`);
    return null;
  }
  return parsed;
}

export function calculateMarket({ season, actualMarket, teams }) {
  const errors = [];
  const forecast = YEAR_ONE_FORECASTS[season];
  if (!forecast) errors.push("Choose a Year 1 season.");

  const actual = wholeNumber(actualMarket, "Actual market", errors);
  if (actual !== null && forecast) {
    const minimum = Math.round(forecast * 0.8);
    const maximum = Math.round(forecast * 1.2);
    if (actual < minimum || actual > maximum) {
      errors.push(`Actual market must be between ${minimum.toLocaleString("en-US")} and ${maximum.toLocaleString("en-US")} for ${season}.`);
    }
  }

  if (!Array.isArray(teams) || teams.length !== 6) {
    errors.push("Enter exactly six teams.");
  }

  const normalized = Array.isArray(teams)
    ? teams.map((team, index) => {
        const label = `Team ${index + 1}`;
        const name = String(team?.name ?? "").trim();
        if (!name) errors.push(`${label} needs a name.`);
        const investment = wholeNumber(team?.investment, `${label} investment`, errors);
        const requested = wholeNumber(team?.requested, `${label} request`, errors);
        const tieOrder = wholeNumber(team?.tieOrder, `${label} tie order`, errors);
        if (investment !== null && investment < 1_000) {
          errors.push(`${label} investment must be at least Sh 1,000, even with a zero request.`);
        }
        if (requested !== null && (requested < 0 || requested % BLOCK_SIZE !== 0)) {
          errors.push(`${label} request must be zero or a nonnegative multiple of 10,000.`);
        }
        if (tieOrder !== null && (tieOrder < 1 || tieOrder > 6)) {
          errors.push(`${label} tie order must be from 1 to 6.`);
        }
        return { index, name, investment, requested, tieOrder };
      })
    : [];

  if (normalized.length === 6) {
    const names = normalized.map((team) => team.name.toLocaleLowerCase());
    if (new Set(names).size !== 6) errors.push("Team names must be distinct.");
    const orders = normalized.map((team) => team.tieOrder);
    if (orders.every((order) => order !== null) && new Set(orders).size !== 6) {
      errors.push("Give the six teams different tie-order numbers.");
    }
  }

  if (errors.length) throw new MarketInputError(errors);

  const saleableCapacity = Math.floor(actual / BLOCK_SIZE) * BLOCK_SIZE;
  const unassignableRemainder = actual - saleableCapacity;
  const totalRequested = normalized.reduce((sum, team) => sum + team.requested, 0);
  const ranked = [...normalized].sort(
    (a, b) => b.investment - a.investment || a.tieOrder - b.tieOrder || a.index - b.index,
  );
  const allocations = new Map(normalized.map((team) => [team.index, team.requested]));
  let blocksToCut = Math.max(0, (totalRequested - saleableCapacity) / BLOCK_SIZE);
  const cutSequence = [];

  while (blocksToCut > 0) {
    let cutThisPass = false;
    for (let position = ranked.length - 1; position >= 0 && blocksToCut > 0; position -= 1) {
      const team = ranked[position];
      const before = allocations.get(team.index);
      if (before < BLOCK_SIZE) continue;
      allocations.set(team.index, before - BLOCK_SIZE);
      blocksToCut -= 1;
      cutThisPass = true;
      cutSequence.push(team.name);
    }
    if (!cutThisPass) throw new Error("Allocation could not be reconciled.");
  }

  const rows = ranked.map((team, index) => {
    const allocated = allocations.get(team.index);
    return {
      rank: index + 1,
      name: team.name,
      investment: team.investment,
      requested: team.requested,
      cut: team.requested - allocated,
      allocated,
      sharePercent: saleableCapacity === 0 ? 0 : (allocated / saleableCapacity) * 100,
      revenue: allocated * UNIT_PRICE,
    };
  });
  const totalAllocated = rows.reduce((sum, team) => sum + team.allocated, 0);
  const totalCuts = totalRequested - totalAllocated;
  if (totalAllocated !== Math.min(totalRequested, saleableCapacity)) {
    throw new Error("Market allocation totals do not reconcile.");
  }

  return {
    season,
    forecast,
    actualMarket: actual,
    saleableCapacity,
    unassignableRemainder,
    totalRequested,
    totalAllocated,
    totalCuts,
    unusedSaleableCapacity: saleableCapacity - totalAllocated,
    unmetMarketDemand: actual - totalAllocated,
    totalRevenue: totalAllocated * UNIT_PRICE,
    cutSequence,
    rows,
  };
}
