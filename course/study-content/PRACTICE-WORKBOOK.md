# Practice workbook

60 original study questions. These are practice, not assigned homework or a prediction of the exam. Solutions are collected after the questions.

## Populations, samples, and graphical summaries

### q01-01

Which display is designed for frequencies of categories?

A. Bar graph
B. Histogram of continuous intervals
C. Normal density
D. Scatterplot of paired measurements

Hint: Think about category labels.

### q01-02

A category contains 12 of 48 observations. What is its relative frequency?

Hint: Divide category count by total.

### q01-03

An ogive reaches 0.80 at an upper class boundary of 50. Interpret it.

Hint: An ogive accumulates frequencies.

## Mean, median, variance, and standard deviation

### q02-01

Which summary is usually more resistant to an extreme observation?

A. Mean
B. Median
C. Range
D. Sample variance

Hint: Consider replacing the largest value by a huge value.

### q02-02

Find the sample variance of 2, 4, 6.

Hint: Find the mean, then divide squared deviations by n−1.

### q02-03

Find the sample standard deviation of 2, 4, 6.

Hint: Take the square root of the sample variance.

## Z-scores, quartiles, outliers, and boxplots

### q03-01

For odd n, how do these lectures define the halves used for quartiles?

A. Exclude the median from both
B. Include the median in both
C. Put the median only in the lower half
D. Use interpolation automatically

Hint: Use the course convention rather than a software default.

### q03-02

Using the course convention, find Q1 for 1, 3, 5, 7, 9.

Hint: Include the median in the lower half.

### q03-03

Q1=10, Q3=18. An observation equals 30. Classify it using the course fence rule.

Hint: Check both fences and equality.

## Sample spaces, events, and set operations

### q04-01

Why is P(sum=7) not 1/11 for two independent fair dice?

A. There are only six sums
B. The possible sums are not equally likely
C. The dice must be identical colors
D. Seven is impossible

Hint: Count ordered pairs.

### q04-02

What is the probability that two independent fair dice sum to 7?

Hint: List pairs with total 7.

### q04-03

Write the complement of “A or B occurs” in words and set notation.

Hint: Apply De Morgan’s law.

## Counting: products, permutations, and combinations

### q05-01

Choosing an unordered committee of three from ten distinct people uses:

A. 10^3
B. 10!
C. 10P3
D. 10 choose 3

Hint: Changing the listing order does not change a committee.

### q05-02

How many distinct arrangements are there of the letters LEVEL?

Hint: Account for two Ls and two Es.

### q05-03

How many ordered choices of president and secretary can be made from 8 people, with different people in the roles?

Hint: Order matters and no person fills both roles.

## Probability rules, conditioning, and independence

### q06-01

Two disjoint events both have positive probability. Are they independent?

A. Always
B. No
C. Only if equally likely
D. Only if their probabilities sum to one

Hint: Compare intersection probability with the product.

### q06-02

P(A)=0.4, P(B)=0.5, P(A intersection B)=0.2. Find P(A union B).

Hint: Subtract the overlap once.

### q06-03

P(A)=0.4 and P(A intersection B)=0.12. Find P(B given A).

Hint: Divide by the probability of the conditioning event.

## Discrete random variables, PMFs, CDFs, and expectations

### q07-01

For integer-valued X, P(2 ≤ X ≤ 5) equals:

A. F(5)−F(2)
B. F(5)−F(1)
C. F(4)−F(2)
D. F(5)+F(2)

Hint: Do not subtract the probability at the included lower endpoint.

### q07-02

X takes 0,1,2 with probabilities 0.2,0.5,0.3. Find E[X].

Hint: Compute a probability-weighted average.

### q07-03

For the same X with probabilities 0.2,0.5,0.3 at 0,1,2, find V(X).

Hint: Find E[X²] first.

## Discrete uniform and geometric distributions

### q08-01

A geometric variable in this course counts:

A. Failures before the first success
B. Total trials through the first success
C. Successes in fixed n trials
D. Events in a time interval

Hint: Its support starts at 1.

### q08-02

X~G(0.25). Find P(X=3).

Hint: Two failures, then success.

### q08-03

X~G(0.25). Find P(X≥3).

Hint: Only the first two trials must fail.

## Binomial and negative-binomial distributions

### q09-01

Counting trials until the fourth success uses which model?

A. Binomial
B. Negative binomial
C. Hypergeometric
D. Discrete uniform

Hint: The success count is fixed; trial count is random.

### q09-02

X~B(4,0.5). Find P(X=2).

Hint: Count sequences with two successes.

### q09-03

With independent trials and p=0.5, what is the probability that the second success occurs on trial 4?

Hint: One success among the first three, followed by success.

## Hypergeometric sampling without replacement

### q10-01

Which feature points to hypergeometric rather than binomial sampling?

A. Fixed sample size alone
B. Sampling without replacement from a finite population
C. A continuous measurement
D. Waiting for first success

Hint: The population composition changes after each draw.

### q10-02

From 4 red and 6 blue tokens, draw 3 without replacement. Find P(exactly 2 red).

Hint: Choose reds and blues separately.

### q10-03

For that sample, what is the expected number of red tokens?

Hint: Use nM/N.

## Poisson counts and time intervals

### q11-01

For a Poisson variable with parameter λ, its standard deviation is:

A. λ
B. λ²
C. sqrt(λ)
D. 1/λ

Hint: Mean and variance both equal λ.

### q11-02

A Poisson process has rate 6 per hour. What is λ for a 30-minute count?

Hint: Convert 30 minutes to hours.

### q11-03

For a Poisson count with λ=2, find P(X=0).

Hint: Use 0!=1.

## Continuous densities, CDFs, and expected values

### q12-01

A continuous PDF has value 2 at x=0.4. Does that alone make it invalid?

A. Yes, probabilities cannot exceed one
B. No, density height may exceed one
C. Yes, every density must be constant
D. No, total area does not matter

Hint: Probability is area, not height.

### q12-02

X~U(2,8). Find P(3≤X≤5).

Hint: Divide interval length by total support length.

### q12-03

A density is f(x)=2x for 0<x<1 and zero otherwise. Find E[X].

Hint: Integrate x times the density.

## Gamma function, gamma, exponential, and chi-squared

### q13-01

In these notes, the second parameter β in Γ(α,β) is:

A. Rate
B. Scale
C. Variance
D. Degrees of freedom

Hint: Inspect the exponent −x/β.

### q13-02

X~Γ(3,2), using shape and scale. Find E[X].

Hint: Multiply shape by scale.

### q13-03

An exponential waiting time has mean 5 minutes. Find P(T>10 minutes).

Hint: The mean is the scale β.

## Normal probabilities, percentiles, and spread rules

### q14-01

X~N(10,9). What is its standard deviation?

A. 9
B. 81
C. 3
D. 1/3

Hint: The second parameter is variance.

### q14-02

X~N(10,9). Find the z-score of x=16.

Hint: Subtract the mean and divide by σ.

### q14-03

Without assuming normality, what does Chebyshev guarantee within three standard deviations?

Hint: Use 1−1/k².

## Moment-generating functions and proof techniques

### q15-01

For an MGF existing near zero, m″(0) gives:

A. Variance directly
B. Second raw moment E[X²]
C. Standard deviation
D. Median

Hint: Variance also needs the square of the mean.

### q15-02

For m(t)=1/(1−t), t<1, find E[X²].

Hint: Differentiate twice, then set t=0.

### q15-03

Evaluate Γ(5).

Hint: Γ(n)=(n−1)!.

## Joint distributions, marginals, and independence

### q16-01

To obtain p_X(x) from a discrete joint PMF, you:

A. Sum over x
B. Sum over y
C. Multiply all cells
D. Divide by x

Hint: Remove the other variable.

### q16-02

A joint table has p(0,0)=0.2, p(0,1)=0.3, p(1,0)=0.1, p(1,1)=0.4. Find P(X=1).

Hint: Sum the row with X=1.

### q16-03

Are X and Y independent for the same joint table?

Hint: One mismatch is enough to disprove factorization.

## Joint expectations, covariance, and correlation

### q17-01

Zero covariance implies independence:

A. Always
B. In general, no
C. Whenever means exist
D. Whenever variables are discrete

Hint: Think of a symmetric X and Y=X².

### q17-02

Cov(X,Y)=6, sd(X)=2, sd(Y)=4. Find correlation.

Hint: Divide by both standard deviations.

### q17-03

Cov(X,Y)=2. Find Cov(3X+5,2Y−1).

Hint: Offsets disappear and scales multiply.

## Sample correlation and the least-squares line

### q18-01

A sample correlation R=−0.9 describes:

A. Strong positive linear association
B. Strong negative linear association
C. No association
D. Proof that X causes Y

Hint: Sign gives direction; magnitude gives linear strength.

### q18-02

R=0.6, sx=2, sy=5. Find the least-squares slope.

Hint: Use b=R sy/sx.

### q18-03

For simple linear regression with an intercept and R=−0.8, what percent of observed y variation is explained?

Hint: Square R and multiply by 100.

## Point estimation, bias, and standard error

### q19-01

An estimator is unbiased when:

A. It equals the parameter for every sample
B. Its expectation equals the parameter
C. Its variance is zero
D. It is always positive

Hint: Bias concerns repeated-sample expectation.

### q19-02

An IID sample has population σ=15 and n=25. Find SE of the sample mean.

Hint: Use σ/sqrt(n).

### q19-03

Does unbiased S² imply unbiased S? Explain.

Hint: Expectation does not commute with arbitrary nonlinear functions.

## Linear combinations and normal sampling distributions

### q20-01

For independent X,Y, V(X−Y) equals:

A. V(X)−V(Y)
B. V(X)+V(Y)
C. sd(X)+sd(Y)
D. Zero

Hint: The coefficient of Y is squared.

### q20-02

Independent X~N(10,4), Y~N(3,9). Find V(2X−Y).

Hint: Square each coefficient in the variance formula.

### q20-03

For n=9 IID normal observations with variance 81, what is sd of the sample mean?

Hint: Variance divides by n; then take the square root.

---
# Answers and explanations

## q01-01

A bar graph compares category counts; a histogram groups numerical observations into intervals.

## q01-02

12/48 = 0.25, or 25%.

## q01-03

Approximately 80% of observations lie up to that boundary; the exact endpoint language follows the bin convention.

Self-check: States cumulative proportion; Relates 80% to observations below/at the boundary; Does not interpret this as density at 50.

## q02-01

The median depends on central ordered observations and is resistant to an extreme value.

## q02-02

Mean = 4. Squared deviations total 4+0+4 = 8. Sample variance = 8/2 = 4.

## q02-03

Sample variance = 4; standard deviation = sqrt(4) = 2, in the original units.

## q03-01

August 26 and August 31 include the middle observation in both halves.

## q03-02

The lower half is 1,3,5, whose median is 3.

## q03-03

IQR=8. Upper fences are 18+12=30 and 18+24=42. Equality at the inner fence counts here, so 30 is a mild outlier.

Self-check: Computes IQR=8; Computes upper inner fence 30 and outer fence 42; Calls 30 a mild outlier under the course inclusive rule.

## q04-01

Six of 36 equally likely ordered pairs sum to 7; sums 2 through 12 have unequal probabilities.

## q04-02

The pairs are (1,6),(2,5),(3,4),(4,3),(5,2),(6,1), so 6/36=1/6.

## q04-03

Neither occurs: (A union B)^c = A^c intersection B^c.

Self-check: Neither A nor B occurs; Uses A^c intersection B^c.

## q05-01

Use combinations: choose 3 distinct people without replacement, ignoring order.

## q05-02

5!/(2!2!1!)=120/4=30.

## q05-03

8 choices for president times 7 for secretary = 56.

## q06-01

Their intersection has probability zero but the product of their positive probabilities is positive.

## q06-02

0.4+0.5−0.2=0.7.

## q06-03

P(B|A)=0.12/0.4=0.3.

## q07-01

Subtract all probability strictly below 2: F(5)−F(1).

## q07-02

0(0.2)+1(0.5)+2(0.3)=1.1.

## q07-03

E[X²]=0+0.5+4(0.3)=1.7. V(X)=1.7−1.1²=0.49.

## q08-01

The success trial is included; X=1 means immediate success.

## q08-02

(0.75)²(0.25)=0.140625.

## q08-03

P(X≥3)=P(first two failures)=0.75²=0.5625.

## q09-01

With independent constant-p Bernoulli trials, this is NB(4,p).

## q09-02

Choose 2 positions among 4, then multiply by 0.5^4: 6/16=0.375.

## q09-03

Choose(3,1)(0.5)²(0.5)²=3/16=0.1875.

## q10-01

Without replacement, draws are dependent; hypergeometric counts successes in the sample.

## q10-02

Choose(4,2)choose(6,1)/choose(10,3)=36/120=0.3.

## q10-03

3(4/10)=1.2.

## q11-01

Standard deviation is the square root of variance, so sqrt(λ).

## q11-02

λ=6(0.5)=3.

## q11-03

2^0 exp(−2)/0! = exp(−2) ≈ 0.1353353.

## q12-01

A valid density needs nonnegativity and total area 1; height can exceed 1.

## q12-02

(5−3)/(8−2)=2/6=1/3.

## q12-03

E[X]=integral from 0 to 1 of 2x² dx=2/3.

## q13-01

β is scale. A rate parameter would be its reciprocal.

## q13-02

E[X]=αβ=3·2=6.

## q13-03

P(T>10)=exp(−10/5)=exp(−2) ≈ 0.1353353.

## q14-01

σ=sqrt(9)=3.

## q14-02

z=(16−10)/3=2.

## q14-03

For finite positive variance, at least 1−1/9=8/9≈88.89%. The 99.7% figure is a normal-model approximation.

Self-check: States at least 8/9 or 88.89%; Recognizes it is a lower bound; Does not claim 99.7% universally.

## q15-01

m″(0)=E[X²]; variance is m″(0)−m′(0)².

## q15-02

m′(t)=(1−t)^−2 and m″(t)=2(1−t)^−3, giving 2.

## q15-03

Γ(5)=4!=24.

## q16-01

For fixed x, sum p(x,y) over all y.

## q16-02

0.1+0.4=0.5.

## q16-03

p_X(0)p_Y(0)=0.5·0.3=0.15, not p(0,0)=0.2. Hence they are dependent.

Self-check: Computes p_X(0)=0.5 and p_Y(0)=0.3; Compares 0.2 with 0.15; Concludes dependence.

## q17-01

Covariance measures linear association; dependent variables can have covariance zero.

## q17-02

ρ=6/(2·4)=0.75.

## q17-03

Cov(3X+5,2Y−1)=3·2·Cov(X,Y)=12.

## q18-01

The linear association is strongly negative; it does not establish causation.

## q18-02

b=0.6·5/2=1.5.

## q18-03

(−0.8)²·100=64%. Enter 64 because the question requests a percent.

## q19-01

Unbiased means E[estimator]=parameter; individual estimates still vary.

## q19-02

15/sqrt(25)=15/5=3.

## q19-03

No. E[S²]=σ² does not establish E[S]=σ. Taking a square root inside an expectation changes the problem; S is generally biased.

Self-check: Answers no; Distinguishes E[S²] from E[S]²; Notes square root is nonlinear.

## q20-01

V(X−Y)=V(X)+(−1)²V(Y)=V(X)+V(Y).

## q20-02

2²·4+(−1)²·9=16+9=25.

## q20-03

V(mean)=81/9=9, so sd(mean)=3.
