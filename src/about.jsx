import React from "react";
import { population } from "./data.js";
import * as S from "./sampling.js";
import { money } from "./charts.jsx";

const N = population.values.length;

// Plain facts the app can state without interpreting any result.
export function QuickFacts() {
  const tm = S.trueMean(population.values);
  const facts = [
    ["The population", `${N.toLocaleString()} people: every row of healthcare_costs.csv, nothing more`],
    ["The target", "charges, in US dollars"],
    ["The true mean", `${money(tm)}, the average of charges over all ${N.toLocaleString()} people`],
    ["The three methods", "simple random, systematic and stratified sampling, always compared at the same total n"],
    ["Repeated results", "labelled Monte Carlo (with a seed) or exact (no seed), with the repetition or start count"],
    ["What the file is not", "real patient records, or a representative sample of current claims"],
  ];
  return (
    <section className="block">
      <h2>Quick facts</h2>
      <dl className="facts">{facts.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
    </section>
  );
}

// Prompts only. They give no answers and no conclusions.
export function Prompts() {
  const qs = [
    "Point to the full population, three sampled people, the sample mean and the true mean in the app. Are they each clearly labelled?",
    "For one method, can you predict the next three selected row numbers from the interval and the start, then check them?",
    "What is the difference between one sample's error and a method's bias or SD across many samples?",
    "Which numbers or features in the app show each method's spread, and which show its distance from the true mean?",
    "If you change the seed, which things stay the same and which can change?",
    "For any result you read: which population, method, n, seed and repetition count is it from, and is it Monte Carlo or exact?",
    "Using only what the app shows, how would you answer the central question for this population, and what limits would you state?",
  ];
  return (
    <section className="block">
      <h2>Questions to ask yourself</h2>
      <p className="sub">Prompts for checking your own understanding while you use the app. The app does not answer them.</p>
      <ol className="steps">{qs.map((q) => <li key={q}>{q}</li>)}</ol>
    </section>
  );
}

const LOG = [
  ["Sampling and results", "Simple random, systematic (whole-number and fractional interval) and stratified sampling, all in one shared module with a seeded random number generator; repeated sampling labelled exact or Monte Carlo with bias, SD and RMSE."],
  ["Experiments", "Experiment A (three methods at n = 100), Experiment B (simple random at n = 1, 10, 100), a seed check across several seeds, a sample-size curve at nine sizes, and a comparison with an earlier run."],
  ["Challenge", "A labelled modified copy that changes only the row order, with its own recalculated true mean, run against baseline results at the same n."],
  ["Charts", "Row-order bars, dots and sorted views; sample-versus-population histograms with bin widths; group-share and allocation charts; box plots by group; charges against age and BMI; log-scale histogram; estimate number line; pick-frequency grid. Most have a toggle and a save-as-image button."],
  ["Explanations", "How-to-read captions, hover help linked to a glossary, a methods guide with a design table and common questions, a walkthrough of the current estimate, and a start-here panel."],
  ["Data", "Data checks, an in-browser SHA-256 fingerprint check, a sortable data preview, a limits panel and citation text."],
  ["Reliability", "Eleven in-browser self-checks of the sampling code, 21 automated tests, shareable settings in the page link, and results that persist across tabs."],
  ["Accessibility and display", "Dark mode, patterned fills, larger text, keyboard focus outlines, screen-reader labels, a skip link, phone and print layouts."],
];
export function Changelog() {
  return (
    <section className="block">
      <h2>What this app contains</h2>
      <dl className="gloss">{LOG.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
    </section>
  );
}

export function Shortcuts() {
  const rows = [["g then p / e / m / s / c / r / u / l", "Go to the population, explore, compare methods, sample size, challenge, your results, methods guide or glossary tab"], ["?", "Open the Methods guide, which contains this list of shortcuts"], ["Esc", "Close the tour"], ["Tab / Shift+Tab", "Move between controls; every control has a visible focus outline"]];
  return (
    <section className="block">
      <h2>Keyboard shortcuts</h2>
      <table><tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row" style={{ width: 300, textTransform: "none", letterSpacing: 0, color: "var(--ink)" }}><code>{k}</code></th><td>{v}</td></tr>)}</tbody></table>
    </section>
  );
}
