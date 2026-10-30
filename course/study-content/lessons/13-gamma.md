# Gamma function, gamma, exponential, and chi-squared

Lesson ID: `13-gamma` · Course sections: 4.3

## What you should be able to do
Recognize the gamma family and keep scale and rate parameters separate.

The gamma function generalizes factorial calculations:

$$\Gamma(\alpha)=\int_0^\infty x^{\alpha-1}e^{-x}\,dx,\quad\alpha>0.$$

It satisfies $\Gamma(1)=1$, $\Gamma(\alpha)=(\alpha-1)\Gamma(\alpha-1)$ for alpha>1, and $\Gamma(n)=(n-1)!$ for positive integers n. Integration by parts proves the recurrence: integrate the exponential factor and differentiate the power, with vanishing boundary terms.

The course uses **shape alpha, scale beta**:

$$X\sim\Gamma(\alpha,\beta),\qquad f(x)=\frac{x^{\alpha-1}e^{-x/\beta}}{\beta^\alpha\Gamma(\alpha)},\quad x>0.$$

The density is zero otherwise; both parameters are positive. The mean is alpha beta, variance is $\alpha\beta^2$, and standard deviation is $\beta\sqrt\alpha$. For alpha>1, the mode is $(\alpha-1)\beta$.

The exponential distribution is $E(\beta)=\Gamma(1,\beta)$, with density $e^{-x/\beta}/\beta$ for x>0 and mean and standard deviation beta. Integrating gives the useful supplemental forms $F(x)=1-e^{-x/\beta}$ for x>0 and $P(X>t)=e^{-t/\beta}$ for t≥0.

For a Poisson process at rate a, the first-event waiting time has scale beta=1/a. Rate and scale are reciprocals, not interchangeable names for the same number.

The chi-squared distribution with nu degrees of freedom is $\chi^2_\nu=\Gamma(\nu/2,2)$. Consequently its mean is nu and variance is 2nu.

## Worked examples
The lecture integral $\int_0^\infty xe^{-x}\,dx=\Gamma(2)=1$. For the lecture density $xe^{-x}$ on x>0, the mean is $\int_0^\infty x^2e^{-x}\,dx=\Gamma(3)=2$.

Original extension: if $X\sim\Gamma(3,2)$, then mean=6, variance=12, and standard deviation=$2\sqrt3$. If a waiting time has exponential mean 5 minutes, $P(T>10)=e^{-2}$.

**Related:** [Moment-generating functions](15-mgf.md).

## Source references
- [lecture-09-30 PDF p. 4, 5, 6, 7](../../Notes/STAT_611_Notes_09-30-2026.pdf#page=4)
- [lecture-10-05 PDF p. 2, 7](../../Notes/STAT_611_Notes_10-05-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Gamma%20function%2C%20gamma%2C%20exponential%2C%20and%20chi-squared) — external search, not a verified source.
