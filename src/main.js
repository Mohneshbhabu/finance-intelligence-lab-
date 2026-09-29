import "./style.css";
import { demoCompanies, csvHeaders } from "./demo-data.js";
import { metrics, ratioDefinitions, formatValue, commentary, parseCSV } from "./finance.js";

const app = document.querySelector("#app");
const state = { companies: [...demoCompanies], selected: "Aster Digital", metric: "revenue", year: 2026, uploadNotice: "" };
const seriesOptions = [
  ["revenue", "Revenue"], ["ebitda", "EBITDA"], ["pat", "Profit after tax"], ["fcf", "Free cash flow"]
];
const statementRows = [
  ["Revenue", "revenue"], ["EBITDA", "ebitda"], ["EBIT", "ebit"], ["Profit after tax", "pat"],
  ["Total assets", "assets"], ["Shareholders' equity", "equity"], ["Total debt", "debt"], ["Cash & equivalents", "cash"],
  ["Operating cash flow", "operatingCashFlow"], ["Capital expenditure", "capex"], ["Free cash flow", "fcf"]
];

const escapeHtml = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const asNumber = n => n === null ? "N/A" : n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const getCompany = () => state.companies.find(c => c.company === state.selected);
const fullRows = company => company.rows.map((r, i) => ({ ...r, ...metrics(r, company.rows[i - 1] || null) }));
const cell = (value, unit = "₹ Cr") => formatValue(value, unit);

function graph(rows, key, color) {
  const values = rows.map(r => r[key]).filter(Number.isFinite);
  if (!values.length) return '<div class="empty">No available values</div>';
  const min = Math.min(...values), max = Math.max(...values), spread = max - min || Math.abs(max) * .2 || 1;
  const low = min - spread * .18, high = max + spread * .18;
  const W = 800, H = 270, left = 22, right = 22, top = 25, bottom = 36;
  const x = i => left + i * (W - left - right) / Math.max(rows.length - 1, 1);
  const y = v => top + (high - v) / (high - low) * (H - top - bottom);
  const points = rows.map((r, i) => `${x(i)},${y(r[key])}`).join(" ");
  const first = rows[0], last = rows.at(-1);
  return `<div class="chart-wrap">
    <div class="chart-range"><span>${escapeHtml(cell(high))}</span><span>${escapeHtml(cell(low))}</span></div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(key)} from fiscal year ${first.year} to ${last.year}">
      ${[.25,.5,.75].map(frac => `<line x1="0" x2="${W}" y1="${top + frac * (H-top-bottom)}" y2="${top + frac * (H-top-bottom)}" class="grid-line"/>`).join("")}
      <polygon points="${points} ${x(rows.length - 1)},${H-bottom} ${x(0)},${H-bottom}" fill="${color}" opacity=".095"/>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      ${rows.map((r, i) => `<circle cx="${x(i)}" cy="${y(r[key])}" r="5" fill="${color}" stroke="#101b2b" stroke-width="3"><title>FY ${r.year}: ${escapeHtml(cell(r[key]))}</title></circle>`).join("")}
    </svg>
    <div class="chart-labels">${rows.map(r => `<span>FY ${r.year}</span>`).join("")}</div>
  </div>`;
}

function render() {
  const company = getCompany();
  const rows = fullRows(company);
  const current = rows.at(-1), prior = rows.at(-2);
  const years = [...new Set(state.companies.flatMap(c => c.rows.map(r => r.year)))].sort((a,b) => b-a);
  if (!years.includes(state.year)) state.year = years[0];
  const compared = state.companies.map(c => {
    const i = c.rows.findIndex(r => r.year === state.year);
    return i < 0 ? { company: c.company, color: c.color, row: null, calculated: null } :
      { company: c.company, color: c.color, row: c.rows[i], calculated: metrics(c.rows[i], c.rows[i-1] || null) };
  });
  const cards = [
    ["Revenue", current.revenue, "₹ Cr", current.revenueGrowth, "Year over year"],
    ["EBITDA margin", current.ebitdaMargin, "%", prior ? current.ebitdaMargin-prior.ebitdaMargin : null, "vs prior year"],
    ["Return on equity", current.roe, "%", null, "Average equity basis"],
    ["Free cash flow", current.fcf, "₹ Cr", prior ? current.fcf-prior.fcf : null, "vs prior year"]
  ];
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">F<span>·</span></span><span class="brand-copy"><strong>FINANCE<br>INTELLIGENCE LAB</strong><small>ANALYST WORKSPACE</small></span></div>
        <div class="side-section">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          <a class="nav-link active" href="#overview"><span class="nav-icon">◫</span> Overview <span class="nav-dot"></span></a>
          <a class="nav-link" href="#financials"><span class="nav-icon">▤</span> Financial statements</a>
          <a class="nav-link" href="#ratios"><span class="nav-icon">◈</span> Ratio analysis</a>
          <a class="nav-link" href="#compare"><span class="nav-icon">▥</span> Peer comparison</a>
          <a class="nav-link" href="#data"><span class="nav-icon">⇧</span> Import data</a>
        </nav>
        <div class="side-section roadmap-label">ON THE ROADMAP</div>
        <div class="roadmap"><span>FP&A forecasting</span><span>DCF valuation</span><span>RBI policy lab</span></div>
        <div class="side-bottom"><div class="avatar">MB</div><div><strong>Mohnesh Bhabu</strong><small>Finance · Analytics · Technology</small></div></div>
      </aside>
      <main id="overview">
        <header class="topbar"><div class="breadcrumb">PORTFOLIO / <strong>COMPANY ANALYSIS</strong></div><div class="top-actions"><span class="version">● &nbsp;V1.0 DEMO</span><a class="text-link" href="#methodology">Methodology ↗</a></div></header>
        <div class="content">
          <section class="heading">
            <div><div class="eyebrow">FINANCIAL ANALYSIS / 01</div><h1>See the numbers.<br><em>Understand the business.</em></h1><p>Turn annual financial statements into clear ratios, trends and peer context.</p></div>
            <div class="heading-pattern" aria-hidden="true">F<span>·</span></div>
          </section>
          <div class="demo-alert"><span class="alert-icon">ⓘ</span><div><strong>Illustrative data</strong> — the three demo companies and their figures are fictional. Upload your own annual figures to analyze a real company. No upload leaves your browser.</div></div>
          <section class="selector-panel" aria-label="Analysis controls">
            <div class="selector-info"><span class="caption">SELECT COMPANY</span><select id="company-select" aria-label="Select company">${state.companies.map(c => `<option value="${escapeHtml(c.company)}" ${c.company === state.selected ? "selected" : ""}>${escapeHtml(c.company)}</option>`).join("")}</select></div>
            <div class="selector-divider"></div>
            <div class="selector-info"><span class="caption">SECTOR</span><strong>${escapeHtml(company.sector)}</strong></div>
            <div class="selector-divider"></div>
            <div class="selector-info"><span class="caption">PERIOD</span><strong>FY ${rows[0].year} — FY ${current.year}</strong></div>
            <div class="selector-spacer"></div><a href="#data" class="button subtle">↑ &nbsp; Import CSV</a>
          </section>
          <div class="section-title"><div><span class="section-index">01 / OVERVIEW</span><h2>Performance snapshot</h2></div><span class="period-badge">LATEST · FY ${current.year}</span></div>
          <section class="kpis">
            ${cards.map(([label,value,unit,delta,description],i) => `<article class="kpi"><span class="caption">${label}</span><div class="kpi-value">${escapeHtml(cell(value,unit))}</div><div class="kpi-foot">${delta !== null ? `<span class="${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "↗" : "↘"} ${unit === "%" ? Math.abs(delta*100).toFixed(1) + " pp" : escapeHtml(cell(Math.abs(delta), unit))}</span>` : '<span class="muted">—</span>'}<span>${description}</span></div><span class="kpi-number">0${i+1}</span></article>`).join("")}
          </section>
          <section class="two-col trends">
            <article class="panel chart-panel"><div class="panel-head"><div><span class="section-index">TREND ANALYSIS</span><h3>Financial trajectory</h3></div><span class="unit-note">INR CRORE · ANNUAL</span></div><div class="tab-row" role="group" aria-label="Chart metric">${seriesOptions.map(([key,label]) => `<button class="tab ${state.metric === key ? "selected" : ""}" data-metric="${key}" aria-pressed="${state.metric === key}">${label}</button>`).join("")}</div>${graph(rows,state.metric,company.color)}</article>
            <article class="panel insight-panel"><span class="section-index">THE ANALYST VIEW</span><div class="insight-glyph">↗</div><h3>What changed<br>this year?</h3><p>${escapeHtml(commentary(company.rows))}</p><div class="insight-divider"></div><small>Rule based commentary calculated from displayed figures. It is not an investment recommendation.</small></article>
          </section>
          <section id="financials" class="data-section"><div class="section-title"><div><span class="section-index">02 / FINANCIALS</span><h2>Selected financials</h2></div><span class="unit-note">ALL VALUES IN ₹ CRORE</span></div><div class="panel table-panel"><div class="scroll-table"><table><thead><tr><th>Line item</th>${rows.map(r => `<th>FY ${r.year}</th>`).join("")}</tr></thead><tbody>${statementRows.map(([label,key]) => `<tr class="${key === "revenue" || key === "fcf" ? "emphasis-row" : ""}"><th scope="row">${escapeHtml(label)}</th>${rows.map(r => `<td>${escapeHtml(asNumber(r[key]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="table-foot">FCF = operating cash flow − capital expenditure. These are selected line items, not complete audited statements.</div></div></section>
          <section id="ratios" class="data-section"><div class="section-title"><div><span class="section-index">03 / RATIOS</span><h2>Financial health, decoded</h2></div><span class="unit-note">FY ${current.year}</span></div><div class="ratio-grid">${ratioDefinitions.map(([name,key,formula,unit]) => `<article class="ratio-item"><div><span>${escapeHtml(name)}</span><small>${escapeHtml(formula)}</small></div><strong>${escapeHtml(cell(current[key],unit))}</strong></article>`).join("")}</div><p class="note">Average balance sheet denominators require two fiscal years; the first year displays N/A. Ratios with zero denominators also display N/A.</p></section>
          <section id="compare" class="data-section"><div class="section-title"><div><span class="section-index">04 / BENCHMARK</span><h2>Compare the peers</h2></div><label class="year-control">FISCAL YEAR <select id="year-select" aria-label="Comparison fiscal year">${years.map(y => `<option value="${y}" ${state.year === y ? "selected" : ""}>FY ${y}</option>`).join("")}</select></label></div><div class="panel table-panel"><div class="scroll-table"><table><thead><tr><th>Company</th><th>Revenue</th><th>Growth</th><th>EBITDA margin</th><th>ROE</th><th>Debt / equity</th></tr></thead><tbody>${compared.map(c => `<tr><th scope="row"><span class="peer-dot" style="background:${c.color}"></span>${escapeHtml(c.company)}</th><td>${escapeHtml(c.row ? cell(c.row.revenue) : "N/A")}</td><td>${escapeHtml(c.calculated ? cell(c.calculated.revenueGrowth,"%") : "N/A")}</td><td>${escapeHtml(c.calculated ? cell(c.calculated.ebitdaMargin,"%") : "N/A")}</td><td>${escapeHtml(c.calculated ? cell(c.calculated.roe,"%") : "N/A")}</td><td>${escapeHtml(c.calculated ? cell(c.calculated.debtEquity,"x") : "N/A")}</td></tr>`).join("")}</tbody></table></div><div class="table-foot">Demo peers share a fictional IT services sector. Comparisons depend on consistent accounting definitions and fiscal periods.</div></div></section>
          <section id="data" class="data-section"><div class="section-title"><div><span class="section-index">05 / YOUR DATA</span><h2>Make the analysis yours</h2></div></div><div class="import-panel"><div><span class="section-index">LOCAL CSV IMPORT</span><h3>Bring your own annual data.</h3><p>Use the template, enter values from a company's annual reports, and cite the source and fiscal period in your portfolio write-up. Files are processed in this browser session only.</p><div class="import-actions"><button class="button" id="template-btn">↓ &nbsp; Download template</button><label class="button outline" for="csv-file">↑ &nbsp; Upload CSV</label><input id="csv-file" type="file" accept=".csv,text/csv" hidden></div><p class="upload-notice" role="status">${escapeHtml(state.uploadNotice)}</p></div><div class="import-steps"><div><b>01</b><span>Download the CSV template</span></div><div><b>02</b><span>Enter one company's annual figures in ₹ crore</span></div><div><b>03</b><span>Upload to calculate trends and ratios</span></div></div></div></section>
          <section id="methodology" class="methodology"><span class="section-index">DATA & METHOD</span><h2>Transparent by design.</h2><p>All calculations are performed in JavaScript from the supplied annual figures. The demo data is fictional. There is no live market feed, price target, valuation, AI interpretation, or implied investment advice in this version. Debt, equity, assets and cash refer to fiscal year end; ROE, ROA, ROCE and asset turnover use two year averages. The CSV template documents required fields.</p><a href="#financials">Inspect the financials ↑</a></section>
          <footer><span>© 2026 MOHNESH BHABU · FINANCE INTELLIGENCE LAB</span><span>BUILT TO SHOW THE WORK BEHIND THE NUMBERS</span></footer>
        </div>
      </main>
    </div>`;
  document.querySelector("#company-select").addEventListener("change", e => { state.selected = e.target.value; render(); });
  document.querySelector("#year-select").addEventListener("change", e => { state.year = Number(e.target.value); render(); });
  document.querySelectorAll("[data-metric]").forEach(btn => btn.addEventListener("click", () => { state.metric = btn.dataset.metric; render(); }));
  document.querySelector("#template-btn").addEventListener("click", downloadTemplate);
  document.querySelector("#csv-file").addEventListener("change", uploadCSV);
}

function downloadTemplate() {
  const sample = getCompany().rows.slice(0,2).map(r => csvHeaders.map(h => r[h]).join(","));
  const blob = new Blob([[csvHeaders.join(","), ...sample].join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "finance-intelligence-lab-template.csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function uploadCSV(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error("CSV exceeds the 2 MB limit.");
    const rows = parseCSV(await file.text());
    const name = rows[0].company;
    const newCompany = { company: name, ticker: rows[0].ticker, sector: "Uploaded company", color: "#d5d0ff", source: `User uploaded: ${file.name}`, rows };
    state.companies = [...demoCompanies.filter(c => c.company !== name), newCompany];
    state.selected = name;
    state.year = rows.at(-1).year;
    state.uploadNotice = `Loaded ${rows.length} fiscal year${rows.length === 1 ? "" : "s"} for ${name}. Source: your local CSV.`;
  } catch (err) {
    state.uploadNotice = `Import failed: ${err.message}`;
  }
  render();
  document.querySelector("#data").scrollIntoView({ behavior: "smooth" });
}

render();
