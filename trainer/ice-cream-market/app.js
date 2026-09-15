import { calculateMarket, YEAR_ONE_FORECASTS, MarketInputError } from "./market.js";

const form = document.querySelector("#market-form");
const seasonInput = document.querySelector("#season");
const actualInput = document.querySelector("#actual-market");
const groupInput = document.querySelector("#group-name");
const teamList = document.querySelector("#team-list");
const errorBox = document.querySelector("#form-error");
const results = document.querySelector("#results");
const number = (value) => Number(value).toLocaleString("en-US");
let lastResult = null;

for (let i = 1; i <= 6; i += 1) {
  const card = document.createElement("div");
  card.className = "team-card";
  card.innerHTML = `<h3>Team ${i}</h3><div class="team-fields">
    <label>Name<input class="team-name" value="Team ${i}" maxlength="40" autocomplete="off"></label>
    <label>Investment · Sh<input class="team-investment" type="number" min="1000" step="1" placeholder="≥ 1,000"></label>
    <label>Request · units<input class="team-request" type="number" min="0" step="10000" placeholder="10,000 blocks"></label>
    <label>Tie order<input class="team-order" type="number" min="1" max="6" step="1" value="${i}"></label>
  </div>`;
  teamList.append(card);
}

function updateForecast() {
  const forecast = YEAR_ONE_FORECASTS[seasonInput.value];
  document.querySelector("#forecast-value").textContent = `${number(forecast)} units`;
  document.querySelector("#forecast-range").textContent = `Allowed actual: ${number(forecast * .8)}–${number(forecast * 1.2)} (±20%)`;
}

function collectTeams() {
  return [...teamList.querySelectorAll(".team-card")].map((card) => ({
    name: card.querySelector(".team-name").value,
    investment: card.querySelector(".team-investment").value,
    requested: card.querySelector(".team-request").value,
    tieOrder: card.querySelector(".team-order").value,
  }));
}

function metric(label, value) {
  const card = document.createElement("div");
  card.className = "metric";
  const caption = document.createElement("span");
  caption.textContent = label;
  const amount = document.createElement("strong");
  amount.textContent = value;
  card.append(caption, amount);
  return card;
}

function cell(row, value) {
  const td = document.createElement("td");
  td.textContent = value;
  row.append(td);
}

function showResult(result) {
  lastResult = result;
  const group = groupInput.value.trim() || "Unnamed group";
  document.querySelector("#result-caption").textContent = `${group} · ${result.season[0].toUpperCase() + result.season.slice(1)} · Year 1`;
  const summary = document.querySelector("#summary");
  summary.replaceChildren(
    metric("Actual market", number(result.actualMarket)),
    metric("Saleable market", number(result.saleableCapacity)),
    metric("Allocated sales", number(result.totalAllocated)),
    metric("Total revenue", `Sh ${number(result.totalRevenue)}`),
  );
  const body = document.querySelector("#result-rows");
  body.replaceChildren();
  for (const team of result.rows) {
    const tr = document.createElement("tr");
    [team.rank, team.name, `Sh ${number(team.investment)}`, number(team.requested), number(team.cut),
      number(team.allocated), `${team.sharePercent.toFixed(1)}%`, `Sh ${number(team.revenue)}`].forEach((value) => cell(tr, value));
    body.append(tr);
  }
  const foot = document.querySelector("#result-total");
  foot.replaceChildren();
  const tr = document.createElement("tr");
  ["", "TOTAL", "", number(result.totalRequested), number(result.totalCuts), number(result.totalAllocated),
    `${result.saleableCapacity ? ((result.totalAllocated / result.saleableCapacity) * 100).toFixed(1) : "0.0"}%`,
    `Sh ${number(result.totalRevenue)}`].forEach((value) => cell(tr, value));
  foot.append(tr);
  const notes = [];
  if (result.unassignableRemainder) notes.push(`${number(result.unassignableRemainder)} actual units cannot be allocated because only whole 10,000-unit blocks are sold.`);
  if (result.unusedSaleableCapacity) notes.push(`${number(result.unusedSaleableCapacity)} saleable units remain because teams requested less than the market could buy.`);
  if (result.totalCuts) notes.push(`${number(result.totalCuts)} requested units were cut, one block at a time from the lowest-ranked available team upward.`);
  document.querySelector("#allocation-note").textContent = notes.join(" ") || "Every team's request was fulfilled.";
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  try {
    const result = calculateMarket({ season: seasonInput.value, actualMarket: actualInput.value, teams: collectTeams() });
    showResult(result);
  } catch (error) {
    results.hidden = true;
    lastResult = null;
    errorBox.textContent = error instanceof MarketInputError ? error.messages.join(" ") : "The calculation failed. Check the entries and try again.";
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

seasonInput.addEventListener("change", () => {
  updateForecast();
  actualInput.value = "";
  results.hidden = true;
  lastResult = null;
});

document.querySelector("#clear-button").addEventListener("click", () => {
  actualInput.value = "";
  for (const card of teamList.querySelectorAll(".team-card")) {
    card.querySelector(".team-investment").value = "";
    card.querySelector(".team-request").value = "";
  }
  errorBox.hidden = true;
  results.hidden = true;
  lastResult = null;
  actualInput.focus();
});

document.querySelector("#copy-button").addEventListener("click", async (event) => {
  if (!lastResult) return;
  const group = groupInput.value.trim() || "Unnamed group";
  const lines = [`${group} | ${lastResult.season} | actual ${lastResult.actualMarket} | saleable ${lastResult.saleableCapacity}`,
    "Rank\tTeam\tInvestment (Sh)\tRequested\tCut\tSales\tMarket share %\tRevenue (Sh)",
    ...lastResult.rows.map((team) => [team.rank, team.name, team.investment, team.requested,
      team.cut, team.allocated, team.sharePercent.toFixed(1), team.revenue].join("\t"))];
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    event.currentTarget.textContent = "Copied";
    setTimeout(() => { event.currentTarget.textContent = "Copy results"; }, 2000);
  } catch {
    event.currentTarget.textContent = "Copy unavailable";
  }
});
document.querySelector("#print-button").addEventListener("click", () => window.print());
updateForecast();
