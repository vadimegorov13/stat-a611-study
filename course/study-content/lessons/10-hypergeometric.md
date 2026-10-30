# Hypergeometric sampling without replacement

Lesson ID: `10-hypergeometric` · Course sections: 3.7

## What you should be able to do
Model a success count from a finite population sampled without replacement.

Suppose a population has N members, M of which are labeled successes. Select an unordered simple random sample of n members without replacement. Let X count the sampled successes. Then

$$X\sim HG(N,M,n),\qquad P(X=x)=\frac{\binom Mx\binom{N-M}{n-x}}{\binom Nn}.$$

The numerator chooses x successes and n−x failures. The denominator counts all equally likely samples. Valid values satisfy

$$\max(0,n-(N-M))\le x\le\min(n,M).$$

These bounds are an explicit clarification of the lecture formula: you cannot draw more successes or failures than exist.

The mean is $E[X]=nM/N$. This resembles np because the population success fraction is M/N. The model differs from binomial because draws without replacement are dependent.

## Worked example from September 23
There are 4 aces in a deck of 52. In a five-card hand, the ace count is $HG(52,4,5)$. Exactly one ace has probability

$$\frac{\binom41\binom{48}{4}}{\binom{52}{5}},$$

and the expected number of aces is $5(4/52)=5/13$. The expected value need not be an integer even though every realized count is.

## Original practice example
A box contains 4 red and 6 blue tokens. Draw 3 without replacement. Exactly 2 red has probability

$$\frac{\binom42\binom61}{\binom{10}{3}}=\frac{36}{120}=0.3.$$

The expected red count is $3(4/10)=1.2$. For at least one red, complementing is efficient: $1-\binom63/\binom{10}{3}=5/6$.

**Common mistake:** the symbol M is a population count, not a probability. Keep N, M, and n in their correct positions.

**Related:** [Probability rules](06-rules.md), [Distribution chooser](../FORMULA-REFERENCE.md).

## Source references
- [lecture-09-09 PDF p. 6, 7, 8](../../Notes/STAT_611_Notes_09-09-2026.pdf#page=6)
- [lecture-09-23 PDF p. 6, 7](../../Notes/STAT_611_Notes_09-23-2026.pdf#page=6)
- [lecture-09-28 PDF p. 2](../../Notes/STAT_611_Notes_09-28-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Hypergeometric%20sampling%20without%20replacement) — external search, not a verified source.
