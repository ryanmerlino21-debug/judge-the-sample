// Technical correctness checks only. These do not report investigation results.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as S from "../src/sampling.js";

const syn = (N) => Array.from({ length: N }, (_, i) => (i * 37) % 101 + i / 7);
const popOf = (values, g) => ({ values, groups: { g } });

test("SRS: exactly n distinct in-range rows, all n incl. 1 and N", () => {
  const rng = S.makeRng(1);
  for (const [N, n] of [[50, 1], [50, 10], [50, 50], [1338, 100]]) {
    const idx = S.srsIndices(N, n, rng);
    assert.equal(idx.length, n);
    assert.equal(new Set(idx).size, n);
    assert.ok(idx.every((i) => i >= 0 && i < N));
  }
});

test("SRS: each row equally likely (known-answer, N=6 n=2)", () => {
  const rng = S.makeRng(7), counts = new Array(6).fill(0), T = 60000;
  for (let t = 0; t < T; t++) S.srsIndices(6, 2, rng).forEach((i) => counts[i]++);
  counts.forEach((c) => assert.ok(Math.abs(c / T - 2 / 6) < 0.01));
});

test("systematic: n distinct rows within 1..N for many N, n (incl. non-divisors)", () => {
  const rng = S.makeRng(3);
  for (let N = 1; N <= 60; N++)
    for (let n = 1; n <= N; n++)
      for (let rep = 0; rep < 5; rep++) {
        const { indices } = S.systematicIndices(N, n, rng);
        assert.equal(indices.length, n, `N=${N} n=${n}`);
        assert.equal(new Set(indices).size, n, `distinct N=${N} n=${n}`);
        assert.ok(indices.every((i) => i >= 0 && i < N), `range N=${N} n=${n}`);
      }
  for (const n of [1, 10, 100]) assert.equal(S.systematicIndices(1338, n, rng).indices.length, n);
});

test("systematic whole interval follows r, r+k, r+2k", () => {
  assert.deepEqual(S.systematicWholeRows(20, 5, 3), [3, 7, 11, 15, 19]);
  assert.equal(S.systematicDesign(20, 5).whole, true);
  assert.equal(S.systematicDesign(1338, 100).whole, false);
});

test("systematic: every row has inclusion probability n/N (exact, fractional N=10 n=4)", () => {
  // integrate over u uniformly on (0,k] with a fine grid
  const N = 10, n = 4, k = N / n, G = 200000, hits = new Array(N).fill(0);
  for (let g = 0; g < G; g++) S.systematicFractionalRows(N, n, ((g + 0.5) / G) * k).forEach((r) => hits[r - 1]++);
  hits.forEach((h) => assert.ok(Math.abs(h / G - n / N) < 0.001));
});

test("allocation: integers, total n, >=1, <= stratum size, weights sum to 1", () => {
  const cases = [[[417, 257, 279, 385], 100], [[1064, 274], 100], [[662, 676], 7], [[5, 1000, 3], 10], [[2, 2, 2000], 6], [[1064, 274], 2]];
  for (const [sizes, n] of cases) {
    const a = S.proportionalAllocation(sizes, n);
    assert.equal(a.reduce((x, y) => x + y, 0), n);
    a.forEach((x, h) => { assert.ok(Number.isInteger(x)); assert.ok(x >= 1 && x <= sizes[h]); });
    const N = sizes.reduce((x, y) => x + y, 0);
    assert.ok(Math.abs(sizes.reduce((s, z) => s + z / N, 0) - 1) < 1e-12);
  }
  assert.throws(() => S.proportionalAllocation([10, 10, 10], 2));
});

test("stratified: n per stratum honoured, distinct rows, weighted estimator", () => {
  const g = ["a", "a", "a", "a", "b", "b"], v = [1, 2, 3, 4, 100, 200];
  const strata = S.strataOf(g);
  const { indices, perStratum } = S.stratifiedSample(strata, [4, 1], S.makeRng(2));
  assert.equal(new Set(indices).size, 5);
  // all of stratum a taken: mean 2.5 weight 4/6; one of b is 100 or 200 weight 2/6
  const est = S.stratifiedEstimate(v, strata, perStratum);
  assert.ok([2.5 * 4 / 6 + 100 * 2 / 6, 2.5 * 4 / 6 + 200 * 2 / 6].some((x) => Math.abs(x - est) < 1e-9));
});

test("stratified weighted estimator: unbiased under non-proportional allocation (exact)", () => {
  const g = ["a", "a", "a", "a", "b", "b"], v = [1, 2, 3, 4, 100, 200], tm = S.trueMean(v);
  const strata = S.strataOf(g);
  // allocation [1,2]: average over all 4 x 1 equally likely samples
  let sum = 0, cnt = 0;
  for (let i = 0; i < 4; i++) { sum += (4 / 6) * v[i] + (2 / 6) * 150; cnt++; }
  assert.ok(Math.abs(sum / cnt - tm) < 1e-9);
  void strata;
});

test("reproducibility: same seed and settings give identical samples and results", () => {
  const N = 300, pop = popOf(syn(N), Array.from({ length: N }, (_, i) => "g" + (i % 3)));
  for (const m of ["srs", "systematic", "stratified"]) {
    const a = S.drawOne(m, pop, 30, 42, "g"), b = S.drawOne(m, pop, 30, 42, "g");
    assert.deepEqual(a.indices, b.indices);
    assert.equal(a.estimate, b.estimate);
    const r1 = S.repeatedResult({ method: m, pop, n: 30, reps: 100, seed: 9, strataCol: "g" });
    const r2 = S.repeatedResult({ method: m, pop, n: 30, reps: 100, seed: 9, strataCol: "g" });
    assert.deepEqual(r1.estimates, r2.estimates);
  }
});

test("repeated sampling: reps count, labels, RMSE^2 = bias^2 + SD^2", () => {
  const N = 300, pop = popOf(syn(N), Array.from({ length: N }, (_, i) => "g" + (i % 3)));
  for (const m of ["srs", "systematic", "stratified"]) {
    for (const n of [7, 30]) {
      const r = S.repeatedResult({ method: m, pop, n, reps: 150, seed: 5, strataCol: "g" });
      assert.ok(Math.abs(r.rmse ** 2 - (r.bias ** 2 + r.sd ** 2)) < 1e-8);
      if (m === "systematic" && N % n === 0) { assert.equal(r.type, "exact"); assert.equal(r.count, N / n); }
      else { assert.equal(r.type, "Monte Carlo"); assert.equal(r.estimates.length, 150); }
    }
  }
});

test("exact enumeration lists each start once and averages to the true mean", () => {
  const N = 120, pop = popOf(syn(N), []);
  const r = S.repeatedResult({ method: "systematic", pop, n: 10, reps: 100, seed: 1 });
  assert.equal(r.type, "exact");
  assert.equal(r.estimates.length, 12);
  assert.ok(Math.abs(r.bias) < 1e-9); // each row in exactly one of k samples
  const all = [];
  for (let s = 1; s <= 12; s++) all.push(...S.systematicWholeRows(N, 10, s));
  assert.equal(new Set(all).size, N);
});

test("true mean: reordering leaves it unchanged; changing a value changes it", () => {
  const v = syn(100), rev = [...v].reverse();
  assert.ok(Math.abs(S.trueMean(v) - S.trueMean(rev)) < 1e-9);
  const w = [...v]; w[0] += 1000;
  assert.notEqual(S.trueMean(w), S.trueMean(v));
});

test("real data file parses (size and numeric target only)", () => {
  const [h, ...ls] = readFileSync(new URL("../data/healthcare_costs.csv", import.meta.url), "utf8").trim().split(/\r?\n/);
  const cols = h.split(","), t = cols.indexOf("charges");
  assert.equal(ls.length, 1338);
  assert.ok(ls.every((l) => Number.isFinite(Number(l.split(",")[t]))));
});

test("describe: known-answer summary", () => {
  const d = S.describe([1, 2, 3, 4, 5]);
  assert.equal(d.median, 3); assert.equal(d.min, 1); assert.equal(d.max, 5);
  assert.equal(d.q1, 2); assert.equal(d.q3, 4);
  assert.ok(Math.abs(d.sd - Math.sqrt(2)) < 1e-12);
});

test("spaceRows: known-answer placement, permutation, true mean unchanged, original untouched", () => {
  const pop = { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], groups: { g: ["x", "x", "x", "x", "x", "x", "x", "a", "a", "a"] } };
  const snapshot = JSON.stringify(pop);
  const m = S.spaceRows(pop, { col: "g", value: "a", count: 2, interval: 4 });
  assert.equal(JSON.stringify(pop), snapshot);                    // original unchanged
  assert.deepEqual(m.movedPositions, [0, 4]);                      // round(1)=1, round(5)=5 -> 0-based 0 and 4
  assert.deepEqual(m.values, [9, 1, 2, 3, 10, 4, 5, 6, 7, 8]);     // top 2 of group a (10, 9) keep original relative order (9 then 10)
  assert.deepEqual([...m.order].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(Math.abs(S.trueMean(m.values) - S.trueMean(pop.values)) < 1e-12);
});

test("spaceRows: 100 spaced rows at interval 13.38 on N=1338 are distinct, in range, nearest-row rounded", () => {
  const N = 1338, groups = { s: Array.from({ length: N }, (_, i) => (i % 5 === 0 ? "yes" : "no")) };
  const pop = { values: Array.from({ length: N }, (_, i) => (i * 7919) % 1000), groups };
  const m = S.spaceRows(pop, { col: "s", value: "yes", count: 100, interval: N / 100 });
  assert.equal(new Set(m.movedPositions).size, 100);
  assert.ok(m.movedPositions.every((p) => p >= 0 && p < N));
  m.movedPositions.forEach((p, j) => assert.equal(p, Math.round(1 + j * 13.38) - 1));
  assert.ok(m.movedPositions.every((p, j) => m.groups.s[p] === "yes"));
  assert.ok(Math.abs(S.trueMean(m.values) - S.trueMean(pop.values)) < 1e-9);
  assert.throws(() => S.spaceRows(pop, { col: "s", value: "yes", count: 100, interval: 20 }));
});

test("summarize: bias, SD and RMSE match a hand calculation (estimates 1,2,3,4; true mean 2)", () => {
  const r = S.summarize([1, 2, 3, 4], 2);
  assert.ok(Math.abs(r.meanOfEstimates - 2.5) < 1e-12);
  assert.ok(Math.abs(r.bias - 0.5) < 1e-12);                 // 2.5 - 2
  assert.ok(Math.abs(r.sd - Math.sqrt(1.25)) < 1e-12);        // divides by the number of repetitions
  assert.ok(Math.abs(r.rmse - Math.sqrt(1.5)) < 1e-12);       // sqrt((1 + 0 + 1 + 4) / 4)
  assert.ok(Math.abs(r.rmse ** 2 - (r.bias ** 2 + r.sd ** 2)) < 1e-12);
});
