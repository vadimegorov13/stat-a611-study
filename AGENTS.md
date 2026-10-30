# Notes for coding assistants (Codex, Claude Code, …)

This folder is a local study app. The user may ask you to read, clarify, or edit one of their **personal notes**. Usually they paste the "Copy context" block from the app, which gives the note ID and absolute file path.

## Where things live

- **Personal notes:** `user-data/notes/<id>.md`, with one Markdown file per note. You may edit these.
- **Note history:** `user-data/note-revisions/<id>/`. The app writes this; do not edit it.
- **Progress, scratch work, backups, and trash:** `user-data/` (`progress.json`, `scratch.json`, `backups/`, `trash/`). Do not edit these unless asked.
- **Course content (read-only):** `course/study-content/`. This includes `course.json` with lessons, `question-bank.json`, `glossary.json`, `source-manifest.json`, `sources/*.txt` (extracted PDF text per page), and the lesson Markdown files.
- **App supplements (authored content):** `content/` (`lesson-guides.json`, `question-extras.json`, `supplemental-questions.json`, `review-items.json`, `resources.json`, `exam.json`, `notation.json`, `datasets.json`, `tips.json`).
- **Saved (starred) quick-reference items:** `progress.json` → `saved`, keyed by item id (`n:<symbol>`, `d:<distribution>`, `t:<term>`, `f:<lesson>:<label>` …).
- **Original lecture PDFs:** `course/Notes/`. Never modify them.

Do not edit `course/study-content/` or `course/Notes/` when asked to edit a note.

## Finding a note

- **By ID:** open `user-data/notes/<id>.md`. IDs look like `n-20261022-binomial-questions-3f2a`.
- **By title:** `grep -l '^title: .*Binomial' user-data/notes/*.md`.
- While the app runs, you can also use `curl -s 'http://127.0.0.1:4611/api/notes/find?q=binomial'`.

The ID's slug comes from the note's first title and never changes. Renaming a note changes only `title:`.

## Note format

```markdown
---
id: n-20261022-binomial-questions-3f2a
title: Binomial vs hypergeometric
topics:
  - 09-binomial
  - 10-hypergeometric
tags:
  - exam
created: 2026-10-22T20:31:12.000Z
updated: 2026-10-22T20:45:03.000Z
---

Body in Markdown. Math: $\binom{n}{x}p^x(1-p)^{n-x}$ inline, $$…$$ on its own line.
Links: [binomial lesson](study://lesson/09-binomial), [question](study://question/q09-02),
[Sep 23 notes p. 6](study://source/lecture-09-23/6), [formula reference](study://doc/formula-reference),
[box plot of Site II](study://viz/describe/boxplot), [binomial explorer](study://viz/distributions/binomial).
```

Follow these rules when editing:

- Keep the frontmatter block. Keep `id` exactly as it is, matching the file name, and keep `created`.
- Do not rename or move the file.
- You may change `title`, `topics` (lesson IDs from `course/study-content/course.json`), `tags`, and the body.
- You may set `updated` to the current ISO time; otherwise the app updates it on its next save.
- Extra frontmatter keys are preserved by the app.
- Write the whole file in one operation; an atomic write via a temp file plus rename is ideal. The app reads only complete files, but partial writes can produce a transient "external change".
- Lesson IDs: `01-data` … `20-sampling`. Source IDs: `lecture-MM-DD` (see `course/study-content/source-manifest.json`), with one-based PDF pages.
- Course conventions matter: odd-n quartiles include the median in both halves; outlier fences are inclusive; geometric/negative binomial count total trials; gamma/exponential use scale β; and N(μ, σ²) uses variance.

## How the app detects edits and handles conflicts

- The server watches `user-data/notes/` with `fs.watch` and also polls every 1.5 s. The browser gets change events and also polls every 4 s.
- Each note's version is the SHA-256 of the whole file. Every save from the app sends the version it was based on, and the server refuses a stale save with HTTP 409.
- When a note changes on disk:
  - If the open editor has no unsaved typing, the app loads the new version. It shows "Updated from disk — the file was changed outside this app" with a before/after diff.
  - If the user was typing, the app shows a conflict view: keep their draft, use the disk version, or merge by hand. The unsaved draft is also stored as a `conflict-draft` revision.
- Every version the app writes, and every external version it detects, is kept in `user-data/note-revisions/<id>/`. Autosaves within 10 minutes are combined into one revision. The user can diff and restore any revision from **History**.
- The app labels changes as "external" because it cannot know who made them.

## Running and verifying

```sh
npm install
npm start                 # http://127.0.0.1:4611 (builds, then serves)
npm run dev               # hot reload on http://127.0.0.1:5173
npm run verify:content    # content import + pack validator + independent answer checks
npm test                  # unit tests
npm run test:e2e          # Playwright browser tests (uses a temp data dir, port 4700)
```

When changing course content, keep existing IDs stable and add new lessons and questions with new IDs. Then run `npm run verify:content && npm test`.
