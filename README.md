# Finance Intelligence Lab

**An interactive financial statement and ratio analysis portfolio by Mohnesh Bhabu.**

Finance Intelligence Lab turns annual figures into a readable analyst workspace: financial trends, key ratios, peer comparisons, and short rule based commentary. It demonstrates finance logic and transparent implementation. The live demo URL can be added after the repository and GitHub Pages are published.

> **Data status:** Aster Digital, Nexa Systems, and Kaveri Tech are fictional companies. Their figures are illustrative and must never be represented as actual filings or live market data. CSV uploads are processed locally in the browser and are not sent to a server.

## Version 1 capabilities

- View five years of selected income statement, balance sheet, and cash flow line items.
- Switch chart series for revenue, EBITDA, profit after tax, and free cash flow.
- Calculate growth, margins, ROE, ROA, ROCE, liquidity, leverage, coverage, turnover, and free cash flow.
- Compare three fictional peers for a selected fiscal year.
- Download a CSV template and import one company's annual figures in ₹ crore.
- Inspect the formula shown beneath each calculated ratio and read a calculation based summary.

**Scope:** This is an annual statement analyzer for nonfinancial businesses. Bank financial statements require different metrics, so HDFC Bank and other banks are intentionally excluded from the generic ratio model. There is no live price feed, AI feature, DCF, or investment recommendation in version 1.

## Quick start

Requires Node.js 20.19+ or 22.12+.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. For verification:

```bash
npm test
npm run build
```

The built site is in `dist/`. It has no runtime backend, API key, or database. GitHub Actions verifies the calculations and deploys the static build to GitHub Pages when Pages is configured to use **GitHub Actions**.

## CSV data contract

Download the template from the site. Use one row per fiscal year, one company per file. Required columns:

```text
company,year,revenue,ebitda,ebit,pat,assets,equity,debt,cash,currentAssets,currentLiabilities,inventory,interest,operatingCashFlow,capex
```

All monetary amounts must use the **same currency and scale**, preferably ₹ crore, and the same consolidated or standalone reporting basis across years. Use positive amounts for interest expense and capex. `debt` means interest bearing debt. `cash` means cash and cash equivalents. `inventory` can be 0 for an IT services firm. `operatingCashFlow` may be negative. `pat` may be negative. Include at least two years for growth and average balance based ratios. A blank value is rejected rather than silently estimated.

For real companies, obtain figures from the same company's annual reports, record the source URLs and report dates, and check units and accounting definitions. The application does not certify an uploaded statement or save the file.

## Formula policy

| Metric | Formula |
|---|---|
| Revenue growth | (Current revenue − prior revenue) / prior revenue |
| EBITDA / EBIT / net margin | EBITDA / EBIT / PAT divided by revenue |
| ROE | PAT / average shareholder equity |
| ROA | PAT / average assets |
| ROCE | EBIT / average (equity + debt − cash) |
| Current ratio | Current assets / current liabilities |
| Quick ratio | (Current assets − inventory) / current liabilities |
| Debt / equity | Debt / equity |
| Debt / EBITDA | Debt / EBITDA |
| Interest coverage | EBIT / interest expense |
| Asset turnover | Revenue / average assets |
| Free cash flow | Operating cash flow − capex |

The average balance uses the current and previous year end. Undefined ratios display **N/A**, including the first year for average based measures and any zero denominator. ROCE's capital employed definition is stated explicitly because alternative definitions exist. The ratios are mechanical and need context before a conclusion.

## Repository map

```text
src/demo-data.js       Clearly marked fictional demonstration data
src/finance.js         Financial calculations, CSV parsing, formatting
src/main.js            Interface and local import workflow
src/style.css          Responsive visual design
tests/finance.test.js  Formula and input validation tests
.github/workflows/     Build, test, GitHub Pages deployment
```

## Next milestones

1. Replace demonstration data with sourced annual report extracts and a transparent provenance record.
2. Add an FP&A actual versus budget module with variance drivers and scenarios.
3. Build DCF and comparable valuation modules with explicit assumptions and sensitivity analysis.
4. Add a separate RBI repo rate and NIFTY Bank research module with sourced event data and stated limitations.
5. Add AI commentary only after the numerical calculations and source records are validated.

## Interview explanation

“I built a browser based finance analyzer that turns annual statement figures into auditable ratios, trends, and peer comparisons. I separated financial formulas from the interface, handle missing or invalid inputs explicitly, and test the calculations. The demo is clearly fictional; users can import sourced annual report figures through a local CSV.”

## License

MIT. See [LICENSE](LICENSE).
