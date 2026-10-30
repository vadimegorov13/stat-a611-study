# Mean, median, variance, and standard deviation

Lesson ID: `02-summary` · Course sections: 6.3

## What you should be able to do
Compute numerical summaries and explain what each measures.

The sample mean is $\bar x=\sum_{i=1}^n x_i/n$. The median is the middle value after sorting; for even $n$, average the two middle values. The mode is a most frequent value. The course allows datasets with no mode or several modes. The range is maximum minus minimum.

The mean uses every value and is sensitive to extremes. The median is resistant. In the lecture example, replacing 5 by 50 in $\{1,2,3,4,5\}$ changes the mean from 3 to 12 but leaves the median at 3. “Resistant” does not mean a statistic can never change.

Signed deviations from the mean sum to zero, so averaging them cannot measure spread. Instead square the deviations:

$$s^2=\frac{\sum_i(x_i-\bar x)^2}{n-1},\qquad s=\sqrt{s^2}.$$

A computationally equivalent formula is

$$s^2=\frac{\sum_i x_i^2-n\bar x^2}{n-1}.$$

For an entire finite population, use its mean $\mu$ and divide the sum of squared deviations by $N$ to obtain $\sigma^2$. Keep sample and population notation separate.

## Worked example from August 26
For $1,4,6,9,10$, the mean is 6. The squared deviations are $25,4,0,9,16$, summing to 54. Therefore $s^2=54/4=13.5$ and $s=\sqrt{13.5}\approx3.6742$. The median is 6 and range is 9.

If data are in centimeters, mean and standard deviation are in centimeters; variance is in square centimeters. Standard deviation zero means all observations are equal. The sample formula requires $n>1$.

## Common mistakes
Sort before finding the median. Do not divide sample variance by $n$. Do not report variance when asked for standard deviation. Avoid premature rounding. The reason for $n-1$ returns in [unbiased estimation](19-estimation.md).

**Related:** [Quartiles and boxplots](03-boxplots.md), [Expected values](07-expectation.md).

## Source references
- [lecture-08-24 PDF p. 6](../../Notes/STAT_611_Notes_08-24-2026.pdf#page=6)
- [lecture-08-26 PDF p. 3, 4, 5](../../Notes/STAT_611_Notes_08-26-2026.pdf#page=3)

[Web search for this topic](https://www.google.com/search?q=statistics%20Mean%2C%20median%2C%20variance%2C%20and%20standard%20deviation) — external search, not a verified source.
