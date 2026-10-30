# Point estimation, bias, and standard error

Lesson ID: `19-estimation` · Course sections: 7.1; brief 7.2 introduction

## What you should be able to do
Distinguish an estimator from an estimate and explain unbiasedness and standard error.

A population parameter theta is an unknown feature such as mu, sigma, or rho. An estimator $\hat\theta$ is a rule based on a random sample; an estimate is the numerical value that rule produces for the observed sample. Before collecting data, $\bar X$ is random; afterward $\bar x$ is a particular number.

Bias is $E[\hat\theta]-\theta$. An estimator is unbiased if this equals zero. Small bias and small standard deviation are desirable. Unbiasedness concerns the center over repeated samples, not whether every individual estimate equals the parameter.

For IID observations with mean mu and finite variance sigma-squared,

$$E[\bar X]=\mu,\qquad V(\bar X)=\frac{\sigma^2}{n},\qquad SE(\bar X)=\frac\sigma{\sqrt n}.$$

Linearity proves the mean result. Independence removes covariance terms in the variance calculation. Standard error describes variation of an estimator across samples; the population standard deviation describes variation of individual observations. Replacing sigma by s gives the estimated standard error $s/\sqrt n$.

## Why divide by n−1?
Using $S^2=[\sum X_i^2-n\bar X^2]/(n-1)$ and

$$E[X_i^2]=\sigma^2+\mu^2,\quad E[\bar X^2]=\sigma^2/n+\mu^2,$$

we obtain

$$E[S^2]=\frac{n(\sigma^2+\mu^2)-n(\sigma^2/n+\mu^2)}{n-1}=\sigma^2.$$

Dividing by n instead gives expected value $(n-1)\sigma^2/n$, a downward bias when sigma-squared>0. However, $E[S^2]=\sigma^2$ does not imply $E[S]=\sigma$; sample standard deviation is generally biased.

## Original worked example
If sigma=12 and n=36, the sample mean has standard error 2. At n=144, its standard error is 1. Halving standard error requires quadrupling sample size.

Section 7.2 names method of moments and maximum likelihood but provides no worked estimation procedure. These are introduction-only topics in this content pack. Do not treat MLE as universally superior or infer that detailed MLE questions are covered by these files.

## Source references
- [lecture-10-12 PDF p. 7, 8](../../Notes/STAT_611_Notes_10-12-2026.pdf#page=7)
- [lecture-10-14 PDF p. 1, 2, 3, 4, 5](../../Notes/STAT_611_Notes_10-14-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Point%20estimation%2C%20bias%2C%20and%20standard%20error) — external search, not a verified source.
