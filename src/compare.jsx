import React, { useState } from "react";
import * as S from "./sampling.js";
import { money, signed } from "./charts.jsx";

const METHODS = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };
const key = (r) => `${r.method}|${r.n}|${r.label || ""}`;
const nameOf = (r) => `${METHODS[r.method]}${r.label ? " · " + r.label : ""}, n = ${r.n}`;

// Holds one earlier run beside the current one. Each run stays its own labelled set; nothing is combined.
export function PreviousRun({ out, getLabelSettings }) {
  const [prev, setPrev] = useState(null);
  const describe = (o) => `seed ${o.seed} · ${o.reps} repetitions${o.strataCol ? ` · stratify on ${o.strataCol}` : ""}${getLabelSettings ? " · " + getLabelSettings(o) : ""}`;
  const same = prev && prev.out === out;
  return (
    <section className="block">
      <h2>Compare with an earlier run</h2>
      <p className="sub">Keep the run on screen as a reference, change the seed or repetitions above and run again, then compare the two side by side. The two runs are always shown separately and never combined.</p>
      <div className="actions" style={{ marginTop: 0 }}>
        <button type="button" className="btn ghost" onClick={() => setPrev({ out, note: describe(out) })}>Keep this run as the reference</button>
        {prev && <button type="button" className="btn ghost" onClick={() => setPrev(null)}>Clear the reference</button>}
      </div>
      {!prev && <p className="note">No reference kept yet. Press the button above, then run again with different settings.</p>}
      {prev && same && <p className="note">The reference is the run currently on screen. Run again with a different seed or repetitions to compare.</p>}
      {prev && !same && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table>
              <caption className="small muted" style={{ textAlign: "left", paddingBottom: 6 }}>Reference run: {prev.note}. Current run: {describe(out)}.</caption>
              <thead><tr><th>Condition</th><th className="num">Bias: reference</th><th className="num">Bias: current</th><th className="num">SD: reference</th><th className="num">SD: current</th><th className="num">RMSE: reference</th><th className="num">RMSE: current</th></tr></thead>
              <tbody>{out.results.map((r) => {
                const p = prev.out.results.find((x) => key(x) === key(r));
                return (
                  <tr key={key(r)}>
                    <td>{nameOf(r)}</td>
                    <td className="num">{p ? signed(p.bias) : "not in the reference"}</td><td className="num">{signed(r.bias)}</td>
                    <td className="num">{p ? money(p.sd) : "–"}</td><td className="num">{money(r.sd)}</td>
                    <td className="num">{p ? money(p.rmse) : "–"}</td><td className="num">{money(r.rmse)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <p className="meta">Both runs use the baseline file; each result is measured against the true mean of its own population. Exact (whole-number systematic) results do not depend on the seed.</p>
        </>
      )}
    </section>
  );
}

// Percentiles and skewness of the estimates themselves (descriptive summaries of the dots).
export function ShapeTable({ results }) {
  return (
    <details>
      <summary>View the shape of each row's estimates (percentiles and skewness)</summary>
      <p className="small muted">The middle 90% of a row's estimates lies between its 5th and 95th percentile. Skewness near 0 means the estimates are balanced either side of their average; a positive value means a longer tail of high estimates.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Condition</th><th className="num">Lowest</th><th className="num">5th pct</th><th className="num">Median</th><th className="num">95th pct</th><th className="num">Highest</th><th className="num">Skewness</th></tr></thead>
          <tbody>{results.map((r) => {
            const h = S.shapeOf(r.estimates);
            return <tr key={key(r)}><td>{nameOf(r)}</td><td className="num">{money(h.min)}</td><td className="num">{money(h.p5)}</td><td className="num">{money(h.median)}</td><td className="num">{money(h.p95)}</td><td className="num">{money(h.max)}</td><td className="num">{h.skew.toFixed(2)}</td></tr>;
          })}</tbody>
        </table>
      </div>
    </details>
  );
}

// Plain-language restatement of the settings that make the modified copy (no interpretation).
export function ChallengeSummary({ out }) {
  return (
    <div className="callout" style={{ marginTop: 0 }}>
      <b>What the modified copy is, in plain words</b>
      <ul>
        <li>Take the <b>{out.count}</b> people with <code>{out.col}</code> = <b>{out.value}</b> who have the highest charges.</li>
        <li>Place them about every <b>{out.k.toFixed(2)}</b> rows down the file, starting at the top (row <code>round(1 + j × {out.k.toFixed(2)})</code> for j = 0, 1, 2, …).</li>
        <li>Everyone else keeps their original relative order. <b>Only the order changes</b>, so the true mean is unchanged.</li>
        <li>Every result below uses the same sample size, <b>n = {out.n}</b>, the same seed, <b>{out.seed}</b>, and <b>{out.reps}</b> repetitions, and is measured against the true mean of its own population.</li>
      </ul>
    </div>
  );
}
