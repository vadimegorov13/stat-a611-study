# Binomial and negative-binomial distributions

Lesson ID: `09-binomial` · Course sections: 3.5–3.6

## What you should be able to do
Tell whether the number of trials or the number of successes is fixed.

For n independent Bernoulli trials with the same success probability p, the number of successes is binomial:

$$X\sim B(n,p),\quad P(X=x)=\binom nxp^x(1-p)^{n-x},\quad x=0,\ldots,n.$$

One particular ordering has probability $p^x(1-p)^{n-x}$. There are $\binom nx$ such orderings. The mean is np and standard deviation is $\sqrt{np(1-p)}$.

## Worked example from September 23
The count of fours in 15 independent fair-die rolls is $B(15,1/6)$. Exactly three fours has probability

$$\binom{15}{3}(1/6)^3(5/6)^{12}.$$

For a binomial CDF table, subtract cumulative entries to isolate values: $P(X=5)=F(5)-F(4)$, and $P(1\le X\le8)=F(8)-F(0)$. The lecture's $B(17,0.3)$ table values give approximately 0.2081 and 0.9574 respectively.

A negative-binomial variable instead counts **total trials until the rth success**:

$$X\sim NB(r,p),\quad P(X=x)=\binom{x-1}{r-1}p^r(1-p)^{x-r},\quad x=r,r+1,\ldots.$$

The last trial must be a success. Among the preceding $x-1$ trials, choose positions for the other $r-1$ successes. Its mean is $r/p$. Setting r=1 recovers the geometric distribution.

For the fifth zero to appear on the 40th independent random digit, the first 39 digits contain four zeros and the final digit is zero:

$$P(X=40)=\binom{39}{4}(0.1)^5(0.9)^{35}.$$

**Common mistakes:** do not use $\binom xr$ for a stopping-time event; it includes sequences that finish earlier. Do not use binomial for sampling without replacement unless an approximation is explicitly justified. “Success” is just the outcome being counted, not a positive judgment.

The lectures mention trinomial and multinomial extensions but do not develop their full formulas.

## Source references
- [lecture-09-21 PDF p. 11, 12](../../Notes/STAT_611_Notes_09-21-2026.pdf#page=11)
- [lecture-09-23 PDF p. 2, 3, 4, 5, 6](../../Notes/STAT_611_Notes_09-23-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Binomial%20and%20negative-binomial%20distributions) — external search, not a verified source.
