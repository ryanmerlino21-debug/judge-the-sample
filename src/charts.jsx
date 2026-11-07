import React from "react";

export const money = (x, d = 2) => (x < 0 ? "-$" : "$") + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money0 = (x) => money(x, 0);
export const moneyK = (x) => (x === 0 ? "$0" : Math.abs(x) >= 1000 ? "$" + +(x / 1000).toFixed(1) + "K" : "$" + x);
export const signed = (x) => (x >= 0 ? "+" : "−") + money(Math.abs(x));

// Categorical slots in fixed order (validated palette); text never wears them.
export const SLOTS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
export const ACCENT = "var(--accent)";
const fill = (c) => ({ fill: c });
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

// ---- 1. Every person as a bar, in file order. Sampled people are thick, dotted and coloured.
export function RowBars({ values, sampled, colorOf, groupOf, trueMean, est }) {
  const N = values.length, W = 980, H = 340, L = 52, R = 150, T = 18, B = 36;
  const top = Math.ceil(Math.max(...values) / 10000) * 10000;
  const bw = (W - L - R) / N;
  const Y = (v) => T + (H - T - B) * (1 - v / top);
  const sel = new Set(sampled);
  const ticks = niceTicks(0, top, 4);
  // right-margin labels, kept at least 40px apart
  const items = [{ k: "true", y: Y(trueMean), name: "True mean", val: trueMean, c: "var(--truec)", dash: true }];
  if (est != null) items.push({ k: "est", y: Y(est), name: "Sample estimate", val: est, c: "var(--samplec)" });
  items.sort((a, b) => a.y - b.y);
  const ly = items.map((it) => it.y);
  for (let i = 1; i < ly.length; i++) if (ly[i] - ly[i - 1] < 40) ly[i] = ly[i - 1] + 40;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="One bar per person in file order; bar height is charges; sampled people are thick coloured bars with a dot on top">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} strokeWidth="1" style={stroke("var(--grid)")} />
          <text x={L - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>{moneyK(t)}</text>
        </g>
      ))}
      {values.map((v, i) => !sel.has(i) && <rect key={i} x={L + i * bw + bw * 0.1} y={Y(v)} width={Math.max(bw * 0.8, 0.6)} height={H - B - Y(v)} style={fill("var(--pop)")} opacity="0.75" shapeRendering="crispEdges" />)}
      {sampled.map((i) => {
        const cx = L + (i + 0.5) * bw;
        return (
          <g key={"s" + i}>
            <rect x={cx - 1.4} y={Y(values[i])} width="2.8" height={H - B - Y(values[i])} rx="1" style={fill(colorOf(i))} />
            <circle cx={cx} cy={Y(values[i])} r="3.6" strokeWidth="1.6" style={{ ...fill(colorOf(i)), ...stroke("var(--surface)") }}>
              <title>{`Row ${i + 1}: ${money0(values[i])}${groupOf ? " · " + groupOf[i] : ""}`}</title>
            </circle>
          </g>
        );
      })}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} strokeWidth="1" style={stroke("var(--axis)")} />
      {items.map((it, j) => (
        <g key={it.k}>
          <line x1={L} x2={W - R + 6} y1={it.y} y2={it.y} strokeWidth={it.dash ? 2 : 2.4} strokeDasharray={it.dash ? "6 4" : undefined} style={stroke(it.c)} />
          <path d={`M${W - R + 6} ${it.y} L${W - R + 22} ${ly[j] + 2}`} strokeWidth="1" fill="none" style={stroke("var(--axis)")} />
          <line x1={W - R + 24} x2={W - R + 24} y1={ly[j] - 12} y2={ly[j] + 14} strokeWidth="3" style={stroke(it.c)} strokeDasharray={it.dash ? "5 3" : undefined} />
          <text x={W - R + 32} y={ly[j] - 1} fontSize="11.5" style={fill("var(--ink2)")}>{it.name}</text>
          <text x={W - R + 32} y={ly[j] + 14} fontSize="14" fontWeight="700" style={fill("var(--ink)")}>{money0(it.val)}</text>
        </g>
      ))}
      <text x={L} y={H - 14} fontSize="11" style={fill("var(--muted)")}>row 1</text>
      <text x={(L + W - R) / 2} y={H - 14} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>each bar = one person, in file order →</text>
      <text x={W - R} y={H - 14} fontSize="11" textAnchor="end" style={fill("var(--muted)")}>row {N.toLocaleString()}</text>
    </svg>
  );
}

// One whole split into parts (thin segmented bar).
export function SegBar({ parts }) {
  const total = parts.reduce((a, p) => a + p.count, 0), W = 600, g = 2;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${W} 14`} role="img" aria-label={parts.map((p) => `${p.name} ${p.count}`).join(", ")}>
      {parts.map((p) => {
        const w = (p.count / total) * W; const r = <rect key={p.name} x={x} y="0" width={Math.max(w - g, 1)} height="14" rx="7" style={fill(p.color)}><title>{`${p.name}: ${p.count.toLocaleString()} (${((100 * p.count) / total).toFixed(1)}%)`}</title></rect>;
        x += w; return r;
      })}
    </svg>
  );
}

// ---- 2. Distribution: everyone (top) vs the sample (bottom), same x axis.
export function DistributionPair({ values, sampled, groupOf, groupNames, colors, trueMean, est, top }) {
  const W = 900, L = 12, R = 12, PH = 110, GAP = 34, T = 46, H = T + PH * 2 + GAP + 30, bins = 28;
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
  const colorFor = (g, isSample) => (groupOf ? colors[groups[g]] : isSample ? ACCENT : "var(--pop)");
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

// ---- 3. Who got sampled? Paired bars per group: population share vs sample share.
export function ShareBars({ rows }) {
  // rows: [{ name, popPct, samPct, color }]
  const W = 520, LBL = 90, R = 54, rowH = 44, H = rows.length * rowH + 6;
  const max = Math.max(...rows.flatMap((r) => [r.popPct, r.samPct]), 1);
  const sx = (p) => (p / max) * (W - LBL - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Share of people in each group: population versus sample">
      {rows.map((r, i) => {
        const y = i * rowH + 4;
        return (
          <g key={r.name}>
            <text x={LBL - 10} y={y + 20} fontSize="13" textAnchor="end" fontWeight="600" style={fill("var(--ink)")}>{r.name}</text>
            <rect x={LBL} y={y + 2} width={Math.max(sx(r.popPct), 1)} height="14" rx="4" style={fill("var(--pop)")}><title>{`Population: ${r.popPct.toFixed(1)}%`}</title></rect>
            <text x={LBL + sx(r.popPct) + 6} y={y + 13} fontSize="12" style={fill("var(--ink2)")}>{r.popPct.toFixed(1)}%</text>
            <rect x={LBL} y={y + 20} width={Math.max(sx(r.samPct), 1)} height="14" rx="4" style={fill(r.color)}><title>{`Sample: ${r.samPct.toFixed(1)}%`}</title></rect>
            <text x={LBL + sx(r.samPct) + 6} y={y + 31} fontSize="12" fontWeight="600" style={fill("var(--ink)")}>{r.samPct.toFixed(1)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- 4. One row of an experiment: every estimate as a dot (strip plot).
const jit = (i) => (Math.imul(i + 1, 2654435761) >>> 0) / 4294967296;
export function StripRow({ estimates, domain, trueMean, meanOfEstimates, axis, label, tickSize = 15 }) {
  const W = 600, L = 8, R = 8, lane = 62, H = lane + (axis ? 24 : 0);
  const [lo, hi] = domain;
  const x = (v) => L + ((v - lo) / (hi - lo || 1)) * (W - L - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
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

// ---- 5. Simple histogram (population tab).
export function SimpleHistogram({ values, trueMean, top }) {
  const W = 900, H = 200, L = 12, R = 12, T = 28, B = 28, bins = 28;
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
      {niceTicks(0, top, 7).map((t) => <text key={t} x={x(t)} y={H - 8} fontSize="11" textAnchor="middle" style={fill("var(--muted)")}>{moneyK(t)}</text>)}
    </svg>
  );
}
