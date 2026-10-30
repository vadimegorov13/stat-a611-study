// Descriptive statistics, course-convention quartiles/boxplots, distributions, and seeded random data.
// Shared so the unit tests can check it against the lecture worked examples.

export const sortNum = (xs: number[]) => [...xs].sort((a, b) => a - b);
export const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : NaN);

/** Median of an already-sorted array. */
function medianSorted(s: number[]): number {
  const n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
export const median = (xs: number[]) => medianSorted(sortNum(xs));

/** Sample variance (divide by n − 1). */
export function variance(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
}
export const sd = (xs: number[]) => Math.sqrt(variance(xs));

export function modes(xs: number[]): number[] {
  const c = new Map<number, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  const top = Math.max(...c.values());
  if (top <= 1) return []; // every value once: no mode
  return [...c].filter(([, k]) => k === top).map(([v]) => v).sort((a, b) => a - b);
}

/** Course convention: Q1/Q3 are medians of the halves; for odd n the median belongs to both halves. */
export function quartilesCourse(xs: number[]): { q1: number; q2: number; q3: number; lower: number[]; upper: number[] } {
  const s = sortNum(xs);
  const n = s.length;
  const half = Math.ceil(n / 2);
  const lower = s.slice(0, half);
  const upper = s.slice(n - half);
  return { q1: medianSorted(lower), q2: medianSorted(s), q3: medianSorted(upper), lower, upper };
}

/** Linear-interpolation quartiles (R's default "type 7", Excel QUARTILE.INC), shown only for comparison. */
export function quantileType7(xs: number[], p: number): number {
  const s = sortNum(xs);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h);
  return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]);
}

export type OutlierKind = 'mild' | 'extreme';

export interface BoxSummary {
  n: number;
  min: number;
  max: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  inner: [number, number];
  outer: [number, number];
  /** Whisker endpoints: smallest and largest values that are not outliers (P1, P2 in the notes). */
  p1: number;
  p2: number;
  outliers: { value: number; kind: OutlierKind; side: 'low' | 'high' }[];
  lower: number[];
  upper: number[];
}

// Fence comparisons tolerate floating-point noise so that equality (which the course counts as an outlier) is detected.
const EPS = 1e-9;

/** Boxplot by the course rules: equality at a fence counts as an outlier. */
export function boxSummary(xs: number[]): BoxSummary {
  const s = sortNum(xs);
  const { q1, q2, q3, lower, upper } = quartilesCourse(s);
  const iqr = q3 - q1;
  const inner: [number, number] = [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
  const outer: [number, number] = [q1 - 3 * iqr, q3 + 3 * iqr];
  const outliers: BoxSummary['outliers'] = [];
  const inside: number[] = [];
  for (const x of s) {
    // IQR = 0 is degenerate; the lesson recommends handling it explicitly, so we flag nothing then.
    if (iqr > 0 && x <= inner[0] + EPS) outliers.push({ value: x, kind: x <= outer[0] + EPS ? 'extreme' : 'mild', side: 'low' });
    else if (iqr > 0 && x >= inner[1] - EPS) outliers.push({ value: x, kind: x >= outer[1] - EPS ? 'extreme' : 'mild', side: 'high' });
    else inside.push(x);
  }
  return {
    n: s.length,
    min: s[0],
    max: s[s.length - 1],
    q1,
    q2,
    q3,
    iqr,
    inner,
    outer,
    p1: inside[0] ?? s[0],
    p2: inside[inside.length - 1] ?? s[s.length - 1],
    outliers,
    lower,
    upper,
  };
}

export interface Bin {
  lo: number;
  hi: number;
  count: number;
}

/** Left-closed classes [lo, hi), as in the course; the last class also closes on the right only if a value equals it exactly at the top edge. */
export function histogram(xs: number[], start: number, width: number, classes?: number): Bin[] {
  if (!(width > 0)) return [];
  const max = Math.max(...xs);
  const k = classes ?? Math.max(1, Math.floor((max - start) / width + EPS) + 1);
  const bins: Bin[] = Array.from({ length: k }, (_, i) => ({ lo: roundTo(start + i * width), hi: roundTo(start + (i + 1) * width), count: 0 }));
  for (const x of xs) {
    const i = Math.floor((x - start) / width + EPS);
    if (i >= 0 && i < k) bins[i].count++;
  }
  return bins;
}

/** A "nice" class width giving roughly 5–10 classes, and a start at or below the minimum. */
export function niceClasses(xs: number[], target = 7): { start: number; width: number } {
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const span = max - min || Math.abs(max) || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const width = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((w) => w >= raw) ?? 10 * mag;
  return { start: roundTo(Math.floor(min / width + EPS) * width), width: roundTo(width) };
}

/** Round away binary noise (0.30000000000000004 → 0.3). */
export function roundTo(x: number, digits = 10): number {
  return Number(x.toFixed(digits));
}

/** Format a number for display: trims trailing zeros, at most `dp` decimals. */
export function fmt(x: number, dp = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  const s = Number(x.toFixed(dp)).toString();
  return s.replace('-', '−');
}

export function decimalsOf(xs: number[]): number {
  let d = 0;
  for (const x of xs) {
    const m = /\.(\d+)$/.exec(String(x));
    if (m) d = Math.max(d, m[1].length);
  }
  return Math.min(d, 6);
}

// ---------- stem-and-leaf ----------

export interface StemLeaf {
  /** Place value of one leaf digit, e.g. 1 (ones) or 0.001 (thousandths). */
  leafUnit: number;
  rows: { stem: number; label: string; leaves: number[] }[];
  split: boolean;
}

export function stemAndLeaf(xs: number[], leafUnit: number, split = false): StemLeaf {
  const ints = sortNum(xs).map((x) => Math.round(x / leafUnit));
  const stems = ints.map((v) => Math.floor(v / 10));
  const lo = Math.min(...stems);
  const hi = Math.max(...stems);
  const rows: StemLeaf['rows'] = [];
  for (let st = lo; st <= hi; st++) {
    const leaves = ints.filter((v) => Math.floor(v / 10) === st).map((v) => v - st * 10);
    if (split) {
      rows.push({ stem: st, label: String(st), leaves: leaves.filter((l) => l <= 4) });
      rows.push({ stem: st, label: String(st), leaves: leaves.filter((l) => l >= 5) });
    } else rows.push({ stem: st, label: String(st), leaves });
  }
  return { leafUnit, rows, split };
}

/** Leaf unit that keeps about 5–15 stems. */
export function autoLeafUnit(xs: number[]): number {
  const d = decimalsOf(xs);
  let unit = 10 ** -d;
  const span = Math.max(...xs) - Math.min(...xs);
  while (span / (unit * 10) > 15) unit *= 10;
  return roundTo(unit);
}

// ---------- paired data ----------

export function correlation(xs: number[], ys: number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export function leastSquares(xs: number[], ys: number[]): { a: number; b: number; r: number } {
  const r = correlation(xs, ys);
  const b = r * (sd(ys) / sd(xs));
  return { a: mean(ys) - b * mean(xs), b, r };
}

/** Lecture guide (Oct 12 p. 3): |R| ≥ 0.8 strong, 0.5–0.8 moderate, below 0.5 weak. */
export function strength(r: number): 'strong' | 'moderate' | 'weak' {
  const a = Math.abs(r);
  return a >= 0.8 ? 'strong' : a >= 0.5 ? 'moderate' : 'weak';
}

// ---------- special functions ----------

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function lnGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export const lnChoose = (n: number, k: number) => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);

/** Regularized lower incomplete gamma P(a, x) (series for x < a + 1, continued fraction otherwise). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  const gln = lnGamma(a);
  if (x < a + 1) {
    let ap = a;
    let del = 1 / a;
    let s = del;
    for (let i = 0; i < 1000; i++) {
      ap += 1;
      del *= x / ap;
      s += del;
      if (Math.abs(del) < Math.abs(s) * 1e-15) break;
    }
    return s * Math.exp(-x + a * Math.log(x) - gln);
  }
  let b = x + 1 - a;
  let c = 1 / 1e-300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
}

/** Standard normal CDF Φ(z). */
export function phi(z: number): number {
  const p = 0.5 * gammaP(0.5, (z * z) / 2);
  return z >= 0 ? 0.5 + p : 0.5 - p;
}

/** Inverse of Φ by bisection (plenty fast for UI use). */
export function phiInv(q: number): number {
  if (q <= 0) return -Infinity;
  if (q >= 1) return Infinity;
  let lo = -40;
  let hi = 40;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (phi(mid) < q) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------- distributions ----------

export type FamilyId = 'binomial' | 'geometric' | 'negbin' | 'hypergeometric' | 'poisson' | 'uniform' | 'normal' | 'exponential' | 'gamma' | 'chisq';

export interface Family {
  id: FamilyId;
  type: 'discrete' | 'continuous';
  params: { key: string; label: string; min: number; max: number; step: number; integer?: boolean }[];
  defaults: Record<string, number>;
  /** Return an error message when the parameters are not a valid model. */
  check?: (p: Record<string, number>) => string | null;
  mean: (p: Record<string, number>) => number;
  variance: (p: Record<string, number>) => number;
  /** Discrete: P(X = x). Continuous: f(x). */
  f: (x: number, p: Record<string, number>) => number;
  /** Continuous only: F(x). */
  F?: (x: number, p: Record<string, number>) => number;
  /** Discrete support bounds (inclusive) or continuous plotting range. */
  range: (p: Record<string, number>) => [number, number];
}

const discreteRange = (lo: number, p: Record<string, number>, f: Family['f'], hardMax = 400): [number, number] => {
  let c = 0;
  let x = lo;
  for (; x < lo + hardMax; x++) {
    c += f(x, p);
    if (c > 0.9999) break;
  }
  return [lo, x];
};

export const FAMILIES: Record<FamilyId, Family> = {
  binomial: {
    id: 'binomial',
    type: 'discrete',
    params: [
      { key: 'n', label: 'n (trials)', min: 1, max: 100, step: 1, integer: true },
      { key: 'p', label: 'p (success probability)', min: 0.01, max: 0.99, step: 0.01 },
    ],
    defaults: { n: 10, p: 0.3 },
    mean: ({ n, p }) => n * p,
    variance: ({ n, p }) => n * p * (1 - p),
    f: (x, { n, p }) => (x < 0 || x > n || x % 1 ? 0 : Math.exp(lnChoose(n, x) + x * Math.log(p) + (n - x) * Math.log(1 - p))),
    range: ({ n }) => [0, n],
  },
  geometric: {
    id: 'geometric',
    type: 'discrete',
    params: [{ key: 'p', label: 'p (success probability)', min: 0.02, max: 1, step: 0.01 }],
    defaults: { p: 0.3 },
    mean: ({ p }) => 1 / p,
    variance: ({ p }) => (1 - p) / p ** 2,
    f: (x, { p }) => (x < 1 || x % 1 ? 0 : (1 - p) ** (x - 1) * p),
    range: (p) => discreteRange(1, p, FAMILIES.geometric.f),
  },
  negbin: {
    id: 'negbin',
    type: 'discrete',
    params: [
      { key: 'r', label: 'r (successes needed)', min: 1, max: 20, step: 1, integer: true },
      { key: 'p', label: 'p (success probability)', min: 0.05, max: 1, step: 0.01 },
    ],
    defaults: { r: 3, p: 0.4 },
    mean: ({ r, p }) => r / p,
    variance: ({ r, p }) => (r * (1 - p)) / p ** 2,
    f: (x, { r, p }) =>
      x < r || x % 1 ? 0 : p === 1 ? (x === r ? 1 : 0) : Math.exp(lnChoose(x - 1, r - 1) + r * Math.log(p) + (x - r) * Math.log(1 - p)),
    range: (p) => discreteRange(p.r, p, FAMILIES.negbin.f),
  },
  hypergeometric: {
    id: 'hypergeometric',
    type: 'discrete',
    params: [
      { key: 'N', label: 'N (population size)', min: 2, max: 200, step: 1, integer: true },
      { key: 'M', label: 'M (successes in population)', min: 0, max: 200, step: 1, integer: true },
      { key: 'n', label: 'n (sample size)', min: 1, max: 200, step: 1, integer: true },
    ],
    defaults: { N: 20, M: 15, n: 5 },
    check: ({ N, M, n }) => (M > N ? 'M cannot exceed N.' : n > N ? 'n cannot exceed N.' : null),
    mean: ({ N, M, n }) => (n * M) / N,
    variance: ({ N, M, n }) => n * (M / N) * (1 - M / N) * ((N - n) / (N - 1)),
    f: (x, { N, M, n }) =>
      x % 1 || x < Math.max(0, n - (N - M)) || x > Math.min(n, M) ? 0 : Math.exp(lnChoose(M, x) + lnChoose(N - M, n - x) - lnChoose(N, n)),
    range: ({ N, M, n }) => [Math.max(0, n - (N - M)), Math.min(n, M)],
  },
  poisson: {
    id: 'poisson',
    type: 'discrete',
    params: [{ key: 'lambda', label: 'λ (mean count)', min: 0.1, max: 50, step: 0.1 }],
    defaults: { lambda: 4 },
    mean: ({ lambda }) => lambda,
    variance: ({ lambda }) => lambda,
    f: (x, { lambda }) => (x < 0 || x % 1 ? 0 : Math.exp(x * Math.log(lambda) - lambda - lnGamma(x + 1))),
    range: (p) => discreteRange(0, p, FAMILIES.poisson.f),
  },
  uniform: {
    id: 'uniform',
    type: 'continuous',
    params: [
      { key: 'a', label: 'a (lower end)', min: -20, max: 20, step: 0.5 },
      { key: 'b', label: 'b (upper end)', min: -20, max: 40, step: 0.5 },
    ],
    defaults: { a: 0, b: 10 },
    check: ({ a, b }) => (a >= b ? 'Need a < b.' : null),
    mean: ({ a, b }) => (a + b) / 2,
    variance: ({ a, b }) => (b - a) ** 2 / 12,
    f: (x, { a, b }) => (x >= a && x <= b ? 1 / (b - a) : 0),
    F: (x, { a, b }) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a)),
    range: ({ a, b }) => [a - (b - a) * 0.15, b + (b - a) * 0.15],
  },
  normal: {
    id: 'normal',
    type: 'continuous',
    params: [
      { key: 'mu', label: 'μ (mean)', min: -100, max: 200, step: 0.5 },
      { key: 'var', label: 'σ² (variance — not σ)', min: 0.01, max: 400, step: 0.01 },
    ],
    defaults: { mu: 0, var: 1 },
    mean: ({ mu }) => mu,
    variance: (p) => p.var,
    f: (x, p) => Math.exp(-((x - p.mu) ** 2) / (2 * p.var)) / Math.sqrt(2 * Math.PI * p.var),
    F: (x, p) => phi((x - p.mu) / Math.sqrt(p.var)),
    range: (p) => [p.mu - 4 * Math.sqrt(p.var), p.mu + 4 * Math.sqrt(p.var)],
  },
  exponential: {
    id: 'exponential',
    type: 'continuous',
    params: [{ key: 'beta', label: 'β (scale = mean)', min: 0.1, max: 50, step: 0.1 }],
    defaults: { beta: 2 },
    mean: ({ beta }) => beta,
    variance: ({ beta }) => beta ** 2,
    f: (x, { beta }) => (x <= 0 ? 0 : Math.exp(-x / beta) / beta),
    F: (x, { beta }) => (x <= 0 ? 0 : 1 - Math.exp(-x / beta)),
    range: ({ beta }) => [0, beta * 7],
  },
  gamma: {
    id: 'gamma',
    type: 'continuous',
    params: [
      { key: 'alpha', label: 'α (shape)', min: 0.2, max: 30, step: 0.1 },
      { key: 'beta', label: 'β (scale)', min: 0.1, max: 20, step: 0.1 },
    ],
    defaults: { alpha: 2, beta: 2 },
    mean: ({ alpha, beta }) => alpha * beta,
    variance: ({ alpha, beta }) => alpha * beta ** 2,
    f: (x, { alpha, beta }) => (x <= 0 ? 0 : Math.exp((alpha - 1) * Math.log(x) - x / beta - alpha * Math.log(beta) - lnGamma(alpha))),
    F: (x, { alpha, beta }) => gammaP(alpha, Math.max(0, x) / beta),
    range: ({ alpha, beta }) => [0, alpha * beta + 6 * Math.sqrt(alpha) * beta],
  },
  chisq: {
    id: 'chisq',
    type: 'continuous',
    params: [{ key: 'nu', label: 'ν (degrees of freedom)', min: 1, max: 60, step: 1, integer: true }],
    defaults: { nu: 4 },
    mean: ({ nu }) => nu,
    variance: ({ nu }) => 2 * nu,
    f: (x, { nu }) => FAMILIES.gamma.f(x, { alpha: nu / 2, beta: 2 }),
    F: (x, { nu }) => gammaP(nu / 2, Math.max(0, x) / 2),
    range: ({ nu }) => [0, nu + 6 * Math.sqrt(2 * nu)],
  },
};

export type EventKind = 'le' | 'ge' | 'between' | 'eq';

/** P(event) for a family: discrete sums, continuous CDF differences (≤ and < agree for continuous X). */
export function probability(fam: Family, p: Record<string, number>, ev: EventKind, a: number, b: number): number {
  if (fam.type === 'discrete') {
    const [lo, hi] = fam.range(p);
    const from = ev === 'le' ? lo : ev === 'eq' ? a : Math.ceil(a);
    const to = ev === 'ge' ? Math.max(hi, from) + 2000 : ev === 'eq' ? a : Math.floor(ev === 'le' ? a : b);
    if (ev === 'eq' && a % 1) return 0;
    let s = 0;
    for (let x = Math.max(from, lo); x <= to; x++) {
      const v = fam.f(x, p);
      s += v;
      if (ev === 'ge' && x > hi && v < 1e-15) break;
    }
    return Math.min(1, s);
  }
  const F = fam.F!;
  if (ev === 'le') return F(a, p);
  if (ev === 'ge') return 1 - F(a, p);
  if (ev === 'eq') return 0;
  return Math.max(0, F(b, p) - F(a, p));
}

// ---------- seeded random numbers ----------

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalDraw(r: () => number): number {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

/** Marsaglia–Tsang gamma variate with shape k, scale 1. */
export function gammaDraw(r: () => number, k: number): number {
  if (k < 1) return gammaDraw(r, k + 1) * r() ** (1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normalDraw(r);
      v = 1 + c * x;
    } while (v <= 0);
    v = v ** 3;
    const u = r();
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
  }
}

export type Shape = 'symmetric' | 'right-skewed' | 'left-skewed' | 'uniform' | 'bimodal' | 'outliers';

/** Generated ("fake") data with a recognisable shape, rounded to `dp` decimals so every chart can show it. */
export function generate(shape: Shape, n: number, seed: number, dp = 1): number[] {
  const r = rng(seed);
  const round = (x: number) => roundTo(Math.round(x * 10 ** dp) / 10 ** dp, 8);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let x: number;
    switch (shape) {
      case 'symmetric':
        x = 50 + 10 * normalDraw(r);
        break;
      case 'right-skewed':
        x = 20 + 8 * gammaDraw(r, 2);
        break;
      case 'left-skewed':
        x = 80 - 8 * gammaDraw(r, 2);
        break;
      case 'uniform':
        x = 20 + 60 * r();
        break;
      case 'bimodal':
        x = (r() < 0.5 ? 35 : 65) + 6 * normalDraw(r);
        break;
      case 'outliers':
        x = i < Math.max(1, Math.round(n * 0.06)) ? 50 + (r() < 0.5 ? -1 : 1) * (35 + 15 * r()) : 50 + 7 * normalDraw(r);
        break;
    }
    out.push(round(x));
  }
  return out;
}

/** Paired data with population correlation close to `rho`; `curved` gives a strong non-linear pattern with R near 0. */
export function generatePairs(n: number, rho: number, seed: number, curved = false): { x: number[]; y: number[] } {
  const r = rng(seed);
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const zx = normalDraw(r);
    const e = normalDraw(r);
    const xi = 50 + 10 * zx;
    const yi = curved ? 20 + 0.35 * (xi - 50) ** 2 / 10 + 2 * e : 100 + 15 * (rho * zx + Math.sqrt(Math.max(0, 1 - rho * rho)) * e);
    x.push(roundTo(Math.round(xi * 10) / 10, 6));
    y.push(roundTo(Math.round(yi * 10) / 10, 6));
  }
  return { x, y };
}

/** Parse numbers typed or pasted by the user: commas, spaces, semicolons, or new lines. */
export function parseNumbers(text: string): { values: number[]; bad: string[] } {
  const values: number[] = [];
  const bad: string[] = [];
  for (const tok of text.split(/[\s,;]+/).filter(Boolean)) {
    const v = Number(tok.replace(/[−–]/g, '-'));
    if (Number.isFinite(v)) values.push(v);
    else bad.push(tok);
  }
  return { values, bad };
}
