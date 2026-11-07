import React, { useContext, useState } from "react";
import { PatternContext } from "./ctx.js";
import { pickBucket } from "./sampling.js";

export const money = (x, d = 2) => (x < 0 ? "-$" : "$") + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money0 = (x) => money(x, 0);
export const moneyK = (x) => (x === 0 ? "$0" : Math.abs(x) >= 1000 ? "$" + +(x / 1000).toFixed(1) + "K" : "$" + x);
export const signed = (x) => (x >= 0 ? "+" : "−") + money(Math.abs(x));

// Categorical slots in fixed order (validated palette); text never wears them.
export const SLOTS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
export const ACCENT = "var(--accent)";
const fill = (c) => ({ fill: c });

// Texture fills: used only when "Patterns" is switched on, so identity never depends on hue alone.
export function PatternDefs() {
  const on = useContext(PatternContext);
  if (!on) return null;
  return (
    <defs>
      {SLOTS.map((c, i) => (
        <pattern key={i} id={`pat${i}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform={i === 2 ? "rotate(-45)" : "rotate(45)"}>
          <rect width="8" height="8" style={fill(c)} />
          {(i === 1 || i === 2) && <line x1="0" y1="0" x2="0" y2="8" strokeWidth="3" style={{ stroke: "var(--surface)" }} />}
          {i === 3 && <circle cx="4" cy="4" r="1.7" style={fill("var(--surface)")} />}
        </pattern>
      ))}
    </defs>
  );
}
export function useFill() {
  const on = useContext(PatternContext);
  return (c) => { const i = SLOTS.indexOf(c); return on && i > 0 ? `url(#pat${i})` : c; };
}
const stroke = (c) => ({ stroke: c });

const niceStep = (range, ticks) => {
  const raw = range / ticks, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};
export function niceTicks(lo, hi, ticks = 4) {
  const step = niceStep(hi - lo, ticks), out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(+t.toFixed(6));
  return out;
}

// Two labelled reference lines (true mean, sample estimate) that never overlap.
function RefLabels({ x, tx, ex, top }) {
  const estRight = ex == null || ex >= tx;
  return (
    <g fontSize="12" fontWeight="600">
      <text x={x(tx) + (estRight ? -6 : 6)} y={top} textAnchor={estRight ? "end" : "start"} style={fill("var(--ink2)")}>True mean {money0(tx)}</text>
      {ex != null && <text x={x(ex) + (estRight ? 6 : -6)} y={top} textAnchor={estRight ? "start" : "end"} style={fill("var(--ink)")}>Sample {money0(ex)}</text>}
    </g>
  );
}
function RefLines({ x, tx, ex, y0, y1 }) {
  return (
    <g>
      <line x1={x(tx)} x2={x(tx)} y1={y0} y2={y1} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />
      {ex != null && <line x1={x(ex)} x2={x(ex)} y1={y0} y2={y1} strokeWidth="2.4" style={stroke("var(--samplec)")} />}
    </g>
  );
}

// ---- 1. Every person as a bar, in file order. Sampled people are thick, dotted and colored.
// view: "bars" (default) | "dots" (one dot per person) | "sorted" (people ordered from lowest to highest charges).
// ticks: optional { rows: [1-based row numbers], start } shown under the axis for systematic sampling.
export function RowBars({ values, sampled, colorOf, groupOf, trueMean, est, view = "bars", ticks = null }) {
  const [hv, setHv] = useState(null);
  const N = values.length, W = 980, L = 52, R = 150, T = 18;
  const showTicks = !!ticks && view === "bars";
  const B = showTicks ? 58 : 36, H = 340;
  const top = Math.ceil(Math.max(...values) / 10000) * 10000;
  const bw = (W - L - R) / N;
  const Y = (v) => T + (H - T - B) * (1 - v / top);
  const sel = new Set(sampled);
  const yt = niceTicks(0, top, 4);
  let rank = null;
  if (view === "sorted") {
    rank = new Array(N);
    values.map((v, i) => i).sort((a, b) => values[a] - values[b] || a - b).forEach((i, r) => { rank[i] = r; });
  }
  const pos = (i) => (rank ? rank[i] : i);
  let inv = null;
  if (rank) { inv = new Array(N); rank.forEach((r, i) => { inv[r] = i; }); }
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect(), vx = ((e.clientX - r.left) * W) / r.width, p = Math.floor((vx - L) / bw);
    setHv(p < 0 || p >= N ? null : (inv ? inv[p] : p));
  };
  // right-margin labels, kept at least 40px apart
  const items = [{ k: "true", y: Y(trueMean), name: "True mean", val: trueMean, c: "var(--truec)", dash: true }];
  if (est != null) items.push({ k: "est", y: Y(est), name: "Sample estimate", val: est, c: "var(--samplec)" });
  items.sort((a, b) => a.y - b.y);
  const ly = items.map((it) => it.y);
  for (let i = 1; i < ly.length; i++) if (ly[i] - ly[i - 1] < 40) ly[i] = ly[i - 1] + 40;
  const xAxisText = view === "sorted" ? "each bar = one person, sorted from lowest to highest charges →" : view === "dots" ? "each dot = one person, in file order →" : "each bar = one person, in file order →";
  const leftText = view === "sorted" ? "lowest" : "row 1", rightText = view === "sorted" ? "highest" : `row ${N.toLocaleString()}`;
  const aria = view === "dots" ? "One dot per person in file order; height is charges; sampled people are large colored dots"
    : view === "sorted" ? "One bar per person sorted from lowest to highest charges; sampled people are thick colored bars with a dot on top"
    : "One bar per person in file order; bar height is charges; sampled people are thick colored bars with a dot on top";
  const hvText = hv == null ? "" : `Row ${hv + 1} · ${money0(values[hv])}${groupOf ? " · " + groupOf[hv] : ""}${sel.has(hv) ? " · in the sample" : ""}`;
  const hvW = hvText.length * 6.6 + 18, hvX = hv == null ? 0 : Math.min(Math.max(L + (pos(hv) + 0.5) * bw - hvW / 2, L), W - R - hvW);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} onMouseMove={onMove} onMouseLeave={() => setHv(null)} style={{ cursor: "crosshair" }}>
      {yt.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={L - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{moneyK(t)}</text>
        </g>
      ))}
      {view === "dots"
        ? values.map((v, i) => !sel.has(i) && <circle key={i} cx={L + (i + 0.5) * bw} cy={Y(v)} r="1.7" style={fill("var(--pop)")} opacity="0.85" />)
        : values.map((v, i) => !sel.has(i) && <rect key={i} x={L + pos(i) * bw + bw * 0.1} y={Y(v)} width={Math.max(bw * 0.8, 0.6)} height={H - B - Y(v)} style={fill("var(--pop)")} opacity="0.75" shapeRendering="crispEdges" />)}
      {sampled.map((i) => {
        const cx = L + (pos(i) + 0.5) * bw;
        return (
          <g key={"s" + i}>
            {view !== "dots" && <rect x={cx - 1.4} y={Y(values[i])} width="2.8" height={H - B - Y(values[i])} rx="1" style={fill(colorOf(i))} />}
            <circle cx={cx} cy={Y(values[i])} r={view === "dots" ? 4.4 : 3.6} strokeWidth="1.6" style={{ ...fill(colorOf(i)), ...stroke("var(--surface)") }}>
              <title>{`Row ${i + 1}: ${money0(values[i])}${groupOf ? " · " + groupOf[i] : ""}`}</title>
            </circle>
          </g>
        );
      })}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      {showTicks && (
        <g>
          {ticks.rows.map((r) => <line key={r} x1={L + (r - 0.5) * bw} x2={L + (r - 0.5) * bw} y1={H - B + 3} y2={H - B + 11} strokeWidth="1.2" style={stroke("var(--muted)")} />)}
          <path d={`M${L + (ticks.start - 0.5) * bw} ${H - B + 13} l-5 9 h10 z`} style={fill("var(--truec)")} />
          <text x={L + (ticks.start - 0.5) * bw + 9} y={H - B + 22} fontSize="11" fontWeight="600" style={fill("var(--ink2)")}>random start: row {ticks.start} · ticks mark the selected rows</text>
        </g>
      )}
      {items.map((it, j) => (
        <g key={it.k}>
          <line x1={L} x2={W - R + 6} y1={it.y} y2={it.y} strokeWidth={it.dash ? 2 : 2.4} strokeDasharray={it.dash ? "6 4" : undefined} style={stroke(it.c)} />
          <path d={`M${W - R + 6} ${it.y} L${W - R + 22} ${ly[j] + 2}`} strokeWidth="1" fill="none" style={stroke("var(--axis)")} />
          <line x1={W - R + 24} x2={W - R + 24} y1={ly[j] - 12} y2={ly[j] + 14} strokeWidth="3" style={stroke(it.c)} strokeDasharray={it.dash ? "5 3" : undefined} />
          <text x={W - R + 32} y={ly[j] - 1} fontSize="11.5" style={fill("var(--ink2)")}>{it.name}</text>
          <text x={W - R + 32} y={ly[j] + 14} fontSize="14" fontWeight="700" style={fill("var(--ink)")}>{money0(it.val)}</text>
        </g>
      ))}
      {hv != null && (
        <g pointerEvents="none">
          <line x1={L + (pos(hv) + 0.5) * bw} x2={L + (pos(hv) + 0.5) * bw} y1={T} y2={H - B} strokeWidth="1.2" strokeDasharray="3 3" style={stroke("var(--ink2)")} />
          <circle cx={L + (pos(hv) + 0.5) * bw} cy={Y(values[hv])} r="4.5" fill="none" strokeWidth="2" style={stroke("var(--ink)")} />
          <rect x={hvX} y="0" width={hvW} height="20" rx="4" style={{ fill: "var(--ink)" }} opacity="0.92" />
          <text x={hvX + hvW / 2} y="14" fontSize="11.5" fontWeight="600" textAnchor="middle" style={{ fill: "var(--surface)" }}>{hvText}</text>
        </g>
      )}
      <text x={L} y={H - 14} fontSize="11" style={fill("var(--muted)")}>{leftText}</text>
      <text x={(L + W - R) / 2} y={H - 14} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{xAxisText}</text>
      <text x={W - R} y={H - 14} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{rightText}</text>
    </svg>
  );
}

// Same idea as SegBar but as horizontal count bars (alternative view of a group split).
export function CountBars({ parts }) {
  const F = useFill();
  const W = 600, LBL = 130, R = 60, rowH = 26, H = parts.length * rowH + 4;
  const max = Math.max(...parts.map((p) => p.count), 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={parts.map((p) => `${p.name} ${p.count}`).join(", ")}>
      <PatternDefs />
      {parts.map((p, i) => (
        <g key={p.name}>
          <text x={LBL - 8} y={i * rowH + 15} fontSize="12" textAnchor="end" style={fill("var(--ink2)")}>{p.name}</text>
          <rect x={LBL} y={i * rowH + 3} width={Math.max((p.count / max) * (W - LBL - R), 1)} height="16" rx="4" style={fill(F(p.color))}><title>{`${p.name}: ${p.count.toLocaleString()}`}</title></rect>
          <text x={LBL + (p.count / max) * (W - LBL - R) + 6} y={i * rowH + 15} fontSize="12" fontWeight="600" style={fill("var(--ink)")}>{p.count.toLocaleString()}</text>
        </g>
      ))}
    </svg>
  );
}

// One whole split into parts (thin segmented bar).
export function SegBar({ parts }) {
  const F = useFill();
  const total = parts.reduce((a, p) => a + p.count, 0), W = 600, g = 2;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${W} 14`} role="img" aria-label={parts.map((p) => `${p.name} ${p.count}`).join(", ")}>
      <PatternDefs />
      {parts.map((p) => {
        const w = (p.count / total) * W; const r = <rect key={p.name} x={x} y="0" width={Math.max(w - g, 1)} height="14" rx="7" style={fill(F(p.color))}><title>{`${p.name}: ${p.count.toLocaleString()} (${((100 * p.count) / total).toFixed(1)}%)`}</title></rect>;
        x += w; return r;
      })}
    </svg>
  );
}

// ---- 2. Distribution: everyone (top) vs the sample (bottom), same x axis.
export function DistributionPair({ values, sampled, groupOf, groupNames, colors, trueMean, est, top, binWidth = 2500 }) {
  const F = useFill();
  const W = 900, L = 12, R = 12, PH = 110, GAP = 34, T = 46, H = T + PH * 2 + GAP + 30, bins = Math.max(1, Math.round(top / binWidth));
  const hi = top, w = hi / bins;
  const x = (v) => L + (v / hi) * (W - L - R);
  const bw = (W - L - R) / bins;
  const sampSet = new Set(sampled);
  const groups = groupOf ? groupNames : ["all"];
  const tally = (pred) => {
    const c = Array.from({ length: bins }, () => groups.map(() => 0));
    values.forEach((v, i) => {
      if (!pred(i)) return;
      c[Math.min(bins - 1, Math.floor(v / w))][groupOf ? groups.indexOf(groupOf[i]) : 0]++;
    });
    return c;
  };
  const popC = tally(() => true), samC = tally((i) => sampSet.has(i));
  const colorFor = (g, isSample) => (groupOf ? F(colors[groups[g]]) : isSample ? ACCENT : "var(--pop)");
  const panel = (c, y0, isSample, label, nLabel) => {
    const max = Math.max(1, ...c.map((r) => r.reduce((a, b) => a + b, 0)));
    return (
      <g>
        <text x={L} y={y0 - 8} fontSize="12" fontWeight="600" style={fill("var(--ink)")}>{label}<tspan fontWeight="400" style={fill("var(--ink2)")}>  {nLabel}</tspan></text>
        <line x1={L} x2={W - R} y1={y0 + PH} y2={y0 + PH} strokeWidth="1" style={stroke("var(--axis)")} />
        {c.map((row, b) => {
          let acc = 0;
          return row.map((n, g) => {
            if (!n) return null;
            const h = (n / max) * (PH - 4);
            acc += h;
            return (
              <rect key={b + "-" + g} x={L + b * bw + 1} width={Math.max(bw - 2, 1)} y={y0 + PH - acc} height={Math.max(h - 1, 0.5)} rx="2" style={{ ...fill(colorFor(g, isSample)), opacity: !isSample && groupOf ? 0.55 : 1 }}>
                <title>{`${moneyK(b * w)}–${moneyK((b + 1) * w)}: ${n} ${n === 1 ? "person" : "people"}${groupOf ? " (" + groups[g] + ")" : ""}`}</title>
              </rect>
            );
          });
        })}
        <text x={W - R} y={y0 + 10} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>tallest bar = {max}</text>
      </g>
    );
  };
  const y1 = T + 6, y2 = y1 + PH + GAP;
  const axisY = y2 + PH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Distribution of charges for everyone and for the sample">
      <PatternDefs />
      {panel(popC, y1, false, "Everyone", `${values.length.toLocaleString()} people`)}
      {panel(samC, y2, true, "Your sample", `${sampled.length} people`)}
      <RefLines x={x} tx={trueMean} ex={est} y0={y1 - 4} y1={axisY} />
      <RefLabels x={x} tx={trueMean} ex={est} top={14} />
      {niceTicks(0, hi, 7).map((t) => (
        <text key={t} x={x(t)} y={axisY + 18} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>
      ))}
    </svg>
  );
}

// ---- 3. Who got sampled? Paired bars per group: population share vs sample share (or the difference).
export function ShareBars({ rows, mode = "pair" }) {
  const F = useFill();
  // rows: [{ name, popPct, samPct, color }]
  const W = 860, LBL = 110, R = 80, rowH = mode === "diff" ? 34 : 44, H = rows.length * rowH + 6;
  if (mode === "diff") {
    const maxAbs = Math.max(...rows.map((r) => Math.abs(r.samPct - r.popPct)), 1);
    const mid = LBL + (W - LBL - R) / 2, half = (W - LBL - R) / 2;
    return (
      <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label="Sample share minus population share for each group, in percentage points">
        <PatternDefs />
        <line x1={mid} x2={mid} y1="0" y2={H} strokeWidth="1.5" style={stroke("var(--axis)")} />
        {rows.map((r, i) => {
          const d = r.samPct - r.popPct, y = i * rowH + 4, len = (Math.abs(d) / maxAbs) * half;
          return (
            <g key={r.name}>
              <text x={LBL - 10} y={y + 17} fontSize="13" textAnchor="end" fontWeight="600" style={fill("var(--ink)")}>{r.name}</text>
              <rect x={d >= 0 ? mid : mid - len} y={y + 4} width={Math.max(len, 1)} height="16" rx="4" style={fill(F(r.color))}><title>{`Sample share − population share: ${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} percentage points`}</title></rect>
              <text x={d >= 0 ? mid + len + 6 : mid - len - 6} y={y + 17} fontSize="12" fontWeight="600" textAnchor={d >= 0 ? "start" : "end"} style={fill("var(--ink)")}>{d >= 0 ? "+" : "−"}{Math.abs(d).toFixed(1)} pp</text>
            </g>
          );
        })}
        <text x={mid} y={H + 14} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>0 = same share as the population · right = over-represented · left = under-represented</text>
      </svg>
    );
  }
  const max = Math.max(...rows.flatMap((r) => [r.popPct, r.samPct]), 1);
  const sx = (p) => (p / max) * (W - LBL - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Share of people in each group: population versus sample">
      <PatternDefs />
      {rows.map((r, i) => {
        const y = i * rowH + 4;
        return (
          <g key={r.name}>
            <text x={LBL - 10} y={y + 20} fontSize="13" textAnchor="end" fontWeight="600" style={fill("var(--ink)")}>{r.name}</text>
            <rect x={LBL} y={y + 2} width={Math.max(sx(r.popPct), 1)} height="14" rx="4" style={fill("var(--pop)")}><title>{`Population: ${r.popPct.toFixed(1)}%`}</title></rect>
            <text x={LBL + sx(r.popPct) + 6} y={y + 13} fontSize="12" style={fill("var(--ink2)")}>{r.popPct.toFixed(1)}%</text>
            <rect x={LBL} y={y + 20} width={Math.max(sx(r.samPct), 1)} height="14" rx="4" style={fill(F(r.color))}><title>{`Sample: ${r.samPct.toFixed(1)}%`}</title></rect>
            <text x={LBL + sx(r.samPct) + 6} y={y + 31} fontSize="12" fontWeight="600" style={fill("var(--ink)")}>{r.samPct.toFixed(1)}%{r.count != null ? ` (${r.count})` : ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- 4. One row of an experiment: every estimate as a dot (strip plot).
const jit = (i) => (Math.imul(i + 1, 2654435761) >>> 0) / 4294967296;
export function StripRow({ estimates, domain, trueMean, meanOfEstimates, axis, label, tickSize = 15, band = null }) {
  const W = 600, L = 8, R = 8, lane = 62, H = lane + (axis ? 24 : 0);
  const [lo, hi] = domain;
  const x = (v) => L + ((v - lo) / (hi - lo || 1)) * (W - L - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. Mean of the estimates ${money0(meanOfEstimates)}; true mean ${money0(trueMean)}; range ${money0(Math.min(...estimates))} to ${money0(Math.max(...estimates))}.`}>
      {band && <rect x={x(band[0])} y="2" width={Math.max(x(band[1]) - x(band[0]), 1)} height={lane - 4} rx="3" style={fill("var(--accent)")} opacity="0.12"><title>{`Middle 90% of the estimates: ${money0(band[0])} to ${money0(band[1])}`}</title></rect>}
      <line x1={L} x2={W - R} y1={lane / 2} y2={lane / 2} strokeWidth="1" style={stroke("var(--grid)")} />
      <line x1={x(trueMean)} x2={x(trueMean)} y1={2} y2={lane - 2} strokeWidth="2" strokeDasharray="4 3" style={stroke("var(--truec)")} />
      {estimates.map((e, i) => (
        <circle key={i} cx={x(Math.min(hi, Math.max(lo, e)))} cy={10 + jit(i) * (lane - 20)} r="3.2" style={{ ...fill(ACCENT), opacity: 0.38 }}>
          <title>{`Estimate: ${money0(e)}`}</title>
        </circle>
      ))}
      <rect x={x(meanOfEstimates) - 1.5} y={lane / 2 - 13} width="3" height="26" rx="1.5" style={fill("var(--ink)")}>
        <title>{`Mean of the estimates: ${money0(meanOfEstimates)}`}</title>
      </rect>
      {axis && (
        <g>
          <line x1={L} x2={W - R} y1={lane + 2} y2={lane + 2} strokeWidth="1" style={stroke("var(--axis)")} />
          {niceTicks(lo, hi, 5).map((t) => (
            <text key={t} x={x(t)} y={lane + 19} fontSize={tickSize} textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>
          ))}
        </g>
      )}
    </svg>
  );
}

// Alternative to StripRow: the same estimates as a histogram (bar heights are scaled within the row).
export function HistRow({ estimates, domain, trueMean, meanOfEstimates, axis, label, tickSize = 15, band = null, bins = 30 }) {
  const W = 600, L = 8, R = 8, lane = 62, H = lane + (axis ? 24 : 0);
  const [lo, hi] = domain;
  const x = (v) => L + ((v - lo) / (hi - lo || 1)) * (W - L - R);
  const w = (hi - lo) / bins || 1, bw = (W - L - R) / bins;
  const c = new Array(bins).fill(0);
  estimates.forEach((e) => { c[Math.min(bins - 1, Math.max(0, Math.floor((e - lo) / w)))]++; });
  const max = Math.max(...c, 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. Mean of the estimates ${money0(meanOfEstimates)}; true mean ${money0(trueMean)}; range ${money0(Math.min(...estimates))} to ${money0(Math.max(...estimates))}.`}>
      {band && <rect x={x(band[0])} y="2" width={Math.max(x(band[1]) - x(band[0]), 1)} height={lane - 4} rx="3" style={fill("var(--accent)")} opacity="0.12"><title>{`Middle 90% of the estimates: ${money0(band[0])} to ${money0(band[1])}`}</title></rect>}
      {c.map((n, b) => n > 0 && (
        <rect key={b} x={L + b * bw + 0.5} width={Math.max(bw - 1, 0.5)} y={lane - 4 - (n / max) * (lane - 12)} height={(n / max) * (lane - 12)} rx="1.5" style={fill(ACCENT)} opacity="0.55">
          <title>{`${money0(lo + b * w)} to ${money0(lo + (b + 1) * w)}: ${n} ${n === 1 ? "estimate" : "estimates"}`}</title>
        </rect>
      ))}
      <line x1={L} x2={W - R} y1={lane - 4} y2={lane - 4} strokeWidth="1" style={stroke("var(--axis)")} />
      <line x1={x(trueMean)} x2={x(trueMean)} y1={2} y2={lane - 2} strokeWidth="2" strokeDasharray="4 3" style={stroke("var(--truec)")} />
      <rect x={x(meanOfEstimates) - 1.5} y="6" width="3" height={lane - 14} rx="1.5" style={fill("var(--ink)")}>
        <title>{`Mean of the estimates: ${money0(meanOfEstimates)}`}</title>
      </rect>
      {axis && (
        <g>
          <line x1={L} x2={W - R} y1={lane + 2} y2={lane + 2} strokeWidth="1" style={stroke("var(--axis)")} />
          {niceTicks(lo, hi, 5).map((t) => (
            <text key={t} x={x(t)} y={lane + 19} fontSize={tickSize} textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>
          ))}
        </g>
      )}
    </svg>
  );
}

// Running mean of repeated draws against the true mean.
export function RunningMean({ draws, trueMean }) {
  const W = 900, H = 230, L = 56, R = 16, T = 18, B = 30;
  const run = []; let acc = 0;
  draws.forEach((d, i) => { acc += d; run.push(acc / (i + 1)); });
  const lo0 = Math.min(trueMean, ...run), hi0 = Math.max(trueMean, ...run), pad = (hi0 - lo0) * 0.15 || 200;
  const lo = Math.max(0, lo0 - pad), hi = hi0 + pad, nDraw = draws.length;
  const X = (i) => L + (nDraw === 1 ? 0.5 : i / (nDraw - 1)) * (W - L - R);
  const Y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const yt = niceTicks(lo, hi, 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Running mean of ${nDraw} draws compared with the true mean`}>
      {yt.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={L - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{moneyK(t)}</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={Y(trueMean)} y2={Y(trueMean)} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />
      <text x={W - R} y={Y(trueMean) - 6} fontSize="12" fontWeight="600" textAnchor="end" style={fill("var(--ink2)")}>True mean {money0(trueMean)}</text>
      <polyline points={run.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} fill="none" strokeWidth="2.4" strokeLinejoin="round" style={stroke("var(--samplec)")} />
      {nDraw <= 60 && run.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="3" style={{ ...fill("var(--samplec)"), ...stroke("var(--surface)") }} strokeWidth="1.2"><title>{`After ${i + 1} ${i === 0 ? "draw" : "draws"}: ${money0(v)}`}</title></circle>)}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      <text x={L} y={H - 10} fontSize="11" style={fill("var(--muted)")}>draw 1</text>
      <text x={(L + W - R) / 2} y={H - 10} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>average of all draws so far →</text>
      <text x={W - R} y={H - 10} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>draw {nDraw}</text>
    </svg>
  );
}

// Charges by group: box plots or mean/median bars. rows: [{ name, n, mean, median, q1, q3, lo, hi, color }]
export function GroupBoxes({ rows, top, trueMean, mode = "box" }) {
  const F = useFill();
  const W = 900, LBL = 120, R = 24, T = 26, rowH = 52, H = T + rows.length * rowH + 30;
  const x = (v) => LBL + (v / top) * (W - LBL - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={mode === "box" ? "Box plot of charges for each group" : "Mean and median charges for each group"}>
      <PatternDefs />
      {niceTicks(0, top, 7).map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={T - 6} y2={H - 26} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={x(t)} y={H - 8} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = T + i * rowH + rowH / 2;
        return (
          <g key={r.name}>
            <text x={LBL - 10} y={y + 4} fontSize="13" fontWeight="600" textAnchor="end" style={fill("var(--ink)")}>{r.name}</text>
            <text x={LBL - 10} y={y + 19} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{r.n.toLocaleString()} people</text>
            {mode === "box" ? (
              <g>
                <line x1={x(r.lo)} x2={x(r.hi)} y1={y} y2={y} strokeWidth="1.5" style={stroke("var(--axis)")} />
                <rect x={x(r.q1)} y={y - 11} width={Math.max(x(r.q3) - x(r.q1), 1)} height="22" rx="3" style={fill(F(r.color))} opacity="0.45"><title>{`${r.name}: 25th to 75th percentile ${money0(r.q1)} to ${money0(r.q3)}`}</title></rect>
                <rect x={x(r.q1)} y={y - 11} width={Math.max(x(r.q3) - x(r.q1), 1)} height="22" rx="3" fill="none" strokeWidth="1.5" style={stroke(r.color)} />
                <line x1={x(r.median)} x2={x(r.median)} y1={y - 11} y2={y + 11} strokeWidth="3" style={stroke("var(--ink)")}><title>{`Median ${money0(r.median)}`}</title></line>
                <path d={`M${x(r.mean)} ${y - 7} l6 7 l-6 7 l-6 -7 z`} style={{ ...fill("var(--truec)"), ...stroke("var(--surface)") }} strokeWidth="1"><title>{`Mean ${money0(r.mean)}`}</title></path>
              </g>
            ) : (
              <g>
                <rect x={LBL} y={y - 11} width={Math.max(x(r.mean) - LBL, 1)} height="22" rx="4" style={fill(F(r.color))}><title>{`${r.name}: mean ${money0(r.mean)}`}</title></rect>
                <line x1={x(r.median)} x2={x(r.median)} y1={y - 14} y2={y + 14} strokeWidth="3" style={stroke("var(--ink)")}><title>{`Median ${money0(r.median)}`}</title></line>
                <text x={x(r.mean) + 8} y={y + 4} fontSize="12" fontWeight="600" style={fill("var(--ink)")}>{money0(r.mean)}</text>
              </g>
            )}
          </g>
        );
      })}
      <line x1={x(trueMean)} x2={x(trueMean)} y1={T - 8} y2={H - 26} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />
      <text x={x(trueMean) + 6} y={T - 10} fontSize="11.5" fontWeight="600" style={fill("var(--ink2)")}>True mean of the whole file {money0(trueMean)}</text>
    </svg>
  );
}

// Teaching diagram: bias (off target on average) versus spread (scatter).
export function BiasSpreadDiagram() {
  const panels = [
    { t: "Small bias, small spread", b: 0, sp: 16 }, { t: "Small bias, large spread", b: 0, sp: 62 },
    { t: "Large bias, small spread", b: 1, sp: 16 }, { t: "Large bias, large spread", b: 1, sp: 62 },
  ];
  const W = 250, cx = 125, cy = 100;
  const rnd = (i, k) => (Math.imul(i * 97 + k * 31 + 7, 2654435761) >>> 0) / 4294967296;
  return (
    <svg viewBox={`0 0 ${W * 2 + 20} 480`} role="img" aria-label="Four targets: small or large bias combined with small or large spread">
      {panels.map((p, pi) => {
        const ox = (pi % 2) * (W + 20), oy = Math.floor(pi / 2) * 240;
        const cX = ox + cx + (p.b ? 44 : 0), cY = oy + cy + (p.b ? -26 : 0);
        return (
          <g key={p.t}>
            {[80, 55, 30].map((r) => <circle key={r} cx={ox + cx} cy={oy + cy} r={r} fill="none" strokeWidth="1" style={stroke("var(--axis)")} />)}
            <circle cx={ox + cx} cy={oy + cy} r="4" style={fill("var(--truec)")} />
            {Array.from({ length: 14 }, (_, i) => {
              const ang = rnd(pi * 20 + i, 1) * Math.PI * 2, rad = Math.sqrt(rnd(pi * 20 + i, 2)) * p.sp;
              return <circle key={i} cx={cX + Math.cos(ang) * rad} cy={cY + Math.sin(ang) * rad} r="4.2" style={fill(ACCENT)} opacity="0.8" />;
            })}
            <text x={ox + cx} y={oy + 205} fontSize="13" fontWeight="600" textAnchor="middle" style={fill("var(--ink)")}>{p.t}</text>
          </g>
        );
      })}
      <text x={W + 10} y="470" fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>gold dot = the true mean · blue dots = estimates from different samples (illustration only, not your data)</text>
    </svg>
  );
}

// ---- 5. Simple histogram (population tab).
export function SimpleHistogram({ values, trueMean, top, binWidth = 2500, median = null, logScale = false }) {
  if (logScale) return <LogHistogram values={values} trueMean={trueMean} median={median} top={top} />;
  const W = 900, H = 200, L = 12, R = 12, T = 28, B = 28, bins = Math.max(1, Math.round(top / binWidth));
  const w = top / bins, bw = (W - L - R) / bins;
  const c = new Array(bins).fill(0);
  values.forEach((v) => c[Math.min(bins - 1, Math.floor(v / w))]++);
  const max = Math.max(...c);
  const x = (v) => L + (v / top) * (W - L - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogram of all charges">
      {c.map((n, b) => (
        <rect key={b} x={L + b * bw + 1} width={bw - 2} y={T + (H - T - B) * (1 - n / max)} height={(H - T - B) * (n / max)} rx="2" style={fill("var(--pop)")}>
          <title>{`${moneyK(b * w)}–${moneyK((b + 1) * w)}: ${n} people`}</title>
        </rect>
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      <line x1={x(trueMean)} x2={x(trueMean)} y1={T - 4} y2={H - B} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />
      <text x={x(trueMean) + 8} y={T - 10} fontSize="12" fontWeight="600" style={fill("var(--ink2)")}>True mean {money0(trueMean)}</text>
      {median != null && (
        <g>
          <line x1={x(median)} x2={x(median)} y1={T - 4} y2={H - B} strokeWidth="2" style={stroke("var(--ink)")} />
          <text x={x(median) - 8} y={T - 10} fontSize="12" fontWeight="600" textAnchor="end" style={fill("var(--ink)")}>Median {money0(median)}</text>
        </g>
      )}
      {niceTicks(0, top, 7).map((t) => <text key={t} x={x(t)} y={H - 8} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>)}
    </svg>
  );
}

// Histogram on a log (multiplicative) dollar axis: each step right multiplies the charge.
function LogHistogram({ values, trueMean, median, top }) {
  const W = 900, H = 200, L = 12, R = 12, T = 28, B = 28, bins = 30;
  const lo = Math.log10(1000), hi = Math.log10(Math.max(top, 70000));
  const x = (v) => L + ((Math.log10(Math.max(v, 1)) - lo) / (hi - lo)) * (W - L - R);
  const bw = (W - L - R) / bins, c = new Array(bins).fill(0);
  values.forEach((v) => { const b = Math.floor(((Math.log10(Math.max(v, 1)) - lo) / (hi - lo)) * bins); c[Math.min(bins - 1, Math.max(0, b))]++; });
  const max = Math.max(...c, 1);
  const edge = (b) => 10 ** (lo + (b / bins) * (hi - lo));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogram of all charges on a log dollar axis">
      {c.map((n, b) => (
        <rect key={b} x={L + b * bw + 1} width={bw - 2} y={T + (H - T - B) * (1 - n / max)} height={(H - T - B) * (n / max)} rx="2" style={fill("var(--pop)")}>
          <title>{`${money0(edge(b))} to ${money0(edge(b + 1))}: ${n} people`}</title>
        </rect>
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      <line x1={x(trueMean)} x2={x(trueMean)} y1={T - 4} y2={H - B} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />
      <text x={x(trueMean) + 8} y={T - 10} fontSize="12" fontWeight="600" style={fill("var(--ink2)")}>True mean {money0(trueMean)}</text>
      {median != null && (
        <g>
          <line x1={x(median)} x2={x(median)} y1={T - 4} y2={H - B} strokeWidth="2" style={stroke("var(--ink)")} />
          <text x={x(median) - 8} y={T - 10} fontSize="12" fontWeight="600" textAnchor="end" style={fill("var(--ink)")}>Median {money0(median)}</text>
        </g>
      )}
      {[1000, 2000, 5000, 10000, 20000, 50000].map((t) => <text key={t} x={x(t)} y={H - 8} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>)}
    </svg>
  );
}

// Every person as a dot: x = age or BMI, y = charges, colored by a group column.
export function ScatterByColumn({ xs, ys, groups, colors, xLabel, top }) {
  const F = useFill();
  const W = 900, H = 340, L = 56, R = 16, T = 14, B = 44;
  const xlo = Math.floor(Math.min(...xs) / 5) * 5, xhi = Math.ceil(Math.max(...xs) / 5) * 5;
  const X = (v) => L + ((v - xlo) / (xhi - xlo || 1)) * (W - L - R), Y = (v) => T + (H - T - B) * (1 - v / top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Charges against ${xLabel} for every person`}>
      <PatternDefs />
      {niceTicks(0, top, 4).map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={L - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{moneyK(t)}</text>
        </g>
      ))}
      {niceTicks(xlo, xhi, 6).map((t) => <text key={t} x={X(t)} y={H - B + 18} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{t}</text>)}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      {xs.map((v, i) => <circle key={i} cx={X(v)} cy={Y(ys[i])} r="2.8" style={fill(groups ? colors[groups[i]] : "var(--accent)")} opacity="0.6" />)}
      <text x={(L + W - R) / 2} y={H - 8} fontSize="11.5" textAnchor="middle" style={fill("var(--ink2)")}>{xLabel}</text>
      <text x={L - 8} y={10} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>charges</text>
    </svg>
  );
}

// How often each person was picked across several draws, in three clearly different groups:
// never picked / picked no more often than expected / picked more often than expected.
// "Expected" is draws x n / N, the average number of times each person is picked.
export const PICK_COLORS = ["var(--muted)", "var(--accent)", "var(--s2)"];
export function FrequencyGrid({ counts, draws, perDraw }) {
  const F = useFill();
  const n = counts.length, cols = 62, rows = Math.ceil(n / cols), W = 900, gap = 2.5, cell = (W - gap * (cols - 1)) / cols, H = rows * (cell + gap) - gap;
  const label = ["never picked", "picked no more than expected", "picked more than expected"];
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label={`How often each of ${n} people was picked across ${draws} draws, in three groups: never picked, picked no more than expected, picked more than expected`}>
      <PatternDefs />
      {counts.map((c, i) => {
        const bk = pickBucket(c, draws, perDraw, n);
        return (
          <rect key={i} x={(i % cols) * (cell + gap)} y={Math.floor(i / cols) * (cell + gap)} width={cell} height={cell} rx="3" style={fill(F(PICK_COLORS[bk]))} opacity={bk === 0 ? 0.85 : 1}>
            <title>{`Row ${i + 1}: picked in ${c} of ${draws} draws (${label[bk]})`}</title>
          </rect>
        );
      })}
      <text x="0" y={H + 16} fontSize="11" style={fill("var(--muted)")}>row 1</text>
      <text x={W / 2} y={H + 16} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>read left to right, top to bottom, in file order →</text>
      <text x={W} y={H + 16} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>row {n.toLocaleString()}</text>
    </svg>
  );
}

// ---- Cumulative distribution: the share of people at or below each charge, for everyone and for the sample.
export function CdfPair({ values, sampled, trueMean, est, top }) {
  const W = 900, H = 300, L = 54, R = 20, T = 26, B = 42;
  const x = (v) => L + (v / top) * (W - L - R), y = (p) => T + (H - T - B) * (1 - p);
  const steps = (arr) => {
    const a = [...arr].sort((p, q) => p - q), n = a.length, pts = [`${x(0)},${y(0)}`];
    a.forEach((v, i) => { pts.push(`${x(v)},${y(i / n)}`); pts.push(`${x(v)},${y((i + 1) / n)}`); });
    pts.push(`${x(top)},${y(1)}`);
    return pts.join(" ");
  };
  const sv = sampled.map((i) => values[i]);
  const half = (arr) => [...arr].sort((p, q) => p - q)[Math.floor(arr.length / 2)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cumulative distribution of charges: the share of people at or below each charge, for everyone and for the sample">
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line x1={L} x2={W - R} y1={y(p)} y2={y(p)} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={L - 8} y={y(p) + 4} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{Math.round(p * 100)}%</text>
        </g>
      ))}
      {niceTicks(0, top, 7).map((t) => <text key={t} x={x(t)} y={H - B + 18} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>)}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      <polyline points={steps(values)} fill="none" strokeWidth="3.4" strokeLinejoin="round" style={stroke("var(--pop)")} />
      <polyline points={steps(sv)} fill="none" strokeWidth="2.2" strokeLinejoin="round" style={stroke(ACCENT)} />
      <line x1={x(trueMean)} x2={x(trueMean)} y1={T - 6} y2={H - B} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />
      {est != null && <line x1={x(est)} x2={x(est)} y1={T - 6} y2={H - B} strokeWidth="2.2" style={stroke("var(--samplec)")} />}
      <text x={x(trueMean) + (est != null && est < trueMean ? 6 : -6)} y="14" fontSize="12" fontWeight="600" textAnchor={est != null && est < trueMean ? "start" : "end"} style={fill("var(--ink2)")}>True mean {money0(trueMean)}</text>
      {est != null && <text x={x(est) + (est < trueMean ? -6 : 6)} y="14" fontSize="12" fontWeight="700" textAnchor={est < trueMean ? "end" : "start"} style={fill("var(--ink)")}>Sample {money0(est)}</text>}
      <g fontSize="12" fontWeight="600">
        <line x1={W - R - 190} x2={W - R - 168} y1={H - B - 34} y2={H - B - 34} strokeWidth="3.4" style={stroke("var(--pop)")} /><text x={W - R - 162} y={H - B - 30} style={fill("var(--ink2)")}>Everyone (median {money0(half(values))})</text>
        <line x1={W - R - 190} x2={W - R - 168} y1={H - B - 14} y2={H - B - 14} strokeWidth="2.2" style={stroke(ACCENT)} /><text x={W - R - 162} y={H - B - 10} style={fill("var(--ink2)")}>Your sample (median {money0(half(sv))})</text>
      </g>
    </svg>
  );
}

// ---- Bars for bias / SD / RMSE: one bar per condition. rows: [{ label, sub, bias, sd, rmse, color }]
export function ResultBars({ rows, metric }) {
  const W = 900, LBL = 270, R = 110, rowH = 40, T = 8, B = 34, H = T + rows.length * rowH + B;
  const vals = rows.map((r) => r[metric]);
  const diverge = metric === "bias";
  const maxAbs = Math.max(...vals.map(Math.abs), 1) * 1.05;
  const half = (W - LBL - R) / 2;
  const x0 = diverge ? LBL + half : LBL;
  const len = (v) => (diverge ? (Math.abs(v) / maxAbs) * half : (Math.abs(v) / maxAbs) * (W - LBL - R));
  const ticks = niceTicks(diverge ? -maxAbs : 0, maxAbs, 4);
  const X = (v) => (diverge ? x0 + (v / maxAbs) * half : LBL + (v / maxAbs) * (W - LBL - R));
  const names = { bias: "Bias", sd: "SD of the estimates", rmse: "RMSE" };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${names[metric]} for each condition, in US dollars`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={T} y2={H - B} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={X(t)} y={H - 12} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{diverge ? (t < 0 ? "−" : t > 0 ? "+" : "") + moneyK(Math.abs(t)) : moneyK(t)}</text>
        </g>
      ))}
      {diverge && <line x1={x0} x2={x0} y1={T} y2={H - B} strokeWidth="2" style={stroke("var(--axis)")} />}
      {rows.map((r, i) => {
        const y = T + i * rowH + rowH / 2, v = r[metric], w = len(v), left = diverge && v < 0;
        return (
          <g key={r.label + i}>
            <text x={LBL - 12} y={y - (r.sub ? 1 : -4)} fontSize="13" fontWeight="600" textAnchor="end" style={fill("var(--ink)")}>{r.label}</text>
            {r.sub && <text x={LBL - 12} y={y + 13} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{r.sub}</text>}
            <rect x={left ? x0 - w : x0} y={y - 11} width={Math.max(w, 1.5)} height="22" rx="4" style={fill(r.color)}><title>{`${r.label}: ${names[metric]} ${money(v)}`}</title></rect>
            <text x={left ? x0 - w - 8 : x0 + w + 8} y={y + 4} fontSize="12.5" fontWeight="700" textAnchor={left ? "end" : "start"} style={fill("var(--ink)")}>{diverge ? signed(v) : money(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- How a running bias or SD settles as repetitions accumulate (for one row of estimates).
export function ConvergenceChart({ estimates, trueMean, metric }) {
  const W = 900, H = 280, L = 70, R = 24, T = 20, B = 44, n = estimates.length;
  const pts = []; let mean = 0, m2 = 0;
  estimates.forEach((e, i) => {
    const k = i + 1, d = e - mean; mean += d / k; m2 += d * (e - mean);
    pts.push({ k, bias: mean - trueMean, sd: Math.sqrt(m2 / k) });
  });
  const use = pts.filter((p) => (metric === "sd" ? p.k >= 2 : true));
  const vals = use.map((p) => p[metric]);
  const lo = metric === "sd" ? 0 : -Math.max(...vals.map(Math.abs), 1) * 1.1, hi = metric === "sd" ? Math.max(...vals, 1) * 1.1 : Math.max(...vals.map(Math.abs), 1) * 1.1;
  const X = (k) => L + ((k - 1) / (n - 1 || 1)) * (W - L - R), Y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const last = use[use.length - 1];
  const xt = [1, ...[0.25, 0.5, 0.75, 1].map((f) => Math.round(f * n))].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Running ${metric === "sd" ? "SD" : "bias"} of the estimates as repetitions accumulate`}>
      {niceTicks(lo, hi, 4).map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={L - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{metric === "bias" ? (t < 0 ? "−" : t > 0 ? "+" : "") + moneyK(Math.abs(t)) : moneyK(t)}</text>
        </g>
      ))}
      {metric === "bias" && <line x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} strokeWidth="2" strokeDasharray="6 4" style={stroke("var(--truec)")} />}
      {n > 100 && <g><line x1={X(100)} x2={X(100)} y1={T} y2={H - B} strokeWidth="1.2" strokeDasharray="2 4" style={stroke("var(--muted)")} /><text x={X(100) + 5} y={T + 10} fontSize="11" style={fill("var(--muted)")}>100 repetitions</text></g>}
      <polyline points={use.map((p) => `${X(p.k)},${Y(p[metric])}`).join(" ")} fill="none" strokeWidth="2.2" strokeLinejoin="round" style={stroke(ACCENT)} />
      <circle cx={X(last.k)} cy={Y(last[metric])} r="5" strokeWidth="2" style={{ fill: ACCENT, stroke: "var(--surface)" }} />
      <text x={X(last.k) - 8} y={Y(last[metric]) - 10} fontSize="12.5" fontWeight="700" textAnchor="end" style={fill("var(--ink)")}>{metric === "bias" ? signed(last.bias) : money(last.sd)} after {n}</text>
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      {xt.map((k) => <text key={k} x={X(k)} y={H - B + 18} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{k}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} fontSize="11.5" textAnchor="middle" style={fill("var(--muted)")}>number of repetitions so far →</text>
    </svg>
  );
}
