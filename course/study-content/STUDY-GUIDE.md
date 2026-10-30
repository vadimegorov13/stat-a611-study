# STAT A611 study guide

AI-authored study synthesis of all 15 supplied lectures. Original PDFs remain authoritative source records; source issues are documented separately. Coverage ends October 14, 2026.

- [Populations, samples, and graphical summaries](lessons/01-data.md)
- [Mean, median, variance, and standard deviation](lessons/02-summary.md)
- [Z-scores, quartiles, outliers, and boxplots](lessons/03-boxplots.md)
- [Sample spaces, events, and set operations](lessons/04-events.md)
- [Counting: products, permutations, and combinations](lessons/05-counting.md)
- [Probability rules, conditioning, and independence](lessons/06-rules.md)
- [Discrete random variables, PMFs, CDFs, and expectations](lessons/07-expectation.md)
- [Discrete uniform and geometric distributions](lessons/08-geometric.md)
- [Binomial and negative-binomial distributions](lessons/09-binomial.md)
- [Hypergeometric sampling without replacement](lessons/10-hypergeometric.md)
- [Poisson counts and time intervals](lessons/11-poisson.md)
- [Continuous densities, CDFs, and expected values](lessons/12-continuous.md)
- [Gamma function, gamma, exponential, and chi-squared](lessons/13-gamma.md)
- [Normal probabilities, percentiles, and spread rules](lessons/14-spread-rules.md)
- [Moment-generating functions and proof techniques](lessons/15-mgf.md)
- [Joint distributions, marginals, and independence](lessons/16-joint.md)
- [Joint expectations, covariance, and correlation](lessons/17-covariance.md)
- [Sample correlation and the least-squares line](lessons/18-regression.md)
- [Point estimation, bias, and standard error](lessons/19-estimation.md)
- [Linear combinations and normal sampling distributions](lessons/20-sampling.md)

# Populations, samples, and graphical summaries

Lesson ID: `01-data` · Course sections: 6.1–6.2

## What you should be able to do
Distinguish a population from a sample, classify variables, and choose an appropriate display.

Statistics begins with a question about a population: the full collection we want to understand. Studying every member may be impractical, so we observe a sample. Population size is $N$; sample size is $n$. The observations are $x_1,\ldots,x_n$. Descriptive statistics organize what we observed. Inferential statistics use sample information and a probability model to draw conclusions about a population.

A quantitative variable records a numerical quantity, such as age. A categorical variable records a group, such as country of birth. A numerical code assigned to a category does not make the variable quantitative.

For categorical data, count observations in each category. Divide each count by $n$ to obtain its relative frequency. Use a bar graph or pie chart. For numerical data, a dotplot shows individual observations, a stem-and-leaf plot retains their digits, and a histogram groups them into intervals. An ogive plots cumulative relative frequency: the fraction at or below successive boundaries.

## Worked example from the August 24 notes
The category counts are 13, 18, and 9 out of 40. Their relative frequencies are $13/40=0.325$, $18/40=0.45$, and $9/40=0.225$. Multiply by $360^\circ$ to get pie slices of $117^\circ$, $162^\circ$, and $81^\circ$.

For histogram classes such as $[0.02,0.03)$, include the left boundary and exclude the right one. A value of 0.03 belongs in the next interval. The supplied frequency table has counts $1,6,9,11,7,1$, totaling 35. Its cumulative counts are $1,7,16,27,34,35$.

## Read a graph thoughtfully
Describe center, spread, shape, and unusual observations. Right skew means a longer right tail; left skew means a longer left tail. A histogram can hide within-bin detail. A stem-and-leaf plot needs a place-value key. With unequal bin widths, density rather than raw frequency height is needed if bar area is to represent frequency; this is a supplemental clarification.

**Source caution:** the August 24 stem-and-leaf display lists 34 leaves, whereas the frequency table lists 35 observations. Use each as its own display; do not invent a missing observation.

**Next:** [Center and spread](lessons/02-summary.md).

## Source references
- [lecture-08-24 PDF p. 1, 2, 3, 4, 5](../Notes/STAT_611_Notes_08-24-2026.pdf#page=1)
- [lecture-08-26 PDF p. 1, 2](../Notes/STAT_611_Notes_08-26-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Populations%2C%20samples%2C%20and%20graphical%20summaries) — external search, not a verified source.


---

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
Sort before finding the median. Do not divide sample variance by $n$. Do not report variance when asked for standard deviation. Avoid premature rounding. The reason for $n-1$ returns in [unbiased estimation](lessons/19-estimation.md).

**Related:** [Quartiles and boxplots](lessons/03-boxplots.md), [Expected values](lessons/07-expectation.md).

## Source references
- [lecture-08-24 PDF p. 6](../Notes/STAT_611_Notes_08-24-2026.pdf#page=6)
- [lecture-08-26 PDF p. 3, 4, 5](../Notes/STAT_611_Notes_08-26-2026.pdf#page=3)

[Web search for this topic](https://www.google.com/search?q=statistics%20Mean%2C%20median%2C%20variance%2C%20and%20standard%20deviation) — external search, not a verified source.


---

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

A z-score does not by itself imply normality. See [Chebyshev and the empirical rule](lessons/14-spread-rules.md) before interpreting “within three standard deviations.”

## Source references
- [lecture-08-26 PDF p. 6, 7](../Notes/STAT_611_Notes_08-26-2026.pdf#page=6)
- [lecture-08-31 PDF p. 1, 2, 3, 4, 5, 6, 7](../Notes/STAT_611_Notes_08-31-2026.pdf#page=1)
- [lecture-09-02 PDF p. 1](../Notes/STAT_611_Notes_09-02-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Z-scores%2C%20quartiles%2C%20outliers%2C%20and%20boxplots) — external search, not a verified source.


---

# Sample spaces, events, and set operations

Lesson ID: `04-events` · Course sections: 1.1–1.2

## What you should be able to do
Translate verbal probability questions into events and choose equally likely elementary outcomes when using counting.

The sample space $S$ contains possible outcomes. An event $A$ is a subset of $S$. Probability measures how likely the event is and lies between 0 and 1.

The classical formula is

$$P(A)=\frac{\#A}{\#S},$$

but only when the finite elementary outcomes being counted are equally likely. Counting possible numerical values is not always valid.

## Worked example from September 2
Roll a red die and a blue die. The sums range from 2 to 12, but these eleven sums are not equally likely. Use the 36 equally likely ordered pairs instead. Sum 8 occurs for $(2,6),(3,5),(4,4),(5,3),(6,2)$, giving $P(\text{sum}=8)=5/36$.

The union $A\cup B$ means A or B or both. The intersection $A\cap B$ means both. The complement $A^c$ means A does not occur. Mutually exclusive events satisfy $A\cap B=\varnothing$: they cannot occur together.

De Morgan's laws are

$$(A\cup B)^c=A^c\cap B^c,\qquad(A\cap B)^c=A^c\cup B^c.$$

The complement of “at least one success” is “no successes.” The complement of “both succeed” is “at least one fails,” not “both fail.” For a collection to be mutually exclusive, every distinct pair must be disjoint.

## A useful precision
The early notes equate probability zero with impossibility. That works for their finite equally likely examples, but not for every probability model: a continuous variable can take a specific value even though that singleton has probability zero. The empty event always has probability zero; the converse need not hold.

**Next:** [Counting](lessons/05-counting.md), [Probability rules](lessons/06-rules.md).

## Source references
- [lecture-09-02 PDF p. 1, 2, 3, 4, 5](../Notes/STAT_611_Notes_09-02-2026.pdf#page=1)
- [lecture-09-09 PDF p. 1, 2](../Notes/STAT_611_Notes_09-09-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Sample%20spaces%2C%20events%2C%20and%20set%20operations) — external search, not a verified source.


---

# Counting: products, permutations, and combinations

Lesson ID: `05-counting` · Course sections: 1.3

## What you should be able to do
Decide whether order matters and whether replacement or repeated objects affect the count.

If successive choices have $n_1,\ldots,n_k$ possibilities at each stage, multiply to get $n_1\cdots n_k$. This assumes the stated number of options holds for each preceding choice; otherwise use branches or separate cases.

Ordered selection of $k$ distinct objects without replacement gives $nP_k=n!/(n-k)!$. Unordered selection gives $\binom nk=n!/[k!(n-k)!]$. Each group of $k$ distinct objects has $k!$ orderings, which explains the division. Recall $0!=1$ and $\binom nk=\binom n{n-k}$.

Rearranging $n$ objects with indistinguishable type counts $n_1,\ldots,n_r$ gives $n!/(n_1!\cdots n_r!)$. This is a different problem from choosing a committee.

## Worked examples from September 9
PEPPER has six letters, including three P's and two E's. The number of distinct arrangements is $6!/(3!2!1!)=60$.

For exactly two spades in an unordered five-card hand, choose 2 of the 13 spades and 3 of the 39 non-spades. Divide by all five-card hands:

$$P=\frac{\binom{13}{2}\binom{39}{3}}{\binom{52}{5}}.$$

For a random sample of 3 blocks from 20, of which 15 are acceptable, the probability all are acceptable is

$$\frac{\binom{15}{3}}{\binom{20}{3}}=\frac{15}{20}\frac{14}{19}\frac{13}{18}.$$

The combination method and sequential probability method agree.

## How to choose
A ranking uses permutations; a committee uses combinations. A password with unrestricted repeated characters uses a product of position counts. A fixed multiset of letters uses factorials divided by repeat factorials. In a probability ratio, numerator and denominator must count outcomes using the same ordering convention.

**Related:** [Conditional probability](lessons/06-rules.md), [Hypergeometric distribution](lessons/10-hypergeometric.md).

## Source references
- [lecture-09-02 PDF p. 5, 6, 7](../Notes/STAT_611_Notes_09-02-2026.pdf#page=5)
- [lecture-09-09 PDF p. 2, 3, 4, 5, 6, 7, 8, 9](../Notes/STAT_611_Notes_09-09-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Counting%3A%20products%2C%20permutations%2C%20and%20combinations) — external search, not a verified source.


---

# Probability rules, conditioning, and independence

Lesson ID: `06-rules` · Course sections: 2.1–2.3

## What you should be able to do
Choose the correct addition or multiplication rule and explain its assumptions.

The axioms give nonnegative probabilities, $P(S)=1$, and additivity for disjoint events. The complement rule is $P(A)=1-P(A^c)$.

For any two events,

$$P(A\cup B)=P(A)+P(B)-P(A\cap B).$$

The intersection was counted twice, so subtract it once. For three events, add single-event probabilities, subtract the three pairwise intersections, and add the triple intersection. Only for mutually exclusive events can we simply add without overlap corrections.

Conditioning restricts attention to outcomes where the given event occurred:

$$P(B\mid A)=\frac{P(A\cap B)}{P(A)},\quad P(A)>0.$$

Thus $P(A\cap B)=P(A)P(B\mid A)$. With several events, each successive factor conditions on all previous events. In general $P(B\mid A)\ne P(A\mid B)$.

Independent events satisfy $P(A\cap B)=P(A)P(B)$. When conditioning is defined, knowing A does not change B's probability. For more than two events, mutual independence is stronger than pairwise independence; multiplying a whole collection requires the appropriate joint independence assumption.

## Worked examples from September 14
A heart or a face card has probability $(13+12-3)/52=22/52$. The three heart face cards are the overlap.

Given that the first card drawn without replacement is an ace, the next card is an ace with probability $3/51$. Hence two aces have probability $(4/52)(3/51)$.

A sample of two people from groups of sizes 17 and 23 has one from each group with probability

$$\frac{17}{40}\frac{23}{39}+\frac{23}{40}\frac{17}{39}.$$

Both possible orders matter.

**Common mistake:** mutually exclusive positive-probability events are not independent. If one occurs, the other becomes impossible. “OR means add” and “AND means multiply” require the correct overlap or conditional terms.

**Scope:** September 16 explicitly says to skip Section 2.4. Do not silently add it as covered material.

## Source references
- [lecture-09-14 PDF p. 1, 2, 3, 4, 5, 6, 7, 8, 9](../Notes/STAT_611_Notes_09-14-2026.pdf#page=1)
- [lecture-09-16 PDF p. 1, 2](../Notes/STAT_611_Notes_09-16-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Probability%20rules%2C%20conditioning%2C%20and%20independence) — external search, not a verified source.


---

# Discrete random variables, PMFs, CDFs, and expectations

Lesson ID: `07-expectation` · Course sections: 3.1–3.3

## What you should be able to do
Build a discrete distribution, accumulate its probabilities, and calculate its center and spread.

A random variable assigns a number to an experimental outcome. Its support is the set of possible values. A discrete support is countable, possibly infinite. The probability mass function is $p(x)=P(X=x)$, with $p(x)\ge0$ and $\sum_xp(x)=1$.

The CDF is $F(t)=P(X\le t)$ for every real t. It is nondecreasing, right-continuous, and tends to 0 and 1 at the two extremes. For integer-valued X,

$$P(a\le X\le b)=F(b)-F(a-1)$$

when a and b are integers. For general discrete supports use $F(b)-F(a^-)$, where $F(a^-)=P(X<a)$.

## Worked examples from the notes
The maximum of two independent fair dice has $p(x)=(2x-1)/36$ for $x=1,\ldots,6$. One way to see this is to subtract the number of pairs with maximum at most $x-1$ from the number with maximum at most x: $x^2-(x-1)^2=2x-1$.

For a distribution with probabilities $0.1,0.3,0.6$ at values $1,2,3$:

$$E[X]=1(0.1)+2(0.3)+3(0.6)=2.5,$$
$$E[X^2]=1(0.1)+4(0.3)+9(0.6)=6.7,$$
$$V(X)=6.7-2.5^2=0.45,\quad sd(X)=\sqrt{0.45}.$$

Expectation is a probability-weighted average, not necessarily a possible observation. In general $E[h(X)]=\sum_xh(x)p(x)$. The kth raw moment is $E[X^k]$. Linearity gives $E[aX+b]=aE[X]+b$; it does not imply $E[X^2]=E[X]^2$.

Variance is $E[(X-\mu)^2]=E[X^2]-\mu^2$, when the second moment is finite.

For infinite discrete distributions, geometric sums often verify total probability: $\sum_{k=0}^{n}a^k=(1-a^{n+1})/(1-a)$ for $a\ne1$, and $\sum_{k=0}^{\infty}a^k=1/(1-a)$ for $|a|<1$.

**Related:** [Geometric distributions](lessons/08-geometric.md), [Continuous distributions](lessons/12-continuous.md).

## Source references
- [lecture-09-16 PDF p. 2, 3, 4, 5, 6, 7, 8, 9, 10, 11](../Notes/STAT_611_Notes_09-16-2026.pdf#page=2)
- [lecture-09-21 PDF p. 1, 2, 3, 4, 5, 6](../Notes/STAT_611_Notes_09-21-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Discrete%20random%20variables%2C%20PMFs%2C%20CDFs%2C%20and%20expectations) — external search, not a verified source.


---

# Discrete uniform and geometric distributions

Lesson ID: `08-geometric` · Course sections: 3.4

## What you should be able to do
Recognize equal-probability models and waiting for the first success.

A discrete uniform distribution gives probability $1/k$ to each of k specified possible values. The course writes $U(k)$, but k alone does not specify the numerical support: record the values too. A fair die is uniform on $\{1,\ldots,6\}$ and has mean 3.5. Uniformity is about equal probabilities, not necessarily equally spaced values.

A geometric variable counts **total trials up to and including the first success** in independent Bernoulli trials with a constant success probability $0<p\le1$:

$$X\sim G(p),\quad P(X=x)=(1-p)^{x-1}p,\quad x=1,2,\ldots.$$

There must be $x-1$ failures followed by one success. Hence

$$P(X>k)=(1-p)^k,\quad P(X\ge k)=(1-p)^{k-1},$$

for nonnegative integer k in the first formula and positive integer k in the second. The CDF is zero below 1 and $1-(1-p)^{\lfloor x\rfloor}$ for $x\ge1$.

$$E[X]=\frac1p,\qquad sd(X)=\frac{\sqrt{1-p}}p.$$

## Worked example from September 21
Generate independent uniform digits 0–9 until the first zero. Success means zero, so $p=0.1$ and the mean waiting count is 10 digits. The probability the first zero is the fourth digit is $0.9^3(0.1)=0.0729$. This numerical evaluation extends the lecture setup.

The chance of waiting more than 4 digits is $0.9^4=0.6561$; waiting at least 4 requires only the first 3 to be nonzero and has probability $0.9^3=0.729$.

**Common mistake:** some software counts failures before success, with support starting at zero. That variable equals this course's X minus one. Translate the convention before using software.

**Next:** [Binomial and negative binomial](lessons/09-binomial.md).

## Source references
- [lecture-09-21 PDF p. 7, 8, 9, 10](../Notes/STAT_611_Notes_09-21-2026.pdf#page=7)
- [lecture-09-23 PDF p. 1, 2](../Notes/STAT_611_Notes_09-23-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Discrete%20uniform%20and%20geometric%20distributions) — external search, not a verified source.


---

# Binomial and negative-binomial distributions

Lesson ID: `09-binomial` · Course sections: 3.5–3.6

## What you should be able to do
Tell whether the number of trials or the number of successes is fixed.

For n independent Bernoulli trials with the same success probability p, the number of successes is binomial:

$$X\sim B(n,p),\quad P(X=x)=\binom nxp^x(1-p)^{n-x},\quad x=0,\ldots,n.$$

One particular ordering has probability $p^x(1-p)^{n-x}$. There are $\binom nx$ such orderings. The mean is np and standard deviation is $\sqrt{np(1-p)}$.

## Worked example from September 23
The count of fours in 15 independent fair-die rolls is $B(15,1/6)$. Exactly three fours has probability

$$\binom{15}{3}(1/6)^3(5/6)^{12}.$$

For a binomial CDF table, subtract cumulative entries to isolate values: $P(X=5)=F(5)-F(4)$, and $P(1\le X\le8)=F(8)-F(0)$. The lecture's $B(17,0.3)$ table values give approximately 0.2081 and 0.9574 respectively.

A negative-binomial variable instead counts **total trials until the rth success**:

$$X\sim NB(r,p),\quad P(X=x)=\binom{x-1}{r-1}p^r(1-p)^{x-r},\quad x=r,r+1,\ldots.$$

The last trial must be a success. Among the preceding $x-1$ trials, choose positions for the other $r-1$ successes. Its mean is $r/p$. Setting r=1 recovers the geometric distribution.

For the fifth zero to appear on the 40th independent random digit, the first 39 digits contain four zeros and the final digit is zero:

$$P(X=40)=\binom{39}{4}(0.1)^5(0.9)^{35}.$$

**Common mistakes:** do not use $\binom xr$ for a stopping-time event; it includes sequences that finish earlier. Do not use binomial for sampling without replacement unless an approximation is explicitly justified. “Success” is just the outcome being counted, not a positive judgment.

The lectures mention trinomial and multinomial extensions but do not develop their full formulas.

## Source references
- [lecture-09-21 PDF p. 11, 12](../Notes/STAT_611_Notes_09-21-2026.pdf#page=11)
- [lecture-09-23 PDF p. 2, 3, 4, 5, 6](../Notes/STAT_611_Notes_09-23-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Binomial%20and%20negative-binomial%20distributions) — external search, not a verified source.


---

# Hypergeometric sampling without replacement

Lesson ID: `10-hypergeometric` · Course sections: 3.7

## What you should be able to do
Model a success count from a finite population sampled without replacement.

Suppose a population has N members, M of which are labeled successes. Select an unordered simple random sample of n members without replacement. Let X count the sampled successes. Then

$$X\sim HG(N,M,n),\qquad P(X=x)=\frac{\binom Mx\binom{N-M}{n-x}}{\binom Nn}.$$

The numerator chooses x successes and n−x failures. The denominator counts all equally likely samples. Valid values satisfy

$$\max(0,n-(N-M))\le x\le\min(n,M).$$

These bounds are an explicit clarification of the lecture formula: you cannot draw more successes or failures than exist.

The mean is $E[X]=nM/N$. This resembles np because the population success fraction is M/N. The model differs from binomial because draws without replacement are dependent.

## Worked example from September 23
There are 4 aces in a deck of 52. In a five-card hand, the ace count is $HG(52,4,5)$. Exactly one ace has probability

$$\frac{\binom41\binom{48}{4}}{\binom{52}{5}},$$

and the expected number of aces is $5(4/52)=5/13$. The expected value need not be an integer even though every realized count is.

## Original practice example
A box contains 4 red and 6 blue tokens. Draw 3 without replacement. Exactly 2 red has probability

$$\frac{\binom42\binom61}{\binom{10}{3}}=\frac{36}{120}=0.3.$$

The expected red count is $3(4/10)=1.2$. For at least one red, complementing is efficient: $1-\binom63/\binom{10}{3}=5/6$.

**Common mistake:** the symbol M is a population count, not a probability. Keep N, M, and n in their correct positions.

**Related:** [Probability rules](lessons/06-rules.md), [Distribution chooser](FORMULA-REFERENCE.md).

## Source references
- [lecture-09-09 PDF p. 6, 7, 8](../Notes/STAT_611_Notes_09-09-2026.pdf#page=6)
- [lecture-09-23 PDF p. 6, 7](../Notes/STAT_611_Notes_09-23-2026.pdf#page=6)
- [lecture-09-28 PDF p. 2](../Notes/STAT_611_Notes_09-28-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Hypergeometric%20sampling%20without%20replacement) — external search, not a verified source.


---

# Poisson counts and time intervals

Lesson ID: `11-poisson` · Course sections: 3.8

## What you should be able to do
Model event counts over a fixed interval and convert a rate into an expected count.

A Poisson variable has

$$P(X=x)=\frac{\lambda^x e^{-\lambda}}{x!},\quad x=0,1,\ldots,\qquad E[X]=V(X)=\lambda.$$

Its standard deviation is $\sqrt\lambda$, not lambda. The parameter lambda is the expected count in the specific interval under study.

For a homogeneous Poisson process with rate a events per unit time, an interval of length t has count distribution $P(at)$. The lecture uses alpha for this rate; here a avoids confusion with gamma shape. Match the time units before multiplying.

The process assumption is a model: constant rate and independent counts in disjoint intervals, with negligible chance of multiple events in a sufficiently short interval. These clarify the conditions behind the lecture applications; event counts are not automatically Poisson just because they are counts.

## Lecture setup
September 23 models the next day's 5–6 PM emergency-room arrivals with mean 6.9 as $X\sim P(6.9)$. This is an illustrative statistical model, not a prediction based on current hospital data.

## Original worked example
Suppose events follow a Poisson process at 3 per hour. In 20 minutes, $t=1/3$ hour, so lambda=1. The probability of no events is $e^{-1}\approx0.3679$. The probability of at least one is $1-e^{-1}\approx0.6321$. Exactly two has probability $e^{-1}/2\approx0.1839$.

A Poisson variable counts events; an exponential variable measures waiting time until the next event. They use different supports and different parameter conventions. At 3 events per hour, the mean waiting time is 1/3 hour, or 20 minutes.

**Next:** [Gamma and exponential families](lessons/13-gamma.md). Section 3.9 is explicitly skipped in the September 23 notes.

## Source references
- [lecture-09-23 PDF p. 7, 8](../Notes/STAT_611_Notes_09-23-2026.pdf#page=7)
- [lecture-09-28 PDF p. 3](../Notes/STAT_611_Notes_09-28-2026.pdf#page=3)
- [lecture-09-30 PDF p. 7](../Notes/STAT_611_Notes_09-30-2026.pdf#page=7)

[Web search for this topic](https://www.google.com/search?q=statistics%20Poisson%20counts%20and%20time%20intervals) — external search, not a verified source.


---

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
- [lecture-09-28 PDF p. 3, 4, 5, 6, 7, 8, 9, 10, 11](../Notes/STAT_611_Notes_09-28-2026.pdf#page=3)
- [lecture-09-30 PDF p. 1, 2, 3, 4](../Notes/STAT_611_Notes_09-30-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Continuous%20densities%2C%20CDFs%2C%20and%20expected%20values) — external search, not a verified source.


---

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

**Related:** [Moment-generating functions](lessons/15-mgf.md).

## Source references
- [lecture-09-30 PDF p. 4, 5, 6, 7](../Notes/STAT_611_Notes_09-30-2026.pdf#page=4)
- [lecture-10-05 PDF p. 2, 7](../Notes/STAT_611_Notes_10-05-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Gamma%20function%2C%20gamma%2C%20exponential%2C%20and%20chi-squared) — external search, not a verified source.


---

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
- [lecture-09-30 PDF p. 7, 8](../Notes/STAT_611_Notes_09-30-2026.pdf#page=7)
- [lecture-10-05 PDF p. 2, 3, 4, 5, 6, 7](../Notes/STAT_611_Notes_10-05-2026.pdf#page=2)
- [lecture-10-07 PDF p. 1, 2](../Notes/STAT_611_Notes_10-07-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Normal%20probabilities%2C%20percentiles%2C%20and%20spread%20rules) — external search, not a verified source.


---

# Moment-generating functions and proof techniques

Lesson ID: `15-mgf` · Course sections: 4.2; supporting calculus

## What you should be able to do
Understand the MGF definition and reproduce the main proof ideas in the notes.

The moment-generating function is $m_X(t)=E[e^{tX}]$. When it exists on an open interval containing zero, differentiating at zero yields raw moments:

$$m_X^{(k)}(0)=E[X^k].$$

Thus $m'_X(0)$ is the mean, while variance is $m''_X(0)-[m'_X(0)]^2$. The second derivative is the second raw moment, not variance by itself. Also $m_X(0)=1$.

The notes introduce the definition and derivative property on September 30 page 3; the following complete example is supplemental teaching based on their exponential density.

## Original worked derivation
For $f(x)=e^{-x}$ on x>0,

$$m_X(t)=\int_0^\infty e^{tx}e^{-x}\,dx=\int_0^\infty e^{-(1-t)x}\,dx=\frac1{1-t},\quad t<1.$$

The condition t<1 makes the integral converge. Differentiate to obtain $m'_X(t)=(1-t)^{-2}$ and $m''_X(t)=2(1-t)^{-3}$. At zero, $E[X]=1$ and $E[X^2]=2$, so $V(X)=1$.

## Proof patterns to practice
For a geometric sum, multiply the sum by its ratio and subtract; most terms cancel. For linearity of expectation, distribute the sum or integral and use total probability one. For the variance identity, expand $(X-\mu)^2$ and apply linearity.

For gamma recurrences, integrate by parts and check boundary terms. For covariance, expand $(X-E[X])(Y-E[Y])$. Under independence, factor the joint distribution to show $E[XY]=E[X]E[Y]$ when the needed expectations exist.

For sample variance unbiasedness, use $E[X_i^2]=\sigma^2+\mu^2$ and $E[\bar X^2]=\sigma^2/n+\mu^2$; substitute into the computational sample-variance formula. See [estimation](lessons/19-estimation.md).

**Study approach:** explain why each algebraic step is legal. The notes include derivations, so a formula-only study plan would omit substantial material.

## Source references
- [lecture-09-16 PDF p. 7, 8](../Notes/STAT_611_Notes_09-16-2026.pdf#page=7)
- [lecture-09-21 PDF p. 4, 6](../Notes/STAT_611_Notes_09-21-2026.pdf#page=4)
- [lecture-09-30 PDF p. 3, 4, 5](../Notes/STAT_611_Notes_09-30-2026.pdf#page=3)
- [lecture-10-07 PDF p. 6, 7](../Notes/STAT_611_Notes_10-07-2026.pdf#page=6)
- [lecture-10-14 PDF p. 1, 3, 4, 5](../Notes/STAT_611_Notes_10-14-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Moment-generating%20functions%20and%20proof%20techniques) — external search, not a verified source.


---

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

**Next:** [Covariance](lessons/17-covariance.md).

## Source references
- [lecture-10-07 PDF p. 2, 3, 4, 5](../Notes/STAT_611_Notes_10-07-2026.pdf#page=2)
- [lecture-10-12 PDF p. 1, 2](../Notes/STAT_611_Notes_10-12-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Joint%20distributions%2C%20marginals%2C%20and%20independence) — external search, not a verified source.


---

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
- [lecture-10-07 PDF p. 6, 7](../Notes/STAT_611_Notes_10-07-2026.pdf#page=6)
- [lecture-10-12 PDF p. 2, 3](../Notes/STAT_611_Notes_10-12-2026.pdf#page=2)

[Web search for this topic](https://www.google.com/search?q=statistics%20Joint%20expectations%2C%20covariance%2C%20and%20correlation) — external search, not a verified source.


---

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
- [lecture-10-12 PDF p. 3, 4, 5, 6, 7](../Notes/STAT_611_Notes_10-12-2026.pdf#page=3)

[Web search for this topic](https://www.google.com/search?q=statistics%20Sample%20correlation%20and%20the%20least-squares%20line) — external search, not a verified source.


---

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
- [lecture-10-12 PDF p. 7, 8](../Notes/STAT_611_Notes_10-12-2026.pdf#page=7)
- [lecture-10-14 PDF p. 1, 2, 3, 4, 5](../Notes/STAT_611_Notes_10-14-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Point%20estimation%2C%20bias%2C%20and%20standard%20error) — external search, not a verified source.


---

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
- [lecture-10-14 PDF p. 3, 6](../Notes/STAT_611_Notes_10-14-2026.pdf#page=3)

[Web search for this topic](https://www.google.com/search?q=statistics%20Linear%20combinations%20and%20normal%20sampling%20distributions) — external search, not a verified source.
