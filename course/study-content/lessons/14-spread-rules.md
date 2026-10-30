# Normal probabilities, percentiles, and spread rules

Lesson ID: `14-spread-rules` · Course sections: 4.4–4.5

## What you should be able to do
Standardize normal variables, find tail areas and percentiles, and distinguish bounds from normal approximations.

The notation $X\sim N(\mu,\sigma^2)$ specifies **variance** as its second parameter. Its PDF is

$$f(x)=\frac1{\sigma\sqrt{2\pi}}\exp\left[-\frac12\left(\frac{x-\mu}{\sigma}\right)^2\right].$$

The curve is symmetric about mu and has inflection points mu±sigma. Standardization gives $Z=(X-\mu)/\sigma\sim N(0,1)$. Write $\Phi(z)=P(Z\le z)$.

Left tail: $P(X\le a)=\Phi((a-\mu)/\sigma)$. Right tail: subtract that from 1. An interval probability is the upper CDF minus the lower CDF. A qth cumulative quantile is $x_q=\mu+\sigma\Phi^{-1}(q)$, where q is a fraction between 0 and 1.

## Worked examples from October 5
For $N(5,4)$, sigma=2, so $P(X\le6)=\Phi(0.5)\approx0.6915$. Also $P(X>6.5)=1-\Phi(0.75)\approx0.2266$.

For the illustrative IQ model $N(100,16^2)$, the 90th percentile using the lecture's rounded z=1.28 is $100+16(1.28)=120.48$. A more precise inverse-normal calculation gives about 120.505. These are different rounding conventions, not contradictory methods.

## Chebyshev versus empirical rule
For any random variable with finite positive variance and k>1,

$$P(|X-\mu|<k\sigma)\ge1-1/k^2.$$

This gives at least 75% within two standard deviations and at least 88.89% within three. It is a lower bound, not an exact probability.

For a normal model, approximately 68%, 95%, and 99.7% lie within one, two, and three standard deviations. This empirical rule requires approximately normal shape. The early notes' informal “almost all within three” should not be used as a universal 99.7% claim.

**Common mistake:** dividing by variance instead of standard deviation produces incorrect z-scores. A z-score can be computed without normality, but normal-table probabilities require a normal model.

## Source references
- [lecture-09-30 PDF p. 7, 8](../../Notes/STAT_611_Notes_09-30-2026.pdf#page=7)
- [lecture-10-05 PDF p. 2, 3, 4, 5, 6, 7](../../Notes/STAT_611_Notes_10-05-2026.pdf#page=2)
- [lecture-10-07 PDF p. 1, 2](../../Notes/STAT_611_Notes_10-07-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Normal%20probabilities%2C%20percentiles%2C%20and%20spread%20rules) — external search, not a verified source.
