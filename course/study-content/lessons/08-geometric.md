# Discrete uniform and geometric distributions

Lesson ID: `08-geometric` · Course sections: 3.4

## What you should be able to do
Recognize equal-probability models and waiting for the first success.

A discrete uniform distribution gives probability $1/k$ to each of k specified possible values. The course writes $U(k)$, but k alone does not specify the numerical support: record the values too. A fair die is uniform on $\{1,\ldots,6\}$ and has mean 3.5. Uniformity is about equal probabilities, not necessarily equally spaced values.

A geometric variable counts **total trials up to and including the first success** in independent Bernoulli trials with a constant success probability $0<p\le1$:

$$X\sim G(p),\quad P(X=x)=(1-p)^{x-1}p,\quad x=1,2,\ldots.$$

There must be $x-1$ failures followed by one success. Hence

$$P(X>k)=(1-p)^k,\quad P(X\ge k)=(1-p)^{k-1},$$

for nonnegative integer k in the first formula and positive integer k in the second. The CDF is zero below 1 and $1-(1-p)^{\lfloor x\rfloor}$ for $x\ge1$.

$$E[X]=\frac1p,\qquad sd(X)=\frac{\sqrt{1-p}}p.$$

## Worked example from September 21
Generate independent uniform digits 0–9 until the first zero. Success means zero, so $p=0.1$ and the mean waiting count is 10 digits. The probability the first zero is the fourth digit is $0.9^3(0.1)=0.0729$. This numerical evaluation extends the lecture setup.

The chance of waiting more than 4 digits is $0.9^4=0.6561$; waiting at least 4 requires only the first 3 to be nonzero and has probability $0.9^3=0.729$.

**Common mistake:** some software counts failures before success, with support starting at zero. That variable equals this course's X minus one. Translate the convention before using software.

**Next:** [Binomial and negative binomial](09-binomial.md).

## Source references
- [lecture-09-21 PDF p. 7, 8, 9, 10](../../Notes/STAT_611_Notes_09-21-2026.pdf#page=7)
- [lecture-09-23 PDF p. 1, 2](../../Notes/STAT_611_Notes_09-23-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Discrete%20uniform%20and%20geometric%20distributions) — external search, not a verified source.
