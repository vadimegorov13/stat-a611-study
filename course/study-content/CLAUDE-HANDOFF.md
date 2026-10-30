# Import instructions for Claude Code

Build the local statistics study app described in the user's app prompt using this existing content pack. Read README.md, SOURCE-ISSUES.md, and COVERAGE.md first. Do not replace this course-specific content with generic statistics placeholders.

## Data contract

- `course.json`: `lessons[]` contains id, title, course_section, prerequisites, sources, body_markdown, origin, search_url, and path. IDs are stable. Prerequisites link to other lesson IDs. Each source reference has a source_id and an array of one-based PDF pages.
- `source-manifest.json`: resolve source_id against sources[].id. PDF paths are relative to the original course workspace, not to study-content/. Preserve the files. SHA-256 hashes identify the exact versions read.
- `question-bank.json`: questions have id, lesson_id, type, prompt, answer, hints, solution, source_refs, origin, difficulty, related_lessons, and grading information where applicable. Multiple-choice answers are **zero-based** option indices. Numeric answers are numbers; use their tolerance metadata. Free-response answers are rubric-item arrays and must use honest self-assessment, not pretend automatic AI grading.
- `glossary.json`: each term has definition and lesson_id.
- `sources/*.txt`: extracted source text with `=== PDF PAGE n ===` delimiters. Useful for search snippets and matching PDF pages; not clean math typesetting.

## Rendering and navigation

Render Markdown with inline and display math. Lesson body links such as `03-boxplots.md` resolve against the lesson directory. The formula-reference link `../FORMULA-REFERENCE.md` is a pack document. Intercept these links and open the corresponding internal document in the app's reference pane. Do not treat lesson paths as arbitrary external URLs.

Show source chips for each referenced PDF page. Multiple page references should remain individually selectable, not all point only to the first page. Load the local PDF in the reference pane and navigate to the requested page. The Markdown links are fallback navigation, not the full app interaction contract.

Label web URLs as topic searches, not verified references. They are ordinary external search links; no web resources were used to author this pack. Preserve internal/external distinction and explicit external-open fallback for sites that block embedding.

## Teaching and exercise behavior

Show objectives, explanation, examples, and source references. Keep question solutions and answer keys hidden in the normal practice UI until the learner submits or reveals them. Retain editable scratch work and independent attempt history. Distinguish hints/reveals from unaided performance. All 60 questions are original study practice, not instructor-assigned exercises.

Preserve source corrections, course conventions, supplemental labels, and coverage boundaries. Do not mark missing Chapters 8 or full Chapter 11 as learned content. Method of moments and maximum likelihood are introduction-only. Later lecture files can extend the pack without changing existing IDs.

Course-specific quiz requirements: inclusive outlier fences; median included in both halves for odd n; geometric/NB total-trial support; gamma/exponential scale; normal variance parameter. Do not use numerical equality checks that reject sensible rounding. Numeric probabilities normally expect decimals, but the R² question explicitly requests a percentage (64, not 0.64).

Keep user-written notes separate from authored course material, for example `study-app/user-data/notes/`. The original user request requires Markdown notes on disk, visible external edits, revision history, and conflict-safe autosave. Editing a personal note must not overwrite these course files.

## Acceptance checks

Load all 20 lessons and all 60 questions. Check prerequisites resolve, source IDs/pages resolve, math renders, lesson links open in a side pane, and search covers lessons, terms, questions, and personal notes. Reuse `validate_content.py` to verify this pack before import. The content validation does not substitute for testing the website's UI and data persistence.
