import React, { useEffect, useMemo, useState } from "react";
import { population } from "./data.js";
import * as S from "./sampling.js";
import { RowBars, StripRow, ACCENT, money, money0, signed } from "./charts.jsx";

const N = population.values.length;
const METHOD_NAMES = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };
const METHOD_ORDER = ["srs", "systematic", "stratified"];

// ---- #5: a plain "how to read this" caption. Reading instructions only, never interpretation.
export function HowTo({ children }) {
  return <p className="howto"><b>How to read this:</b> {children}</p>;
}

// ---- #6: what bias, SD and RMSE mean, with formulas.
export function MeasuresPanel() {
  return (
    <details className="measures">
      <summary>How to read bias, SD and RMSE</summary>
      <dl>
        <dt>Estimate</dt>
        <dd>The number one sample gives for the true mean. A repeated experiment draws many separate samples, so it produces many estimates.</dd>
        <dt>Bias</dt>
        <dd><b>mean of the estimates − true mean.</b> It asks whether the estimates are off target on average. It is measured against the true mean of the population the samples came from. With random repetitions it is rarely exactly zero, even for an unbiased method, and a small nonzero value can be simulation noise.</dd>
        <dt>SD (of the estimates)</dt>
        <dd><b>the spread of the estimates across repetitions</b>, dividing by the number of repetitions. It asks how much estimates vary from sample to sample. It is <i>not</i> the spread of individual charges in the file.</dd>
        <dt>RMSE</dt>
        <dd><b>√( mean of (estimate − true mean)² )</b>: the typical size of the error of one estimate, combining bias and variability. RMSE² = bias² + SD².</dd>
        <dt>Units</dt>
        <dd>All three are in US dollars, the same units as <code>charges</code>.</dd>
      </dl>
    </details>
  );
}

// ---- #7: draw more single samples and watch the estimates pile up against the true mean.
const domainOf = (xs, tm) => {
  const lo = Math.min(tm, ...xs), hi = Math.max(tm, ...xs), pad = (hi - lo) * 0.08 || 100;
  return [Math.max(0, lo - pad), hi + pad];
};

export function DrawMore({ method, n, seed, strataCol, first, trueMean }) {
  const [extra, setExtra] = useState(0);
  useEffect(() => { setExtra(0); }, [method, n, seed, strataCol]);

  const draws = useMemo(() => {
    const out = [first];
    for (let j = 1; j <= extra; j++) {
      // draw j uses its own seed derived from the seed shown above, so the whole sequence is reproducible
      out.push(S.drawOne(method, population, n, (seed + 1000003 * j) >>> 0, strataCol).estimate);
    }
    return out;
  }, [method, n, seed, strataCol, extra, first]);

  const m = S.mean(draws);
  const sd = Math.sqrt(S.mean(draws.map((x) => (x - m) ** 2)));
  const add = (k) => setExtra((e) => Math.min(1000, e + k));

  return (
    <section className="block">
      <h2>Draw more samples</h2>
      <p className="sub">The sample above is one draw. Add more draws with the same method, n and settings, and watch where their estimates land compared with the true mean. This is an exploration tool: the recorded experiments are on the Compare methods, Sample size and Challenge tabs.</p>
      <div className="chart">
        <div className="actions" style={{ marginTop: 0, marginBottom: 10 }}>
          <button className="btn ghost" onClick={() => add(1)}>Draw 1 more</button>
          <button className="btn ghost" onClick={() => add(10)}>Draw 10 more</button>
          <button className="btn ghost" onClick={() => add(100)}>Draw 100 more</button>
          <button className="btn ghost" onClick={() => setExtra(0)} disabled={extra === 0}>Back to one sample</button>
        </div>
        <StripRow estimates={draws} domain={domainOf(draws, trueMean)} trueMean={trueMean} meanOfEstimates={m} axis tickSize={8.5} label={`${draws.length} estimates from ${draws.length} samples`} />
        <div className="legend">
          <span><span className="sw" style={{ background: ACCENT, opacity: 0.5 }} />one dot = one sample's estimate</span>
          <span><span className="key" style={{ borderTop: 0, width: 3, height: 12, background: "var(--ink)", borderRadius: 2 }} /> mean of the estimates so far</span>
          <span><span className="key dash" /> true mean {money(trueMean)}</span>
        </div>
        <HowTo>Each dot is the estimate from one separate sample of {n} {n === 1 ? "person" : "people"}. The black tick is the average of the dots so far and the gold dashed line is the true mean of everyone. Dots far apart mean the estimates vary a lot from sample to sample.</HowTo>
        <p className="meta">
          <b>{draws.length}</b> {draws.length === 1 ? "sample" : "samples"} drawn · {METHOD_NAMES[method]}{method === "stratified" ? ` on ${strataCol}` : ""} · n = {n} · seed {seed} (draw 1 uses this seed; later draws use seeds derived from it, so the same clicks give the same dots)
          {draws.length > 1 && <> · mean of the estimates {money(m)} · SD of the estimates {money(sd)} · range {money0(Math.min(...draws))} to {money0(Math.max(...draws))}</>}
        </p>
        <p className="note">A handful of draws is only a rough picture. For stable bias, SD and RMSE use at least 100 repetitions on the experiment tabs.</p>
      </div>
    </section>
  );
}

// ---- #8: two methods, same n and seed, side by side.
export function SideBySide({ methodA, n, seed, strataCol, sampleA }) {
  const [on, setOn] = useState(false);
  const [methodB, setMethodB] = useState(METHOD_ORDER.find((m) => m !== methodA));
  useEffect(() => { if (methodB === methodA) setMethodB(METHOD_ORDER.find((m) => m !== methodA)); }, [methodA, methodB]);

  const b = useMemo(() => {
    if (!on) return null;
    try { return { sample: S.drawOne(methodB, population, n, seed, strataCol) }; } catch (e) { return { error: e.message }; }
  }, [on, methodB, n, seed, strataCol]);

  const setA = useMemo(() => new Set(sampleA.indices), [sampleA]);
  const overlap = b && b.sample ? b.sample.indices.filter((i) => setA.has(i)).length : 0;
  const tm = S.trueMean(population.values);

  const card = (label, sample, color) => (
    <div className="chart">
      <h3 style={{ textTransform: "none", fontSize: 15, color: "var(--ink)" }}>{label}</h3>
      <div className="stats" style={{ display: "flex", gap: 26, flexWrap: "wrap", margin: "4px 0 6px" }}>
        <div><div className="small muted">Estimate</div><b style={{ fontSize: 20 }}>{money(sample.estimate)}</b></div>
        <div><div className="small muted">Estimate − true mean</div><b style={{ fontSize: 20 }}>{signed(sample.estimate - tm)}</b></div>
        <div><div className="small muted">People sampled</div><b style={{ fontSize: 20 }}>{sample.indices.length}</b></div>
      </div>
      <RowBars values={population.values} sampled={sample.indices} colorOf={() => color} groupOf={null} trueMean={tm} est={sample.estimate} />
      <details style={{ marginTop: 6 }}>
        <summary>Selected row numbers ({sample.indices.length}, in file order)</summary>
        <p className="small" style={{ fontFamily: "ui-monospace, Menlo, monospace", lineHeight: 1.9, wordBreak: "break-word" }}>{sample.indices.map((i) => i + 1).join(", ")}</p>
      </details>
    </div>
  );

  return (
    <section className="block">
      <h2>Compare two methods side by side</h2>
      <p className="sub">Same n, same seed and same stratification column for both. Only the method changes, so you can see which people each method picks.</p>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} style={{ minWidth: 0, width: "auto" }} /> Show a second method
        </label>
        {on && (
          <label>Second method
            <select value={methodB} onChange={(e) => setMethodB(e.target.value)}>
              {METHOD_ORDER.filter((m) => m !== methodA).map((m) => <option key={m} value={m}>{METHOD_NAMES[m]}</option>)}
            </select>
          </label>
        )}
      </div>
      {on && b && b.error && <div className="err"><b>Can't draw the second sample.</b> {b.error}. Choose a larger n or a different method.</div>}
      {on && b && b.sample && (
        <>
          {card(`A · ${METHOD_NAMES[methodA]}`, sampleA, ACCENT)}
          {card(`B · ${METHOD_NAMES[methodB]}`, b.sample, "var(--s2)")}
          <HowTo>Each chart has one bar per person in file order, as on the chart above. Coloured bars are the people that method picked. The two lines mark the true mean of everyone and that sample's mean.</HowTo>
          <p className="meta">
            <b>{overlap}</b> {overlap === 1 ? "person was" : "people were"} picked by both methods ({((100 * overlap) / n).toFixed(1)}% of n = {n}). Baseline population · N = {N.toLocaleString()} · n = {n} · seed {seed}. These are two single samples, not repeated results.
          </p>
        </>
      )}
    </section>
  );
}
