import React, { useMemo, useState } from "react";
import { population, TARGET, GROUP_COLUMNS } from "./data.js";
import * as S from "./sampling.js";
import { Histogram, RowStrip, money, money0, PALETTE } from "./charts.jsx";

const N = population.values.length;
const TRUE_MEAN = S.trueMean(population.values);
const POP_MIN = Math.min(...population.values);
const POP_MAX = Math.max(...population.values);
const METHODS = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };

const groupCounts = Object.fromEntries(
  GROUP_COLUMNS.map((c) => [c, S.strataOf(population.groups[c]).map((s) => [s.name, s.size]).sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))])
);

const TrueMeanBadge = ({ big }) => (
  <div className="truemean">
    <div className="small muted">True mean of {TARGET} (all {N.toLocaleString()} rows)</div>
    <div className="v">{money(TRUE_MEAN)}</div>
  </div>
);

// ---------------------------------------------------------------- Population
function PopulationTab() {
  return (
    <>
      <div className="card">
        <h2>Healthcare costs <span className="tag gold">Public teaching data, simulated by its author</span></h2>
        <p>A health-plan analyst wants to estimate average medical charges per person in this list without reviewing every record.</p>
        <dl className="facts">
          <dt>One row</dt><dd>one person (a beneficiary record)</dd>
          <dt>Rows (N)</dt><dd>{N.toLocaleString()}</dd>
          <dt>Target</dt><dd><code>{TARGET}</code>, in US dollars</dd>
          <dt>Population</dt><dd>The 1,338 people in this file. It is a teaching dataset, not a representative sample of current claims.</dd>
          <dt>Row order</dt><dd>The order of the source file. <code>row_id</code> is added; the order has no documented meaning and is not a time sequence.</dd>
          <dt>Group columns</dt>
          <dd>
            {GROUP_COLUMNS.map((c) => (
              <div key={c}><code>{c}</code>: {groupCounts[c].map(([g, k]) => `${g} ${k.toLocaleString()}`).join(", ")}</div>
            ))}
          </dd>
        </dl>
      </div>

      <div className="card">
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
          <p style={{ marginTop: 8 }}>The <code>insurance.csv</code> teaching dataset distributed with Brett Lantz's book <em>Machine Learning with R</em> (Packt), as mirrored in the stedy/Machine-Learning-with-R-datasets GitHub repository. The book describes it as hypothetical (simulated) data created using US Census Bureau demographic statistics; the repository itself documents nothing further, and how charges were generated is not published. Unchanged except for the added <code>row_id</code> and <code>age_band</code> columns.</p>
          <p><b>Source:</b> <a href="https://raw.githubusercontent.com/stedy/Machine-Learning-with-R-datasets/master/insurance.csv" target="_blank" rel="noreferrer">stedy/Machine-Learning-with-R-datasets, insurance.csv</a></p>
          <p><b>Licence / reuse:</b> No licence is stated in the source repository. Widely redistributed for teaching; confirm this use fits your course policy.</p>
          <p className="small"><b>SHA-256:</b> <code>d51bc2b911e7d636d232ee6e9fb94b0c0e9bbad2d898894d9938afb7fa2bbbbd</code></p>
        </details>
      </div>

      <div className="callout">
        <b>Claims to avoid</b>
        <ul>
          <li>“This is the average for all patients” (or all clinics, all days, all wearers). It is the average of this file.</li>
          <li>Calling the cost teaching data real patient records.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Try it yourself</h3>
        <p className="small" style={{ margin: 0 }}>Without looking at the card, explain in two sentences what one row is and what the true mean of <code>charges</code> describes. Then name one group of people your population does <em>not</em> describe.</p>
      </div>

      <div className="card small muted">
        Source: <code>insurance.csv</code> from Brett Lantz, <em>Machine Learning with R</em> (Packt), via{" "}
        <a href="https://github.com/stedy/Machine-Learning-with-R-datasets" target="_blank" rel="noreferrer">stedy/Machine-Learning-with-R-datasets</a>.
        Described by its author as simulated from US Census demographic statistics. No licence is stated in the source repository; confirm reuse fits your course policy.
      </div>
    </>
  );
}

// ------------------------------------------------------------------- Explore
function SeedField({ seed, setSeed }) {
  return (
    <label className="f">Seed
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
  const [colorBy, setColorBy] = useState("smoker");

  const nn = Math.min(N, Math.max(1, Math.floor(n) || 1));
  const { sample, error } = useMemo(() => {
    try { return { sample: S.drawOne(method, population, nn, seed, strataCol) }; }
    catch (e) { return { error: e.message }; }
  }, [method, nn, seed, strataCol]);

  const colors = useMemo(() => {
    const names = groupCounts[colorBy].map(([g]) => g);
    return Object.fromEntries(names.map((g, i) => [g, PALETTE[i % PALETTE.length]]));
  }, [colorBy]);
  const groupOf = colorBy === "none" ? null : population.groups[colorBy];

  const design = method === "systematic" ? S.systematicDesign(N, nn) : null;
  const sampleSet = sample ? sample.indices : [];
  const diff = sample ? sample.estimate - TRUE_MEAN : 0;

  return (
    <div className="grid2">
      <div className="card">
        <h2>Settings</h2>
        <label className="f">Method
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="f">Sample size n (1 to {N.toLocaleString()})
          <input type="number" min="1" max={N} value={n} onChange={(e) => setN(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
        <SeedField seed={seed} setSeed={setSeed} />
        {method === "stratified" && (
          <label className="f">Stratify on
            <select value={strataCol} onChange={(e) => setStrataCol(e.target.value)}>
              {GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label className="f">Colour the people by
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
            <option value="none">nothing</option>
            {GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <p className="small muted">The same seed and settings always reproduce the same sample.</p>
      </div>

      <div>
        {error ? (
          <div className="err"><b>Can't draw this sample.</b> {error}. Choose a larger n, or a different stratification column.</div>
        ) : (
          <>
            <div className="card">
              <span className="tag warm">Single sample</span><span className="tag">Baseline population</span>
              <div className="stats">
                <div className="stat"><div className="l">True population mean</div><div className="v truec">{money(TRUE_MEAN)}</div></div>
                <div className="stat"><div className="l">This sample's estimate</div><div className="v samplec">{money(sample.estimate)}</div></div>
                <div className="stat"><div className="l">Estimate − true mean</div><div className="v">{(diff >= 0 ? "+" : "") + money(diff)}</div></div>
                <div className="stat"><div className="l">Rows sampled</div><div className="v">{sampleSet.length}</div></div>
              </div>
              <RowStrip values={population.values} sampled={sampleSet} groupOf={groupOf} groupColors={colors} trueMean={TRUE_MEAN} sampleMean={sample.estimate} />
              <div className="legend">
                <span><i style={{ background: "#1f6f70" }} />true mean</span>
                <span><i style={{ background: "#c8553d" }} />sample estimate</span>
                <span><span className="sw" style={{ background: "#c8553d" }} />sampled rows</span>
                {groupOf && groupCounts[colorBy].map(([g]) => <span key={g}><span className="sw" style={{ background: colors[g] }} />{g}</span>)}
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>
                Each bar is one person, in file order; bar height is <code>{TARGET}</code>.
                {method === "systematic" && " The file order has no documented meaning here (it is not a time sequence), so stepping through it means something different from sampling a chronological record."}
              </p>
            </div>

            <div className="grid3">
              <div className="card">
                <h3>All charges, with the sample</h3>
                <Histogram values={population.values} domain={[0, Math.ceil(POP_MAX / 10000) * 10000]} color="#cfdcdd"
                  lines={[{ x: TRUE_MEAN, color: "#1f6f70", dash: true }, { x: sample.estimate, color: "#c8553d" }]} label="Histogram of all charges" />
                <Histogram values={sampleSet.map((i) => population.values[i])} domain={[0, Math.ceil(POP_MAX / 10000) * 10000]} color="#e8a495" height={110}
                  lines={[{ x: sample.estimate, color: "#c8553d" }]} label="Histogram of sampled charges" />
                <p className="small muted">Top: everyone. Bottom: the sampled rows only.</p>
              </div>
              {groupOf && (
                <div className="card">
                  <h3>Who got sampled? <code>{colorBy}</code></h3>
                  <table>
                    <thead><tr><th>Group</th><th className="num">Population</th><th className="num">Sample</th></tr></thead>
                    <tbody>
                      {groupCounts[colorBy].map(([g, k]) => {
                        const c = sampleSet.filter((i) => groupOf[i] === g).length;
                        return (
                          <tr key={g}>
                            <td><span className="sw" style={{ background: colors[g] }} />{g}</td>
                            <td className="num">{((100 * k) / N).toFixed(1)}%</td>
                            <td className="num">{sampleSet.length ? ((100 * c) / sampleSet.length).toFixed(1) : 0}% <span className="muted">({c})</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="small muted">Compare each group's share of the sample with its share of the population.</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3>How this sample was chosen</h3>
              <p>{RULES[method]}</p>
              {design && (
                <p className="small"><b>Design that applies:</b> {design.kind}. N ÷ n = {N} ÷ {nn} = {design.k.toFixed(3).replace(/\.?0+$/, "")}.{" "}
                  {design.whole ? <>Random start r in 1..{design.k}: rows r, r+{design.k}, r+{2 * design.k}, … (start used: {sample.start}).</> : <>Start u uniform in (0, k]; rows ⌈u + j·k⌉ for j = 0..{nn - 1} (start used: {sample.start.toFixed(3)}).</>}</p>
              )}
              {method === "stratified" && (
                <>
                  <p className="small">Proportional allocation (largest-remainder rounding, at least 1 per group, never above the group size, total = n). Within each group: simple random sample without replacement.</p>
                  <table>
                    <thead><tr><th>{strataCol}</th><th className="num">Group size</th><th className="num">Weight</th><th className="num">Allocated</th></tr></thead>
                    <tbody>
                      {sample.strata.map((s, h) => (
                        <tr key={s.name}><td>{s.name}</td><td className="num">{s.size.toLocaleString()}</td><td className="num">{(s.size / N).toFixed(4)}</td><td className="num">{sample.alloc[h]}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              <p className="small muted" style={{ marginTop: 8 }}>
                Population: baseline · {population.file} · N = {N.toLocaleString()} · method: {METHODS[method]}
                {method === "stratified" && ` (on ${strataCol})`} · n = {nn} · seed {seed}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------- Experiments
function ResultCard({ r, domain, strataCol }) {
  return (
    <div className="card">
      <h2>{METHODS[r.method]} <span className="tag">{r.type}</span></h2>
      <div className="stats">
        <div className="stat"><div className="l">Bias</div><div className="v">{(r.bias >= 0 ? "+" : "") + money(r.bias)}</div></div>
        <div className="stat"><div className="l">SD</div><div className="v">{money(r.sd)}</div></div>
        <div className="stat"><div className="l">RMSE</div><div className="v">{money(r.rmse)}</div></div>
      </div>
      <Histogram values={r.estimates} domain={domain} bins={30} color="#9db9ba" height={150}
        lines={[{ x: r.trueMean, color: "#1f6f70", dash: true }, { x: r.meanOfEstimates, color: "#c8553d" }]} label={`Distribution of ${r.count} estimates`} />
      <div className="legend">
        <span><i style={{ background: "#1f6f70" }} />true mean {money(r.trueMean)}</span>
        <span><i style={{ background: "#c8553d" }} />mean of estimates</span>
      </div>
      <p className="meta" style={{ marginTop: 8 }}>
        <b>Population:</b> baseline ({N.toLocaleString()} rows) · <b>n</b> {r.n} · <b>{r.type === "exact" ? "Starts (all enumerated)" : "Repetitions"}:</b> {r.count}<br />
        <b>Seed:</b> {r.type === "exact" ? "none needed (exact)" : r.seed} · <b>Settings:</b> {r.settings}
      </p>
    </div>
  );
}

function domainFor(results) {
  let lo = Infinity, hi = -Infinity;
  for (const r of results) {
    for (const e of r.estimates) { lo = Math.min(lo, e); hi = Math.max(hi, e); }
    lo = Math.min(lo, r.trueMean); hi = Math.max(hi, r.trueMean);
  }
  const pad = (hi - lo) * 0.08 || 100;
  return [Math.max(0, lo - pad), hi + pad];
}

function ExperimentTab({ title, intro, conditions }) {
  const [seed, setSeed] = useState(2026);
  const [reps, setReps] = useState(100);
  const [strataCol, setStrataCol] = useState("smoker");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const needsStrata = conditions.some((c) => c.method === "stratified");

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      setResults(conditions.map((c) => ({ ...S.repeatedResult({ ...c, pop: population, reps, seed, strataCol }) })));
      setBusy(false);
    }, 10);
  };

  return (
    <>
      <div className="card">
        <h2>{title}</h2>
        <p>{intro}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>
          <SeedField seed={seed} setSeed={setSeed} />
          <label className="f">Repetitions (separate samples)
            <select value={reps} onChange={(e) => setReps(Number(e.target.value))}>
              {[100, 250, 500, 1000].map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          {needsStrata && (
            <label className="f">Stratify on
              <select value={strataCol} onChange={(e) => setStrataCol(e.target.value)}>
                {GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          )}
          <div style={{ marginBottom: 12 }}><button className="btn" onClick={run} disabled={busy}>{busy ? "Running…" : results ? "Run again (replaces results)" : "Run"}</button></div>
        </div>
        <p className="small muted">
          100 repetitions usually reveal the main pattern; 1,000 give smoother distributions and more stable bias, SD and RMSE. Neither guarantees stable results, and 100 repetitions cannot reliably separate small differences between methods: rerun with different seeds to check. Sample size and repetitions are separate settings: n is the rows in one sample; repetitions is how many samples are drawn. Systematic sampling with a whole-number interval uses exact enumeration (all starts), so it ignores the seed and repetitions.
        </p>
      </div>
      {results && (
        <>
          <div className="grid3">
            {results.map((r, i) => <ResultCard key={i} r={r} domain={domainFor(results)} />)}
          </div>
          <p className="small muted">Each result is one condition on its own. Bias = mean of estimates − true mean; SD = spread of the estimates across repetitions; RMSE = √(mean of (estimate − true mean)²). All in US dollars.</p>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Shell
const TABS = [
  ["pop", "The population"],
  ["explore", "Explore a sample"],
  ["methods", "Compare methods"],
  ["size", "Sample size"],
];

export default function App() {
  const [tab, setTab] = useState(TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : "pop");
  return (
    <>
      <header className="top">
        <div className="row">
          <div>
            <h1>Judge the Sample</h1>
            <div className="question">Which sampling method would you trust for this population, at what sample size, and with what limits?</div>
          </div>
          <TrueMeanBadge />
        </div>
      </header>
      <nav className="tabs">
        {TABS.map(([k, label]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>)}
      </nav>
      <main>
        {tab === "pop" && <PopulationTab />}
        {tab === "explore" && <ExploreTab />}
        {tab === "methods" && (
          <ExperimentTab key="m" title="Experiment A: three methods at n = 100" intro="Simple random, systematic and stratified sampling on the baseline population, each with the same total n = 100 and the same seed." conditions={[{ method: "srs", n: 100 }, { method: "systematic", n: 100 }, { method: "stratified", n: 100 }]} />
        )}
        {tab === "size" && (
          <ExperimentTab key="s" title="Experiment B: simple random sampling at n = 1, 10 and 100" intro="Same population and method; only the sample size changes. With the same seed and repetitions, the n = 100 result matches the simple random result in Experiment A." conditions={[{ method: "srs", n: 1 }, { method: "srs", n: 10 }, { method: "srs", n: 100 }]} />
        )}
      </main>
      <footer>
        Baseline population: <code>{population.file}</code> ({N.toLocaleString()} people). A teaching dataset, not real patient records or a representative sample of current claims.
      </footer>
    </>
  );
}
