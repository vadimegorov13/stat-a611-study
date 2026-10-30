# Discrete random variables, PMFs, CDFs, and expectations

Lesson ID: `07-expectation` · Course sections: 3.1–3.3

## What you should be able to do
Build a discrete distribution, accumulate its probabilities, and calculate its center and spread.

A random variable assigns a number to an experimental outcome. Its support is the set of possible values. A discrete support is countable, possibly infinite. The probability mass function is $p(x)=P(X=x)$, with $p(x)\ge0$ and $\sum_xp(x)=1$.

The CDF is $F(t)=P(X\le t)$ for every real t. It is nondecreasing, right-continuous, and tends to 0 and 1 at the two extremes. For integer-valued X,

$$P(a\le X\le b)=F(b)-F(a-1)$$

when a and b are integers. For general discrete supports use $F(b)-F(a^-)$, where $F(a^-)=P(X<a)$.

## Worked examples from the notes
The maximum of two independent fair dice has $p(x)=(2x-1)/36$ for $x=1,\ldots,6$. One way to see this is to subtract the number of pairs with maximum at most $x-1$ from the number with maximum at most x: $x^2-(x-1)^2=2x-1$.

For a distribution with probabilities $0.1,0.3,0.6$ at values $1,2,3$:

$$E[X]=1(0.1)+2(0.3)+3(0.6)=2.5,$$
$$E[X^2]=1(0.1)+4(0.3)+9(0.6)=6.7,$$
$$V(X)=6.7-2.5^2=0.45,\quad sd(X)=\sqrt{0.45}.$$

Expectation is a probability-weighted average, not necessarily a possible observation. In general $E[h(X)]=\sum_xh(x)p(x)$. The kth raw moment is $E[X^k]$. Linearity gives $E[aX+b]=aE[X]+b$; it does not imply $E[X^2]=E[X]^2$.

Variance is $E[(X-\mu)^2]=E[X^2]-\mu^2$, when the second moment is finite.

For infinite discrete distributions, geometric sums often verify total probability: $\sum_{k=0}^{n}a^k=(1-a^{n+1})/(1-a)$ for $a\ne1$, and $\sum_{k=0}^{\infty}a^k=1/(1-a)$ for $|a|<1$.

**Related:** [Geometric distributions](08-geometric.md), [Continuous distributions](12-continuous.md).

## Source references
- [lecture-09-16 PDF p. 2, 3, 4, 5, 6, 7, 8, 9, 10, 11](../../Notes/STAT_611_Notes_09-16-2026.pdf#page=2)
- [lecture-09-21 PDF p. 1, 2, 3, 4, 5, 6](../../Notes/STAT_611_Notes_09-21-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Discrete%20random%20variables%2C%20PMFs%2C%20CDFs%2C%20and%20expectations) — external search, not a verified source.
