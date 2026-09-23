# CartShare-Project (workspace)

This is the **working folder** for the CartShare project. It keeps the app,
its documentation and its tests side by side, without mixing them.

```
CartShare-Project/
├── CartShare/     ← the app. This folder alone goes to GitHub and gets deployed.
├── docs/          ← report material: requirements, architecture, dev log,
│                    bug report, testing report, decisions, roadmap,
│                    presentation outline + demo script, screenshots
├── tests/         ← automated browser tests + screenshot generator (optional)
└── .vscode/       ← recommended extensions + Live Server setting
```

**Why the app is in its own folder:** the brief requires the submission to
strictly follow the `css/`, `js/`, `assets/` structure. Keeping docs and
tests outside `CartShare/` keeps the submission clean.

## Daily use

- **Run the app:** right-click `CartShare/index.html` → **Open with Live Server**
  (or click **Go Live** in the status bar) → `http://127.0.0.1:5500/index.html`
- **Read docs with diagrams:** open any `.md` file in `docs/` → **Ctrl + Shift + V**
- **Export a doc to PDF for the report:** open the `.md` → right-click →
  **Markdown PDF: Export (pdf)**
- **Run the tests (optional):** see `tests/README.md`

## GitHub (only the app folder)

```powershell
cd CartShare
git init
git add .
git commit -m "CartShare: collaborative shopping cart"
git branch -M main
git remote add origin https://github.com/<your-username>/<BatchID_FullName_CartShare>.git
git push -u origin main
```

If you also want to keep the docs on GitHub, make a **separate** repository
for `CartShare-Project`, or add them after checking with your instructor,
since the brief wants the submission structure kept strict.
