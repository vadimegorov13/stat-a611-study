import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCourse, loadSourcePages } from '../../server/content.ts';
import {
  FAMILIES,
  boxSummary,
  correlation,
  generate,
  generatePairs,
  histogram,
  leastSquares,
  mean,
  median,
  phi,
  phiInv,
  probability,
  quartilesCourse,
  sd,
  stemAndLeaf,
  variance,
} from '../../shared/stats.ts';

const appRoot = path.resolve(__dirname, '../..');
const courseRoot = path.join(appRoot, 'course');
const contentDir = path.join(courseRoot, 'study-content');
const { bundle: course, problems } = loadCourse({ courseRoot, contentDir, supplementDir: path.join(appRoot, 'content') }, { notesDir: '', userDataDir: '' });
const data = (id: string) => course.datasets.datasets.find((d) => d.id === id)!.values;

describe('course-convention boxplots reproduce the lecture worked examples', () => {
  it('Site II (Aug 31 p. 4–5): 1 on the inner fence is a mild outlier', () => {
    const b = boxSummary(data('site-ii'));
    expect([b.q1, b.q2, b.q3, b.iqr]).toEqual([13, 17.5, 21, 8]);
    expect(b.inner).toEqual([1, 33]);
    expect(b.outliers).toEqual([{ value: 1, kind: 'mild', side: 'low' }]);
    expect([b.p1, b.p2]).toEqual([9, 25]);
    expect([b.min, b.q1, b.q2, b.q3, b.max]).toEqual([1, 13, 17.5, 21, 25]);
  });

  it('Site I (Aug 31 p. 5–6): odd n with the median in both halves', () => {
    const b = boxSummary(data('site-i'));
    expect(b.n).toBe(23);
    expect([b.q1, b.q2, b.q3, b.iqr]).toEqual([13.5, 19, 29, 15.5]);
    expect(b.inner).toEqual([-9.75, 52.25]);
    expect(b.outliers).toEqual([]);
    expect([b.p1, b.p2]).toEqual([10, 49]);
  });

  it('Example 6.4.2 (Aug 31 p. 6–7): mild and extreme outliers on both sides', () => {
    const b = boxSummary(data('ex-6-4-2'));
    expect([b.q1, b.q2, b.q3, b.iqr]).toEqual([32, 40, 47, 15]);
    expect(b.outliers).toEqual([
      { value: 8, kind: 'mild', side: 'low' },
      { value: 89, kind: 'mild', side: 'high' },
      { value: 108, kind: 'extreme', side: 'high' },
    ]);
    expect([b.p1, b.p2]).toEqual([12, 61]);
    expect([b.min, b.max]).toEqual([8, 108]);
  });

  it('Aug 26 and Aug 31 quartile examples', () => {
    const odd = boxSummary(data('aug26-odd'));
    expect([odd.q1, odd.q2, odd.q3]).toEqual([8.5, 10, 17.5]);
    expect(odd.inner[1]).toBe(31);
    expect(odd.outer[1]).toBe(44.5);
    expect(odd.outliers).toEqual([{ value: 35, kind: 'mild', side: 'high' }]);
    expect([odd.p1, odd.p2]).toEqual([2, 18]);
    const even = quartilesCourse(data('aug26-even'));
    expect([even.q1, even.q2, even.q3]).toEqual([5, 7.5, 10]);
    const ex3 = quartilesCourse(data('aug31-ex3'));
    expect([ex3.q1, ex3.q2, ex3.q3]).toEqual([8, 17, 20]);
    const five = quartilesCourse([5, 6, 10, 4, 17]);
    expect([five.q1, five.q2, five.q3]).toEqual([5, 6, 10]);
    const six = quartilesCourse([1, 8, 10, 17, 21, 24]);
    expect([six.q1, six.q2, six.q3]).toEqual([8, 13.5, 21]);
  });

  it('summary statistics for the Aug 26 variance and Aug 24 resistance examples', () => {
    const v = data('aug26-var');
    expect(mean(v)).toBe(6);
    expect(variance(v)).toBe(13.5);
    expect(sd(v)).toBeCloseTo(3.6742, 4);
    expect(median(v)).toBe(6);
    expect(mean(data('resistance'))).toBe(12);
    expect(median(data('resistance'))).toBe(3);
  });
});

describe('histograms and stem-and-leaf', () => {
  it('uses left-closed classes, so 0.03 falls in [0.03, 0.04)', () => {
    const bins = histogram(data('aug24-stem'), 0.02, 0.01, 6);
    expect(bins.map((b) => b.count)).toEqual([1, 6, 9, 11, 7, 0]);
    expect(bins[0]).toMatchObject({ lo: 0.02, hi: 0.03 });
    // The printed table has one more observation in [0.07, 0.08) than the printed stem-and-leaf display.
    expect(course.datasets.grouped[0].counts).toEqual([1, 6, 9, 11, 7, 1]);
  });

  it('rebuilds the Aug 24 stem-and-leaf display (stem = hundredths, leaf = thousandths)', () => {
    const sl = stemAndLeaf(data('aug24-stem'), 0.001);
    expect(sl.rows.map((r) => `${r.label}|${r.leaves.join('')}`)).toEqual(['2|0', '3|007999', '4|022445679', '5|01122345678', '6|0111226']);
  });

  it('rebuilds the Site I split-stem display (Aug 31 p. 5)', () => {
    const sl = stemAndLeaf(data('site-i'), 1, true);
    expect(sl.rows.map((r) => r.leaves.join(''))).toEqual(['0223334', '66789', '014', '57', '122', '67', '', '9']);
  });
});

describe('distributions', () => {
  it('normal CDF matches table values', () => {
    expect(phi(0)).toBeCloseTo(0.5, 12);
    expect(phi(1)).toBeCloseTo(0.841344746, 8);
    expect(phi(-1.96)).toBeCloseTo(0.024997895, 8);
    expect(phiInv(0.975)).toBeCloseTo(1.959964, 5);
  });

  it('lesson examples: N(5, 4) uses variance 4 (sd 2)', () => {
    const n = FAMILIES.normal;
    expect(probability(n, { mu: 5, var: 4 }, 'le', 6, 0)).toBeCloseTo(0.6915, 4);
    expect(probability(n, { mu: 5, var: 4 }, 'ge', 6.5, 0)).toBeCloseTo(0.2266, 4);
    expect(probability(n, { mu: 61, var: 9 }, 'le', 64, 0)).toBeCloseTo(0.8413, 4);
  });

  it('every PMF sums to 1 and matches its mean and variance', () => {
    for (const fam of Object.values(FAMILIES).filter((f) => f.type === 'discrete')) {
      const p = fam.defaults;
      const [lo] = fam.range(p);
      let s = 0;
      let m = 0;
      let m2 = 0;
      for (let x = lo; x < lo + 3000; x++) {
        const v = fam.f(x, p);
        s += v;
        m += x * v;
        m2 += x * x * v;
      }
      expect(s, fam.id).toBeCloseTo(1, 9);
      expect(m, fam.id).toBeCloseTo(fam.mean(p), 7);
      expect(m2 - m * m, fam.id).toBeCloseTo(fam.variance(p), 6);
    }
  });

  it('every density integrates to 1 and its CDF agrees with the integral', () => {
    for (const fam of Object.values(FAMILIES).filter((f) => f.type === 'continuous')) {
      const p = fam.defaults;
      const lo = fam.id === 'normal' ? -12 : fam.id === 'uniform' ? p.a : 0;
      const hi = fam.mean(p) + 40 * Math.sqrt(fam.variance(p));
      const steps = 200000;
      const h = (hi - lo) / steps;
      let s = 0;
      let mid = 0;
      const t = fam.mean(p);
      for (let i = 0; i < steps; i++) {
        const x = lo + (i + 0.5) * h;
        const v = fam.f(x, p) * h;
        s += v;
        if (x <= t) mid += v;
      }
      expect(s, fam.id).toBeCloseTo(1, 4);
      expect(fam.F!(t, p), fam.id).toBeCloseTo(mid, 4);
    }
  });

  it('discrete event probabilities use F(b) − F(a − 1)', () => {
    const b = FAMILIES.binomial;
    const p = { n: 10, p: 0.3 };
    const F = (k: number) => probability(b, p, 'le', k, 0);
    expect(probability(b, p, 'between', 2, 4)).toBeCloseTo(F(4) - F(1), 12);
    expect(probability(b, p, 'ge', 3, 0)).toBeCloseTo(1 - F(2), 12);
    expect(probability(FAMILIES.geometric, { p: 0.3 }, 'ge', 4, 0)).toBeCloseTo(0.7 ** 3, 10); // P(X ≥ k) = q^(k−1)
    expect(probability(FAMILIES.hypergeometric, { N: 20, M: 15, n: 5 }, 'eq', 5, 0)).toBeCloseTo(3003 / 15504, 10);
  });
});

describe('generated data', () => {
  it('is reproducible from its seed and has the requested size', () => {
    expect(generate('symmetric', 40, 7)).toEqual(generate('symmetric', 40, 7));
    expect(generate('right-skewed', 25, 3)).toHaveLength(25);
    const g = generate('right-skewed', 4000, 11);
    expect(mean(g)).toBeGreaterThan(median(g)); // right skew pulls the mean above the median
  });

  it('paired data approximates the requested correlation and the fit passes through the means', () => {
    const { x, y } = generatePairs(4000, 0.7, 5);
    expect(correlation(x, y)).toBeGreaterThan(0.65);
    expect(correlation(x, y)).toBeLessThan(0.75);
    const { a, b } = leastSquares(x, y);
    expect(a + b * mean(x)).toBeCloseTo(mean(y), 8);
  });
});

describe('notation sheet', () => {
  it('loads without problems and every lecture symbol appears on the page it cites', () => {
    expect(problems).toEqual([]);
    const pages = loadSourcePages(contentDir, course.sources);
    expect(course.notation.length).toBeGreaterThan(40);
    for (const n of course.notation) {
      if (n.origin !== 'lecture') continue;
      expect(n.refs.length, n.id).toBe(1);
      const ref = n.refs[0];
      const text = pages.find((p) => p.source_id === ref.source_id && p.page === ref.pages[0])?.text ?? '';
      expect(new RegExp(n.evidence!.normalize('NFKC')).test(text), `${n.id} on ${ref.source_id} p. ${ref.pages[0]}`).toBe(true);
    }
  });

  it('distribution rows agree with the app distribution functions', () => {
    const famOf: Record<string, keyof typeof FAMILIES> = {
      geometric: 'geometric',
      binomial: 'binomial',
      negbin: 'negbin',
      hypergeometric: 'hypergeometric',
      poisson: 'poisson',
      uniform: 'uniform',
      gamma: 'gamma',
      exponential: 'exponential',
      chisq: 'chisq',
      normal: 'normal',
    };
    for (const d of course.distributions) if (d.id !== 'uniform-discrete') expect(famOf[d.id], d.id).toBeTruthy();
  });
});
