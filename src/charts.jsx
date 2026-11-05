import React from "react";

export const money = (x, d = 2) => (x < 0 ? "-$" : "$") + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money0 = (x) => money(x, 0);
export const PALETTE = ["#8fb3b4", "#d9a441", "#8e7cc3", "#5b9bd5", "#7a8f3a"];

// Histogram of `values` with optional vertical reference lines.
// lines: [{ x, color, label, dash }]
export function Histogram({ values, domain, bins = 30, lines = [], height = 150, color = "#9db9ba", ticks = 4, label }) {
  const W = 560, H = height, L = 8, R = 8, T = 16, B = 24;
  const [lo, hi] = domain;
  const w = (hi - lo) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of values) counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w)))]++;
  const max = Math.max(...counts, 1);
  const X = (v) => L + ((v - lo) / (hi - lo || 1)) * (W - L - R);
  const bw = (W - L - R) / bins;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
      {counts.map((c, i) => (
        <rect key={i} x={L + i * bw + 0.5} width={Math.max(bw - 1, 0.5)} y={T + (H - T - B) * (1 - c / max)} height={(H - T - B) * (c / max)} fill={color} rx="1.5" />
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#cfd8d9" />
      {Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks).map((t, i) => (
        <text key={i} x={X(t)} y={H - 8} fontSize="11" fill="#5d6b70" textAnchor={i === 0 ? "start" : i === ticks ? "end" : "middle"}>{money0(t)}</text>
      ))}
      {lines.map((ln, i) => (
        <g key={i}>
          <line x1={X(ln.x)} x2={X(ln.x)} y1={T - 4} y2={H - B} stroke={ln.color} strokeWidth="2" strokeDasharray={ln.dash ? "5 3" : undefined} />
        </g>
      ))}
    </svg>
  );
}

// Every person as a thin bar, in file order. Sampled rows are drawn on top.
export function RowStrip({ values, sampled, groupOf, groupColors, trueMean, sampleMean, height = 230 }) {
  const N = values.length, W = 1000, H = height, L = 46, R = 6, T = 12, B = 22;
  const maxV = Math.max(...values);
  const niceMax = Math.ceil(maxV / 10000) * 10000;
  const Y = (v) => T + (H - T - B) * (1 - v / niceMax);
  const bw = (W - L - R) / N;
  const sel = new Set(sampled);
  const yticks = [0, niceMax / 2, niceMax];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="All people in file order, bar height is charges">
      {yticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#e8eeee" />
          <text x={L - 6} y={Y(t) + 4} fontSize="11" textAnchor="end" fill="#5d6b70">{money0(t)}</text>
        </g>
      ))}
      {values.map((v, i) => (
        <rect key={i} x={L + i * bw} width={Math.max(bw, 0.6)} y={Y(v)} height={H - B - Y(v)} fill={groupOf ? groupColors[groupOf[i]] : "#cbd9da"} opacity={sampled.length && !sel.has(i) ? (groupOf ? 0.35 : 1) : 1} shapeRendering="crispEdges" />
      ))}
      {sampled.map((i) => (
        <rect key={"s" + i} x={L + i * bw - 0.6} width={Math.max(bw, 0.6) + 1.2} y={Y(values[i])} height={H - B - Y(values[i])} fill="#c8553d" />
      ))}
      <line x1={L} x2={W - R} y1={Y(trueMean)} y2={Y(trueMean)} stroke="#1f6f70" strokeWidth="2" strokeDasharray="6 4" />
      {sampleMean != null && <line x1={L} x2={W - R} y1={Y(sampleMean)} y2={Y(sampleMean)} stroke="#c8553d" strokeWidth="2" />}
      <text x={L} y={H - 6} fontSize="11" fill="#5d6b70">row 1</text>
      <text x={W - R} y={H - 6} fontSize="11" fill="#5d6b70" textAnchor="end">row {N.toLocaleString()}</text>
      <text x={(L + W) / 2} y={H - 6} fontSize="11" fill="#5d6b70" textAnchor="middle">file order →</text>
    </svg>
  );
}
