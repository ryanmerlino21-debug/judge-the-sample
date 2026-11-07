import React, { useState } from "react";
import { population } from "./data.js";
import * as S from "./sampling.js";
import { niceTicks, money, money0, moneyK, signed, ACCENT } from "./charts.jsx";
import { HowTo, Toggle, SaveBtn } from "./extras.jsx";

const fmtMetric = { bias: signed, sd: money, rmse: money };
const metricName = { bias: "Bias", sd: "SD", rmse: "RMSE" };
const tick = (x) => moneyK(x);
const sleep = () => new Promise((r) => setTimeout(r, 0));

// ---- One dot per seed, one row per condition, for the chosen measure.
function SeedDots({ rows, metric, seeds }) {
  const W = 900, LBL = 250, R = 24, rowH = 34, T = 12, B = 34, H = T + rows.length * rowH + B;
  const vals = rows.flatMap((r) => r.values);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (metric !== "bias") lo = 0; else { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const pad = (hi - lo) * 0.08 || 50; hi += pad; if (metric === "bias") lo -= pad;
  const x = (v) => LBL + ((v - lo) / (hi - lo || 1)) * (W - LBL - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metricName[metric]} for each condition, one dot per seed`}>
      {niceTicks(lo, hi, 5).map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={T} y2={H - B} strokeWidth="1" style={{ stroke: "var(--grid)" }} />
          <text x={x(t)} y={H - 12} fontSize="11" textAnchor="middle" style={{ fill: "var(--muted)" }}>{metric === "bias" ? (t < 0 ? "−" : t > 0 ? "+" : "") + moneyK(Math.abs(t)) : tick(t)}</text>
        </g>
      ))}
      {metric === "bias" && <line x1={x(0)} x2={x(0)} y1={T} y2={H - B} strokeWidth="2" strokeDasharray="6 4" style={{ stroke: "var(--truec)" }} />}
      {rows.map((r, i) => {
        const y = T + i * rowH + rowH / 2;
        return (
          <g key={r.label}>
            <text x={LBL - 10} y={y + 4} fontSize="12.5" textAnchor="end" style={{ fill: "var(--ink)" }}>{r.label}</text>
            <line x1={LBL} x2={W - R} y1={y} y2={y} strokeWidth="1" style={{ stroke: "var(--grid)" }} />
            {r.values.map((v, j) => (
              <circle key={j} cx={x(v)} cy={y} r="5.5" strokeWidth={j === 0 ? 2 : 1.2} style={{ fill: ACCENT, stroke: j === 0 ? "var(--ink)" : "var(--surface)" }} opacity="0.8">
                <title>{`${r.label} · seed ${seeds[j]}${j === 0 ? " (your current seed)" : ""}: ${fmtMetric[metric](v)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ---- Run the same experiment at several seeds and show each seed as its own result (never pooled).
export function SeedCheck({ baseSeed, reps, runSeed, rowLabel, disabled = false, name = "seed-check" }) {
  const [count, setCount] = useState(5);
  const [metric, setMetric] = useState("sd");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);

  const run = async () => {
    setBusy(true); setProg(0);
    const seeds = S.seedList(baseSeed, count), byseed = [];
    for (let j = 0; j < seeds.length; j++) { await sleep(); byseed.push(runSeed(seeds[j])); setProg(j + 1); }
    setRes({ seeds, byseed, reps });
    setBusy(false);
  };

  const rows = res ? res.byseed[0].map((r0, k) => ({
    label: rowLabel(r0), type: r0.type, values: res.byseed.map((b) => b[k][metric]), all: res.byseed.map((b) => b[k]),
  })) : [];

  const csv = () => {
    const head = ["Condition", "Seed", "Type", "n", "Repetitions or starts", "True mean", "Bias", "SD", "RMSE"];
    const lines = [head];
    res.byseed.forEach((b, j) => b.forEach((r) => lines.push([`"${rowLabel(r)}"`, r.type === "exact" ? "exact" : res.seeds[j], r.type, r.n, r.count, r.trueMean.toFixed(2), r.bias.toFixed(2), r.sd.toFixed(2), r.rmse.toFixed(2)])));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.map((l) => l.join(",")).join("\n")], { type: "text/csv" })); a.download = `${name}.csv`; a.click();
  };

  return (
    <section className="block">
      <h2>Check several seeds</h2>
      <p className="sub">Run this same experiment again at more seeds, with the same settings, to see how much each number depends on the seed. Every seed is a separate result, measured against the true mean of its own population, and nothing is pooled.</p>
      <div className="toolbar">
        <label>Number of seeds
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>{[3, 5, 10].map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <div className="small muted" style={{ maxWidth: 360 }}>Seeds used: your current seed {baseSeed}, then {count - 1} more derived from it. Repetitions: {reps}.</div>
        <button className="btn" onClick={run} disabled={busy || disabled}>{busy ? `Running seed ${Math.min(prog + 1, count)} of ${count}…` : res ? "Run again (replaces results)" : "Run the seed check"}</button>
      </div>
      {busy && <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax={count} aria-valuenow={prog}><div style={{ width: `${(100 * prog) / count}%` }} /></div>}
      {res && (
        <>
          <div className="opts"><Toggle label="Show" value={metric} onChange={setMetric} options={[["bias", "Bias"], ["sd", "SD"], ["rmse", "RMSE"]]} /></div>
          <div className="chart">
            <SaveBtn name={name} />
            <SeedDots rows={rows} metric={metric} seeds={res.seeds} />
            <HowTo>Each dot is one seed's result for that row; the dot with a dark ring is your current seed. {metric === "bias" ? "The gold dashed line marks zero bias (the estimates average out to the true mean)." : "Further right means more spread in the estimates."} The closer the dots in a row are to each other, the less that number depends on the seed.</HowTo>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <caption className="small muted" style={{ textAlign: "left", paddingBottom: 6 }}>{metricName[metric]} for each seed ({res.reps} repetitions each; Monte Carlo rows use the seed, exact rows do not).</caption>
              <thead><tr><th>Condition</th>{res.seeds.map((sd, j) => <th key={sd} className="num">{j === 0 ? `Seed ${sd} (current)` : `Seed ${sd}`}</th>)}<th className="num">Range across seeds</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.label}><td>{r.label} <span className="tag">{r.type}</span></td>{r.values.map((v, j) => <td key={j} className="num">{fmtMetric[metric](v)}</td>)}<td className="num">{fmtMetric[metric](Math.min(...r.values))} to {fmtMetric[metric](Math.max(...r.values))}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="actions"><button className="btn ghost" onClick={csv}>Download every seed's results (CSV)</button></div>
        </>
      )}
    </section>
  );
}

// ---- Simple random sampling at many sample sizes: spread of the estimates against n.
const SIZES = [1, 2, 5, 10, 20, 50, 100, 200, 500];
function SizeCurve({ rows, metric, logX }) {
  const W = 900, H = 320, L = 74, R = 26, T = 20, B = 52;
  const xs = (n) => (logX ? Math.log10(n) : n), lo = xs(SIZES[0]), hi = xs(SIZES[SIZES.length - 1]);
  const X = (n) => L + ((xs(n) - lo) / (hi - lo || 1)) * (W - L - R);
  const maxV = Math.max(...rows.map((r) => r[metric]), 1) * 1.08;
  const Y = (v) => T + (H - T - B) * (1 - v / maxV);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metricName[metric]} of the estimates against sample size`}>
      {niceTicks(0, maxV, 5).map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} strokeWidth="1" style={{ stroke: "var(--grid)" }} />
          <text x={L - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" style={{ fill: "var(--muted)" }}>{moneyK(t)}</text>
        </g>
      ))}
      <polyline points={rows.map((r) => `${X(r.n)},${Y(r[metric])}`).join(" ")} fill="none" strokeWidth="2.4" strokeLinejoin="round" style={{ stroke: ACCENT }} />
      {rows.map((r) => (
        <g key={r.n}>
          <circle cx={X(r.n)} cy={Y(r[metric])} r="5" strokeWidth="1.6" style={{ fill: ACCENT, stroke: "var(--surface)" }}><title>{`n = ${r.n}: ${metricName[metric]} ${money(r[metric])}`}</title></circle>
          <text x={X(r.n)} y={H - B + 18} fontSize="11.5" textAnchor="middle" style={{ fill: "var(--ink2)" }}>{r.n}</text>
          <text x={X(r.n)} y={Y(r[metric]) - 10} fontSize="11" textAnchor="middle" style={{ fill: "var(--ink)" }}>{money0(r[metric])}</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={{ stroke: "var(--axis)" }} />
      <text x={(L + W - R) / 2} y={H - 8} fontSize="11.5" textAnchor="middle" style={{ fill: "var(--muted)" }}>sample size n {logX ? "(spaced by ratio, so each doubling takes similar room)" : "(to scale)"}</text>
    </svg>
  );
}

export function SampleSizeCurve({ seed, reps }) {
  const [res, setRes] = useState(null);
  const [metric, setMetric] = useState("sd");
  const [logX, setLogX] = useState(true);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const run = async () => {
    setBusy(true); setProg(0);
    const out = [];
    for (let j = 0; j < SIZES.length; j++) {
      await sleep();
      out.push(S.repeatedResult({ method: "srs", pop: population, n: SIZES[j], reps, seed }));
      setProg(j + 1);
    }
    setRes({ rows: out, seed, reps });
    setBusy(false);
  };
  return (
    <section className="block">
      <h2>Spread of the estimates at more sample sizes</h2>
      <p className="sub">Experiment B uses n = 1, 10 and 100. This optional extension runs simple random sampling at {SIZES.length} sample sizes with the same seed and repetitions, each one a separate Monte Carlo result.</p>
      <div className="toolbar">
        <div className="small muted">Sizes: {SIZES.join(", ")} · seed {seed} · {reps} repetitions each</div>
        <button className="btn" onClick={run} disabled={busy}>{busy ? `Running size ${Math.min(prog + 1, SIZES.length)} of ${SIZES.length}…` : res ? "Run again (replaces results)" : "Run the sample-size curve"}</button>
      </div>
      {busy && <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax={SIZES.length} aria-valuenow={prog}><div style={{ width: `${(100 * prog) / SIZES.length}%` }} /></div>}
      {res && (
        <>
          <div className="opts">
            <Toggle label="Show" value={metric} onChange={setMetric} options={[["sd", "SD"], ["rmse", "RMSE"]]} />
            <Toggle label="Horizontal axis" value={logX ? "log" : "lin"} onChange={(v) => setLogX(v === "log")} options={[["log", "Spaced by ratio"], ["lin", "To scale"]]} />
          </div>
          <div className="chart">
            <SaveBtn name="sample-size-curve" />
            <SizeCurve rows={res.rows} metric={metric} logX={logX} />
            <HowTo>Each dot is one sample size. Its height is the {metric === "sd" ? "SD" : "RMSE"} of the {res.reps} estimates at that size, in US dollars, so a lower dot means the estimates are less spread out. Each size is a separate result from the same seed.</HowTo>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th className="num">n</th><th>Type</th><th className="num">Repetitions</th><th className="num">Bias</th><th className="num">SD</th><th className="num">RMSE</th></tr></thead>
              <tbody>{res.rows.map((r) => <tr key={r.n}><td className="num">{r.n}</td><td>{r.type}</td><td className="num">{r.count}</td><td className="num">{signed(r.bias)}</td><td className="num">{money(r.sd)}</td><td className="num">{money(r.rmse)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="meta">Simple random sampling · baseline population ({population.file}) · Monte Carlo · seed {res.seed} · {res.reps} repetitions per size · true mean {money(res.rows[0].trueMean)}.</p>
        </>
      )}
    </section>
  );
}
