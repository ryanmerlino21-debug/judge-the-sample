import React, { useMemo, useState } from "react";
import { population, RAW_CSV, HEADER_COLUMNS, GROUP_COLUMNS } from "./data.js";
import * as S from "./sampling.js";
import { money } from "./charts.jsx";

const N = population.values.length;
export const PUBLISHED_SHA256 = "d51bc2b911e7d636d232ee6e9fb94b0c0e9bbad2d898894d9938afb7fa2bbbbd";
const EXPECTED_COLUMNS = ["row_id", "age", "age_band", "sex", "bmi", "children", "smoker", "region", "charges"];
const EXPECTED_COUNTS = {
  age_band: { "18-29": 417, "30-39": 257, "40-49": 279, "50-64": 385 },
  region: { northeast: 324, northwest: 325, southeast: 364, southwest: 325 },
  smoker: { no: 1064, yes: 274 },
  sex: { female: 662, male: 676 },
};
const bandOf = (a) => (a < 30 ? "18-29" : a < 40 ? "30-39" : a < 50 ? "40-49" : "50-64");

function buildChecks() {
  const v = population.values, d = S.describe(v), iqr = d.q3 - d.q1, fence = d.q3 + 1.5 * iqr;
  const m = S.mean(v), sd = d.sd, skew = S.mean(v.map((x) => ((x - m) / sd) ** 3));
  const countsOk = GROUP_COLUMNS.every((c) => S.strataOf(population.groups[c]).every((g) => EXPECTED_COUNTS[c][g.name] === g.size) && Object.keys(EXPECTED_COUNTS[c]).length === S.strataOf(population.groups[c]).length);
  return [
    ["Rows loaded", `${N.toLocaleString()} rows`, N === 1338],
    ["Columns", `${HEADER_COLUMNS.length} columns, in the documented order`, JSON.stringify(HEADER_COLUMNS) === JSON.stringify(EXPECTED_COLUMNS)],
    ["Target column is numeric", `${v.filter((x) => !Number.isFinite(x)).length} missing or non-numeric charges`, v.every((x) => Number.isFinite(x))],
    ["Row numbers run 1 to N in order", `row_id 1 to ${N.toLocaleString()}`, population.rowIds.every((r, i) => r === i + 1)],
    ["Age ranges", `${Math.min(...population.ages)} to ${Math.max(...population.ages)} years, and every age_band matches its age`, population.ages.every((a, i) => bandOf(a) === population.groups.age_band[i])],
    ["BMI and children are numeric", `BMI ${Math.min(...population.bmi)} to ${Math.max(...population.bmi)}; children ${Math.min(...population.children)} to ${Math.max(...population.children)}`, population.bmi.every(Number.isFinite) && population.children.every(Number.isFinite)],
    ["Group sizes match the data documentation", "age_band, region, smoker and sex all have the documented counts", countsOk],
    ["Charges range", `${money(d.min)} to ${money(d.max)}`, d.min > 0],
  ].map(([name, detail, pass]) => ({ name, detail, pass })).concat([
    { name: "Charges above the upper box-plot fence", detail: `${v.filter((x) => x > fence).length} people have charges above ${money(fence)} (Q3 + 1.5 × IQR); none were removed`, info: true },
    { name: "Shape of the charges", detail: `skewness ${skew.toFixed(2)}: a positive value means a long tail of high charges`, info: true },
  ]);
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function DataChecks() {
  const checks = useMemo(buildChecks, []);
  const [fp, setFp] = useState(null);
  const verify = async () => {
    try { const h = await sha256Hex(RAW_CSV); setFp({ h, ok: h === PUBLISHED_SHA256 }); } catch { setFp({ h: "unavailable in this browser", ok: false }); }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([RAW_CSV], { type: "text/csv" })); a.download = "healthcare_costs.csv"; a.click();
  };
  const passed = checks.filter((c) => !c.info && c.pass).length, total = checks.filter((c) => !c.info).length;
  return (
    <section className="block">
      <h2>Data checks</h2>
      <p className="sub">Quick checks that the file loaded as documented, run in your browser on the data the app uses. {passed} of {total} checks passed.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th style={{ width: 80 }}>Result</th><th>Check</th><th>What was found</th></tr></thead>
          <tbody>{checks.map((c) => (
            <tr key={c.name}>
              <td>{c.info ? <span className="muted">Note</span> : <b style={{ color: c.pass ? "var(--s3)" : "#b3261e" }}>{c.pass ? "✓ Pass" : "✗ Fail"}</b>}</td>
              <td>{c.name}</td><td>{c.detail}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h3 style={{ marginTop: 18, textTransform: "none", fontSize: 15, color: "var(--ink)" }}>Is the file unchanged?</h3>
      <p className="small muted" style={{ maxWidth: 780 }}>The published SHA-256 fingerprint of <code>healthcare_costs.csv</code> is <code style={{ wordBreak: "break-all" }}>{PUBLISHED_SHA256}</code>. The button recomputes the fingerprint of the exact text this app loaded. If a single character had changed, the fingerprints would differ.</p>
      <div className="actions">
        <button type="button" className="btn" onClick={verify}>Verify the file fingerprint</button>
        <button type="button" className="btn ghost" onClick={download}>Download the CSV exactly as loaded</button>
      </div>
      {fp && (
        <p role="status" style={{ marginTop: 10 }}>
          <b style={{ color: fp.ok ? "var(--s3)" : "#b3261e" }}>{fp.ok ? "✓ The fingerprints match: the data is unchanged." : "✗ The fingerprints do not match."}</b>
          <br /><span className="small muted">Computed here: <code style={{ wordBreak: "break-all" }}>{fp.h}</code></span>
        </p>
      )}
    </section>
  );
}
