// Pure helpers for the "Your results" tab, kept free of React so they can be unit-tested.
export const METHODS = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };
export const HEAD = ["Experiment", "Population or condition", "Method", "Settings", "Seed (or exact)", "n", "Repetitions or starts", "Type", "True mean", "Bias", "SD", "RMSE"];

// Rows in the same column order as the results table in DECISIONS.md.
export function ledgerRows(data) {
  const rows = [];
  if (data.methods) data.methods.results.forEach((r) => rows.push({ tab: "methods", exp: "Methods at n = 100", pop: "baseline", r }));
  if (data.size) data.size.results.forEach((r) => rows.push({ tab: "size", exp: "Sample size", pop: "baseline", r }));
  if (data.challenge) {
    const c = data.challenge;
    const desc = `top ${c.count} ${c.col} = ${c.value} rows spaced every ${c.k.toFixed(2)} rows`;
    c.results.forEach((r) => rows.push({ tab: "challenge", exp: "Challenge", pop: r.label === "modified" ? "modified" : "baseline", r, desc }));
  }
  return rows;
}
export const cells = ({ exp, pop, r, desc }) => {
  const settings = (pop === "modified" && desc ? `${r.settings} (${desc})` : r.settings).replace(/,/g, ";");
  return [exp, pop, METHODS[r.method], settings, r.type === "exact" ? "exact" : r.seed, r.n, r.count, r.type, r.trueMean.toFixed(2), r.bias.toFixed(2), r.sd.toFixed(2), r.rmse.toFixed(2)];
};
