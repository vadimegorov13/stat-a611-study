# Z-scores, quartiles, outliers, and boxplots

Lesson ID: `03-boxplots` · Course sections: 6.4

## What you should be able to do
Standardize observations and construct a boxplot using the course conventions.

A sample z-score is $z_i=(x_i-\bar x)/s$ when $s>0$. A population z-score is $(x-\mu)/\sigma$. It measures signed distance from the mean in standard-deviation units. Rearranging gives $x=\mu+z\sigma$. With mean 5 and standard deviation 0.5, a value of 6 has z-score 2.

Quartiles divide the ordered data into approximate quarters. $Q_2$ is the median; $Q_1$ and $Q_3$ are the medians of the lower and upper halves. **For odd sample sizes, this course includes the median in both halves.** Software may use a different convention.

## Worked example from August 26
For $2,8,9,10,17,18,35$, $Q_2=10$. The lower half is $2,8,9,10$, so $Q_1=8.5$. The upper half is $10,17,18,35$, so $Q_3=17.5$. Thus $IQR=Q_3-Q_1=9$.

The inner fences are $Q_1-1.5IQR$ and $Q_3+1.5IQR$. The outer fences replace 1.5 by 3. In the August 31 notes, equality at a fence counts as an outlier. A point at or beyond an outer fence is extreme; a point at or beyond an inner fence but short of the outer fence is mild. Apply these as lower- and upper-tail rules. Degenerate cases with $IQR=0$ need explicit handling and are best excluded from automatic convention-based quizzes.

For the example, the upper inner fence is 31 and outer fence is 44.5. Thus 35 is a mild outlier. Whiskers extend to the smallest and largest observed non-outliers, here 2 and 18. Draw the box from 8.5 to 17.5 with a median line at 10.

The five-number summary uses the **actual minimum and maximum**, including outliers: $(2,8.5,10,17.5,35)$. The September 2 review mistakenly substitutes whisker endpoints; the August 31 definition and worked examples distinguish them.

A z-score does not by itself imply normality. See [Chebyshev and the empirical rule](14-spread-rules.md) before interpreting “within three standard deviations.”

## Source references
- [lecture-08-26 PDF p. 6, 7](../../Notes/STAT_611_Notes_08-26-2026.pdf#page=6)
- [lecture-08-31 PDF p. 1, 2, 3, 4, 5, 6, 7](../../Notes/STAT_611_Notes_08-31-2026.pdf#page=1)
- [lecture-09-02 PDF p. 1](../../Notes/STAT_611_Notes_09-02-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Z-scores%2C%20quartiles%2C%20outliers%2C%20and%20boxplots) — external search, not a verified source.
