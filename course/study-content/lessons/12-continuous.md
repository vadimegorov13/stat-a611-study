# Continuous densities, CDFs, and expected values

Lesson ID: `12-continuous` · Course sections: 4.1–4.2

## What you should be able to do
Interpret probability as area, construct a CDF, and integrate to obtain moments.

For the density-based continuous models in these notes, a PDF f satisfies $f(x)\ge0$ and $\int_{-\infty}^{\infty}f(x)\,dx=1$. The lecture uses p for PDFs as well as PMFs; f here makes the distinction visible.

$$P(a\le X\le b)=\int_a^b f(x)\,dx,\qquad F(t)=\int_{-\infty}^t f(x)\,dx.$$

Density height is not a probability and can exceed 1. Every single point has probability zero, so interval endpoints do not affect continuous probabilities. The CDF is still a probability and must stay between 0 and 1. Where f is continuous, $F'=f$.

## Worked example from September 28, with corrected arithmetic
For $f(x)=12.5x-1.25$ on $[0.1,0.5]$ and zero elsewhere, total area is the triangle $\frac12(0.4)(5)=1$. On its support,

$$F(x)=6.25x^2-1.25x+0.0625.$$

Extend F as 0 below 0.1 and 1 above 0.5. Then $P(0.2\le X\le0.3)=F(0.3)-F(0.2)=0.25-0.0625=0.1875$. Directly evaluating the antiderivative gives $0.1875-0$, not the intermediate negative values printed on page 4.

Continuous expectation replaces summation by integration:

$$E[h(X)]=\int h(x)f(x)\,dx,\quad V(X)=E[X^2]-E[X]^2.$$

For the lecture density, $E[X]=\int_{0.1}^{0.5}x(12.5x-1.25)\,dx=11/30$. Its mean is right of the interval midpoint because larger x values have greater density.

For $X\sim U(a,b)$, the PDF is $1/(b-a)$ on the interval, the interior CDF is $(x-a)/(b-a)$, and $E[X]=(a+b)/2$. Equal-length subintervals inside its support have equal probability.

**Common mistakes:** include the support in every integral; do not equate f(a) with P(X=a). Integrate x f(x), not f(x), to calculate a mean.

## Source references
- [lecture-09-28 PDF p. 3, 4, 5, 6, 7, 8, 9, 10, 11](../../Notes/STAT_611_Notes_09-28-2026.pdf#page=3)
- [lecture-09-30 PDF p. 1, 2, 3, 4](../../Notes/STAT_611_Notes_09-30-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Continuous%20densities%2C%20CDFs%2C%20and%20expected%20values) — external search, not a verified source.
