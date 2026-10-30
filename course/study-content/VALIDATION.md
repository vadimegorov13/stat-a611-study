# Content validation report

- Passed: 15 original PDF files present with unchanged SHA-256 hashes; 123 page-delimited source pages.
- Passed: 20 unique lessons with valid prerequisite IDs and source-page references.
- Passed: 60 unique questions, exactly three per lesson (20 multiple-choice, 34 numeric, six rubric-based).
- Passed: all 34 numeric answer keys independently recomputed, including enumeration of card/token-style samples and Bernoulli sequences.
- Passed: 231 local Markdown link targets resolve, including lesson links and original PDF files.
- Passed: glossary lesson IDs, multiple-choice option indices, and free-response rubric structure.
- Passed: representative density integrals, lecture joint-table marginals, and maximum-of-two-dice normalization.
- Manually checked: 20 conceptual multiple-choice keys and six free-response rubrics against the authored lessons; selected PDF pages visually checked for formulas and source inconsistencies.

Run again from any directory with `python3 /absolute/path/to/study-content/validate_content.py`.

These checks do not validate a future website, external search-result content, or all possible interpretations of an instructor's exam scope. The formula reference marks supplemental formulas. See SOURCE-ISSUES.md for source corrections and reading-method limits.
