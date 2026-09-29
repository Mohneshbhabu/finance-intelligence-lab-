import test from "node:test";
import assert from "node:assert/strict";
import { metrics, parseCSV, commentary, formatValue } from "../src/finance.js";
import { demoCompanies, csvHeaders } from "../src/demo-data.js";

test("ratios use average balances and free cash flow uses cash flow less capex", () => {
  const prior = { revenue: 100, assets: 100, equity: 50, debt: 20, cash: 5 };
  const current = { revenue: 120, ebitda: 30, ebit: 24, pat: 15, assets: 140,
    equity: 70, debt: 30, cash: 10, currentAssets: 40, currentLiabilities: 20,
    inventory: 5, interest: 3, operatingCashFlow: 18, capex: 8 };
  const m = metrics(current, prior);
  assert.equal(m.revenueGrowth, .2);
  assert.equal(m.roe, .25);
  assert.equal(m.roa, .125);
  assert.equal(m.roce, 24 / ((65 + 90) / 2));
  assert.equal(m.quickRatio, 1.75);
  assert.equal(m.interestCoverage, 8);
  assert.equal(m.fcf, 10);
});

test("undefined base ratios show N/A instead of Infinity or invented growth", () => {
  const row = demoCompanies[0].rows[0];
  const m = metrics({ ...row, interest: 0, currentLiabilities: 0 });
  assert.equal(m.roe, null);
  assert.equal(m.revenueGrowth, null);
  assert.equal(m.interestCoverage, null);
  assert.equal(m.currentRatio, null);
  assert.equal(formatValue(m.roe, "%"), "N/A");
});

test("CSV accepts quoted names and sorts annual rows", () => {
  const rows = [demoCompanies[0].rows[1], demoCompanies[0].rows[0]];
  const csv = csvHeaders.join(",") + "\n" + rows.map(row => csvHeaders.map(key =>
    key === "company" ? '"Aster, Digital"' : row[key]).join(",")).join("\n");
  const parsed = parseCSV(csv);
  assert.deepEqual(parsed.map(r => r.year), [2022, 2023]);
  assert.equal(parsed[0].company, "Aster, Digital");
});

test("CSV rejects missing fields and inconsistent statements", () => {
  assert.throws(() => parseCSV("company,year\nA,2025"), /Missing columns/);
  const row = demoCompanies[0].rows[0];
  const bad = { ...row, inventory: row.currentAssets + 1 };
  const csv = csvHeaders.join(",") + "\n" + csvHeaders.map(k => bad[k]).join(",");
  assert.throws(() => parseCSV(csv), /inconsistent statement values/);
});

test("commentary is tied to the two latest years", () => {
  const rows = demoCompanies[0].rows;
  const narrative = commentary(rows);
  assert.match(narrative, /Revenue grew 9.0% year over year/);
  assert.match(narrative, /basis points/);
  assert.match(narrative, /Operating cash flow/);
});
