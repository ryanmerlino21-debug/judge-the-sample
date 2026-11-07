import React, { useState } from "react";
import { ResultBars, ConvergenceChart, SLOTS, ACCENT, money, signed } from "./charts.jsx";
import { HowTo, Toggle, SaveBtn } from "./extras.jsx";

const METHODS = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };
const MORDER = ["srs", "systematic", "stratified"];
const labelOf = (r, mode) => (mode === "size" ? `n = ${r.n}` : mode === "challenge" ? `${METHODS[r.method]}` : METHODS[r.method]);
const subOf = (r, mode) => (mode === "challenge" ? `${r.label} · ${r.type}` : r.type === "exact" ? "exact" : "Monte Carlo");
const colorOf = (r, mode) => (mode === "challenge" ? (r.label === "modified" ? "var(--s2)" : ACCENT) : mode === "size" ? SLOTS[[1, 10, 100].indexOf(r.n) % 3] : SLOTS[MORDER.indexOf(r.method) % 3]);

// Bars of bias, SD or RMSE: an alternative to reading the numbers off the table.
export function ResultSummary({ results, mode }) {
  const [metric, setMetric] = useState("sd");
  const rows = results.map((r) => ({ label: labelOf(r, mode), sub: subOf(r, mode), bias: r.bias, sd: r.sd, rmse: r.rmse, color: colorOf(r, mode) }));
  return (
    <>
      <div className="opts"><Toggle label="Compare" value={metric} onChange={setMetric} options={[["bias", "Bias"], ["sd", "SD"], ["rmse", "RMSE"]]} /></div>
      <div className="chart">
        <SaveBtn name={"summary-" + metric} />
        <ResultBars rows={rows} metric={metric} />
        {mode === "challenge" && <div className="legend"><span><span className="sw sq" style={{ background: ACCENT }} />baseline</span><span><span className="sw sq" style={{ background: "var(--s2)" }} />modified copy</span></div>}
        <HowTo>One bar per condition, in US dollars. {metric === "bias" ? "Bars to the right of the centre line are estimates that averaged above the true mean; bars to the left averaged below it. Each result is measured against the true mean of its own population." : metric === "sd" ? "A longer bar means the estimates are more spread out from sample to sample." : "A longer bar means a larger typical error, combining bias and spread."} These are the same numbers as the table, drawn as bars.</HowTo>
      </div>
    </>
  );
}

// How the running bias or SD settles as repetitions accumulate.
export function StabilityCard({ results, mode }) {
  const [row, setRow] = useState(0);
  const [metric, setMetric] = useState("sd");
  const r = results[Math.min(row, results.length - 1)];
  const name = (x) => (mode === "challenge" ? `${METHODS[x.method]} · ${x.label}` : mode === "size" ? `Simple random, n = ${x.n}` : `${METHODS[x.method]}, n = ${x.n}`);
  return (
    <section className="block">
      <h2>How stable is this result?</h2>
      <p className="sub">The running {metric === "sd" ? "SD" : "bias"} of the estimates after each repetition. Early on it moves a lot because it rests on few samples; the line shows how much it still moves as repetitions are added.</p>
      <div className="opts">
        <label className="inl">Condition <select value={row} onChange={(e) => setRow(Number(e.target.value))} style={{ font: "inherit", padding: "4px 6px", borderRadius: 6 }}>{results.map((x, i) => <option key={i} value={i}>{name(x)}</option>)}</select></label>
        <Toggle label="Show" value={metric} onChange={setMetric} options={[["sd", "SD so far"], ["bias", "Bias so far"]]} />
      </div>
      <div className="chart">
        <SaveBtn name="stability" />
        {r.type === "exact" ? <p className="note">This result is exact (every start is listed), so it does not depend on repetitions.</p> : <ConvergenceChart estimates={r.estimates} trueMean={r.trueMean} metric={metric} />}
        <HowTo>The horizontal axis counts repetitions. The line is the {metric === "sd" ? "SD" : "bias"} of the first k estimates, for each k. {metric === "bias" ? "The gold dashed line is zero bias. A running bias that wanders around zero is typical simulation noise." : "If the line is still drifting at the right edge, more repetitions would change the number."} This describes this one run of {name(r)}; a different seed gives a different path.</HowTo>
      </div>
    </section>
  );
}
