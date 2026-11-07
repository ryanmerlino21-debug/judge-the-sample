import React, { useMemo, useState } from "react";
import { population, TARGET, GROUP_COLUMNS } from "./data.js";
import * as S from "./sampling.js";
import { DistributionPair, RowBars, SegBar, ShareBars, SimpleHistogram, StripRow, SLOTS, ACCENT, money, money0, signed } from "./charts.jsx";

const N = population.values.length;
const TRUE_MEAN = S.trueMean(population.values);
const TOP = Math.ceil(Math.max(...population.values) / 10000) * 10000;
const METHODS = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };

const groupCounts = Object.fromEntries(
  GROUP_COLUMNS.map((c) => [c, S.strataOf(population.groups[c]).map((s) => [s.name, s.size]).sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))])
);

// ------------------------------------------------------------ Population
function PopulationTab() {
  return (
    <>
      <div className="cards">
        <div className="stat c1"><div className="l">people in the file (N)</div><div className="v">{N.toLocaleString()}</div></div>
        <div className="stat c2"><div className="l">true mean of charges</div><div className="v">{money(TRUE_MEAN)}</div></div>
        <div className="stat c3"><div className="l">group columns to stratify on</div><div className="v">{GROUP_COLUMNS.length}</div></div>
        <div className="stat c4"><div className="l">columns per person</div><div className="v">9</div></div>
      </div>

      <section className="block">
        <h2>Healthcare costs <span className="tag gold">Public teaching data, simulated by its author</span></h2>
        <p className="sub">A health-plan analyst wants to estimate average medical charges per person in this list without reviewing every record.</p>
        <dl className="facts">
          <dt>One row</dt><dd>one person (a beneficiary record)</dd>
          <dt>Rows (N)</dt><dd>{N.toLocaleString()}</dd>
          <dt>Target</dt><dd><code>{TARGET}</code>, in US dollars</dd>
          <dt>Population</dt><dd>The 1,338 people in this file. It is a teaching dataset, not a representative sample of current claims.</dd>
          <dt>Row order</dt><dd>The order of the source file. <code>row_id</code> is added; the order has no documented meaning and is not a time sequence.</dd>
          <dt>Group columns</dt>
          <dd>{GROUP_COLUMNS.map((c) => <div key={c}><code>{c}</code>: {groupCounts[c].map(([g, k]) => `${g} ${k.toLocaleString()}`).join(", ")}</div>)}</dd>
        </dl>
      </section>

      <section className="block">
        <h2>How the 1,338 people split into groups</h2>
        <p className="sub">Each bar is the whole file; each coloured piece is one group. Stratified sampling uses one of these columns.</p>
        <div className="chart groups">
          {GROUP_COLUMNS.map((c) => (
            <div key={c} className="grow">
              <div className="gname"><code>{c}</code></div>
              <div>
                <SegBar parts={groupCounts[c].map(([g, k], i) => ({ name: g, count: k, color: SLOTS[i % SLOTS.length] }))} />
                <div className="legend">{groupCounts[c].map(([g, k], i) => <span key={g}><span className="sw" style={{ background: SLOTS[i % SLOTS.length] }} />{g} · {k.toLocaleString()}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>What the charges look like</h2>
        <p className="sub">Each bar counts people whose charges fall in that $2,500 band. The dashed line is the true mean of the whole file.</p>
        <div className="chart"><SimpleHistogram values={population.values} trueMean={TRUE_MEAN} top={TOP} /></div>
      </section>

      <section className="block">
        <h2>Summary of charges across all {N.toLocaleString()} people</h2>
        <p className="sub">Descriptive numbers for the whole file, in US dollars. SD divides by N because this is the whole population.</p>
        <SummaryGrid d={POP_STATS} />
        <details>
          <summary>Charges by group (mean, median and size of each group)</summary>
          {GROUP_COLUMNS.map((c) => (
            <table key={c} style={{ marginTop: 10 }}>
              <thead><tr><th><code>{c}</code></th><th className="num">People</th><th className="num">Share</th><th className="num">Mean charges</th><th className="num">Median charges</th></tr></thead>
              <tbody>{S.strataOf(population.groups[c]).sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true })).map((g) => {
                const d = S.describe(g.members.map((i) => population.values[i]));
                return <tr key={g.name}><td>{g.name}</td><td className="num">{g.size.toLocaleString()}</td><td className="num">{((100 * g.size) / N).toFixed(1)}%</td><td className="num">{money(d.mean)}</td><td className="num">{money(d.median)}</td></tr>;
              })}</tbody>
            </table>
          ))}
        </details>
      </section>

      <section className="block">
        <h2>Columns in <code>healthcare_costs.csv</code></h2>
        <table>
          <thead><tr><th>Column</th><th>Meaning</th><th>Units / values</th></tr></thead>
          <tbody>
            <tr><td><code>row_id</code></td><td>Row number in the source file, 1–1,338 (added)</td><td>id</td></tr>
            <tr><td><code>age</code></td><td>Age of the primary beneficiary</td><td>years</td></tr>
            <tr><td><code>age_band</code></td><td>Age group derived from age (added)</td><td>18-29, 30-39, 40-49, 50-64</td></tr>
            <tr><td><code>sex</code></td><td>Recorded sex</td><td>female, male</td></tr>
            <tr><td><code>bmi</code></td><td>Body mass index</td><td>kg/m²</td></tr>
            <tr><td><code>children</code></td><td>Number of dependants covered</td><td>count</td></tr>
            <tr><td><code>smoker</code></td><td>Smoker</td><td>yes, no</td></tr>
            <tr><td><code>region</code></td><td>US region of residence</td><td>northeast, northwest, southeast, southwest</td></tr>
            <tr className="target"><td><code>charges</code> <span className="tag">Target</span></td><td>Individual medical costs billed</td><td>US dollars</td></tr>
          </tbody>
        </table>
        <details>
          <summary>Provenance, licence and fingerprint</summary>
          <p style={{ marginTop: 10 }}>The <code>insurance.csv</code> teaching dataset distributed with Brett Lantz's book <em>Machine Learning with R</em> (Packt), as mirrored in the stedy/Machine-Learning-with-R-datasets GitHub repository. The book describes it as hypothetical (simulated) data created using US Census Bureau demographic statistics; the repository itself documents nothing further, and how charges were generated is not published. Unchanged except for the added <code>row_id</code> and <code>age_band</code> columns.</p>
          <p><b>Source:</b> <a href="https://raw.githubusercontent.com/stedy/Machine-Learning-with-R-datasets/master/insurance.csv" target="_blank" rel="noreferrer">stedy/Machine-Learning-with-R-datasets, insurance.csv</a></p>
          <p><b>Licence / reuse:</b> No licence is stated in the source repository. Widely redistributed for teaching; confirm this use fits your course policy.</p>
          <p className="small"><b>SHA-256:</b> <code>d51bc2b911e7d636d232ee6e9fb94b0c0e9bbad2d898894d9938afb7fa2bbbbd</code></p>
        </details>
      </section>

      <div className="callout">
        <b>Claims to avoid</b>
        <ul>
          <li>“This is the average for all patients” (or all clinics, all days, all wearers). It is the average of this file.</li>
          <li>Calling the cost teaching data real patient records.</li>
        </ul>
      </div>

      <p className="note">
        Source: <code>insurance.csv</code> from Brett Lantz, <em>Machine Learning with R</em> (Packt), via{" "}
        <a href="https://github.com/stedy/Machine-Learning-with-R-datasets" target="_blank" rel="noreferrer">stedy/Machine-Learning-with-R-datasets</a>.
        Described by its author as simulated from US Census demographic statistics. No licence is stated in the source repository; confirm reuse fits your course policy.
      </p>
    </>
  );
}

function SummaryGrid({ d }) {
  const f = (x) => money(x);
  return (
    <div className="summary-grid">
      {[["People", d.n.toLocaleString()], ["Mean", f(d.mean)], ["SD", f(d.sd)], ["Minimum", f(d.min)], ["25th percentile", f(d.q1)], ["Median", f(d.median)], ["75th percentile", f(d.q3)], ["Maximum", f(d.max)]].map(([k, v]) => (
        <div key={k}><div className="k">{k}</div><div className="n">{v}</div></div>
      ))}
    </div>
  );
}
const POP_STATS = S.describe(population.values);

// --------------------------------------------------------------- Explore
function SeedField({ seed, setSeed }) {
  return (
    <label>Seed
      <div className="seedrow">
        <input type="number" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        <button className="btn ghost" type="button" onClick={() => setSeed(Math.floor(Math.random() * 1e6))}>New</button>
      </div>
    </label>
  );
}

const RULES = {
  srs: "Choose n different people at random, with no one picked twice. Every possible set of n people is equally likely. Estimate = the plain average of the sampled charges.",
  systematic: "Walk down the file in row order, taking every k-th person (k = N ÷ n) from a random starting point. Estimate = the plain average of the sampled charges.",
  stratified: "Split people into groups by one column, take a simple random sample inside each group (sizes in proportion to the group), then combine: Σ (group size ÷ N) × (sample mean in that group).",
};

function ExploreTab() {
  const [method, setMethod] = useState("srs");
  const [n, setN] = useState(100);
  const [seed, setSeed] = useState(2026);
  const [strataCol, setStrataCol] = useState("smoker");
  const [colorBy, setColorBy] = useState("none");

  const nn = Math.min(N, Math.max(1, Math.floor(n) || 1));
  const { sample, error } = useMemo(() => {
    try { return { sample: S.drawOne(method, population, nn, seed, strataCol) }; }
    catch (e) { return { error: e.message }; }
  }, [method, nn, seed, strataCol]);

  const names = colorBy === "none" ? [] : groupCounts[colorBy].map(([g]) => g);
  const colors = Object.fromEntries(names.map((g, i) => [g, SLOTS[i % SLOTS.length]]));
  const groupOf = colorBy === "none" ? null : population.groups[colorBy];
  const colorOf = (i) => (groupOf ? colors[groupOf[i]] : ACCENT);
  const design = method === "systematic" ? S.systematicDesign(N, nn) : null;
  const idx = sample ? sample.indices : [];

  const shareRows = groupOf && sample ? groupCounts[colorBy].map(([g, k]) => ({
    name: g, popPct: (100 * k) / N, samPct: (100 * idx.filter((i) => groupOf[i] === g).length) / idx.length, color: colors[g],
  })) : [];

  return (
    <>
      <div className="toolbar">
        <label>Method
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Sample size n (1–{N.toLocaleString()})
          <input type="number" min="1" max={N} value={n} onChange={(e) => setN(e.target.value === "" ? "" : Number(e.target.value))} />
          <div className="chips">{[1, 10, 100].map((v) => <button key={v} type="button" className={nn === v ? "on" : ""} onClick={() => setN(v)}>n = {v}</button>)}</div>
        </label>
        <SeedField seed={seed} setSeed={setSeed} />
        {method === "stratified" && (
          <label>Stratify on
            <select value={strataCol} onChange={(e) => setStrataCol(e.target.value)}>{GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        )}
        <label>Colour people by
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
            <option value="none">nothing</option>
            {GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {error ? (
        <div className="err"><b>Can't draw this sample.</b> {error}. Choose a larger n, or a different stratification column.</div>
      ) : (
        <>
          <div className="cards three">
            <div className="stat c2"><div className="l"><span className="key dash" /> True mean · all {N.toLocaleString()} people</div><div className="v">{money(TRUE_MEAN)}</div></div>
            <div className="stat c1"><div className="l"><span className="key" /> This sample's estimate · single sample</div><div className="v">{money(sample.estimate)}</div></div>
            <div className="stat c5"><div className="l">Estimate − true mean</div><div className="v">{signed(sample.estimate - TRUE_MEAN)}</div></div>
          </div>

          <SummaryGrid d={S.describe(idx.map((i) => population.values[i]))} />
          <p className="small muted" style={{ marginTop: -6 }}>Numbers above describe the charges of the sampled people only (this single sample). For comparison, everyone: median {money(POP_STATS.median)}, SD {money(POP_STATS.sd)}.</p>

          <section className="block">
            <h2>Who is in the sample?</h2>
            <p className="sub">Every bar is one person, in file order; bar height is <code>{TARGET}</code>. The {idx.length} sampled people are the coloured bars.
              {method === "systematic" && " The file order has no documented meaning (it is not a time sequence), so stepping through it means something different from sampling a chronological record."}</p>
            <div className="chart">
              <RowBars values={population.values} sampled={idx} colorOf={colorOf} groupOf={groupOf} trueMean={TRUE_MEAN} est={sample.estimate} />
              <div className="legend">
                <span><span className="sw sq" style={{ background: "var(--pop)" }} />not sampled</span>
                <span><span className="key dash" /> true mean (all people)</span>
                <span><span className="key" /> this sample's mean</span>
                {groupOf ? names.map((g) => <span key={g}><span className="sw sq" style={{ background: colors[g] }} />sampled · {g}</span>) : <span><span className="sw sq" style={{ background: ACCENT }} />sampled</span>}
              </div>
            </div>
          </section>

          <section className="block">
            <h2>How do the sampled charges compare with everyone's?</h2>
            <p className="sub">Same horizontal scale in both panels.</p>
            <div className="chart">
              <DistributionPair values={population.values} sampled={idx} groupOf={groupOf} groupNames={names} colors={colors} trueMean={TRUE_MEAN} est={sample.estimate} top={TOP} />
              {groupOf && <div className="legend">{names.map((g) => <span key={g}><span className="sw sq" style={{ background: colors[g] }} />{g}</span>)}</div>}
            </div>
          </section>

          {groupOf && (
            <section className="block">
              <h2>Does the sample mirror the population? <code>{colorBy}</code></h2>
              <p className="sub">Share of people in each group: population (grey) versus this sample (colour).</p>
              <div className="chart">
                <ShareBars rows={shareRows} />
                <details>
                  <summary>View as table</summary>
                  <table>
                    <thead><tr><th>{colorBy}</th><th className="num">Population</th><th className="num">Sample share</th><th className="num">Sample count</th></tr></thead>
                    <tbody>{shareRows.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{r.popPct.toFixed(1)}%</td><td className="num">{r.samPct.toFixed(1)}%</td><td className="num">{Math.round((r.samPct * idx.length) / 100)}</td></tr>)}</tbody>
                  </table>
                </details>
              </div>
            </section>
          )}

          <section className="block">
            <h2>How this sample was chosen</h2>
            <p className="sub">{RULES[method]}</p>
            {design && (
              <p className="small"><b>Design that applies:</b> {design.kind}. N ÷ n = {N} ÷ {nn} = {design.k.toFixed(3).replace(/\.?0+$/, "")}.{" "}
                {design.whole ? <>Random start r in 1..{design.k}: rows r, r+{design.k}, r+{2 * design.k}, … (start used: {sample.start}).</> : <>Start u uniform in (0, k]; rows ⌈u + j·k⌉ for j = 0..{nn - 1} (start used: {sample.start.toFixed(3)}).</>}</p>
            )}
            <details open={idx.length <= 30}>
              <summary>Selected row numbers ({idx.length}, in file order)</summary>
              <p className="small" style={{ fontFamily: "ui-monospace, Menlo, monospace", lineHeight: 1.9, wordBreak: "break-word" }}>{idx.map((i) => i + 1).join(", ")}</p>
            </details>
            {method === "stratified" && (
              <>
                <p className="small">Proportional allocation (largest-remainder rounding, at least 1 per group, never above the group size, total = n). Within each group: simple random sample without replacement.</p>
                <table>
                  <thead><tr><th>{strataCol}</th><th className="num">Group size</th><th className="num">Weight</th><th className="num">Allocated</th></tr></thead>
                  <tbody>{sample.strata.map((s, h) => <tr key={s.name}><td>{s.name}</td><td className="num">{s.size.toLocaleString()}</td><td className="num">{(s.size / N).toFixed(4)}</td><td className="num">{sample.alloc[h]}</td></tr>)}</tbody>
                  <tfoot><tr><th>Total</th><th className="num">{N.toLocaleString()}</th><th className="num">{sample.strata.reduce((t, x) => t + x.size / N, 0).toFixed(4)}</th><th className="num">{sample.alloc.reduce((t, x) => t + x, 0)}</th></tr></tfoot>
                </table>
              </>
            )}
            <p className="meta">Baseline population · {population.file} · N = {N.toLocaleString()} · {METHODS[method]}{method === "stratified" && ` on ${strataCol}`} · n = {nn} · seed {seed} (same seed and settings reproduce this sample)</p>
          </section>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------ Experiments
const domainFor = (results) => {
  let lo = Infinity, hi = -Infinity;
  for (const r of results) {
    for (const e of r.estimates) { lo = Math.min(lo, e); hi = Math.max(hi, e); }
    lo = Math.min(lo, r.trueMean); hi = Math.max(hi, r.trueMean);
  }
  const pad = (hi - lo) * 0.06 || 100;
  return [Math.max(0, lo - pad), hi + pad];
};

function ExperimentTab({ title, intro, conditions, rowLabel, expName }) {
  const [seed, setSeed] = useState(2026);
  const [reps, setReps] = useState(100);
  const [strataCol, setStrataCol] = useState("smoker");
  const [zoom, setZoom] = useState("shared");
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const needsStrata = conditions.some((c) => c.method === "stratified");

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      setOut({ seed, reps, strataCol, results: conditions.map((c) => S.repeatedResult({ ...c, pop: population, reps, seed, strataCol })) });
      setBusy(false);
    }, 10);
  };
  const shared = out ? domainFor(out.results) : null;
  const [copied, setCopied] = useState(false);
  const rowsOf = () => out.results.map((r) => [expName, "baseline", METHODS[r.method], r.settings.replace(/,/g, ";"), r.type === "exact" ? "exact" : r.seed, r.n, r.count, r.type, r.trueMean.toFixed(2), r.bias.toFixed(2), r.sd.toFixed(2), r.rmse.toFixed(2)]);
  const HEAD = ["Experiment", "Population or condition", "Method", "Settings", "Seed (or exact)", "n", "Repetitions or starts", "Type", "True mean", "Bias", "SD", "RMSE"];
  const downloadCsv = () => {
    const csv = [HEAD, ...rowsOf()].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `${expName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`; a.click();
  };
  const copyRows = async () => {
    const md = rowsOf().map((r) => "| " + r.join(" | ") + " |").join("\n");
    try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };

  return (
    <>
      <section className="block" style={{ marginBottom: 20 }}>
        <h2>{title}</h2>
        <p className="sub">{intro}</p>
      </section>
      <div className="toolbar">
        <SeedField seed={seed} setSeed={setSeed} />
        <label>Repetitions (separate samples)
          <select value={reps} onChange={(e) => setReps(Number(e.target.value))}>{[100, 250, 500, 1000].map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        {needsStrata && (
          <label>Stratify on
            <select value={strataCol} onChange={(e) => setStrataCol(e.target.value)}>{GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        )}
        <button className="btn" onClick={run} disabled={busy}>{busy ? "Running…" : out ? "Run again (replaces results)" : "Run experiment"}</button>
      </div>
      {!out && <p className="note">Press <b>Run experiment</b>. Sample size and repetitions are separate settings: n is the number of rows in one sample; repetitions is how many separate samples are drawn.</p>}
      {out && (
        <>
          <div className="chart">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div className="legend" style={{ marginTop: 0 }}>
                <span><span className="sw" style={{ background: ACCENT, opacity: 0.5 }} />one dot = one sample's estimate</span>
                <span><span className="key" style={{ borderTopWidth: 5, width: 3, height: 12, borderTop: 0, background: "var(--ink)", borderRadius: 2 }} /> mean of the estimates</span>
                <span><span className="key dash" /> true mean {money(TRUE_MEAN)}</span>
              </div>
              <label className="small muted">Scale{" "}
                <select value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ font: "inherit", padding: "3px 6px", borderRadius: 6 }}>
                  <option value="shared">same for every row</option>
                  <option value="each">zoom each row</option>
                </select>
              </label>
            </div>
            <div className="strip-grid">
              <div className="hd">{rowLabel}</div><div className="hd">Estimates, in US dollars</div>
              <div className="hd num" style={{ textAlign: "right" }}>Bias</div><div className="hd" style={{ textAlign: "right" }}>SD</div><div className="hd" style={{ textAlign: "right" }}>RMSE</div>
              {out.results.map((r, i) => (
                <React.Fragment key={i}>
                  <div className="cell name">
                    {rowLabel === "Method" ? METHODS[r.method] : `n = ${r.n}`}
                    <span className="tag">{r.type}</span>
                    <small>{rowLabel === "Method" ? `n = ${r.n} · ` : ""}{r.settings} · {r.type === "exact" ? `all ${r.count} starts (no seed)` : `seed ${r.seed} · ${r.count} repetitions`}</small>
                  </div>
                  <div className="cell"><StripRow estimates={r.estimates} domain={zoom === "each" ? domainFor([r]) : shared} trueMean={r.trueMean} meanOfEstimates={r.meanOfEstimates} axis={zoom === "each"} label={`${METHODS[r.method]} n=${r.n}: ${r.count} estimates`} /></div>
                  <div className="cell num">{signed(r.bias)}</div>
                  <div className="cell num">{money(r.sd)}</div>
                  <div className="cell num">{money(r.rmse)}</div>
                </React.Fragment>
              ))}
            </div>
            {zoom === "shared" && (
              <div className="strip-grid"><div /><StripAxis domain={shared} /><div /><div /><div /></div>
            )}
          </div>
          <p className="meta">Baseline population · {population.file} · N = {N.toLocaleString()} · seed {out.seed} (exact rows need none) · repetitions {out.reps} for Monte Carlo rows; exact rows list every start (count shown in the row).
            Bias = mean of estimates − true mean; SD = spread of the estimates; RMSE = √(mean of (estimate − true mean)²).</p>
          <p className="note">100 repetitions usually reveal the main pattern; 1,000 give smoother distributions and more stable bias, SD and RMSE. Neither guarantees stable results, and 100 repetitions cannot reliably separate small differences between methods: rerun with different seeds to check. Systematic sampling with a whole-number interval uses exact enumeration, so it ignores the seed and repetitions.</p>
          <div className="actions">
            <button className="btn ghost" onClick={downloadCsv}>Download results (CSV)</button>
            <button className="btn ghost" onClick={copyRows}>{copied ? "Copied" : "Copy rows for the DECISIONS.md table"}</button>
          </div>
          <details><summary>View results as a table</summary>
            <table>
              <thead><tr><th>Condition</th><th>Type</th><th className="num">n</th><th className="num">Reps / starts</th><th>Seed</th><th className="num">True mean</th><th className="num">Bias</th><th className="num">SD</th><th className="num">RMSE</th></tr></thead>
              <tbody>{out.results.map((r, i) => <tr key={i}><td>{METHODS[r.method]} (baseline)</td><td>{r.type}</td><td className="num">{r.n}</td><td className="num">{r.count}</td><td>{r.type === "exact" ? "exact" : r.seed}</td><td className="num">{money(r.trueMean)}</td><td className="num">{signed(r.bias)}</td><td className="num">{money(r.sd)}</td><td className="num">{money(r.rmse)}</td></tr>)}</tbody>
            </table>
          </details>
        </>
      )}
    </>
  );
}

function StripAxis({ domain }) {
  const [lo, hi] = domain, W = 600, L = 8, R = 8;
  const x = (v) => L + ((v - lo) / (hi - lo || 1)) * (W - L - R);
  const step = (() => { const raw = (hi - lo) / 5, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; })();
  const ticks = []; for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);
  const k = (v) => (v === 0 ? "$0" : v >= 1000 ? "$" + +(v / 1000).toFixed(1) + "K" : "$" + v);
  return (
    <svg viewBox={`0 0 ${W} 24`} style={{ display: "block", width: "100%" }} aria-hidden="true">
      <line x1={L} x2={W - R} y1="2" y2="2" strokeWidth="1" style={{ stroke: "var(--axis)" }} />
      {ticks.map((t) => <text key={t} x={x(t)} y="17" fontSize="15" textAnchor="middle" style={{ fill: "var(--muted)" }}>{k(t)}</text>)}
    </svg>
  );
}


// ------------------------------------------------------------- Challenge (stage 5)
function ChallengeTab() {
  const [col, setCol] = useState("smoker");
  const [value, setValue] = useState("yes");
  const [count, setCount] = useState(100);
  const [n, setN] = useState(100);
  const [matchInterval, setMatchInterval] = useState(true);
  const [interval, setIntervalVal] = useState(N / 100);
  const [strataCol, setStrataCol] = useState("smoker");
  const [seed, setSeed] = useState(2026);
  const [reps, setReps] = useState(1000);
  const [zoom, setZoom] = useState("shared");
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const nn = Math.min(N, Math.max(1, Math.floor(n) || 1));
  const k = matchInterval ? N / nn : Number(interval) || 1;
  const values = groupCounts[col].map(([g]) => g);

  const built = useMemo(() => {
    try { return { mod: S.spaceRows(population, { col, value, count: Number(count) || 1, interval: k }) }; }
    catch (e) { return { error: e.message }; }
  }, [col, value, count, k]);

  const changeCol = (c) => { setCol(c); setValue(groupCounts[c][0][0]); };

  const run = () => {
    if (!built.mod) return;
    setBusy(true);
    setTimeout(() => {
      const mod = built.mod;
      const pops = [["baseline", population], ["modified", mod]];
      const results = [];
      for (const method of ["systematic", "stratified", "srs"]) {
        for (const [label, pop] of pops) {
          results.push({ label, ...S.repeatedResult({ method, pop, n: nn, reps, seed, strataCol }) });
        }
      }
      setOut({ seed, reps, n: nn, strataCol, k, col, value, count: Number(count), results, modMean: S.trueMean(mod.values) });
      setBusy(false);
    }, 10);
  };

  const modDesc = out && `top ${out.count} ${out.col}=${out.value} rows spaced every ${out.k.toFixed(2)} rows (nearest row)`;
  const rowsOf = () => out.results.map((r) => ["Challenge", r.label === "modified" ? `modified (${modDesc})` : "baseline", METHODS[r.method], r.settings.replace(/,/g, ";"), r.type === "exact" ? "exact" : r.seed, r.n, r.count, r.type, r.trueMean.toFixed(2), r.bias.toFixed(2), r.sd.toFixed(2), r.rmse.toFixed(2)]);
  const HEAD = ["Experiment", "Population or condition", "Method", "Settings", "Seed (or exact)", "n", "Repetitions or starts", "Type", "True mean", "Bias", "SD", "RMSE"];
  const downloadCsv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[HEAD, ...rowsOf()].map((r) => r.join(",")).join("\n")], { type: "text/csv" })); a.download = "challenge-results.csv"; a.click();
  };
  const copyRows = async () => {
    try { await navigator.clipboard.writeText(rowsOf().map((r) => "| " + r.join(" | ") + " |").join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };
  const downloadCopy = () => {
    const m = built.mod, cols = Object.keys(m.groups);
    const csv = [["row_id", ...cols, TARGET].join(","), ...m.values.map((v, i) => [m.rowIds[i], ...cols.map((c) => m.groups[c][i]), v].join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "healthcare_costs_MODIFIED_copy.csv"; a.click();
  };

  const shared = out ? domainFor(out.results) : null;
  const find = (method, label) => out.results.find((r) => r.method === method && r.label === label);
  const pct = (a, b) => ((a / b - 1) * 100);

  return (
    <>
      <section className="block" style={{ marginBottom: 20 }}>
        <h2>Challenge: a modified copy of the population</h2>
        <p className="sub">Set up the change your hypothesis describes. The original file is never altered: the app builds a <b>labelled modified copy</b> in memory, reordering rows only, and measures every result against the true mean of the population it was drawn from. Sampling rules and estimators are exactly the ones used everywhere else in the app.</p>
      </section>

      <div className="toolbar">
        <label>Rows to space out: group column
          <select value={col} onChange={(e) => changeCol(e.target.value)}>{GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label>Group value
          <select value={value} onChange={(e) => setValue(e.target.value)}>{values.map((v) => <option key={v}>{v}</option>)}</select>
        </label>
        <label>How many (highest charges)
          <input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
        <label>Sample size n (same for every result)
          <input type="number" min="1" max={N} value={n} onChange={(e) => setN(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
        <label>Spacing (rows between them)
          <input type="number" step="0.01" min="1" disabled={matchInterval} value={matchInterval ? k.toFixed(2) : interval} onChange={(e) => setIntervalVal(e.target.value)} />
          <span style={{ fontSize: 12 }}><input type="checkbox" checked={matchInterval} onChange={(e) => setMatchInterval(e.target.checked)} style={{ minWidth: 0, width: "auto" }} /> match N ÷ n</span>
        </label>
        <label>Stratify on
          <select value={strataCol} onChange={(e) => setStrataCol(e.target.value)}>{GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <SeedField seed={seed} setSeed={setSeed} />
        <label>Repetitions
          <select value={reps} onChange={(e) => setReps(Number(e.target.value))}>{[100, 250, 500, 1000].map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <button className="btn" onClick={run} disabled={busy || !built.mod}>{busy ? "Running…" : out ? "Run again (replaces results)" : "Run challenge"}</button>
      </div>

      {built.error ? <div className="err"><b>Can't build the modified copy.</b> {built.error}</div> : (
        <section className="block">
          <h2>The modified copy <span className="tag gold">Modified population</span></h2>
          <p className="sub">Only row order changes. Coloured bars are the {Number(count)} highest-charge rows with {col} = {value}, placed at positions round(1 + j × {k.toFixed(2)}), j = 0, 1, 2, …, in their original relative order among themselves. All other rows keep their original relative order.</p>
          <div className="chart">
            <RowBars values={built.mod.values} sampled={built.mod.movedPositions} colorOf={() => ACCENT} groupOf={built.mod.groups[col]} trueMean={S.trueMean(built.mod.values)} est={null} />
            <div className="legend">
              <span><span className="sw sq" style={{ background: "var(--pop)" }} />other rows (original relative order)</span>
              <span><span className="sw sq" style={{ background: ACCENT }} />spaced-out rows</span>
              <span><span className="key dash" /> true mean of this copy</span>
            </div>
          </div>
          <div className="cards three">
            <div className="stat c2"><div className="l">True mean, baseline</div><div className="v">{money(TRUE_MEAN)}</div></div>
            <div className="stat c2"><div className="l">True mean, modified copy (recalculated)</div><div className="v">{money(S.trueMean(built.mod.values))}</div></div>
            <div className="stat c3"><div className="l">Reordering changes the true mean?</div><div className="v" style={{ fontSize: 22 }}>{Math.abs(S.trueMean(built.mod.values) - TRUE_MEAN) < 1e-6 ? "No: identical" : "Yes: differs"}</div></div>
          </div>
          <div className="actions"><button className="btn ghost" onClick={downloadCopy}>Download the modified copy (CSV)</button></div>
          <p className="meta">The original <code>{population.file}</code> is unchanged on disk. The copy exists only in this page unless you download it.</p>
        </section>
      )}

      {out && (
        <section className="block">
          <h2>Results at n = {out.n}</h2>
          <p className="sub">Each row is one condition on its own, measured against the true mean of the population it was drawn from. Baseline and modified results are shown together but never pooled.</p>
          <div className="chart">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div className="legend" style={{ marginTop: 0 }}>
                <span><span className="sw" style={{ background: ACCENT, opacity: 0.5 }} />one dot = one sample's estimate</span>
                <span><span className="key" style={{ borderTop: 0, width: 3, height: 12, background: "var(--ink)", borderRadius: 2 }} /> mean of the estimates</span>
                <span><span className="key dash" /> true mean of that population</span>
              </div>
              <label className="small muted">Scale{" "}
                <select value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ font: "inherit", padding: "3px 6px", borderRadius: 6 }}>
                  <option value="shared">same for every row</option><option value="each">zoom each row</option>
                </select>
              </label>
            </div>
            <div className="strip-grid">
              <div className="hd">Population · method</div><div className="hd">Estimates, in US dollars</div>
              <div className="hd" style={{ textAlign: "right" }}>Bias</div><div className="hd" style={{ textAlign: "right" }}>SD</div><div className="hd" style={{ textAlign: "right" }}>RMSE</div>
              {out.results.map((r, i) => (
                <React.Fragment key={i}>
                  <div className="cell name">
                    {METHODS[r.method]} <span className="tag" style={r.label === "modified" ? { background: "#f5ecd3", color: "#6b5314" } : undefined}>{r.label}</span> <span className="tag">{r.type}</span>
                    <small>n = {r.n} · true mean {money(r.trueMean)} · {r.settings} · {r.type === "exact" ? `all ${r.count} starts (no seed)` : `seed ${r.seed} · ${r.count} repetitions`}</small>
                  </div>
                  <div className="cell"><StripRow estimates={r.estimates} domain={zoom === "each" ? domainFor([r]) : shared} trueMean={r.trueMean} meanOfEstimates={r.meanOfEstimates} axis={zoom === "each"} label={`${METHODS[r.method]} ${r.label}: ${r.count} estimates`} /></div>
                  <div className="cell num">{signed(r.bias)}</div>
                  <div className="cell num">{money(r.sd)}</div>
                  <div className="cell num">{money(r.rmse)}</div>
                </React.Fragment>
              ))}
            </div>
            {zoom === "shared" && <div className="strip-grid"><div /><StripAxis domain={shared} /><div /><div /><div /></div>}
          </div>

          <h3 style={{ marginTop: 18 }}>Ratios and differences (arithmetic from the table above)</h3>
          <table>
            <thead><tr><th>Method</th><th className="num">SD: modified ÷ baseline</th><th className="num">RMSE: modified ÷ baseline</th><th className="num">Bias: baseline</th><th className="num">Bias: modified</th></tr></thead>
            <tbody>{["srs", "systematic", "stratified"].map((m) => { const b = find(m, "baseline"), x = find(m, "modified");
              return <tr key={m}><td>{METHODS[m]}</td><td className="num">{(x.sd / b.sd).toFixed(2)}</td><td className="num">{(x.rmse / b.rmse).toFixed(2)}</td><td className="num">{signed(b.bias)}</td><td className="num">{signed(x.bias)}</td></tr>; })}</tbody>
          </table>
          <table style={{ marginTop: 10 }}>
            <thead><tr><th>Population</th><th className="num">SD: simple random</th><th className="num">SD: stratified</th><th className="num">Stratified SD relative to simple random</th></tr></thead>
            <tbody>{["baseline", "modified"].map((l) => { const a = find("srs", l), b = find("stratified", l);
              return <tr key={l}><td>{l}</td><td className="num">{money(a.sd)}</td><td className="num">{money(b.sd)}</td><td className="num">{pct(b.sd, a.sd).toFixed(1)}%</td></tr>; })}</tbody>
          </table>

          <p className="meta">Settings: n = {out.n} · seed {out.seed} · repetitions {out.reps} (Monte Carlo rows) · stratified on {out.strataCol} · modified copy: {modDesc}. Exact rows (whole-number systematic interval only) list every start and need no seed. The simple random rows are extra context; the four required results are systematic and stratified on both populations.</p>
          <p className="note">With 100 repetitions, small differences between methods cannot be separated reliably; 1,000 gives more stable bias, SD and RMSE. Rerun with different seeds to check that conclusions hold. A nonzero bias in a Monte Carlo result may be simulation noise: the specified designs are unbiased for the finite-population mean.</p>
          <div className="actions">
            <button className="btn ghost" onClick={downloadCsv}>Download results (CSV)</button>
            <button className="btn ghost" onClick={copyRows}>{copied ? "Copied" : "Copy rows for the DECISIONS.md table"}</button>
          </div>
        </section>
      )}
    </>
  );
}

function GlossaryTab() {
  const terms = [
    ["Unit (one row)", "The thing each row describes. Here: one person, a beneficiary record."],
    ["Target variable", "The column you want to estimate the average of. Here: charges, in US dollars."],
    ["Finite population", "Every row in the file, nothing more. Here: the 1,338 people in healthcare_costs.csv."],
    ["True (population) mean", "The average of the target over every row. Because you hold the whole file, it is known exactly."],
    ["Row order", "The order of rows in the file. In this file it is the source file's order and has no documented meaning; it is not a time sequence."],
    ["Stratum (strata)", "A group of rows defined by an observable column, such as smoker or region. Stratified sampling samples inside each group."],
    ["Simple random sampling", "n different rows chosen at random without replacement; every set of n rows is equally likely. Estimate = sample mean."],
    ["Systematic sampling", "Every k-th row in file order from a random start (k = N ÷ n). With a whole-number k there are exactly k equally likely starts; otherwise a fractional interval is used."],
    ["Proportional allocation", "Each stratum gets a share of n in proportion to its size (largest-remainder rounding, at least 1 each, total exactly n)."],
    ["Population-weighted estimate", "Σ (stratum size ÷ N) × (sample mean in that stratum). Not the plain average of all sampled rows."],
    ["Estimate", "The number a sample produces for the true mean."],
    ["Bias", "Mean of the estimates − the true mean."],
    ["SD of estimates", "The spread of the estimates across repetitions."],
    ["RMSE", "√(mean of (estimate − true mean)²): typical estimation error, combining bias and variability. RMSE² = bias² + SD²."],
    ["Repetitions", "How many separate samples are drawn. Separate from n, the number of rows in one sample."],
    ["Exact enumeration", "Listing every possible start (whole-number systematic sampling) instead of drawing random samples. Labelled “exact”."],
    ["Monte Carlo", "Repeated random sampling with a seeded random number generator. Labelled “Monte Carlo”."],
    ["Modified copy", "A reordered copy of the population built in memory for the challenge. The original file is never altered; the copy is always labelled “modified”, and its true mean is recalculated from its own rows."],
    ["Seed", "The starting value of the random number generator. The same seed and settings always reproduce the same samples and results."],
  ];
  return (
    <section className="block">
      <h2>Glossary</h2>
      <dl className="gloss">{terms.map(([t, d]) => <React.Fragment key={t}><dt>{t}</dt><dd>{d}</dd></React.Fragment>)}</dl>
    </section>
  );
}

// ------------------------------------------------------------------ Shell
const TABS = [["pop", "The population"], ["explore", "Explore a sample"], ["methods", "Compare methods"], ["size", "Sample size"], ["challenge", "Challenge"], ["gloss", "Glossary"]];

export default function App() {
  const [tab, setTab] = useState(TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : "pop");
  const go = (k) => { setTab(k); history.replaceState(null, "", "#" + k); };
  return (
    <div className="wrap">
      <header className="banner">
        <div className="bn-text">
          <div className="eyebrow">Sampling activity · Healthcare costs · N = 1,338</div>
          <h1>Judge the Sample</h1>
          <div className="question">Which sampling method would you trust for this population, at what sample size, and with what limits?</div>
        </div>
      </header>
      <nav className="tabs">
        {TABS.map(([k, label]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => go(k)}>{label}</button>)}
      </nav>
      <main>
        {tab === "pop" && <PopulationTab />}
        {tab === "challenge" && <ChallengeTab />}
        {tab === "gloss" && <GlossaryTab />}
        {tab === "explore" && <ExploreTab />}
        {tab === "methods" && <ExperimentTab key="m" rowLabel="Method" expName="Methods at n = 100" title="Experiment A: three methods at n = 100" intro="Simple random, systematic and stratified sampling on the baseline population, each with the same total n = 100 and the same seed." conditions={[{ method: "srs", n: 100 }, { method: "systematic", n: 100 }, { method: "stratified", n: 100 }]} />}
        {tab === "size" && <ExperimentTab key="s" rowLabel="Sample size" expName="Sample size" title="Experiment B: simple random sampling at n = 1, 10 and 100" intro="Same population and method; only the sample size changes. With the same seed and repetitions, the n = 100 result matches the simple random result in Experiment A." conditions={[{ method: "srs", n: 1 }, { method: "srs", n: 10 }, { method: "srs", n: 100 }]} />}
      </main>
      <footer>
        Baseline population: <code>{population.file}</code> ({N.toLocaleString()} people). A teaching dataset, not real patient records or a representative sample of current claims.
      </footer>
    </div>
  );
}
