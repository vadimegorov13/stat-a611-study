# Joint distributions, marginals, and independence

Lesson ID: `16-joint` · Course sections: 5.1

## What you should be able to do
Read a joint probability table, calculate marginals, and test factorization.

A discrete joint PMF is $p(x,y)=P(X=x,Y=y)$. Every entry is nonnegative and all entries sum to 1. Marginals describe one variable alone:

$$p_X(x)=\sum_y p(x,y),\qquad p_Y(y)=\sum_xp(x,y).$$

Sum over the variable you want to remove. Event probabilities are sums over cells satisfying the event, not necessarily a full row or column.

## Worked lecture table: defective welds X and loose bolts Y

| X / Y | 0 | 1 | 2 | 3 | Row total |
|---|---:|---:|---:|---:|---:|
| 0 | .84 | .03 | .02 | .01 | .90 |
| 1 | .06 | .01 | .008 | .002 | .08 |
| 2 | .01 | .005 | .004 | .001 | .02 |
| Column total | .91 | .045 | .032 | .013 | 1 |

For example, $P(X=1)=0.08$ and $P(Y=2)=0.032$. Independence would require $p(x,y)=p_X(x)p_Y(y)$ everywhere. It already fails at (0,0), because $0.84\ne0.90(0.91)=0.819$. One mismatch disproves independence; one matching cell does not prove it.

For continuous pairs, a joint density integrates to 1 over its support. Marginal densities integrate out the other variable. Probabilities are double integrals over the relevant region. For PDFs, factorization is understood up to sets of area zero; pointwise changes of a density do not change its distribution.

The lecture's uniform rectangle $[8.5,10.5]\times[120,240]$ has constant density $1/240$. Its marginal densities are $1/2$ and $1/120$ on their intervals, so the variables are independent in this specified model.

**Common mistake:** support matters. A constant density on a triangular region generally does not imply independent coordinates. Uniformity over a rectangle is a special case.

**Next:** [Covariance](17-covariance.md).

## Source references
- [lecture-10-07 PDF p. 2, 3, 4, 5](../../Notes/STAT_611_Notes_10-07-2026.pdf#page=2)
- [lecture-10-12 PDF p. 1, 2](../../Notes/STAT_611_Notes_10-12-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Joint%20distributions%2C%20marginals%2C%20and%20independence) — external search, not a verified source.
