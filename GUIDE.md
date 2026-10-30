# User guide

The details behind the [README](README.md): where your data is saved, how the app is laid out, shortcuts, practice rules, and tests.

## Where your data lives

| What | Location |
|---|---|
| Personal notes (Markdown + YAML frontmatter) | `user-data/notes/<note-id>.md` |
| Note revision history | `user-data/note-revisions/<note-id>/` |
| Deleted notes (recoverable) | `user-data/trash/` |
| Progress: attempts, flags, studied marks, exam checklist | `user-data/progress.json` |
| Scratch work for exercises | `user-data/scratch.json` |
| Backups | `user-data/backups/<timestamp>-…/` |

Use **Progress → Back up notes & progress now** for a folder backup. **Export as JSON** downloads a single file. **Reset progress** asks you to type `RESET PROGRESS` and writes a backup first. It never deletes notes.

Layout, open reference tabs, and scroll positions are browser conveniences kept in `localStorage`. Clearing site data resets only the layout.

## Using it

- **Left:** the exam countdown, then topics grouped by unit, in prerequisite order, or by lecture date. Also links to practice, notes, progress, and the reference documents.
- **Centre:** the lesson or practice workspace.
- **Right:** the reference pane. It holds tabs with their own back/forward history for related lessons, cited PDF pages, glossary terms, notes, and web pages.

Internal links open in the side pane by default, so your place in the main view is kept. ⌘/Ctrl/Alt-click opens the other way. You can change the default in the top bar.

| Shortcut | Action |
|---|---|
| ⌘/Ctrl K | Search everything |
| ⌘/Ctrl J | Quick reference: formulas, notation, saved items, notes, charts, tips |
| ⌘/Ctrl B / ⌘/Ctrl Alt B | Toggle left sidebar / reference pane |
| ⌘/Ctrl Shift F | Study (focus) mode; Esc leaves |
| Alt [ / Alt ] | Back / forward in the reference pane |
| ? | Shortcut list |

Drag the dividers to resize, or focus a divider and use the arrow keys. Use **⋯ → Reset layout** to return to the defaults.

**Quick reference (∑ button, bottom right, on every screen; ⌘/Ctrl J).** One searchable list of every formula (study guides, lesson text, formula reference), the course notation with the lecture page where each symbol appears, a distribution summary table, glossary terms, your **Saved** items, your notes, the charts, and study tips. Star (☆) anything to save it; stars are stored in `progress.json` and also show on the lessons' key formulas. **Full page ↗** opens the same list at `#/reference`.

**Visualize** (sidebar, or "See it" links on lessons):
- **Describe a dataset:** histogram and ogive, box plot, dot plot, and stem-and-leaf, plus a summary-statistics panel. Data can be real datasets transcribed from your lectures (Site I/II, Example 6.4.2, the Aug 24 table, …), generated data in a chosen shape, or numbers you paste. The box plot shows each construction step with the course rules.
- **Distribution explorer:** move the parameters of any course distribution, shade P(X ≤ a), P(a ≤ X ≤ b), and so on, and see the F(b) − F(a − 1) or Φ working.
- **Scatterplot & correlation, Sampling distribution of x̄, Bar graph & pie chart.**

**Exam countdown:** top of the sidebar, counting down to the syllabus date (Wed Dec 9, 1:00–3:45 PM), read in this computer's time zone. Confirm the date with the instructor.

**Tips (💡 in the top bar):** about two dozen study tips. General strategies (retrieval practice, spacing, interleaving, worked examples, …) cite the research they summarise; course tips restate the conventions that cost points. Home shows one tip a day.

**Content labels:** *Instructor PDF* means the original notes. *Course-notes synthesis* means the lesson text from the content pack. *Study aid (supplemental)* means summaries added by this app. *Generated practice* means newly authored questions. *External* means outside links. *My note* means your files. Search links are labelled as web searches, not verified sources.

**Practice:** topic quizzes, mixed practice, timed or untimed exam practice (feedback held until the end), and a review queue. The queue holds incorrect answers, solutions viewed first, answers solved only with hints, unassessed free responses, and flagged questions. First-try unaided answers are tracked separately from answers given with hints or after viewing a solution. The app gives counts, not a "mastery score".

Numeric answers accept decimals, `25%`, fractions (`3/16`), and expressions (`exp(-2)`, `15/sqrt(25)`). Sensible rounding is accepted. Only the R² question expects a percent (enter `64`).

## Editing notes with ChatGPT or Codex

1. Open a note and click **Copy context**. Select text first to include it. This copies the note ID, absolute file path, linked topics, and the selection.
2. Paste it into ChatGPT/Codex with your request.
3. An assistant **with access to this folder** can edit the Markdown file directly; see `AGENTS.md`. Examples are Codex or Claude Code running in this directory. A regular ChatGPT chat cannot see your files, so paste its answer into the note yourself.
4. The running app notices the change within a few seconds. It shows the new text with a before/after diff and keeps the previous version in **History**. If you had unsaved typing at that moment, you choose which version to keep; nothing is overwritten silently.

## Verification

```sh
npm run verify:content   # import checks, the pack's validator (on a temp copy), independent answer-key recomputation
npm test                 # unit tests: answer checking, note store (conflicts, external edits, revisions), API, content links
npm run test:e2e         # browser tests (Playwright/Chromium) against a throwaway data folder
```

The browser tests start their own server on port 4700 with data in your system temp folder, so they never touch `user-data/`. If Chromium is missing, run `npx playwright install chromium`.

See `CONTENT-REVIEW.md` for source-extraction problems and content that needs review.
