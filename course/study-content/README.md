# STAT A611 website content pack

This is completed learning content for a future local study app, not the app itself. It is based on all 15 lecture PDFs in `../Notes/`, totaling 123 pages, plus the supplied syllabus. Coverage runs August 24–October 14, 2026. The original course files were preserved.

## Start here

- [Study guide](STUDY-GUIDE.md): 20 linked lessons with explanations, formulas, worked examples, common mistakes, and source/page references.
- [Practice workbook](PRACTICE-WORKBOOK.md): 60 original questions, followed by answers and explanations.
- [Formula reference](FORMULA-REFERENCE.md): method chooser and formulas, with assumptions and course conventions.
- [Coverage map](COVERAGE.md): every supplied lecture mapped to lessons, plus remaining syllabus coverage.
- [Source issues](SOURCE-ISSUES.md): corrections, ambiguities, rounding conventions, and limitations.
- [Claude handoff](CLAUDE-HANDOFF.md): how to import this content into the website.

## App-ready data

`course.json` contains the 20 lessons, stable IDs, prerequisite IDs, Markdown bodies, source IDs/page arrays, and topic search URLs. `question-bank.json` contains 60 exercises: 20 multiple-choice, 34 numeric, and 6 rubric-based free-response questions. `source-manifest.json` records filenames, dates, page counts, and hashes. `glossary.json` supplies searchable definitions linked to lessons.

The 20 individual Markdown lessons are in `lessons/`. `sources/` contains page-delimited extracted text for every PDF and the extracted syllabus. These text files are for retrieval, not direct math rendering; PDF extraction alters mathematical glyphs and layout.

## Provenance and scope

All lesson prose is an AI-authored synthesis, not an instructor-approved transcript. Lecture examples are labeled. New examples, explanatory extensions, and practice questions are distinguished from the course's assigned exercises. Supplemental formulas in the reference are marked. Each question's source references identify the concepts being practiced, not a claim that the question occurs verbatim in the lecture.

The syllabus lists a comprehensive, open-book final with a calculator permitted and schedules it for **Wednesday, December 9, 2026, 1:00–3:45 PM**. This is the schedule recorded in the supplied document, not a live confirmation. The final exam grade is listed as the final course grade. The supplied notes do not yet cover the entire planned semester.

The syllabus says generative AI must not be used on assignments or tests. This pack is preparation material with newly authored practice; it is not permission to use AI or this app during the exam. The syllabus does not explicitly resolve whether an AI-generated preparation aid is permitted, so clarify that with the instructor if needed.

## Suggested study sequence

1. Read a lesson and explain its central idea in your own words.
2. Work its three questions before viewing solutions.
3. Record the reason for each mistake: model selection, notation, algebra, endpoint handling, or interpretation.
4. Revisit linked prerequisites where the mistake began.
5. Mix questions across topics, especially distribution selection and sample mean versus individual observation.
6. Add later lecture notes before treating this as comprehensive final preparation.

## Verification

See [validation report](VALIDATION.md). The content structure, internal links, source page bounds, question coverage, and 34 numeric answer keys were checked programmatically. Selected source pages were visually inspected. No website has been built or browser-tested in this content-preparation task.
