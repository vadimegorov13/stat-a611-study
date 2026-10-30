# Content review record

This file records source-extraction problems and content that still needs a human check. The full structured list, with PDF page links, is in the app under **Source issues & review**. Its source is `content/review-items.json`.

## Source of truth and provenance

- The app imports `course/study-content/` without changing it. This covers the 20 lessons, 60 questions, glossary, manifest, and extracted text. Every existing ID is preserved.
- All 15 lecture PDFs are unchanged. Their SHA-256 hashes match `source-manifest.json`, which `npm run verify:content` checks.
- **Added by this app, all labelled "supplemental" in the UI:**
  - `content/lesson-guides.json`: objectives, recognition cues, key formulas, common mistakes, and related lessons for each lesson.
  - `content/question-extras.json`: a second hint, step-by-step solution, and reasoning for each pack question.
  - `content/supplemental-questions.json`: 60 new practice questions, 3 per lesson. With these, every lesson has at least 3 conceptual and 3 calculation/interpretation questions.
  - `content/notation.json`: 47 notation entries and an 11-row distribution summary. Symbols marked "lecture" cite the first lecture page that uses them; a unit test checks each one against that page's extracted text. Φ, binomial-coefficient notation, X/x, p(x), X̄ and S² are marked as course-notes-synthesis notation, because the lectures don't print them in a findable form. Lectures write V[X] and sd[X]; lessons write V(X). Both appear. The distribution rows mirror FORMULA-REFERENCE.md, including its † flags.
  - `content/datasets.json`: real data transcribed from the lectures for the Visualize tools: Site I, Site II, Example 6.4.2, the Aug 24 stem-and-leaf values and frequency table, quartile examples, and the party-affiliation counts. `tests/unit/stats.test.ts` recomputes the lecture's own quartiles, fences, outlier classes, whiskers, five-number summaries and stem-and-leaf rows from these values. The Aug 24 stem-and-leaf data keeps its 34 printed leaves; the missing 35th value is not invented. Site I carries the lecture's warning about the textbook plot.
  - `content/tips.json`: 24 study tips. General strategies summarise Dunlosky et al. (2013), the Learning Scientists, the GAISE College Report, Rohrer's interleaving research, and a worked-examples meta-analysis. All links were checked on 2026-10-23. Course tips restate lesson conventions.
  - `content/exam.json` → `final`: the syllabus exam time, used by the countdown. It is read as local time on this computer.
  - Generated ("fake") datasets in Visualize are random, seeded, and always labelled as generated.
- All lesson prose comes from the content pack. It is an AI-authored synthesis of the notes, not instructor text. Only the PDFs are instructor material.

## Verification performed

- `scripts/verify_answers.py` recomputes all 56 numeric keys (34 from the pack, 22 supplemental) by independent methods. These are enumeration, exact fractions, Simpson integration, numerical differentiation, least squares on a constructed dataset, and one seeded simulation. It also checks computable multiple-choice keys.
- `tests/unit/content.test.ts` checks the following:
  - Every numeric key passes the app's own checker, both exactly and rounded to 4 significant figures.
  - Every link in the lessons and pack documents resolves.
  - Every question has at least 2 hints and a step-by-step solution.
- The setups cited in supplemental prompts were matched against the extracted lecture text:
  - Sep 16 p. 3: maximum of two dice
  - Sep 23 p. 8: ER arrivals, P(6.9)
  - Sep 9 p. 6: 15 of 20 acceptable blocks
  - Sep 28 p. 4: the 12.5x − 1.25 density
  - Oct 7 p. 3: weld/bolt table
  - Aug 24 pp. 4–5: histogram counts
  - Oct 14 p. 6: N(61, 81) finishing times

## Extraction problems

- The extracted text in `course/study-content/sources/` uses Unicode math-italic glyphs. It also splits fractions and subscripts across lines and renders x̄ as "¯x". The app normalizes it with NFKC for search, but **snippets from lecture PDFs can still look garbled**. Open the PDF page (one click from any result) for the exact notation.
- Only selected pages were visually inspected by the content pack (9 pages, listed in `course/study-content/SOURCE-ISSUES.md`). Diagrams and handwritten-style figures on other pages have not been checked against the lesson text.

## Remaining uncertainties (please review)

1. **Exam scope.** The syllabus describes a comprehensive final on Wed Dec 9, 2026, 1:00–3:45 PM, open book, with a calculator. The notes stop at Oct 14. Chapters 8 and 11, confidence intervals, hypothesis tests, the CLT, and full regression are not covered. The exam checklist defaults to "all supplied topics" until you tick a subset.
2. **Source discrepancies kept as flagged, not silently fixed in the PDFs:**
   - Aug 24 outline chapter labels.
   - Aug 24 stem-and-leaf display has 34 leaves but the table has 35 observations.
   - Sep 2 five-number summary uses whisker endpoints.
   - Sep 28 p. 4 has intermediate integral values that are off; the final answer is correct.
   - Oct 7 p. 7 covariance unit conversion.
3. **Instructor confirmation suggested:**
   - The textbook stem-and-leaf plot for Site I (Aug 31 p. 5).
   - Whether AI-authored preparation material is acceptable under the syllabus AI policy. The syllabus bans AI on assignments and tests; it does not address study aids.
4. **Introduction-only topics.** Method of moments and MLE (Oct 14 p. 5) have no practice questions, because the notes do not work an example.
5. **Assigned textbook exercises** are referenced in the notes but the textbook isn't supplied, so they were not reconstructed.
6. **Sampling simulation beyond the notes.** For non-normal populations, the x̄ tool overlays a normal curve and labels it a central-limit approximation. The CLT is not in the supplied notes yet.
7. **External resources.** Five URLs were verified on 2026-10-22 (HTTP 200, title checked). OpenIntro and Khan Academy were left out because they blocked automated checks. Per-topic search links are unverified by design and are labelled as web searches.
