export function divide(numerator, denominator) {
  return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0
    ? numerator / denominator : null;
}

export function percentChange(current, previous) {
  // A zero or negative prior base is not a meaningful percentage growth rate here.
  return previous > 0 && Number.isFinite(current) ? (current - previous) / previous : null;
}

export function metrics(row, previous = null) {
  const avg = key => previous ? (row[key] + previous[key]) / 2 : null;
  const capital = row.equity + row.debt - row.cash;
  const priorCapital = previous ? previous.equity + previous.debt - previous.cash : null;
  return {
    revenueGrowth: previous ? percentChange(row.revenue, previous.revenue) : null,
    ebitdaMargin: divide(row.ebitda, row.revenue),
    ebitMargin: divide(row.ebit, row.revenue),
    netMargin: divide(row.pat, row.revenue),
    roe: divide(row.pat, avg("equity")),
    roa: divide(row.pat, avg("assets")),
    roce: divide(row.ebit, previous ? (capital + priorCapital) / 2 : null),
    currentRatio: divide(row.currentAssets, row.currentLiabilities),
    quickRatio: divide(row.currentAssets - row.inventory, row.currentLiabilities),
    debtEquity: divide(row.debt, row.equity),
    debtEbitda: divide(row.debt, row.ebitda),
    interestCoverage: divide(row.ebit, row.interest),
    assetTurnover: divide(row.revenue, avg("assets")),
    fcf: row.operatingCashFlow - row.capex
  };
}

export const ratioDefinitions = [
  ["Revenue growth", "revenueGrowth", "(Current revenue − prior revenue) / prior revenue", "%"],
  ["EBITDA margin", "ebitdaMargin", "EBITDA / revenue", "%"],
  ["EBIT margin", "ebitMargin", "EBIT / revenue", "%"],
  ["Net margin", "netMargin", "PAT / revenue", "%"],
  ["Return on equity", "roe", "PAT / average equity", "%"],
  ["Return on assets", "roa", "PAT / average total assets", "%"],
  ["Return on capital employed", "roce", "EBIT / average (equity + debt − cash)", "%"],
  ["Current ratio", "currentRatio", "Current assets / current liabilities", "x"],
  ["Quick ratio", "quickRatio", "(Current assets − inventory) / current liabilities", "x"],
  ["Debt / equity", "debtEquity", "Total debt / equity", "x"],
  ["Debt / EBITDA", "debtEbitda", "Total debt / EBITDA", "x"],
  ["Interest coverage", "interestCoverage", "EBIT / interest expense", "x"],
  ["Asset turnover", "assetTurnover", "Revenue / average total assets", "x"],
  ["Free cash flow", "fcf", "Operating cash flow − capital expenditure", "₹ Cr"]
];

export function formatValue(value, unit = "₹ Cr") {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  if (unit === "%") return `${(value * 100).toFixed(1)}%`;
  if (unit === "x") return `${value.toFixed(2)}×`;
  return `${value < 0 ? "−" : ""}₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

export function commentary(rows) {
  if (rows.length < 2) return "Add a prior year to calculate growth and changes.";
  const a = rows.at(-1), b = rows.at(-2);
  const m = metrics(a, b), prior = metrics(b, rows.at(-3) ?? null);
  const growth = m.revenueGrowth === null ? "unavailable" : formatValue(Math.abs(m.revenueGrowth), "%");
  const marginShift = (m.ebitdaMargin - prior.ebitdaMargin) * 10000;
  const direction = marginShift >= 0 ? "expanded" : "contracted";
  return `Revenue ${m.revenueGrowth >= 0 ? "grew" : "fell"} ${growth} year over year. EBITDA margin ${direction} by ${Math.abs(marginShift).toFixed(0)} basis points to ${formatValue(m.ebitdaMargin, "%")}. Operating cash flow ${a.operatingCashFlow >= b.operatingCashFlow ? "rose" : "fell"} from ${formatValue(b.operatingCashFlow)} to ${formatValue(a.operatingCashFlow)}.`;
}

// CSV follows RFC-style quoted fields, including escaped quotes and embedded newlines.
export function parseCSV(text) {
  const records = [];
  let record = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else if (!quoted && field === "") quoted = true;
      else if (quoted) quoted = false;
      else throw new Error("Invalid quote in CSV.");
    } else if (c === "," && !quoted) { record.push(field); field = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      record.push(field); field = "";
      if (record.some(v => v.trim() !== "")) records.push(record);
      record = [];
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed quoted field in CSV.");
  record.push(field);
  if (record.some(v => v.trim() !== "")) records.push(record);
  if (records.length < 2) throw new Error("CSV needs a header and at least one annual row.");
  const headers = records.shift().map((h, i) => i === 0 ? h.replace(/^\uFEFF/, "").trim() : h.trim());
  const required = ["company", "year", "revenue", "ebitda", "ebit", "pat", "assets", "equity", "debt", "cash", "currentAssets", "currentLiabilities", "inventory", "interest", "operatingCashFlow", "capex"];
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}.`);
  const rows = records.map((fields, i) => {
    if (fields.length !== headers.length) throw new Error(`Row ${i + 2} has ${fields.length} columns; expected ${headers.length}.`);
    const raw = Object.fromEntries(headers.map((h, n) => [h, fields[n].trim()]));
    const row = { company: raw.company, ticker: raw.company.slice(0, 4).toUpperCase(), sector: "Uploaded company" };
    if (!row.company) throw new Error(`Row ${i + 2} has no company name.`);
    for (const key of required.slice(1)) {
      if (raw[key] === "" || !Number.isFinite(Number(raw[key]))) throw new Error(`Row ${i + 2}: ${key} must be a number.`);
      row[key] = Number(raw[key]);
    }
    if (!Number.isInteger(row.year) || row.year < 1900 || row.year > 2200) throw new Error(`Row ${i + 2}: invalid fiscal year.`);
    if (row.revenue <= 0 || row.assets <= 0 || row.equity <= 0 || row.currentAssets < 0 || row.currentLiabilities < 0 || row.debt < 0 || row.cash < 0 || row.inventory < 0 || row.capex < 0 || row.interest < 0) {
      throw new Error(`Row ${i + 2}: check positive bases and nonnegative balance or expense items.`);
    }
    if (row.currentAssets > row.assets || row.inventory > row.currentAssets || row.ebit > row.ebitda) throw new Error(`Row ${i + 2}: inconsistent statement values.`);
    return row;
  });
  const names = new Set(rows.map(r => r.company));
  if (names.size !== 1) throw new Error("Upload one company per CSV.");
  const years = rows.map(r => r.year);
  if (new Set(years).size !== years.length) throw new Error("Fiscal years must be unique.");
  return rows.sort((a, b) => a.year - b.year);
}
