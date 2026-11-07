import React, { useContext, useEffect, useState } from "react";
import { NavContext } from "./ctx.js";

const STEPS = [
  { tab: "explore", title: "Pick a method and a sample size", body: "Use the toolbar at the top of Explore a sample. The seed fixes the random choices, so the same seed and settings always give the same sample." },
  { tab: "explore", title: "See who was picked", body: "Each bar is one person in file order. The coloured bars are the people in this sample. The gold dashed line is the true mean of everyone; the dark line is this sample's mean." },
  { tab: "explore", title: "Look at how the estimate was made", body: "Further down, the walkthrough shows the real numbers behind the estimate, and 'Draw more samples' lets you watch many estimates build up against the true mean." },
  { tab: "methods", title: "Run an experiment", body: "Experiment A repeats each method many times at n = 100. Each dot is one sample's estimate. Bias, SD and RMSE summarise the dots." },
  { tab: "challenge", title: "Test a change to the row order", body: "The Challenge tab builds a labelled modified copy of the file and compares results on the baseline and the copy, each against its own true mean." },
  { tab: "results", title: "Collect your results", body: "'Your results' gathers every result you have run in one table, in the same columns as the results table in your notes." },
];

export function Tour({ open, onClose }) {
  const { goTab } = useContext(NavContext);
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const st = STEPS[i], last = i === STEPS.length - 1;
  const go = (k) => { setI(k); goTab(STEPS[k].tab); };
  return (
    <div className="tour" role="dialog" aria-modal="false" aria-label="Guided tour">
      <div className="tourhead"><b>Tour · step {i + 1} of {STEPS.length}</b><button type="button" className="linkbtn" onClick={onClose}>Close</button></div>
      <h3 style={{ textTransform: "none", fontSize: 16, color: "var(--ink)", margin: "6px 0" }}>{st.title}</h3>
      <p className="small" style={{ margin: "0 0 10px" }}>{st.body}</p>
      <div className="actions" style={{ margin: 0 }}>
        <button type="button" className="btn ghost" disabled={i === 0} onClick={() => go(i - 1)}>Back</button>
        {!last ? <button type="button" className="btn" onClick={() => go(i + 1)}>Next</button> : <button type="button" className="btn" onClick={onClose}>Done</button>}
      </div>
    </div>
  );
}
