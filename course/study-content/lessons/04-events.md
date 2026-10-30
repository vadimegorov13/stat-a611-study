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

**Next:** [Counting](05-counting.md), [Probability rules](06-rules.md).

## Source references
- [lecture-09-02 PDF p. 1, 2, 3, 4, 5](../../Notes/STAT_611_Notes_09-02-2026.pdf#page=1)
- [lecture-09-09 PDF p. 1, 2](../../Notes/STAT_611_Notes_09-09-2026.pdf#page=1)

[Web search for this topic](https://www.google.com/search?q=statistics%20Sample%20spaces%2C%20events%2C%20and%20set%20operations) — external search, not a verified source.
