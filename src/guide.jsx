import React, { useContext, useState } from "react";
import { population } from "./data.js";
import * as S from "./sampling.js";
import { NavContext } from "./ctx.js";
import { money, signed } from "./charts.jsx";
import { MeasuresPanel } from "./extras.jsx";

const N = population.values.length;
const METHOD_NAMES = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };

// ---------------------------------------------------------------- "Start here"
export function StartHere() {
  const { goTab } = useContext(NavContext);
  const steps = [
    ["pop", "The population", "See what the 1,338 rows are, what the target is and what the file is not."],
    ["explore", "Explore a sample", "Draw one sample with each method and see which people it picks and what estimate it gives."],
    ["methods", "Compare methods", "Experiment A: many repeated samples from the three methods at the same n."],
    ["size", "Sample size", "Experiment B: how the spread of the estimates changes with n."],
    ["challenge", "Challenge", "Change the row order in a labelled copy and compare the results."],
    ["guide", "Methods guide", "How each method works, what it needs, and answers to common questions."],
  ];
  return (
    <details className="starthere" open>
      <summary>Start here: what this app is for and where to begin</summary>
      <p style={{ marginTop: 10 }}><b>The question:</b> which sampling method would you trust for this population, at what sample size, and with what limits? The whole file of 1,338 people is the population, so its true mean is known exactly and every sample can be measured against it.</p>
      <ol className="steps">
        {steps.map(([tab, name, what]) => (
          <li key={tab}><button type="button" className="linkbtn" onClick={() => goTab(tab)}>{name}</button>: {what}</li>
        ))}
      </ol>
      <p className="small muted">Look for the <b>?</b> buttons next to terms, the grey “How to read this” captions under the charts, and the toggles above each chart.</p>
    </details>
  );
}

// ---------------------------------------------------------------- walk through one estimate
export function Walkthrough({ method, sample, n, strataCol }) {
  const idx = sample.indices, vals = population.values;
  const sum = idx.reduce((t, i) => t + vals[i], 0), tm = S.trueMean(vals);
  const shown = idx.slice(0, 10).map((i) => i + 1);
  let strata = null;
  if (method === "stratified" && sample.strata) {
    const g = population.groups[strataCol];
    strata = sample.strata.map((s, h) => {
      const mine = idx.filter((i) => g[i] === s.name), m = mine.length ? S.mean(mine.map((i) => vals[i])) : 0;
      return { name: s.name, size: s.size, w: s.size / N, n: mine.length, mean: m, part: (s.size / N) * m };
    });
  }
  return (
    <section className="block">
      <h2>Walk through the estimate</h2>
      <p className="sub">The same sample as above, step by step, with its real numbers.</p>
      {!strata ? (
        <ol className="steps">
          <li><b>Pick the people.</b> {METHOD_NAMES[method]} sampling picked {n} {n === 1 ? "person" : "people"}: rows {shown.join(", ")}{idx.length > 10 ? `, … (the full list of ${idx.length} is under “How this sample was chosen”)` : ""}.</li>
          <li><b>Add up their charges.</b> The {n} charges add up to {money(sum)}.</li>
          <li><b>Divide by n.</b> {money(sum)} ÷ {n} = <b>{money(sample.estimate)}</b>. That is this sample's estimate.</li>
          <li><b>Compare with the truth.</b> The true mean is the same average over all {N.toLocaleString()} people: {money(tm)}. The estimate minus the true mean is <b>{signed(sample.estimate - tm)}</b>.</li>
        </ol>
      ) : (
        <>
          <ol className="steps">
            <li><b>Split the people into groups</b> by <code>{strataCol}</code>, and sample inside each group in proportion to its size.</li>
            <li><b>Find the average charge of the sampled people in each group</b> (the “sample mean” column).</li>
            <li><b>Weight each group's average by the group's share of the file</b> (group size ÷ {N.toLocaleString()}) and add the results.</li>
          </ol>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>{strataCol}</th><th className="num">Group size</th><th className="num">Weight (size ÷ N)</th><th className="num">Sampled</th><th className="num">Sample mean</th><th className="num">Weight × mean</th></tr></thead>
              <tbody>{strata.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{r.size.toLocaleString()}</td><td className="num">{r.w.toFixed(4)}</td><td className="num">{r.n}</td><td className="num">{money(r.mean)}</td><td className="num">{money(r.part)}</td></tr>)}</tbody>
              <tfoot><tr><th>Estimate</th><th className="num">{N.toLocaleString()}</th><th className="num">{strata.reduce((t, r) => t + r.w, 0).toFixed(4)}</th><th className="num">{strata.reduce((t, r) => t + r.n, 0)}</th><th /><th className="num">{money(strata.reduce((t, r) => t + r.part, 0))}</th></tr></tfoot>
            </table>
          </div>
          <p className="small">The weighted total <b>{money(sample.estimate)}</b> is the stratified estimate. For comparison only: the plain average of all {n} sampled charges is {money(sum / n)}. That plain average is <i>not</i> the stratified estimate unless the allocation is exactly proportional.</p>
          <p className="small">True mean {money(tm)}; estimate minus true mean: <b>{signed(sample.estimate - tm)}</b>.</p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- methods guide tab
function MethodsTable() {
  const rows = [
    ["How the people are picked",
      "n different people chosen at random, none twice. Every possible set of n people is equally likely.",
      "A random starting point in the file's row order, then every k-th person, where k = N ÷ n.",
      "Split the people into groups by one column, then take a simple random sample inside each group."],
    ["The estimate",
      "The plain average of the sampled charges.",
      "The plain average of the sampled charges.",
      "Σ (group size ÷ N) × (sample mean in that group): the population-weighted mean."],
    ["Does it use the row order?", "No.", "Yes: it walks down the file in order. For this file the order is just the source file's order, not a time sequence.", "No."],
    ["What it needs", "Nothing beyond n.", "Nothing beyond n.", "A group column (observable for every person) and a rule for how many people each group gets."],
    ["Allowed sample sizes", "Any n from 1 to N.", "Any n from 1 to N. It is never restricted to sizes that divide N.", "n at least the number of groups, and at most N. Each group gets at least 1 person and never more than it has."],
    ["Two designs inside it", "None.", "If N ÷ n is a whole number: random start r in 1..k, rows r, r+k, r+2k… (k possible starts). Otherwise a fractional interval: rows ⌈u + j·k⌉ with u random in (0, k].", "Proportional allocation with largest-remainder rounding, so the group sizes are whole numbers that add up to exactly n."],
    ["How repeated results are produced here", "Monte Carlo: seeded random repetitions.", "Exact enumeration of all k starts when N ÷ n is whole; Monte Carlo otherwise.", "Monte Carlo: seeded random repetitions."],
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="cheat">
        <thead><tr><th /><th>Simple random</th><th>Systematic</th><th>Stratified</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function DesignTable() {
  const [custom, setCustom] = useState(250);
  const sizes = [1, 10, 50, 100, 500, 1000, Math.min(N, Math.max(1, Math.floor(custom) || 1))];
  const uniq = [...new Set(sizes)];
  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <label>Try another n (1–{N.toLocaleString()})
          <input type="number" min="1" max={N} value={custom} onChange={(e) => setCustom(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th className="num">n</th><th className="num">k = N ÷ n</th><th>Design that applies</th><th>How repeated results are produced</th></tr></thead>
          <tbody>{uniq.map((n) => {
            const d = S.systematicDesign(N, n);
            return (
              <tr key={n}>
                <td className="num">{n}</td>
                <td className="num">{+d.k.toFixed(3)}</td>
                <td>{d.whole ? "Whole-number interval" : "Fractional interval"}</td>
                <td>{d.whole ? `Exact enumeration: all ${d.k.toLocaleString()} possible starts` : "Monte Carlo: seeded random starts"}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="small muted">Systematic sampling at the sizes this app's experiments use: n = 1 has k = {N.toLocaleString()} (whole), n = 10 has k = 133.8 and n = 100 has k = 13.38 (both fractional).</p>
    </>
  );
}

const FAQ = [
  ["When is exact enumeration used instead of random repetitions?", "When systematic sampling has a whole-number interval k = N ÷ n. The random start is then the only random step, so there are just k equally likely samples and listing all k gives the exact result; it needs no seed. Simple random sampling, stratified sampling and the fractional-interval design use seeded random repetitions, labelled Monte Carlo."],
  ["What does RMSE add to bias and SD?", "RMSE is the typical size of one estimate's error, counting both a consistent offset (bias) and random scatter (SD): RMSE² = bias² + SD², with SD calculated by dividing by the number of repetitions. It is in the same units as the target, US dollars."],
  ["Does “unbiased” mean “reliable”?", "No. The specified designs and estimators are unbiased for the finite-population mean: across all possible samples the average estimate equals the true mean. A method can stay unbiased and still be less reliable, because its estimates vary more from sample to sample."],
  ["Why is a measured bias usually not exactly zero?", "With random repetitions you only see a finite number of samples, so even an unbiased method shows a small nonzero bias. That value may be simulation noise: it is not guaranteed to be small, and its sign can change with the seed. Compare several seeds before reading anything into it."],
  ["What can a larger sample not fix?", "A larger sample narrows the spread of the estimates. It cannot repair an estimate that is consistently off for some other reason, such as a wrong weight or a changed population, and it does not make this teaching dataset represent real patients."],
  ["Why keep the population and method fixed when n changes?", "To isolate one cause. If anything else changes along with n, you cannot tell which change produced the difference."],
  ["How is a proportional allocation rounded?", "Each group gets about n × (group size ÷ N) people, rounded down, then the leftover people go to the groups with the largest remainders. Each group gets at least one person, none gets more than it has, and the total is exactly n."],
  ["Why are the stratum means weighted?", "Each group's sample mean estimates that group's mean. Weighting by group size ÷ N combines them into an estimate for the whole population. Without the weights, groups that happened to get slightly more people from rounding would count too much."],
  ["Does reordering the rows change the true mean?", "No: the same rows in a different order have the same mean. Changing values, or adding or removing rows, may change it, so it has to be recalculated each time. Changing N can also change whether a systematic interval is a whole number."],
  ["Why does the same seed always give the same numbers?", "The seed is the starting value of the random number generator. The same seed and settings produce the same sequence of random choices, so the same samples and results. A different seed gives a different sequence."],
];

export function GuideTab() {
  return (
    <>
      <section className="block">
        <h2>The three methods side by side</h2>
        <p className="sub">What each method does. This table describes the rules only; the results are on the experiment tabs.</p>
        <MethodsTable />
      </section>
      <section className="block">
        <h2>Systematic sampling: which design applies?</h2>
        <p className="sub">For this file, N = {N.toLocaleString()}. Whether N ÷ n is a whole number decides which design applies.</p>
        <DesignTable />
      </section>
      <section className="block qa">
        <h2>Common questions</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p style={{ marginTop: 8 }}>{a}</p></details>)}
      </section>
      <section className="block">
        <h2>Reading bias, SD and RMSE</h2>
        <MeasuresPanel />
      </section>
    </>
  );
}
