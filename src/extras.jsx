import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { notify } from "./ctx.js";
import { NavContext } from "./ctx.js";
import { population } from "./data.js";
import * as S from "./sampling.js";
import { RowBars, StripRow, RunningMean, BiasSpreadDiagram, FrequencyGrid, HistRow, PICK_COLORS, ACCENT, money, money0, signed } from "./charts.jsx";

const N = population.values.length;
const METHOD_NAMES = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" };
const METHOD_ORDER = ["srs", "systematic", "stratified"];

// ---------------------------------------------------------------- navigation + hover help
export { NavContext };

const DEFS = {
  "true-mean": ["True mean", "The average of charges over every one of the 1,338 rows. Because the whole file is the population, it is known exactly."],
  estimate: ["Estimate", "The number one sample gives for the true mean."],
  bias: ["Bias", "Mean of the estimates minus the true mean."],
  sd: ["SD of estimates", "How much the estimates vary from sample to sample."],
  rmse: ["RMSE", "Typical size of an estimate's error: the square root of the mean of (estimate − true mean)². RMSE² = bias² + SD²."],
  stratum: ["Stratum", "A group of rows defined by a column such as smoker. Stratified sampling samples inside each group."],
  "monte-carlo": ["Monte Carlo", "Repeated random sampling with a seeded random number generator."],
  exact: ["Exact enumeration", "Listing every possible start of a whole-number systematic design instead of drawing random samples."],
  seed: ["Seed", "The starting value of the random number generator. The same seed and settings reproduce the same results."],
  repetitions: ["Repetitions", "How many separate samples are drawn. Separate from n, the size of one sample."],
  n: ["Sample size (n)", "The number of people in one sample."],
  systematic: ["Systematic sampling", "Every k-th row in file order from a random start, where k = N ÷ n."],
  band: ["Middle 90% band", "The shaded range that covers the middle 90% of the estimates (from the 5th to the 95th percentile)."],
};

export function Help({ term }) {
  const { openGlossary } = useContext(NavContext);
  const d = DEFS[term];
  if (!d) return null;
  return (
    <button type="button" className="help" aria-label={`What is ${d[0]}? Opens the glossary`} title={`${d[0]}: ${d[1]} (click to open the glossary)`} onClick={() => openGlossary(term)}>?</button>
  );
}

// ---------------------------------------------------------------- small shared controls
export function Toggle({ label, value, onChange, options }) {
  return (
    <div className="toggle" role="group" aria-label={label}>
      <span className="tlabel">{label}</span>
      {options.map(([v, t]) => <button key={v} type="button" className={value === v ? "on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>)}
    </div>
  );
}

export function CopyLink() {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); notify("Link to these settings copied"); setOk(true); setTimeout(() => setOk(false), 2000); } catch { /* clipboard unavailable */ }
  };
  return <button type="button" className="btn ghost" onClick={copy}>{ok ? "Link copied" : "Copy link to these settings"}</button>;
}

// ---- settings in the page link: #explore?m=srs&n=100&seed=2026 ...
const hashParams = () => {
  const h = location.hash.slice(1), i = h.indexOf("?");
  return new URLSearchParams(i >= 0 ? h.slice(i + 1) : "");
};
export const hashTab = () => location.hash.slice(1).split("?")[0];
export function param(key, def, allowed) {
  const v = hashParams().get(key);
  if (v == null) return def;
  if (typeof def === "number") { const x = Number(v); return Number.isFinite(x) && v !== "" ? x : def; }
  if (typeof def === "boolean") return v === "1";
  if (allowed && !allowed.includes(v)) return def;
  return v;
}
export function useUrlSync(tab, obj) {
  const str = JSON.stringify(obj);
  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => p.set(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v)));
    history.replaceState(null, "", "#" + tab + "?" + p.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, str]);
}

// ---------------------------------------------------------------- save a chart as a PNG image
function resolveVars(root) {
  const cs = getComputedStyle(document.documentElement);
  const fix = (str) => str.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || "#000");
  [root, ...root.querySelectorAll("*")].forEach((el) => {
    const st = el.getAttribute("style");
    if (st && st.includes("var(")) el.setAttribute("style", fix(st));
    ["fill", "stroke"].forEach((a) => { const v = el.getAttribute(a); if (v && v.includes("var(")) el.setAttribute(a, fix(v)); });
  });
}
const loadImage = (url) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });

export async function cardToPngBlob(card) {
  const svgs = [...card.querySelectorAll("svg")].filter((s) => s.getAttribute("role") === "img");
  if (!svgs.length) return null;
  const scale = 2, gap = 14;
  const imgs = [];
  for (const svg of svgs) {
    const r = svg.getBoundingClientRect();
    const c = svg.cloneNode(true);
    c.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    c.setAttribute("width", Math.round(r.width));
    c.setAttribute("height", Math.round(r.height));
    c.setAttribute("style", "font-family: system-ui, -apple-system, 'Segoe UI', sans-serif");
    resolveVars(c);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: "image/svg+xml;charset=utf-8" }));
    imgs.push({ im: await loadImage(url), w: Math.round(r.width), h: Math.round(r.height), url });
  }
  const W = Math.max(...imgs.map((i) => i.w)) + 24, H = imgs.reduce((t, i) => t + i.h + gap, 12);
  const cv = document.createElement("canvas");
  cv.width = W * scale; cv.height = H * scale;
  const ctx = cv.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#fff";
  ctx.fillRect(0, 0, W, H);
  let y = 12;
  for (const i of imgs) { ctx.drawImage(i.im, 12, y, i.w, i.h); y += i.h + gap; URL.revokeObjectURL(i.url); }
  return new Promise((res) => cv.toBlob(res, "image/png"));
}

export async function saveCardAsPng(card, name) {
  const blob = await cardToPngBlob(card);
  if (!blob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `${name}.png`; a.click(); notify("Downloaded " + a.download);
}

export function SaveBtn({ name = "chart" }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const click = async () => {
    setBusy(true);
    try { await saveCardAsPng(ref.current.closest(".chart"), name); } catch { /* image export unavailable */ }
    setBusy(false);
  };
  return <button ref={ref} type="button" className="savebtn" onClick={click} disabled={busy} title="Download this chart as a PNG image">{busy ? "Saving…" : "Save as image"}</button>;
}

// ---------------------------------------------------------------- how-to-read caption
export function HowTo({ children }) {
  return <p className="howto"><b>How to read this:</b> {children}</p>;
}

// ---------------------------------------------------------------- bias / SD / RMSE guide
export function MeasuresPanel() {
  return (
    <details className="measures">
      <summary>How to read bias, SD and RMSE</summary>
      <dl>
        <dt>Estimate</dt>
        <dd>The number one sample gives for the true mean. A repeated experiment draws many separate samples, so it produces many estimates.</dd>
        <dt>Bias</dt>
        <dd><b>mean of the estimates − true mean.</b> It asks whether the estimates are off target on average. It is measured against the true mean of the population the samples came from. With random repetitions it is rarely exactly zero, even for an unbiased method, and a small nonzero value can be simulation noise.</dd>
        <dt>SD (of the estimates)</dt>
        <dd><b>the spread of the estimates across repetitions</b>, dividing by the number of repetitions. It asks how much estimates vary from sample to sample. It is <i>not</i> the spread of individual charges in the file.</dd>
        <dt>RMSE</dt>
        <dd><b>√( mean of (estimate − true mean)² )</b>: the typical size of the error of one estimate, combining bias and variability. RMSE² = bias² + SD².</dd>
        <dt>Units</dt>
        <dd>All three are in US dollars, the same units as <code>charges</code>.</dd>
      </dl>
      <div className="diagram"><BiasSpreadDiagram /></div>
    </details>
  );
}

// ---------------------------------------------------------------- draw more samples
const domainOf = (xs, tm) => {
  const lo = Math.min(tm, ...xs), hi = Math.max(tm, ...xs), pad = (hi - lo) * 0.08 || 100;
  return [Math.max(0, lo - pad), hi + pad];
};

const counts0 = (drawn) => { const c = new Array(N).fill(0); drawn.forEach((d) => d.idx.forEach((i) => { c[i]++; })); return c; };
export function DrawMore({ method, n, seed, strataCol, first, firstIdx, trueMean }) {
  const [extra, setExtra] = useState(0);
  const [view, setView] = useState("dots");
  useEffect(() => { setExtra(0); }, [method, n, seed, strataCol]);

  const drawn = useMemo(() => {
    const out = [{ est: first, idx: firstIdx }];
    for (let j = 1; j <= extra; j++) {
      // draw j uses its own seed derived from the seed shown above, so the whole sequence is reproducible
      const d = S.drawOne(method, population, n, (seed + 1000003 * j) >>> 0, strataCol);
      out.push({ est: d.estimate, idx: d.indices });
    }
    return out;
  }, [method, n, seed, strataCol, extra, first, firstIdx]);
  const draws = useMemo(() => drawn.map((d) => d.est), [drawn]);
  const buckets = useMemo(() => { const b = [0, 0, 0]; counts0(drawn).forEach((c) => { b[S.pickBucket(c, drawn.length, n, N)]++; }); return b; }, [drawn, n]);
  const counts = useMemo(() => {
    const c = new Array(N).fill(0);
    drawn.forEach((d) => d.idx.forEach((i) => { c[i]++; }));
    return c;
  }, [drawn]);

  const m = S.mean(draws);
  const sd = Math.sqrt(S.mean(draws.map((x) => (x - m) ** 2)));
  const add = (k) => setExtra((e) => Math.min(1000, e + k));

  return (
    <section className="block">
      <h2>Draw more samples</h2>
      <p className="sub">The sample above is one draw. Add more draws with the same method, n and settings, and watch where their estimates land compared with the true mean. This is an exploration tool: the recorded experiments are on the Compare methods, Sample size and Challenge tabs.</p>
      <div className="chart">
        <SaveBtn name="draw-more-samples" />
        <div className="actions" style={{ marginTop: 0, marginBottom: 10 }}>
          <button className="btn ghost" onClick={() => add(1)}>Draw 1 more</button>
          <button className="btn ghost" onClick={() => add(10)}>Draw 10 more</button>
          <button className="btn ghost" onClick={() => add(100)}>Draw 100 more</button>
          <button className="btn ghost" onClick={() => setExtra(0)} disabled={extra === 0}>Back to one sample</button>
          <Toggle label="View" value={view} onChange={setView} options={[["dots", "Each estimate"], ["hist", "Histogram"], ["running", "Running average"], ["picked", "How often each person was picked"]]} />
        </div>
        {view === "dots" ? (
          <StripRow estimates={draws} domain={domainOf(draws, trueMean)} trueMean={trueMean} meanOfEstimates={m} axis tickSize={8.5} label={`${draws.length} estimates from ${draws.length} samples`} />
        ) : view === "hist" ? (
          <HistRow estimates={draws} domain={domainOf(draws, trueMean)} trueMean={trueMean} meanOfEstimates={m} axis tickSize={8.5} bins={Math.min(30, Math.max(8, Math.ceil(Math.sqrt(draws.length) * 1.6)))} label={`Histogram of ${draws.length} estimates`} />
        ) : view === "running" ? (
          <RunningMean draws={draws} trueMean={trueMean} />
        ) : (
          <FrequencyGrid counts={counts} draws={draws.length} perDraw={n} />
        )}
        <div className="legend">
          {view === "picked" ? (
            <>
              {[0, 1, 2].map((bk) => (
                <span key={bk}><span className="sw sq" style={{ background: PICK_COLORS[bk], opacity: bk === 0 ? 0.85 : 1 }} />{["never picked", "picked, but no more than expected", "picked more than expected"][bk]} · <b>{buckets[bk].toLocaleString()}</b> {buckets[bk] === 1 ? "person" : "people"}</span>
              ))}
            </>
          ) : view === "dots" || view === "hist" ? (
            <>
              <span><span className={view === "hist" ? "sw sq" : "sw"} style={{ background: ACCENT, opacity: 0.5 }} />{view === "hist" ? "bar height = number of estimates" : "one dot = one sample's estimate"}</span>
              <span><span className="key" style={{ borderTop: 0, width: 3, height: 12, background: "var(--ink)", borderRadius: 2 }} /> mean of the estimates so far</span>
            </>
          ) : (
            <span><span className="key" /> average of all draws so far</span>
          )}
          {view !== "picked" && <span><span className="key dash" /> true mean {money(trueMean)}</span>}
        </div>
        <HowTo>{view === "hist"
          ? <>Each bar counts the estimates that fall in that dollar range, so taller bars mean more of the {draws.length} {draws.length === 1 ? "estimate" : "estimates"} landed there. The black tick is the average of the estimates and the gold dashed line is the true mean of everyone.</>
          : view === "dots"
          ? <>Each dot is the estimate from one separate sample of {n} {n === 1 ? "person" : "people"}. The black tick is the average of the dots so far and the gold dashed line is the true mean of everyone. Dots far apart mean the estimates vary a lot from sample to sample.</>
          : view === "running"
          ? <>The line shows the average of all the estimates drawn so far, after each new draw. The gold dashed line is the true mean of everyone. Early on the line moves a lot because it rests on few draws.</>
          : <>Each square is one person, in file order, in one of three colours. Grey: never picked in the {draws.length} {draws.length === 1 ? "draw" : "draws"} so far. Blue: picked, but no more often than expected. Orange: picked more often than expected. Expected is the average number of times a person is picked: {draws.length} × {n} ÷ {N.toLocaleString()} = {((draws.length * n) / N).toFixed(2)}, rounded up. With few draws the pattern is mostly chance, and every draw picks {n} {n === 1 ? "person" : "people"}.</>}</HowTo>
        <p className="meta">
          <b>{draws.length}</b> {draws.length === 1 ? "sample" : "samples"} drawn · {METHOD_NAMES[method]}{method === "stratified" ? ` on ${strataCol}` : ""} · n = {n} · seed {seed} (draw 1 uses this seed; later draws use seeds derived from it, so the same clicks give the same dots)
          {draws.length > 1 && <> · mean of the estimates {money(m)} · SD of the estimates {money(sd)} · range {money0(Math.min(...draws))} to {money0(Math.max(...draws))}</>}
        </p>
        <p className="note">A handful of draws is only a rough picture. For stable bias, SD and RMSE use at least 100 repetitions on the experiment tabs.</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- selection markers for systematic samples
export const selectionTicks = (sample, n) => (sample && sample.method === "systematic" && n <= 150 && sample.indices.length ? { rows: sample.indices.map((i) => i + 1), start: sample.indices[0] + 1 } : null);

// ---------------------------------------------------------------- two methods side by side
export function SideBySide({ methodA, n, seed, strataCol, sampleA, view = "bars", markers = true }) {
  const [on, setOn] = useState(false);
  const [methodB, setMethodB] = useState(METHOD_ORDER.find((m) => m !== methodA));
  useEffect(() => { if (methodB === methodA) setMethodB(METHOD_ORDER.find((m) => m !== methodA)); }, [methodA, methodB]);

  const b = useMemo(() => {
    if (!on) return null;
    try { return { sample: S.drawOne(methodB, population, n, seed, strataCol) }; } catch (e) { return { error: e.message }; }
  }, [on, methodB, n, seed, strataCol]);

  const setA = useMemo(() => new Set(sampleA.indices), [sampleA]);
  const overlap = b && b.sample ? b.sample.indices.filter((i) => setA.has(i)).length : 0;
  const tm = S.trueMean(population.values);

  const card = (label, sample, color) => (
    <div className="chart">
      <SaveBtn name={"side-by-side-" + label.slice(0, 1).toLowerCase()} />
      <h3 style={{ textTransform: "none", fontSize: 15, color: "var(--ink)" }}>{label}</h3>
      <div className="stats" style={{ display: "flex", gap: 26, flexWrap: "wrap", margin: "4px 0 6px" }}>
        <div><div className="small muted">Estimate</div><b style={{ fontSize: 20 }}>{money(sample.estimate)}</b></div>
        <div><div className="small muted">Estimate − true mean</div><b style={{ fontSize: 20 }}>{signed(sample.estimate - tm)}</b></div>
        <div><div className="small muted">People sampled</div><b style={{ fontSize: 20 }}>{sample.indices.length}</b></div>
      </div>
      <RowBars values={population.values} sampled={sample.indices} colorOf={() => color} groupOf={null} trueMean={tm} est={sample.estimate} view={view} ticks={markers ? selectionTicks(sample, n) : null} />
      <details style={{ marginTop: 6 }}>
        <summary>Selected row numbers ({sample.indices.length}, in file order)</summary>
        <p className="small" style={{ fontFamily: "ui-monospace, Menlo, monospace", lineHeight: 1.9, wordBreak: "break-word" }}>{sample.indices.map((i) => i + 1).join(", ")}</p>
      </details>
    </div>
  );

  return (
    <section className="block">
      <h2>Compare two methods side by side</h2>
      <p className="sub">Same n, same seed and same stratification column for both. Only the method changes, so you can see which people each method picks.</p>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} style={{ minWidth: 0, width: "auto" }} /> Show a second method
        </label>
        {on && (
          <label>Second method
            <select value={methodB} onChange={(e) => setMethodB(e.target.value)}>
              {METHOD_ORDER.filter((m) => m !== methodA).map((m) => <option key={m} value={m}>{METHOD_NAMES[m]}</option>)}
            </select>
          </label>
        )}
      </div>
      {on && b && b.error && <div className="err"><b>Can't draw the second sample.</b> {b.error}. Choose a larger n or a different method.</div>}
      {on && b && b.sample && (
        <>
          {card(`A · ${METHOD_NAMES[methodA]}`, sampleA, ACCENT)}
          {card(`B · ${METHOD_NAMES[methodB]}`, b.sample, "var(--s2)")}
          <HowTo>Each chart has one {view === "dots" ? "dot" : "bar"} per person{view === "sorted" ? ", sorted from lowest to highest charges" : ", in file order"}, as on the chart above. Coloured marks are the people that method picked. The two lines mark the true mean of everyone and that sample's mean.</HowTo>
          <p className="meta">
            <b>{overlap}</b> {overlap === 1 ? "person was" : "people were"} picked by both methods ({((100 * overlap) / n).toFixed(1)}% of n = {n}). Baseline population · N = {N.toLocaleString()} · n = {n} · seed {seed}. These are two single samples, not repeated results.
          </p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- data preview (sortable, paged)
export function DataPreview() {
  const cols = [["row_id", true], ["age", true], ["age_band", false], ["sex", false], ["bmi", true], ["children", true], ["smoker", false], ["region", false], ["charges", true]];
  const rows = useMemo(() => population.values.map((v, i) => ({
    row_id: population.rowIds[i], age: population.ages[i], age_band: population.groups.age_band[i], sex: population.groups.sex[i],
    bmi: population.bmi[i], children: population.children[i], smoker: population.groups.smoker[i], region: population.groups.region[i], charges: v,
  })), []);
  const [key, setKey] = useState("row_id");
  const [dir, setDir] = useState(1);
  const [page, setPage] = useState(0);
  const per = 15, pages = Math.ceil(N / per);
  const sorted = useMemo(() => {
    const numeric = cols.find((c) => c[0] === key)[1];
    return [...rows].sort((a, b) => dir * (numeric ? a[key] - b[key] : String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true })) || a.row_id - b.row_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, key, dir]);
  const sort = (k) => { if (k === key) setDir(-dir); else { setKey(k); setDir(1); } setPage(0); };
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <caption className="small muted" style={{ textAlign: "left", paddingBottom: 6 }}>Rows {page * per + 1}–{Math.min(N, (page + 1) * per)} of {N.toLocaleString()}, sorted by <code>{key}</code> ({dir === 1 ? "lowest first" : "highest first"}). Click a column heading to sort.</caption>
          <thead>
            <tr>{cols.map(([c, num]) => (
              <th key={c} className={num ? "num" : ""} aria-sort={key === c ? (dir === 1 ? "ascending" : "descending") : "none"}>
                <button type="button" className="thbtn" onClick={() => sort(c)}>{c}{key === c ? (dir === 1 ? " ▲" : " ▼") : ""}</button>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {sorted.slice(page * per, (page + 1) * per).map((r) => (
              <tr key={r.row_id}>{cols.map(([c, num]) => <td key={c} className={num ? "num" : ""}>{c === "charges" ? money(r[c]) : r[c]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={() => setPage(0)} disabled={page === 0}>« First</button>
        <button type="button" className="btn ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹ Previous</button>
        <span className="small muted" style={{ alignSelf: "center" }}>Page {page + 1} of {pages}</span>
        <button type="button" className="btn ghost" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>Next ›</button>
        <button type="button" className="btn ghost" onClick={() => setPage(pages - 1)} disabled={page >= pages - 1}>Last »</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- limits of this file
export function LimitsPanel() {
  return (
    <section className="block">
      <h2>Limits of this file</h2>
      <p className="sub">What the numbers in this app can and cannot tell you.</p>
      <ul className="limits">
        <li><b>The population is these 1,338 rows.</b> Every average describes this file. It does not describe all patients, other health plans, other years or other people.</li>
        <li><b>It is a teaching dataset.</b> Its author describes it as simulated from US Census demographic statistics. It is not real patient records and not a representative sample of current claims.</li>
        <li><b>The row order has no documented meaning.</b> It is the order of the source file, not a time sequence. Systematic sampling walks that order, which means something different from sampling a chronological record.</li>
        <li><b>A result belongs to the conditions that produced it:</b> the population, the row order, n, the seed, the number of repetitions and any change tested. No result shows that a method always or never works.</li>
        <li><b>One sample, or one seed, is not enough.</b> Repeated samples show how a method behaves. 100 repetitions usually reveal the main pattern but cannot reliably separate small differences between methods, so rerun with different seeds.</li>
        <li><b>A nonzero bias from random repetitions may be simulation noise.</b> The specified designs and estimators are unbiased for the finite-population mean; what differs between conditions is how much the estimates vary.</li>
        <li><b>The modified copy changes only the row order.</b> It is always labelled “modified”, and its results are measured against its own recalculated true mean.</li>
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- footer
export function SiteFooter({ nPeople }) {
  const date = typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : "dev";
  const commit = typeof __COMMIT__ !== "undefined" ? __COMMIT__ : "local";
  return (
    <footer>
      <p>Baseline population: <code>{population.file}</code> ({nPeople.toLocaleString()} people). A teaching dataset, not real patient records or a representative sample of current claims.</p>
      <p>
        Data: <code>insurance.csv</code> from Brett Lantz, <i>Machine Learning with R</i> (Packt), via{" "}
        <a href="https://github.com/stedy/Machine-Learning-with-R-datasets" target="_blank" rel="noreferrer">stedy/Machine-Learning-with-R-datasets</a>. No licence is stated in the source repository.
      </p>
      <p>
        <a href="https://github.com/ryanmerlino21-debug/judge-the-sample" target="_blank" rel="noreferrer">Source code and notes on GitHub</a> · built {date} · version {commit} ·{" "}
        <button type="button" className="linkbtn" onClick={() => window.print()}>Print this page</button>
      </p>
    </footer>
  );
}

// ---------------------------------------------------------------- how to reproduce a result
export function ReproduceCard({ text }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); notify("Settings copied"); setOk(true); setTimeout(() => setOk(false), 2000); } catch { /* clipboard unavailable */ }
  };
  return (
    <p className="meta"><b>To reproduce this result:</b> {text} · <button type="button" className="linkbtn" onClick={copy}>{ok ? "Copied" : "Copy these settings as text"}</button></p>
  );
}

// ---------------------------------------------------------------- how far off is this estimate?
export function EstimateRuler({ trueMean, est }) {
  const [zoom, setZoom] = useState(true);
  const top = Math.ceil(Math.max(...population.values) / 10000) * 10000;
  const gap = Math.abs(est - trueMean);
  const pad = Math.max(gap * 1.2, 400);
  const lo = zoom ? Math.max(0, Math.min(est, trueMean) - pad) : 0, hi = zoom ? Math.max(est, trueMean) + pad : top;
  const W = 900, L = 24, R = 24, y = 78, H = 150;
  const x = (v) => L + ((v - lo) / (hi - lo || 1)) * (W - L - R);
  const ticks = zoom ? (() => { const out = []; const step = (hi - lo) / 5, p10 = 10 ** Math.floor(Math.log10(step)), f = step / p10, st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p10; for (let t = Math.ceil(lo / st) * st; t <= hi; t += st) out.push(t); return out; })() : [0, 10000, 20000, 30000, 40000, 50000, 60000, 70000].filter((t) => t <= hi);
  const left = Math.min(x(est), x(trueMean)), right = Math.max(x(est), x(trueMean));
  return (
    <>
      <div className="opts"><Toggle label="Scale" value={zoom ? "zoom" : "full"} onChange={(v) => setZoom(v === "zoom")} options={[["zoom", "Zoom in on the gap"], ["full", "Full range of charges"]]} /></div>
      <div className="chart">
        <SaveBtn name="estimate-vs-true-mean" />
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The sample estimate ${money(est)} and the true mean ${money(trueMean)} on a number line; the gap is ${signed(est - trueMean)}`}>
          <line x1={L} x2={W - R} y1={y} y2={y} strokeWidth="2" style={{ stroke: "var(--axis)" }} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={y - 5} y2={y + 5} strokeWidth="1.5" style={{ stroke: "var(--axis)" }} />
              <text x={x(t)} y={y + 24} fontSize="11" textAnchor="middle" style={{ fill: "var(--muted)" }}>{money0(t)}</text>
            </g>
          ))}
          {right - left > 2 && <rect x={left} y={y - 7} width={right - left} height="14" rx="3" style={{ fill: "var(--accent)" }} opacity="0.25"><title>{`Estimate minus true mean: ${signed(est - trueMean)}`}</title></rect>}
          <line x1={x(trueMean)} x2={x(trueMean)} y1={26} y2={y + 12} strokeWidth="3" strokeDasharray="6 4" style={{ stroke: "var(--truec)" }} />
          <line x1={x(est)} x2={x(est)} y1={26} y2={y + 12} strokeWidth="3" style={{ stroke: "var(--samplec)" }} />
          <circle cx={x(trueMean)} cy={y} r="6" style={{ fill: "var(--truec)", stroke: "var(--surface)" }} strokeWidth="2" />
          <circle cx={x(est)} cy={y} r="6" style={{ fill: "var(--samplec)", stroke: "var(--surface)" }} strokeWidth="2" />
          <text x={x(trueMean) + (est >= trueMean ? -8 : 8)} y="20" fontSize="12.5" fontWeight="600" textAnchor={est >= trueMean ? "end" : "start"} style={{ fill: "var(--ink2)" }}>True mean {money(trueMean)}</text>
          <text x={x(est) + (est >= trueMean ? 8 : -8)} y="20" fontSize="12.5" fontWeight="700" textAnchor={est >= trueMean ? "start" : "end"} style={{ fill: "var(--ink)" }}>Sample estimate {money(est)}</text>
          <text x={(left + right) / 2} y={y + 50} fontSize="13" fontWeight="700" textAnchor="middle" style={{ fill: "var(--ink)" }}>{signed(est - trueMean)}</text>
        </svg>
        <HowTo>The gold dashed line is the true mean of everyone and the dark line is this sample's estimate. The shaded stretch between them is the error of this one sample: the estimate minus the true mean. One sample's error says little about how the method behaves in general; the experiment tabs show many samples.</HowTo>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- exactly who was picked
export function SampledPeople({ indices }) {
  const cap = 200, shown = indices.slice(0, cap);
  return (
    <details>
      <summary>Who was picked: the people in this sample ({indices.length})</summary>
      <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
        <table>
          <thead><tr><th className="num">Row</th><th className="num">Age</th><th>Sex</th><th>Smoker</th><th>Region</th><th className="num">Charges</th></tr></thead>
          <tbody>{shown.map((i) => (
            <tr key={i}><td className="num">{population.rowIds[i]}</td><td className="num">{population.ages[i]}</td><td>{population.groups.sex[i]}</td><td>{population.groups.smoker[i]}</td><td>{population.groups.region[i]}</td><td className="num">{money(population.values[i])}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {indices.length > cap && <p className="small muted">Showing the first {cap} of {indices.length} people, in file order.</p>}
    </details>
  );
}

// ---------------------------------------------------------------- sample versus population on every column
export function Representativeness({ indices }) {
  const n = indices.length;
  const numeric = [["age (years)", population.ages], ["bmi", population.bmi], ["children", population.children]];
  const mean = (arr, idx) => idx.reduce((t, i) => t + arr[i], 0) / idx.length;
  const all = population.values.map((_, i) => i);
  const cols = ["age_band", "region", "smoker", "sex"];
  return (
    <details>
      <summary>Compare this sample with the population on every column</summary>
      <p className="small muted">Descriptive only: how the {n} sampled people compare with all {N.toLocaleString()} people on each column, not just the one you coloured by.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Column</th><th className="num">Population</th><th className="num">This sample</th><th className="num">Difference</th></tr></thead>
          <tbody>
            {numeric.map(([label, arr]) => { const a = mean(arr, all), b = mean(arr, indices); return <tr key={label}><td>mean {label}</td><td className="num">{a.toFixed(2)}</td><td className="num">{b.toFixed(2)}</td><td className="num">{b - a >= 0 ? "+" : "−"}{Math.abs(b - a).toFixed(2)}</td></tr>; })}
            {cols.flatMap((c) => S.strataOf(population.groups[c]).sort((x, y) => String(x.name).localeCompare(String(y.name), undefined, { numeric: true })).map((g) => {
              const pa = (100 * g.size) / N, k = indices.filter((i) => population.groups[c][i] === g.name).length, pb = (100 * k) / n;
              return <tr key={c + g.name}><td>share of <code>{c}</code> = {g.name}</td><td className="num">{pa.toFixed(1)}%</td><td className="num">{pb.toFixed(1)}% ({k})</td><td className="num">{pb - pa >= 0 ? "+" : "−"}{Math.abs(pb - pa).toFixed(1)} pp</td></tr>;
            }))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
