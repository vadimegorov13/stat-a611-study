# Source issues, conventions, and coverage limits

All 15 PDFs (123 pages) were read through extracted text. Nine selected pages were additionally rendered and inspected to verify mathematical notation, tables, and suspected inconsistencies. This is not a claim that every diagram on every page received visual inspection. The extracted text is a search aid; formulas may contain PDF extraction artifacts. Use authored Markdown/JSON for teaching content and the original PDF for source display.

## Confirmed or directly identified issues

1. **August 24, p. 1, chapter outline:** labels Chapter 4 “Bivariate distributions,” while the actual September 28–October 5 lectures cover continuous univariate distributions in Chapter 4. It also labels a regression entry “Chapter 9” while citing Chapter 11 sections. The content follows the actual lecture sequence and identifies regression as a preview of Chapter 11.
2. **August 24, pp. 3–4, stem-and-leaf data:** the developed p. 4 stem display lists 34 leaves, but the histogram table lists 35 observations, including one in [0.07,0.08). The stem row 07 is blank. Preserve the frequency table as given; do not silently fabricate a missing leaf or claim the displays match exactly. Page 3 is explicitly schematic/partial.
3. **August 31, p. 3–4, outlier equality:** the notes explicitly use “at least” 1.5 IQR and classify the value 1 exactly at the lower inner fence as a mild outlier. This is a course convention. Automatic exercises must honor equality rather than import a strict-inequality software default.
4. **August 31, p. 5, Site I:** the notes themselves flag an error in a textbook stem-and-leaf plot and recommend confirming its ordering/key with the instructor. The provided 23-value ordered list is internally usable; the textbook was not supplied or independently checked.
5. **September 2, p. 1, five-number summary:** writes {P1,Q1,Q2,Q3,P2}, but P1/P2 are non-outlier whisker endpoints. August 31 p. 3 explicitly defines the summary with actual dataset extremes, and p. 5 uses an outlier as its minimum. The lessons use actual minimum and maximum and explain this discrepancy.
6. **September 2, p. 2, probability zero:** equates probability zero with impossibility in its finite examples. Generalize cautiously: continuous singleton events have probability zero without being logically impossible. Likewise probability one means almost sure in a general model, not necessarily every possible outcome.
7. **August 26 p. 6 / August 31 p. 1, three-standard-deviation language:** “almost all” is informal. It must not become a universal 99.7% claim. October 5 pp. 5–6 distinguishes Chebyshev’s bound from the normal empirical rule.
8. **September 28, p. 4, definite-integral arithmetic:** the final probability 0.1875 is correct. The printed intermediate values −0.1875 and −0.375 are not the values of 6.25x²−1.25x at 0.3 and 0.2. Correct values are 0.1875 and 0. The independently presented CDF calculation on p. 6 is consistent with 0.1875.
9. **October 7, p. 7, covariance unit conversion:** the illustration changes covariance 12.51 to 0.36 for Celsius-to-Fahrenheit conversion. If both variables convert as F=(9/5)C+32, covariance scales by (9/5)², giving 40.5324, not 0.36. The October 12 p. 2 centimeter-to-inch example uses the correct scaling rule. The questionable numerical illustration is not reproduced as a teaching example.
10. **October 12 pp. 3,5,7, correlation-strength labels:** weak/moderate/strong thresholds are classroom heuristics, not universal standards. R measures linear association; R² interpretation here assumes ordinary simple least-squares regression with an intercept.
11. **October 14 p. 5, estimation-method comparison:** MLE and method of moments are named, but no method is actually worked through. The general preference statement does not prove that every MLE has smaller bias or variance. The pack marks these as introduction only.
12. **October 14 p. 6, finishing times:** the notes end after specifying the individual normal model N(61,81). The sample-of-nine calculation in lesson 20 is explicitly an authored extension.

## Course conventions preserved

- For odd n, include the median in both quartile halves.
- Sample variance divides by n−1; sample standard deviation itself is not generally unbiased.
- Geometric and negative binomial count total trials including the final success.
- Gamma and exponential use scale β, not rate β.
- Normal notation N(μ,σ²) uses variance as the second parameter.
- The notation U(k) for a discrete uniform distribution also needs its actual support.
- The notation p is used for both PMFs and PDFs in the source notes; authored lessons occasionally use f for a PDF to avoid confusion.

## What is not available yet

The supplied notes end October 14. They contain descriptive statistics; counting and probability rules; discrete and continuous distributions; joint distributions; correlation and a least-squares preview; point estimation; and initial exact normal sampling-distribution results.

They do not develop confidence intervals, hypothesis testing, a central limit theorem, detailed method-of-moments or maximum-likelihood procedures, or the later full regression treatment. These must not appear as “covered by your notes.” Section 2.4 is explicitly skipped on September 16 p. 1, and Section 3.9 is explicitly skipped on September 23 p. 8.

The syllabus schedules later material and a comprehensive final. Therefore this pack covers all currently supplied notes, not the full final-exam syllabus.
