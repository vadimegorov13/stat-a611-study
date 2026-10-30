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

**Next:** [Gamma and exponential families](13-gamma.md). Section 3.9 is explicitly skipped in the September 23 notes.

## Source references
- [lecture-09-23 PDF p. 7, 8](../../Notes/STAT_611_Notes_09-23-2026.pdf#page=7)
- [lecture-09-28 PDF p. 3](../../Notes/STAT_611_Notes_09-28-2026.pdf#page=3)
- [lecture-09-30 PDF p. 7](../../Notes/STAT_611_Notes_09-30-2026.pdf#page=7)

[Web search for this topic](https://www.google.com/search?q=statistics%20Poisson%20counts%20and%20time%20intervals) — external search, not a verified source.
