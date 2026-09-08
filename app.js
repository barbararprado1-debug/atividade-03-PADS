const DATA_URL = "data/gasolina_sp_capital_2026_1s.json";
const TANK_LITERS = 45;

const periodFilter = document.querySelector("#periodFilter");
const brandFilter = document.querySelector("#brandFilter");
const toggles = [...document.querySelectorAll(".toggle")];

let records = [];
let order = "cheap";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function safeDate(value) {
  return new Date(`${value}T12:00:00`);
}

function currentRecords() {
  const selectedPeriod = periodFilter.value;
  const selectedBrand = brandFilter.value;
  const maxDate = records[records.length - 1].data;
  const cutoff = new Date(`${maxDate}T12:00:00`);
  cutoff.setDate(cutoff.getDate() - 27);

  return records.filter((row) => {
    const matchesBrand = selectedBrand === "all" || row.bandeira === selectedBrand;
    if (!matchesBrand) return false;
    if (selectedPeriod === "all") return true;
    if (selectedPeriod === "last4") return safeDate(row.data) >= cutoff;
    return row.data.startsWith(selectedPeriod);
  });
}

function groupByNeighborhood(data) {
  const groups = new Map();
  data.forEach((row) => {
    if (!groups.has(row.bairro)) groups.set(row.bairro, []);
    groups.get(row.bairro).push(row);
  });
  return [...groups.entries()].map(([bairro, rows]) => ({
    bairro,
    average: mean(rows.map((row) => row.preco)),
    posts: new Set(rows.map((row) => row.cnpj)).size,
    collections: rows.length,
  }));
}

function groupByWeek(data) {
  const groups = new Map();
  data.forEach((row) => {
    if (!groups.has(row.semana)) groups.set(row.semana, []);
    groups.get(row.semana).push(row.preco);
  });
  const weekly = [...groups.entries()]
    .map(([week, prices]) => ({ week, average: mean(prices) }))
    .sort((a, b) => a.week.localeCompare(b.week));
  return weekly.map((item, index) => ({
    ...item,
    moving: index >= 3 ? mean(weekly.slice(index - 3, index + 1).map((row) => row.average)) : null,
  }));
}

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function renderKpis(data, neighborhoods) {
  if (!data.length || !neighborhoods.length) {
    ["avgPrice", "neighborhoodGap", "tankImpact", "typicalGap"].forEach((id) => setText(id, "—"));
    setText("avgPriceCaption", "Sem dados para este filtro");
    setText("gapCaption", "Sem comparação disponível");
    return;
  }
  const prices = data.map((row) => row.preco);
  const lowest = Math.min(...neighborhoods.map((row) => row.average));
  const highest = Math.max(...neighborhoods.map((row) => row.average));
  const gap = highest - lowest;
  setText("avgPrice", brl.format(mean(prices)));
  setText("avgPriceCaption", `${number.format(data.length)} coletas em ${number.format(new Set(data.map((row) => row.cnpj)).size)} postos`);
  setText("neighborhoodGap", brl.format(gap));
  setText("gapCaption", "Maior média menos menor média por bairro");
  setText("tankImpact", brl.format(gap * TANK_LITERS));
  setText("typicalGap", brl.format(percentile(prices, .9) - percentile(prices, .1)));
}

function renderRanking(neighborhoods) {
  const direction = order === "cheap" ? 1 : -1;
  const sorted = [...neighborhoods].sort((a, b) => direction * (a.average - b.average)).slice(0, 10);
  const max = Math.max(...sorted.map((row) => row.average));
  const min = Math.min(...sorted.map((row) => row.average));
  setText("rankingEyebrow", order === "cheap" ? "TOP 10 · MENOR MÉDIA" : "TOP 10 · MAIOR MÉDIA");
  setText("rankingTitle", order === "cheap" ? "Bairros mais baratos" : "Bairros mais caros");
  const container = document.querySelector("#rankingChart");
  if (!sorted.length) {
    container.innerHTML = '<p class="empty">Não há dados para esta combinação de filtros.</p>';
    return;
  }
  container.innerHTML = sorted.map((row) => {
    const width = 28 + ((row.average - min) / Math.max(max - min, .01)) * 72;
    return `<div class="rank-row ${order === "expensive" ? "expensive" : ""}">
      <span class="rank-name" title="${row.bairro}">${row.bairro}</span>
      <div class="bar-track"><div class="bar" style="width:${width}%">${brl.format(row.average)}</div></div>
      <span class="rank-detail">${row.posts} posto${row.posts === 1 ? "" : "s"} · ${row.collections} coleta${row.collections === 1 ? "" : "s"}</span>
    </div>`;
  }).join("");
}

function makePath(points, width, height, minValue, maxValue, margins) {
  return points.map((point, index) => {
    const x = margins.left + (index / Math.max(points.length - 1, 1)) * (width - margins.left - margins.right);
    const y = margins.top + (1 - (point - minValue) / Math.max(maxValue - minValue, .01)) * (height - margins.top - margins.bottom);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function renderTrend(weekly) {
  const container = document.querySelector("#trendChart");
  if (!weekly.length) {
    container.innerHTML = '<p class="empty">Não há semanas disponíveis para esta combinação de filtros.</p>';
    return;
  }
  const width = 620, height = 290, margins = { top: 22, right: 10, bottom: 35, left: 42 };
  const values = weekly.flatMap((row) => [row.average, row.moving].filter(Number.isFinite));
  const low = Math.floor((Math.min(...values) - .08) * 10) / 10;
  const high = Math.ceil((Math.max(...values) + .08) * 10) / 10;
  const yTicks = Array.from({ length: 5 }, (_, index) => low + ((high - low) * index) / 4);
  const mainPath = makePath(weekly.map((row) => row.average), width, height, low, high, margins);
  const movingPoints = weekly.map((row) => row.moving);
  const movingPath = movingPoints.map((point, index) => {
    if (point === null) return "";
    const x = margins.left + (index / Math.max(weekly.length - 1, 1)) * (width - margins.left - margins.right);
    const y = margins.top + (1 - (point - low) / Math.max(high - low, .01)) * (height - margins.top - margins.bottom);
    const priorNull = index === 0 || movingPoints[index - 1] === null;
    return `${priorNull ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  const labels = weekly.filter((_, index) => index % Math.ceil(weekly.length / 7) === 0 || index === weekly.length - 1)
    .map((row) => {
      const index = weekly.indexOf(row);
      const x = margins.left + (index / Math.max(weekly.length - 1, 1)) * (width - margins.left - margins.right);
      return `<text class="axis-label" x="${x}" y="${height - 10}" text-anchor="middle">${shortDate.format(safeDate(row.week)).replace(".", "")}</text>`;
    }).join("");
  const grids = yTicks.map((tick) => {
    const y = margins.top + (1 - (tick - low) / Math.max(high - low, .01)) * (height - margins.top - margins.bottom);
    return `<line class="grid-line" x1="${margins.left}" x2="${width - margins.right}" y1="${y}" y2="${y}" /><text class="axis-label" x="0" y="${y + 4}">${brl.format(tick).replace("R$", "")}</text>`;
  }).join("");
  const points = weekly.map((row, index) => {
    const x = margins.left + (index / Math.max(weekly.length - 1, 1)) * (width - margins.left - margins.right);
    const y = margins.top + (1 - (row.average - low) / Math.max(high - low, .01)) * (height - margins.top - margins.bottom);
    return `<circle class="point" cx="${x}" cy="${y}" r="3"><title>${shortDate.format(safeDate(row.week))}: ${brl.format(row.average)}</title></circle>`;
  }).join("");
  container.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Preço médio semanal da gasolina">
    ${grids}${labels}<path class="line-main" d="${mainPath}" /><path class="line-moving" d="${movingPath}" />${points}
  </svg>`;
}

function render() {
  const data = currentRecords();
  const neighborhoods = groupByNeighborhood(data);
  const periodName = periodFilter.options[periodFilter.selectedIndex].text;
  const brandName = brandFilter.options[brandFilter.selectedIndex].text;
  setText("resultSummary", `${number.format(data.length)} coletas · ${periodName} · ${brandName}`);
  renderKpis(data, neighborhoods);
  renderRanking(neighborhoods);
  renderTrend(groupByWeek(data));
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Não foi possível carregar a base.");
    const payload = await response.json();
    records = payload.dados.map((row) => ({ ...row, preco: Number(row.preco) })).sort((a, b) => a.data.localeCompare(b.data));
    const brands = [...new Set(records.map((row) => row.bandeira))].sort();
    brands.forEach((brand) => brandFilter.insertAdjacentHTML("beforeend", `<option value="${brand}">${brand}</option>`));
    [periodFilter, brandFilter].forEach((element) => element.addEventListener("change", render));
    toggles.forEach((button) => button.addEventListener("click", () => {
      order = button.dataset.order;
      toggles.forEach((item) => item.classList.toggle("active", item === button));
      render();
    }));
    render();
  } catch (error) {
    document.querySelector("#resultSummary").textContent = "Não foi possível carregar os dados. Abra o projeto em um servidor local ou pelo GitHub Pages.";
    document.querySelector("#rankingChart").innerHTML = '<p class="empty">Erro ao carregar a base.</p>';
    document.querySelector("#trendChart").innerHTML = '<p class="empty">Erro ao carregar a base.</p>';
  }
}

init();
