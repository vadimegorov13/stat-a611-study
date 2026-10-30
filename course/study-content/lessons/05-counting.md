# Counting: products, permutations, and combinations

Lesson ID: `05-counting` · Course sections: 1.3

## What you should be able to do
Decide whether order matters and whether replacement or repeated objects affect the count.

If successive choices have $n_1,\ldots,n_k$ possibilities at each stage, multiply to get $n_1\cdots n_k$. This assumes the stated number of options holds for each preceding choice; otherwise use branches or separate cases.

Ordered selection of $k$ distinct objects without replacement gives $nP_k=n!/(n-k)!$. Unordered selection gives $\binom nk=n!/[k!(n-k)!]$. Each group of $k$ distinct objects has $k!$ orderings, which explains the division. Recall $0!=1$ and $\binom nk=\binom n{n-k}$.

Rearranging $n$ objects with indistinguishable type counts $n_1,\ldots,n_r$ gives $n!/(n_1!\cdots n_r!)$. This is a different problem from choosing a committee.

## Worked examples from September 9
PEPPER has six letters, including three P's and two E's. The number of distinct arrangements is $6!/(3!2!1!)=60$.

For exactly two spades in an unordered five-card hand, choose 2 of the 13 spades and 3 of the 39 non-spades. Divide by all five-card hands:

$$P=\frac{\binom{13}{2}\binom{39}{3}}{\binom{52}{5}}.$$

For a random sample of 3 blocks from 20, of which 15 are acceptable, the probability all are acceptable is

$$\frac{\binom{15}{3}}{\binom{20}{3}}=\frac{15}{20}\frac{14}{19}\frac{13}{18}.$$

The combination method and sequential probability method agree.

## How to choose
A ranking uses permutations; a committee uses combinations. A password with unrestricted repeated characters uses a product of position counts. A fixed multiset of letters uses factorials divided by repeat factorials. In a probability ratio, numerator and denominator must count outcomes using the same ordering convention.

**Related:** [Conditional probability](06-rules.md), [Hypergeometric distribution](10-hypergeometric.md).

## Source references
- [lecture-09-02 PDF p. 5, 6, 7](../../Notes/STAT_611_Notes_09-02-2026.pdf#page=5)
- [lecture-09-09 PDF p. 2, 3, 4, 5, 6, 7, 8, 9](../../Notes/STAT_611_Notes_09-09-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Counting%3A%20products%2C%20permutations%2C%20and%20combinations) — external search, not a verified source.
