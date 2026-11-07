import React, { useMemo, useState } from "react";
import { population, GROUP_COLUMNS } from "./data.js";
import * as S from "./sampling.js";
import { money } from "./charts.jsx";
import { HowTo, Toggle } from "./extras.jsx";

const N = population.values.length;
const order = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });

// Average charge for every combination of two group columns, as a colored grid.
export function HeatMap() {
  const [rowCol, setRowCol] = useState("smoker");
  const [colCol, setColCol] = useState("age_band");
  const [measure, setMeasure] = useState("mean");
  const rc = rowCol, cc = rowCol === colCol ? GROUP_COLUMNS.find((c) => c !== rowCol) : colCol;
  const grid = useMemo(() => {
    const rn = [...new Set(population.groups[rc])].sort(order), cn = [...new Set(population.groups[cc])].sort(order);
    const cell = {};
    rn.forEach((r) => cn.forEach((c) => { cell[r + "|" + c] = []; }));
    population.values.forEach((v, i) => cell[population.groups[rc][i] + "|" + population.groups[cc][i]].push(v));
    const stat = (arr) => (!arr.length ? null : measure === "n" ? arr.length : measure === "median" ? S.describe(arr).median : S.mean(arr));
    const vals = rn.flatMap((r) => cn.map((c) => stat(cell[r + "|" + c]))).filter((v) => v != null);
    return { rn, cn, cell, stat, lo: Math.min(...vals), hi: Math.max(...vals) };
  }, [rc, cc, measure]);
  const fmt = (v) => (v == null ? "–" : measure === "n" ? v.toLocaleString() : money(v, 0));
  return (
    <section className="block">
      <h2>Average charges across two groups</h2>
      <p className="sub">Each cell is one combination of the two columns. Darker cells have {measure === "n" ? "more people" : "higher charges"}. This describes the file only.</p>
      <div className="opts">
        <label className="inl">Rows <select value={rc} onChange={(e) => setRowCol(e.target.value)} style={{ font: "inherit", padding: "4px 6px", borderRadius: 6 }}>{GROUP_COLUMNS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="inl">Columns <select value={cc} onChange={(e) => setColCol(e.target.value)} style={{ font: "inherit", padding: "4px 6px", borderRadius: 6 }}>{GROUP_COLUMNS.filter((c) => c !== rc).map((c) => <option key={c}>{c}</option>)}</select></label>
        <Toggle label="Show" value={measure} onChange={setMeasure} options={[["mean", "Mean charges"], ["median", "Median charges"], ["n", "Number of people"]]} />
      </div>
      <div className="chart" style={{ overflowX: "auto" }}>
        <table className="heat">
          <thead><tr><th><code>{rc}</code> ↓ &nbsp; <code>{cc}</code> →</th>{grid.cn.map((c) => <th key={c} className="num">{c}</th>)}</tr></thead>
          <tbody>{grid.rn.map((r) => (
            <tr key={r}>
              <th scope="row">{r}</th>
              {grid.cn.map((c) => {
                const arr = grid.cell[r + "|" + c], v = grid.stat(arr), t = v == null || grid.hi === grid.lo ? 0 : (v - grid.lo) / (grid.hi - grid.lo);
                return (
                  <td key={c} className="num" style={{ background: v == null ? "transparent" : `color-mix(in srgb, var(--accent) ${Math.round(10 + t * 80)}%, var(--surface))`, color: t > 0.55 ? "#fff" : "var(--ink)" }} title={`${rc} = ${r}, ${cc} = ${c}: ${arr.length} people${v != null ? ", " + fmt(v) : ""}`}>
                    <b>{fmt(v)}</b>{measure !== "n" && <small>{arr.length.toLocaleString()} people</small>}
                  </td>
                );
              })}
            </tr>
          ))}</tbody>
        </table>
        <HowTo>Rows are the groups of <code>{rc}</code> and columns are the groups of <code>{cc}</code>. Each cell shows the {measure === "mean" ? "average" : measure === "median" ? "median" : "count of"} {measure === "n" ? "people in" : "charges of the people in"} that combination, with the number of people underneath. A dash means nobody in the file is in that combination.</HowTo>
      </div>
    </section>
  );
}
