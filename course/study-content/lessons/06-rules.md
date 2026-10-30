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
- [lecture-09-14 PDF p. 1, 2, 3, 4, 5, 6, 7, 8, 9](../../Notes/STAT_611_Notes_09-14-2026.pdf#page=1)
- [lecture-09-16 PDF p. 1, 2](../../Notes/STAT_611_Notes_09-16-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Probability%20rules%2C%20conditioning%2C%20and%20independence) — external search, not a verified source.
