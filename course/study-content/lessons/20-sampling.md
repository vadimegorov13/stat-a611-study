# Linear combinations and normal sampling distributions

Lesson ID: `20-sampling` · Course sections: 7.3 beginning

## What you should be able to do
Calculate the distribution of a linear combination of independent normal variables and distinguish an observation from a sample mean.

For finite-variance random variables,

$$E\left[\sum_i a_iX_i\right]=\sum_i a_iE[X_i],$$
$$V\left(\sum_i a_iX_i\right)=\sum_i\sum_j a_i a_j\operatorname{Cov}(X_i,X_j).$$

The equivalent form is $\sum_i a_i^2V(X_i)+2\sum_{i<j}a_i a_j\operatorname{Cov}(X_i,X_j)$. With independence, off-diagonal terms vanish and variance becomes $\sum_i a_i^2V(X_i)$. Coefficients must be squared in the variance formula.

If the variables are also normal, their linear combination is normal (or constant in a degenerate zero-variance case). For independent $X_i\sim N(\mu_i,\sigma_i^2)$,

$$\sum_i a_iX_i\sim N\left(\sum_i a_i\mu_i,\sum_i a_i^2\sigma_i^2\right).$$

For IID normal observations, $\bar X\sim N(\mu,\sigma^2/n)$ exactly. Normality is not needed for the mean and variance formulas, but it is needed for this exact normal-distribution conclusion. A central limit theorem for non-normal populations is not developed in the supplied notes.

## Original worked example
Let $X\sim N(10,4)$ and $Y\sim N(3,9)$ be independent. For $W=2X-Y$, the mean is $2(10)-3=17$. The variance is $2^2(4)+(-1)^2(9)=25$. Thus $W\sim N(17,25)$ and $sd(W)=5$. Subtracting Y does not mean subtracting its variance.

## Extension of the final lecture setup
October 14 ends with an individual finishing-time model $X\sim N(61,81)$ minutes. For an independent sample of 9 finishers under this model, $\bar X\sim N(61,9)$ and its standard deviation is 3 minutes. Therefore $P(\bar X\le64)=\Phi(1)\approx0.8413$. The sample-of-nine calculation is an authored extension, not a worked example printed in the notes.

**Next material needed:** later sampling-distribution results, confidence intervals, hypothesis testing, and the full regression chapter require additional lecture notes.

## Source references
- [lecture-10-14 PDF p. 3, 6](../../Notes/STAT_611_Notes_10-14-2026.pdf#page=3)

[Web search for this topic](https://www.google.com/search?q=statistics%20Linear%20combinations%20and%20normal%20sampling%20distributions) — external search, not a verified source.
