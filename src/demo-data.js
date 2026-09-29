// Fictional, illustrative figures in INR crore. These are NOT company filings.
const years = [2022, 2023, 2024, 2025, 2026];

const profiles = [
  { company: "Aster Digital", ticker: "ASTR", sector: "IT Services", base: 12000, growth: [0, .13, .10, .12, .09], margins: [.23, .225, .218, .221, .227], color: "#b8ea5c" },
  { company: "Nexa Systems", ticker: "NEXA", sector: "IT Services", base: 10800, growth: [0, .09, .11, .08, .12], margins: [.19, .195, .201, .205, .207], color: "#79a9ff" },
  { company: "Kaveri Tech", ticker: "KAVR", sector: "IT Services", base: 9200, growth: [0, .16, .14, .09, .07], margins: [.25, .246, .239, .23, .224], color: "#f8b77a" }
];

function makeRows(p) {
  let revenue = p.base;
  return years.map((year, i) => {
    revenue = Math.round(revenue * (1 + p.growth[i]));
    const ebitda = Math.round(revenue * p.margins[i]);
    const da = Math.round(revenue * (.035 + i * .001));
    const ebit = ebitda - da;
    const interest = Math.round(revenue * (.007 + i * .0002));
    const pat = Math.round((ebit - interest) * .75);
    const assets = Math.round(revenue * (1.42 - i * .025));
    const equity = Math.round(assets * (.66 + i * .008));
    const debt = Math.round(assets * (.14 - i * .008));
    const cash = Math.round(revenue * (.14 + i * .007));
    const currentAssets = Math.round(assets * .46);
    const currentLiabilities = Math.round(assets * .23);
    const inventory = Math.round(revenue * .006);
    const operatingCashFlow = Math.round(pat * (1.08 - i * .015));
    const capex = Math.round(revenue * (.042 + i * .001));
    return {
      company: p.company, ticker: p.ticker, sector: p.sector, year,
      revenue, ebitda, ebit, pat, assets, equity, debt, cash,
      currentAssets, currentLiabilities, inventory, interest,
      operatingCashFlow, capex
    };
  });
}

export const demoCompanies = profiles.map(p => ({
  ...p,
  source: "Illustrative demo data · fictional company",
  rows: makeRows(p)
}));

export const csvHeaders = [
  "company", "year", "revenue", "ebitda", "ebit", "pat", "assets",
  "equity", "debt", "cash", "currentAssets", "currentLiabilities",
  "inventory", "interest", "operatingCashFlow", "capex"
];
