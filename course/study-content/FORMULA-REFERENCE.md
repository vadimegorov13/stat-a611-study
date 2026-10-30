# Formula reference and method chooser

This reference summarizes the authored lessons. Each linked lesson supplies the original lecture/page references, assumptions, examples, and caveats. Symbols follow the supplied course notes unless explicitly explained.

## Start with the question

| What is being asked? | Method | Go to |
|---|---|---|
| Summarize observed data | Graphs, mean, median, standard deviation | [Data](lessons/01-data.md), [Summaries](lessons/02-summary.md) |
| Locate unusual observations | z-scores, course quartiles and fences | [Boxplots](lessons/03-boxplots.md) |
| Count possible selections | Decide order, replacement, and repetition | [Counting](lessons/05-counting.md) |
| Probability of “or,” “and,” or “given” | Addition, conditional multiplication, conditioning | [Rules](lessons/06-rules.md) |
| Equal probabilities on a finite specified support | Discrete uniform | [Uniform/geometric](lessons/08-geometric.md) |
| Trials through first success | Geometric | [Geometric](lessons/08-geometric.md) |
| Successes in fixed n independent constant-p trials | Binomial | [Binomial](lessons/09-binomial.md) |
| Trials through rth success | Negative binomial | [Negative binomial](lessons/09-binomial.md) |
| Successes in a finite sample without replacement | Hypergeometric | [Hypergeometric](lessons/10-hypergeometric.md) |
| Count in a fixed interval of a homogeneous Poisson process | Poisson | [Poisson](lessons/11-poisson.md) |
| Waiting time to first Poisson-process event | Exponential | [Gamma family](lessons/13-gamma.md) |
| Probability under an arbitrary continuous density | Integrate over the event or subtract CDFs | [Continuous](lessons/12-continuous.md) |
| Probability or percentile under a normal model | Standardize using standard deviation | [Normal](lessons/14-spread-rules.md) |
| Two variables jointly | Joint PMF/PDF, marginals, covariance | [Joint](lessons/16-joint.md), [Covariance](lessons/17-covariance.md) |
| Estimate a population parameter | Distinguish estimator, estimate, bias, and SE | [Estimation](lessons/19-estimation.md) |
| Probability involving a mean of normal observations | Use variance σ²/n, not σ² | [Sampling](lessons/20-sampling.md) |

## Descriptive statistics

$$\bar x=\frac1n\sum_i x_i,\qquad s^2=\frac{\sum_i(x_i-\bar x)^2}{n-1}=\frac{\sum_i x_i^2-n\bar x^2}{n-1},\qquad s=\sqrt{s^2}.$$

$$z=\frac{x-\mu}{\sigma},\quad x=\mu+z\sigma,\quad IQR=Q_3-Q_1.$$

Course quartiles: include the median in both halves for odd n. Inner fences: Q1−1.5IQR and Q3+1.5IQR. Outer fences: Q1−3IQR and Q3+3IQR. The course counts equality at a fence as an outlier. Whiskers are observed non-outlier extremes; five-number-summary endpoints are actual extremes.

## Counting and event probabilities

$$nP_k=\frac{n!}{(n-k)!},\qquad\binom nk=\frac{n!}{k!(n-k)!},\qquad\text{multiset arrangements}=\frac{n!}{n_1!\cdots n_r!}.$$

$$P(A^c)=1-P(A),\quad P(A\cup B)=P(A)+P(B)-P(A\cap B).$$

$$P(B\mid A)=\frac{P(A\cap B)}{P(A)},\quad P(A)>0;\qquad P(A\cap B)=P(A)P(B\mid A).$$

Independence: P(A∩B)=P(A)P(B). Disjointness: A∩B is empty. These are different relationships.

## Distribution formulas

Let q=1−p. All supports and parameter restrictions are part of the model.

| Model | PMF or PDF on support | Mean | Variance |
|---|---|---|---|
| Uniform on specified k distinct values x1,…,xk | 1/k at each value | Σxi/k | Σ(xi−μ)²/k |
| G(p), 0<p≤1; x=1,2,… | q^(x−1)p | 1/p | q/p² |
| B(n,p); x=0,…,n | choose(n,x)p^x q^(n−x) | np | npq |
| NB(r,p); x=r,r+1,… | choose(x−1,r−1)p^r q^(x−r) | r/p | rq/p² † |
| HG(N,M,n) | choose(M,x)choose(N−M,n−x)/choose(N,n) | nM/N | n(M/N)(1−M/N)(N−n)/(N−1) † |
| P(λ), λ>0; x=0,1,… | λ^x exp(−λ)/x! | λ | λ |
| U(a,b), a<b; a≤x≤b | 1/(b−a) | (a+b)/2 | (b−a)²/12 † |
| Γ(α,β), α,β>0; x>0 | x^(α−1) exp(−x/β)/(β^α Γ(α)) | αβ | αβ² |
| E(β), β>0; x>0 | exp(−x/β)/β | β | β² |
| χ²ν, ν>0 | Γ(ν/2,2) density | ν | 2ν |
| N(μ,σ²), σ>0; real x | exp(−(x−μ)²/(2σ²))/(σ√(2π)) | μ | σ² |

† Supplemental reference formulas not explicitly developed in the supplied lectures. Hypergeometric variance requires N>1; feasible x is max(0,n−(N−M)) through min(n,M). Geometric and negative-binomial formulas count total trials. At p=1 the distribution is degenerate at 1 or r, respectively; interpret formulas by that model rather than relying on an ambiguous 0^0 expression. At λ=0 a Poisson count is zero with certainty.

For a Poisson process with rate a and duration t: λ=at. Exponential waiting-time scale is β=1/a. Keep units consistent.

## CDFs and expectations

$$F(t)=P(X\le t).$$

Integer-valued X and integer a,b: P(a≤X≤b)=F(b)−F(a−1). Continuous X: P(a≤X≤b)=F(b)−F(a). General case: subtract the left limit F(a−).

$$E[h(X)]=\sum_xh(x)p(x)\ \text{or}\ \int h(x)f(x)\,dx.$$

$$V(X)=E[X^2]-E[X]^2,\quad E[aX+b]=aE[X]+b,\quad V(aX+b)=a^2V(X).$$

$$\Gamma(n)=(n-1)!,\qquad m_X(t)=E[e^{tX}],\qquad m_X^{(k)}(0)=E[X^k].$$

The MGF derivative rule assumes existence on a neighborhood of zero. Moments and variances require the relevant integrability.

## Normal calculations and spread

$$Z=\frac{X-\mu}{\sigma},\quad P(X\le a)=\Phi\left(\frac{a-\mu}{\sigma}\right),\quad x_q=\mu+\sigma\Phi^{-1}(q).$$

Chebyshev for finite positive variance, k>1: at least 1−1/k² within k standard deviations. Approximately normal models: about 68%, 95%, 99.7% within 1, 2, 3 standard deviations. These are not interchangeable claims.

## Joint distributions and regression

$$p_X(x)=\sum_yp(x,y)\ \text{or}\ \int p(x,y)\,dy.$$

$$\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y],\qquad\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}.$$

$$R=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum_i(x_i-\bar x)^2\sum_i(y_i-\bar y)^2}},\quad b=R\frac{s_y}{s_x},\quad a=\bar y-b\bar x.$$

Least-squares fit: ŷ=a+bx. For simple regression with an intercept, R² is the fraction of observed y variation explained by the fit. It does not prove causation.

## Estimation and sampling

$$\operatorname{Bias}(\hat\theta)=E[\hat\theta]-\theta.$$

$$E[\bar X]=\mu,\quad V(\bar X)=\sigma^2/n,\quad SE(\bar X)=\sigma/\sqrt n.$$

$$E[S^2]=\sigma^2\quad\text{for IID finite-variance samples, }n>1;\qquad E[S]\ne\sigma\text{ in general}.$$

$$V(aX+bY)=a^2V(X)+b^2V(Y)+2ab\operatorname{Cov}(X,Y).$$

For independent normal Xi, the linear combination is normal with mean Σaiμi and variance Σai²σi², except a zero-variance combination is constant. In particular, an IID normal sample gives X̄~N(μ,σ²/n). The supplied notes have not yet developed a CLT for non-normal observations.
