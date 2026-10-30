# Sample correlation and the least-squares line

Lesson ID: `18-regression` · Course sections: 5.3; regression preview

## What you should be able to do
Compute sample correlation and interpret a fitted line and R-squared.

Paired observations are $(x_i,y_i)$. First inspect a scatterplot. Sample correlation is

$$R=\frac1{n-1}\sum_i z_{x_i}z_{y_i}=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum_i(x_i-\bar x)^2\sum_i(y_i-\bar y)^2}}.$$

Pairs above both means or below both means contribute positive products. Pairs on opposite sides contribute negative products. R summarizes linear association and may miss a strong curved relationship. It requires nonconstant values in both coordinates.

The least-squares line with an intercept is $\hat y=a+bx$, where

$$b=R\frac{s_y}{s_x},\qquad a=\bar y-b\bar x.$$

It passes through $(\bar x,\bar y)$. The slope is the predicted change in y for one unit increase in x. The intercept is the predicted y at x=0, which may lie outside the observed range.

For this simple least-squares fit with an intercept, $R^2$ is the fraction of observed variation in y explained by the fitted linear relationship. “Explained” is a statistical fit description; it does not establish a causal mechanism.

## Original worked example
Suppose $\bar x=10$, $\bar y=30$, $s_x=2$, $s_y=5$, and $R=0.8$. Then $b=0.8(5/2)=2$, $a=30-2(10)=10$, and $\hat y=10+2x$. At x=12, predict 34. Here $R^2=0.64$, so the fitted line accounts for 64% of the observed y variation.

## Common mistakes
R has no units, but the slope has y-units per x-unit. R-squared loses the direction of the relationship. Avoid interpreting association as causation or extending a fitted relationship far beyond observed x values without justification. The lecture's weak/moderate/strong cutoffs are classroom guides, not universal scientific thresholds.

**Scope:** the supplied notes contain this regression preview, not the later full Chapter 11 treatment or regression inference.

## Source references
- [lecture-10-12 PDF p. 3, 4, 5, 6, 7](../../Notes/STAT_611_Notes_10-12-2026.pdf#page=3)

[Web search for this topic](https://www.google.com/search?q=statistics%20Sample%20correlation%20and%20the%20least-squares%20line) — external search, not a verified source.
