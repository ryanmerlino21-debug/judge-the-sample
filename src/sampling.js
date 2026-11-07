// ALL sampling calculations live here. Every display calls this module.
// Rows are referred to by 0-based index into the population array; "row r" in
// the text of the app means index r-1.

// ---------- seedable RNG (mulberry32) ----------
export function makeRng(seed) {
  let a = (Number(seed) >>> 0) || 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // [0, 1)
  };
}

// ---------- basics ----------
export function mean(xs) {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  return s / xs.length;
}

export function trueMean(values) {
  return mean(values);
}

// ---------- simple random sampling ----------
// n distinct indices, without replacement, every n-subset equally likely
// (partial Fisher-Yates). Returned sorted ascending.
export function srsIndices(N, n, rng) {
  if (!(n >= 1 && n <= N)) throw new Error(`n must satisfy 1 <= n <= N (n=${n}, N=${N})`);
  const pool = new Uint32Array(N);
  for (let i = 0; i < N; i++) pool[i] = i;
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (N - i));
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return Array.from(pool.subarray(0, n)).sort((a, b) => a - b);
}

// ---------- systematic sampling, random start, file order ----------
export function systematicDesign(N, n) {
  if (!(n >= 1 && n <= N)) throw new Error(`n must satisfy 1 <= n <= N (n=${n}, N=${N})`);
  const whole = N % n === 0;
  return { whole, k: N / n, kind: whole ? "whole-number interval" : "fractional interval" };
}

// Rows (1-based) for a whole-number interval k with start r in 1..k.
export function systematicWholeRows(N, n, r) {
  const k = N / n;
  const rows = [];
  for (let j = 0; j < n; j++) rows.push(r + j * k);
  return rows;
}

// Rows (1-based) for fractional interval k = N/n and start u in (0, k].
export function systematicFractionalRows(N, n, u) {
  const k = N / n;
  const rows = [];
  for (let j = 0; j < n; j++) rows.push(Math.min(N, Math.max(1, Math.ceil(u + j * k))));
  return rows;
}

export function systematicIndices(N, n, rng) {
  const { whole, k } = systematicDesign(N, n);
  let rows, start;
  if (whole) {
    start = 1 + Math.floor(rng() * k); // 1..k
    rows = systematicWholeRows(N, n, start);
  } else {
    start = k * (1 - rng()); // (0, k]
    rows = systematicFractionalRows(N, n, start);
  }
  return { indices: rows.map((r) => r - 1), start };
}

// ---------- stratified sampling ----------
export function strataOf(groups) {
  const map = new Map();
  groups.forEach((g, i) => {
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(i);
  });
  return [...map.entries()].map(([name, members]) => ({ name, members, size: members.length }));
}

// Proportional allocation, largest-remainder rounding, >= 1 per stratum,
// <= stratum size, integers totalling exactly n.
export function proportionalAllocation(sizes, n) {
  const H = sizes.length;
  const N = sizes.reduce((a, b) => a + b, 0);
  if (n < H) throw new Error(`n (${n}) is smaller than the number of strata (${H})`);
  if (n > N) throw new Error(`n (${n}) is larger than N (${N})`);
  const q = sizes.map((s) => (n * s) / N);
  const alloc = q.map((x, h) => Math.min(sizes[h], Math.max(1, Math.floor(x))));
  let total = alloc.reduce((a, b) => a + b, 0);
  while (total < n) {
    let best = -1;
    for (let h = 0; h < H; h++) {
      if (alloc[h] < sizes[h] && (best < 0 || q[h] - alloc[h] > q[best] - alloc[best])) best = h;
    }
    alloc[best]++;
    total++;
  }
  while (total > n) {
    let best = -1;
    for (let h = 0; h < H; h++) {
      if (alloc[h] > 1 && (best < 0 || q[h] - alloc[h] < q[best] - alloc[best])) best = h;
    }
    alloc[best]--;
    total--;
  }
  return alloc;
}

// Returns indices of the whole sample plus per-stratum detail.
export function stratifiedSample(strata, alloc, rng) {
  const indices = [];
  const perStratum = strata.map((s, h) => {
    const local = srsIndices(s.size, alloc[h], rng).map((i) => s.members[i]);
    indices.push(...local);
    return local;
  });
  return { indices: indices.sort((a, b) => a - b), perStratum };
}

// Population-weighted estimate: sum_h (N_h / N) * (sample mean in stratum h).
export function stratifiedEstimate(values, strata, perStratum) {
  const N = strata.reduce((a, s) => a + s.size, 0);
  let est = 0;
  strata.forEach((s, h) => {
    est += (s.size / N) * mean(perStratum[h].map((i) => values[i]));
  });
  return est;
}

export function sampleMean(values, indices) {
  return mean(indices.map((i) => values[i]));
}

// ---------- one sample (any method) ----------
// pop = { values: number[], groups: {col: string[]} }
export function drawOne(method, pop, n, seed, strataCol) {
  const N = pop.values.length;
  const rng = makeRng(seed);
  if (method === "srs") {
    const indices = srsIndices(N, n, rng);
    return { method, indices, estimate: sampleMean(pop.values, indices) };
  }
  if (method === "systematic") {
    const { indices, start } = systematicIndices(N, n, rng);
    return { method, indices, start, estimate: sampleMean(pop.values, indices), design: systematicDesign(N, n) };
  }
  const strata = strataOf(pop.groups[strataCol]);
  const alloc = proportionalAllocation(strata.map((s) => s.size), n);
  const { indices, perStratum } = stratifiedSample(strata, alloc, rng);
  return { method, indices, strata, alloc, estimate: stratifiedEstimate(pop.values, strata, perStratum) };
}

// ---------- repeated sampling ----------
export function summarize(estimates, tm) {
  const m = mean(estimates);
  const bias = m - tm;
  let v = 0;
  let se = 0;
  for (const e of estimates) {
    v += (e - m) ** 2;
    se += (e - tm) ** 2;
  }
  return { bias, sd: Math.sqrt(v / estimates.length), rmse: Math.sqrt(se / estimates.length), meanOfEstimates: m };
}

// Runs the repeated-sampling result for one condition.
// Whole-number systematic interval -> exact enumeration of all k starts (no seed).
// Everything else -> Monte Carlo with `reps` seeded repetitions.
export function repeatedResult({ method, pop, n, reps, seed, strataCol }) {
  const N = pop.values.length;
  const tm = trueMean(pop.values);
  let estimates;
  let type;
  let count;
  let settings = "";
  if (method === "systematic" && N % n === 0) {
    const k = N / n;
    estimates = [];
    for (let r = 1; r <= k; r++) {
      estimates.push(mean(systematicWholeRows(N, n, r).map((row) => pop.values[row - 1])));
    }
    type = "exact";
    count = k;
    settings = `whole-number interval k = ${k}, all ${k} starts`;
  } else {
    const rng = makeRng(seed);
    estimates = new Array(reps);
    let strata, alloc;
    if (method === "stratified") {
      strata = strataOf(pop.groups[strataCol]);
      alloc = proportionalAllocation(strata.map((s) => s.size), n);
      settings = `stratified on ${strataCol}, proportional allocation (largest remainder, min 1 per stratum)`;
    } else if (method === "systematic") {
      settings = `fractional interval k = ${(N / n).toFixed(3)}`;
    } else {
      settings = "without replacement";
    }
    for (let i = 0; i < reps; i++) {
      if (method === "srs") {
        estimates[i] = sampleMean(pop.values, srsIndices(N, n, rng));
      } else if (method === "systematic") {
        estimates[i] = sampleMean(pop.values, systematicIndices(N, n, rng).indices);
      } else {
        const { perStratum } = stratifiedSample(strata, alloc, rng);
        estimates[i] = stratifiedEstimate(pop.values, strata, perStratum);
      }
    }
    type = "Monte Carlo";
    count = reps;
  }
  return { method, n, seed: type === "exact" ? null : seed, type, count, settings, trueMean: tm, estimates, ...summarize(estimates, tm) };
}

// ---------- descriptive summary (for display) ----------
export function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
export function describe(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const m = mean(values);
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - m) ** 2, 0) / values.length); // population SD (divides by N)
  return { n: values.length, mean: m, sd, min: sorted[0], q1: quantile(sorted, 0.25), median: quantile(sorted, 0.5), q3: quantile(sorted, 0.75), max: sorted[sorted.length - 1] };
}

// ---------- modified copy (stage 5): space out the top rows of one group ----------
// Builds a REORDERED COPY; the input population is never changed.
// Takes the `count` highest-target rows whose group column equals `value`
// (ties broken by earlier row), keeps them in their original relative order, and
// puts them at 1-based positions round(1 + j * interval), j = 0..count-1.
// All other rows keep their original relative order in the remaining positions.
export function spaceRows(pop, { col, value, count, interval }) {
  const N = pop.values.length;
  const cand = [];
  for (let i = 0; i < N; i++) if (pop.groups[col][i] === value) cand.push(i);
  if (cand.length < count) throw new Error(`Only ${cand.length} rows have ${col} = ${value}; cannot space out ${count}`);
  cand.sort((a, b) => pop.values[b] - pop.values[a] || a - b);
  const chosen = cand.slice(0, count).sort((a, b) => a - b);
  const targets = chosen.map((_, j) => Math.round(1 + j * interval) - 1);
  if (targets.some((t, j) => t >= N || (j > 0 && t <= targets[j - 1]))) {
    throw new Error("These settings do not fit in the file: positions run past the last row or repeat. Use a smaller interval or fewer rows.");
  }
  const isChosen = new Set(chosen);
  const rest = [];
  for (let i = 0; i < N; i++) if (!isChosen.has(i)) rest.push(i);
  const order = new Array(N);
  chosen.forEach((idx, j) => { order[targets[j]] = idx; });
  let r = 0;
  for (let p = 0; p < N; p++) if (order[p] === undefined) order[p] = rest[r++];
  return {
    values: order.map((i) => pop.values[i]),
    groups: Object.fromEntries(Object.entries(pop.groups).map(([c, arr]) => [c, order.map((i) => arr[i])])),
    rowIds: pop.rowIds ? order.map((i) => pop.rowIds[i]) : undefined,
    movedPositions: targets,
    order,
  };
}

// ---------- seeds for a multi-seed check ----------
// The first seed is the one the user is already using; the others are derived from it deterministically.
export const seedList = (base, count) => Array.from({ length: count }, (_, j) => (base + 7919 * j) >>> 0);
