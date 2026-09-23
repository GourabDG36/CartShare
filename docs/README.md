# CartShare — Project Documentation

Everything about how CartShare was built, what went wrong, how it was
fixed and tested, and what could be improved. Use it as the source for the
project report and the presentation.

> The app itself lives in `../CartShare/` (the folder you submit and push to
> GitHub). This `docs/` folder and `../tests/` sit **next to** it, so the
> submission keeps the required `css/`, `js/`, `assets/` structure exactly.

## Files

| File | What it covers | Use it for |
|---|---|---|
| [01-requirements-checklist.md](01-requirements-checklist.md) | Every requirement in the brief, and how and where it is met | Report "Objectives" section; proving completeness |
| [02-architecture.md](02-architecture.md) | File structure, data model, how tabs sync (with diagrams) | Report "Design" section; technical slides |
| [03-development-log.md](03-development-log.md) | Timeline of every phase and what changed | Report "Methodology / Development process" |
| [04-bug-report.md](04-bug-report.md) | Every bug found: symptom, root cause, fix, how verified | Report "Challenges"; Q&A |
| [05-testing-report.md](05-testing-report.md) | Automated browser tests (70 checks) + manual checklist | Report "Testing" section |
| [06-design-decisions.md](06-design-decisions.md) | Why each technical choice was made, and the trade-offs | Report "Design rationale"; Q&A |
| [07-limitations-and-improvements.md](07-limitations-and-improvements.md) | Honest limits and a prioritised roadmap | Report "Limitations / Future scope" |
| [presentation/slide-outline.md](presentation/slide-outline.md) | Slide-by-slide outline with speaker points | Building the deck |
| [presentation/demo-script-and-qa.md](presentation/demo-script-and-qa.md) | Live-demo script, backup plan, likely questions with answers | Rehearsing |
| [screenshots/](screenshots/) | 12 screenshots + receipt PDF with clean demo data | Report figures and slides |

## Keeping it current

- After changing the app, run the tests (`cd ..\tests` → `npm test`) and regenerate the
  screenshots (`npm run screenshots`) so the report always matches the real app.
- Add every new bug or change to `03-development-log.md` and `04-bug-report.md`
  as it happens. It's much easier than reconstructing it later.

## Suggested report structure (mapped to these files)

1. Introduction & problem statement → brief + `01`
2. Objectives & requirements → `01`
3. System design & architecture → `02`, `06`
4. Implementation (development process) → `03`
5. Challenges & bug fixes → `04`
6. Testing → `05`
7. Results (screenshots) → `screenshots/`
8. Limitations & future scope → `07`
9. Conclusion
