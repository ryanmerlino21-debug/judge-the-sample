import React, { useContext, useState } from "react";
import { population } from "./data.js";
import { NavContext } from "./ctx.js";
import { money, signed } from "./charts.jsx";
import { useResults } from "./store.js";
import { HEAD, ledgerRows, cells } from "./ledger.js";

export function ResultsTab() {
  const data = useResults();
  const { goTab } = useContext(NavContext);
  const [copied, setCopied] = useState(false);
  const rows = ledgerRows(data);
  const copy = async () => {
    try { await navigator.clipboard.writeText(rows.map((x) => "| " + cells(x).join(" | ") + " |").join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };
  const csv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[HEAD, ...rows.map(cells)].map((l) => l.join(",")).join("\n")], { type: "text/csv" }));
    a.download = "current-results.csv"; a.click();
  };
  const have = { methods: !!data.methods, size: !!data.size, challenge: !!data.challenge };
  return (
    <section className="block">
      <h2>Your current results</h2>
      <p className="sub">The most recent run of each experiment in this browser session, in the same columns as the results table. Each result stays separate and is measured against the true mean of its own population. Running an experiment again replaces its rows; nothing is saved to disk.</p>
      <div className="cards three" style={{ marginBottom: 14 }}>
        {[["methods", "Experiment A", "Compare methods"], ["size", "Experiment B", "Sample size"], ["challenge", "Challenge", "Challenge"]].map(([k, t, tab]) => (
          <div key={k} className={"stat " + (have[k] ? "c1" : "c4")}>
            <div className="l">{t}</div>
            <div className="v" style={{ fontSize: 18 }}>{have[k] ? "Run: results below" : "Not run yet"}</div>
            <button type="button" className="linkbtn" onClick={() => goTab(tab === "Compare methods" ? "methods" : tab === "Sample size" ? "size" : "challenge")}>Open this tab</button>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="note">Nothing has been run yet. Run an experiment on the Compare methods, Sample size or Challenge tab and its results will appear here.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr>{HEAD.map((h, i) => <th key={h} className={i >= 5 && i !== 7 ? "num" : ""}>{h}</th>)}</tr></thead>
              <tbody>{rows.map((x, i) => {
                const c = cells(x);
                return <tr key={i}>{c.map((v, j) => <td key={j} className={j >= 5 && j !== 7 ? "num" : ""}>{j === 8 ? money(Number(v)) : j === 9 ? signed(Number(v)) : j === 10 || j === 11 ? money(Number(v)) : v}</td>)}</tr>;
              })}</tbody>
            </table>
          </div>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={copy}>{copied ? "Copied" : "Copy all rows for the DECISIONS.md table"}</button>
            <button type="button" className="btn ghost" onClick={csv}>Download all rows (CSV)</button>
            <button type="button" className="btn ghost" onClick={() => window.print()}>Print / save as PDF</button>
          </div>
          <p className="meta">Baseline population · {population.file} · N = {population.values.length.toLocaleString()}. The simple random n = 100 row on the Sample size tab repeats the one on the Compare methods tab when the seed and repetitions match.</p>
        </>
      )}
    </section>
  );
}
