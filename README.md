# STAT A611 Study

A study website for **STAT A611 General Statistics for Data Science** (Fall 2026). It runs on your own computer and works offline.

- **Course path:** 20 lessons built from the lecture notes, each linked to its PDF pages
- **Practice:** 120 practice questions with hints and solutions, quizzes, timed exam practice and a review queue
- **Charts:** interactive histograms, box plots, distributions and more
- **Lookup:** a formula and notation quick reference, plus search across everything
- **Your notes:** saved as plain Markdown files

## How to run it

**1. Install Node.js (one time).** Download the **LTS** version from [nodejs.org](https://nodejs.org) and install it. To check it worked, open a terminal and run `node -v`; it should print `v20` or higher.

**2. Download this repo (one time).**

```sh
git clone https://github.com/<your-username>/stat-a611-study.git
cd stat-a611-study
npm install
```

**3. Start it (every time).**

```sh
npm start
```

**4. Open http://127.0.0.1:4611 in your browser.**

To stop it, press `Ctrl+C` in the terminal. Next time, just `cd` into the folder and run `npm start` again.

## Tips

| Shortcut | Does |
|---|---|
| ⌘/Ctrl K | Search everything |
| ⌘/Ctrl J | Formulas, notation and tips |
| ⌘/Ctrl Shift F | Focus mode |
| ? | All shortcuts |

- **Your notes and progress** are saved in `user-data/`. Back them up from **Progress → Back up notes & progress now**.
- **Port already in use?** The app is probably still running in another terminal. Close that one, or use another port: `STUDY_APP_PORT=4620 npm start`.
- **Updating:** run `git pull`, then `npm install`, then `npm start`.

## What's in here

```
course/        lecture PDFs, syllabus and the course content pack (read-only)
content/       extra questions, tips, datasets and notation added by the app
src/ server/   the website (React) and its local server (Express)
user-data/     your notes and progress
```

More detail is in the [user guide](GUIDE.md): data locations, the layout, practice rules, editing notes with an AI assistant, and running the tests.

## Disclaimer

This is an unofficial study aid. The lessons and practice questions are AI-assisted summaries of the lecture notes. If something disagrees with the notes or the instructor, trust them. The exam date comes from the syllabus, so confirm it in class. The syllabus doesn't allow AI on assignments or tests; this is for studying only.
