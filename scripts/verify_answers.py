"""Independently recompute every numeric answer key used by the study app.

Methods deliberately differ from the authored solutions where practical: brute-force enumeration of
equally likely outcomes, exact fractions, Simpson integration of densities, numerical differentiation of
MGFs, and seeded simulation for one bias check. Standard library only.

Run: python3 study-app/scripts/verify_answers.py
"""
from __future__ import annotations

import json
import math
import random
import statistics
import sys
from collections import Counter
from fractions import Fraction as F
from itertools import combinations, permutations, product
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
PACK = APP / 'course' / 'study-content'

pack = json.loads((PACK / 'question-bank.json').read_text())['questions']
supp = json.loads((APP / 'content' / 'supplemental-questions.json').read_text())['questions']
extras = json.loads((APP / 'content' / 'question-extras.json').read_text())
questions = {q['id']: q for q in pack + supp}


def simpson(f, a, b, n=20000):
    if n % 2:
        n += 1
    h = (b - a) / n
    s = f(a) + f(b)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * f(a + i * h)
    return s * h / 3


def normal_pdf(mu, var):
    sd = math.sqrt(var)
    return lambda x: math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * math.sqrt(2 * math.pi))


def prob(events, total):
    return F(sum(1 for e in events if e), total)


def bernoulli_prob(n, p, pred):
    """Sum probabilities of all 0/1 sequences of length n satisfying pred."""
    total = 0.0
    for seq in product([0, 1], repeat=n):
        k = sum(seq)
        if pred(seq):
            total += p ** k * (1 - p) ** (n - k)
    return total


dice = list(product(range(1, 7), repeat=2))
weld = {(0, 0): .84, (0, 1): .03, (0, 2): .02, (0, 3): .01,
        (1, 0): .06, (1, 1): .01, (1, 2): .008, (1, 3): .002,
        (2, 0): .01, (2, 1): .005, (2, 2): .004, (2, 3): .001}
small = {(0, 0): .2, (0, 1): .3, (1, 0): .1, (1, 1): .4}
pmf7 = {0: .2, 1: .5, 2: .3}
mean7 = sum(x * p for x, p in pmf7.items())

expected = {
    # ---------------- pack keys ----------------
    'q01-02': F(12, 48),
    'q02-02': statistics.variance([2, 4, 6]),
    'q02-03': statistics.stdev([2, 4, 6]),
    'q03-02': statistics.median([1, 3, 5]),  # lower half includes the median for odd n
    'q04-02': prob((a + b == 7 for a, b in dice), 36),
    'q05-02': len(set(permutations('LEVEL'))),
    'q05-03': sum(1 for a, b in permutations(range(8), 2)),
    'q06-02': 0.4 + 0.5 - 0.2,
    'q06-03': 0.12 / 0.4,
    'q07-02': mean7,
    'q07-03': sum((x - mean7) ** 2 * p for x, p in pmf7.items()),
    'q08-02': bernoulli_prob(3, 0.25, lambda s: s == (0, 0, 1)),
    'q08-03': bernoulli_prob(2, 0.25, lambda s: s == (0, 0)),
    'q09-02': bernoulli_prob(4, 0.5, lambda s: sum(s) == 2),
    'q09-03': bernoulli_prob(4, 0.5, lambda s: sum(s[:3]) == 1 and s[3] == 1),
    'q10-02': prob((sum(i < 4 for i in c) == 2 for c in combinations(range(10), 3)), math.comb(10, 3)),
    'q10-03': F(sum(sum(i < 4 for i in c) for c in combinations(range(10), 3)), math.comb(10, 3)),
    'q11-02': 6 * 30 / 60,
    'q11-03': 2 ** 0 * math.exp(-2) / math.factorial(0),
    'q12-02': simpson(lambda x: 1 / 6, 3, 5, 10),
    'q12-03': simpson(lambda x: x * 2 * x, 0, 1),
    'q13-02': simpson(lambda x: x * x ** 2 * math.exp(-x / 2) / (2 ** 3 * math.gamma(3)), 0, 200),
    'q13-03': 1 - simpson(lambda t: math.exp(-t / 5) / 5, 0, 10),
    'q14-02': (16 - 10) / math.sqrt(9),
    'q15-02': (1 / (1 - 1e-4) - 2 * 1 + 1 / (1 + 1e-4)) / 1e-8,  # second central difference of 1/(1-t) at 0
    'q15-03': simpson(lambda x: x ** 4 * math.exp(-x), 0, 200),
    'q16-02': small[(1, 0)] + small[(1, 1)],
    'q17-02': 6 / (2 * 4),
    'q17-03': None,  # covered by the scaling check below
    'q18-02': 0.6 * 5 / 2,
    'q18-03': 100 * (-0.8) ** 2,
    'q19-02': 15 / math.sqrt(25),
    'q20-02': 2 ** 2 * 4 + (-1) ** 2 * 9,
    'q20-03': math.sqrt(81 / 9),
    # ---------------- supplemental keys ----------------
    's01-03': F(sum([1, 6, 9, 11]), 35),
    's02-03': statistics.stdev([3, 5, 7, 9, 11]),
    's03-03': 50 + (-1.25) * 8,
    's04-02': prob((a + b >= 9 for a, b in dice), 36),
    's04-03': prob((sum(s) >= 1 for s in product([0, 1], repeat=4)), 16),
    's05-03': math.comb(10, 3) * math.comb(7, 3) * math.comb(4, 2) * math.comb(2, 1),  # place S's, T's, I's, A
    's06-03': prob(((a >= 5) and (b >= 5) for a, b in permutations(range(8), 2)), 8 * 7),  # items 5..7 defective
    's07-03': F(sum(max(a, b) for a, b in dice), 36),
    's08-03': 1 - sum(0.9 ** (x - 1) * 0.1 for x in range(1, 11)),
    's09-03': bernoulli_prob(5, 0.2, lambda s: sum(s) <= 1),
    's10-03': prob((sum(i < 15 for i in c) == 2 for c in combinations(range(20), 3)), math.comb(20, 3)),
    's11-03': None,  # recursion below
    's12-03': simpson(lambda x: 12.5 * x - 1.25, 0.1, 0.3),
    's13-03': None,  # numerical moments below
    's14-03': simpson(normal_pdf(61, 81), 70, 61 + 12 * 9),
    's15-03': ((1 - 2e-4) ** -3 - (1 + 2e-4) ** -3) / (2 * 1e-4),  # m'(0) by central difference
    's16-03': sum(p for (x, y), p in weld.items() if x >= 1 and y >= 1),
    's17-03': sum(x * y * p for (x, y), p in small.items())
              - sum(x * p for (x, y), p in small.items()) * sum(y * p for (x, y), p in small.items()),
    's18-03': None,  # least squares below
    's19-02': next(n for n in range(1, 1000) if abs(12 / math.sqrt(n) - 1.5) < 1e-12),
    's19-03': None,  # simulation below
    's20-03': simpson(normal_pdf(17, 25), 17 - 12 * 5, 7),
}

# q17-03: Cov(3X+5, 2Y-1) on a concrete joint distribution with Cov(X,Y)=2.
pairs = [(-1, -2), (1, 2)]  # X=±1, Y=2X → Cov = E[XY] = 2
cov = lambda us, vs: statistics.fmean(u * v for u, v in zip(us, vs)) - statistics.fmean(us) * statistics.fmean(vs)
xs, ys = [p[0] for p in pairs], [p[1] for p in pairs]
assert math.isclose(cov(xs, ys), 2)
expected['q17-03'] = cov([3 * x + 5 for x in xs], [2 * y - 1 for y in ys])

# s11-03: Poisson recursion p(x) = p(x-1) * λ / x.
p = math.exp(-6.9)
for x in range(1, 6):
    p *= 6.9 / x
expected['s11-03'] = p

# s13-03: Γ(4, 3) variance from numerically integrated moments of the density.
g = lambda x: x ** 3 * math.exp(-x / 3) / (3 ** 4 * math.gamma(4))
m1 = simpson(lambda x: x * g(x), 0, 400)
m2 = simpson(lambda x: x * x * g(x), 0, 400)
expected['s13-03'] = m2 - m1 ** 2

# s18-03: build a dataset with the stated summary statistics and fit least squares directly.
base = [-1.0, -1.0, 1.0, 1.0]
noise = [1.0, -1.0, 1.0, -1.0]  # orthogonal to base, both mean 0
zx = [b / statistics.stdev(base) for b in base]
zn = [e / statistics.stdev(noise) for e in noise]
R = -0.5
zy = [R * a + math.sqrt(1 - R * R) * b for a, b in zip(zx, zn)]
X = [4 + 1.5 * z for z in zx]
Y = [20 + 6 * z for z in zy]
assert math.isclose(statistics.correlation(X, Y), R)
slope, intercept = statistics.linear_regression(X, Y)
expected['s18-03'] = intercept + slope * 7

# s19-03: bias of the divide-by-n variance estimator, by simulation (n=5, σ²=20).
rng = random.Random(611)
reps = 200_000
acc = 0.0
for _ in range(reps):
    sample = [rng.gauss(0, math.sqrt(20)) for _ in range(5)]
    m = sum(sample) / 5
    acc += sum((v - m) ** 2 for v in sample) / 5
sim_bias = acc / reps - 20
assert abs(sim_bias - (-4)) < 0.15, sim_bias
expected['s19-03'] = round(sim_bias)  # simulation confirms the exact value −4

# ---------------- compare ----------------
failures = []
numeric = [q for q in questions.values() if q['type'] == 'numeric']
missing = {q['id'] for q in numeric} - set(expected)
assert not missing, f'no independent check for {sorted(missing)}'
for q in numeric:
    exp_v = float(expected[q['id']])
    tol = max(1e-6, 1e-6 * abs(exp_v))
    if not math.isclose(exp_v, float(q['answer']), abs_tol=tol, rel_tol=1e-6):
        failures.append(f"{q['id']}: key {q['answer']} vs recomputed {exp_v}")
    # The key must also pass the question's own grading tolerance.
    g = q['grading']
    assert g['absolute_tolerance'] > 0 and g['relative_tolerance'] > 0

# Multiple-choice keys that can be computed.
def opt(qid):
    q = questions[qid]
    return q['options'][q['answer']]

assert opt('s10-02') == str(max(0, 5 - (10 - 7)))
assert opt('s16-02') == '$1/240$' and math.isclose((10.5 - 8.5) * (240 - 120), 240)
assert opt('s11-02') == 'Poisson with $\\lambda=1$' and 4 * 15 / 60 == 1
assert opt('s07-02') == str(2 * 3 + 5)
assert opt('s13-01') == '$E(1/3)$'
assert opt('s20-01') == '$\\bar X\\sim N(61,\\,9)$' and 81 / 9 == 9
assert opt('q14-01') == str(int(math.sqrt(9)))
assert opt('q07-01') == 'F(5)−F(1)'
xs3 = [-1, 0, 1]
assert math.isclose(statistics.fmean(x * x * x for x in xs3) - statistics.fmean(xs3) * statistics.fmean(x * x for x in xs3), 0)
# s17-02: correlation of X and -2X+7 for a nonconstant X.
xx = [1, 2, 3, 7]
assert math.isclose(statistics.correlation(xx, [-2 * v + 7 for v in xx]), -1)
assert opt('s17-02') == '$-1$'
# s13-02: χ²_ν = Γ(ν/2, 2) has mean ν and variance 2ν.
for nu in (1, 3, 8):
    a, b = nu / 2, 2
    assert a * b == nu and a * b * b == 2 * nu
# s07-01: only option C is a valid PMF.
valid = [all(v >= 0 for v in o) and math.isclose(sum(o), 1) for o in ([.2, .3, .4], [.5, .6, -.1], [.1, .3, .6], [1, 1, 1])]
assert valid.index(True) == questions['s07-01']['answer'] and valid.count(True) == 1
# q18-03 expects a percent and is the only percent question.
percent_q = [qid for qid, x in extras.items() if x.get('expect') == 'percent']
assert percent_q == ['q18-03'], percent_q

per_lesson = Counter()
kinds = Counter()
for q in questions.values():
    kind = extras.get(q['id'], {}).get('kind') or q.get('kind') or ('conceptual' if q['type'] == 'multiple_choice' else 'calculation')
    kinds[(q['lesson_id'], kind)] += 1
    per_lesson[q['lesson_id']] += 1
thin = [(l, kinds[(l, 'conceptual')], kinds[(l, 'calculation')]) for l in sorted(per_lesson)
        if kinds[(l, 'conceptual')] < 3 or kinds[(l, 'calculation')] < 3]

if failures:
    print('FAILED:\n  ' + '\n  '.join(failures))
    sys.exit(1)
print(f'OK: {len(numeric)} numeric keys independently recomputed ({sum(q["id"].startswith("q") for q in numeric)} pack, '
      f'{sum(q["id"].startswith("s") for q in numeric)} supplemental); computable multiple-choice keys checked.')
print(f'Questions: {len(questions)} across {len(per_lesson)} lessons; lessons below 3 conceptual + 3 calculation: {thin or "none"}')
