# Joint expectations, covariance, and correlation

Lesson ID: `17-covariance` · Course sections: 5.2–5.3

## What you should be able to do
Calculate a joint expectation and distinguish linear association from independence.

For a discrete pair, $E[h(X,Y)]=\sum_x\sum_y h(x,y)p(x,y)$. For a continuous pair, replace sums by a double integral. Linearity gives $E[aX+bY+c]=aE[X]+bE[Y]+c$ without requiring independence.

Covariance measures whether deviations tend to have the same sign:

$$\operatorname{Cov}(X,Y)=E[(X-E[X])(Y-E[Y])]=E[XY]-E[X]E[Y].$$

Correlation standardizes covariance:

$$\rho=\frac{\operatorname{Cov}(X,Y)}{sd(X)sd(Y)},\qquad-1\le\rho\le1.$$

It requires finite, nonzero standard deviations. Positive rho means larger X tends to accompany larger Y in a linear pattern; negative rho means an opposite linear pattern.

If X and Y are independent, their covariance is zero when the relevant moments exist. Zero covariance does not in general imply independence.

## Original example: dependent but uncorrelated
Let X be equally likely to be −1, 0, or 1, and set $Y=X^2$. Then $E[X]=0$, $E[Y]=2/3$, and $E[XY]=E[X^3]=0$. Covariance is zero. Nevertheless Y is completely determined by X: given X=0, Y=0 with certainty. The relationship is nonlinear.

## Units and transformations
For constants a,b,c,d,

$$\operatorname{Cov}(aX+b,cY+d)=ac\operatorname{Cov}(X,Y).$$

Adding constants does not change covariance; scaling both variables multiplies covariance by the product of the scales. Correlation is unchanged by positive unit conversions and reverses sign if just one scale is negative.

If $Y=aX+b$ and a≠0, then $sd(Y)=|a|sd(X)$ and $\operatorname{Cov}(X,Y)=aV(X)$, yielding correlation +1 or −1. If a=0, Y is constant and correlation is undefined.

**Source correction:** the October 7 Celsius-to-Fahrenheit covariance numbers do not follow the scaling rule. Use the rule and the correct centimeter-to-inch example on October 12 instead.

## Source references
- [lecture-10-07 PDF p. 6, 7](../../Notes/STAT_611_Notes_10-07-2026.pdf#page=6)
- [lecture-10-12 PDF p. 2, 3](../../Notes/STAT_611_Notes_10-12-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Joint%20expectations%2C%20covariance%2C%20and%20correlation) — external search, not a verified source.
