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

For sample variance unbiasedness, use $E[X_i^2]=\sigma^2+\mu^2$ and $E[\bar X^2]=\sigma^2/n+\mu^2$; substitute into the computational sample-variance formula. See [estimation](19-estimation.md).

**Study approach:** explain why each algebraic step is legal. The notes include derivations, so a formula-only study plan would omit substantial material.

## Source references
- [lecture-09-16 PDF p. 7, 8](../../Notes/STAT_611_Notes_09-16-2026.pdf#page=7)
- [lecture-09-21 PDF p. 4, 6](../../Notes/STAT_611_Notes_09-21-2026.pdf#page=4)
- [lecture-09-30 PDF p. 3, 4, 5](../../Notes/STAT_611_Notes_09-30-2026.pdf#page=3)
- [lecture-10-07 PDF p. 6, 7](../../Notes/STAT_611_Notes_10-07-2026.pdf#page=6)
- [lecture-10-14 PDF p. 1, 3, 4, 5](../../Notes/STAT_611_Notes_10-14-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Moment-generating%20functions%20and%20proof%20techniques) — external search, not a verified source.
