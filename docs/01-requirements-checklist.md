# 01 — Requirements Checklist

Every requirement from the project brief (*"The CartShare Challenge"*),
with its status and where it's implemented.

**Status key:** ✅ done · ⚠️ partly done / different approach · ⏳ your action needed · ❌ not done yet

## Mission (section 2 of the brief)

| # | Requirement | Status | How / where |
|---|---|---|---|
| M1 | Create or join a unique "Room" using a code | ✅ | 6-character codes, checked unique against existing rooms — `storage.js` `generateRoomCode()`, `createRoom()`, `joinRoom()` |
| M2 | Add/remove items from a shared cart that updates for everyone in the room | ✅ | `addItem()` / `removeItem()` / `editItem()` in `storage.js`; every open tab re-draws via `sync.js` |
| M3 | Real-time activity log of what participants are doing | ✅ | Join, leave, add, edit, remove entries with name + timestamp — `pushActivity()` (`storage.js`), `renderActivity()` (`render.js`) |
| M4 | Audit-ready, printable receipt | ✅ | Room code, date/time, participants, items, contribution summary, total — `receipt.js` + `@media print` in `style.css` |

## Technical requirements (section 3)

| # | Requirement | Status | How / where |
|---|---|---|---|
| T1 | User access: HTML forms + JavaScript for "login" and room joining | ✅ | Create/Join forms in `index.html`; validation in `validation.js`; handlers in `app.js` |
| T2 | Responsive UI: Flexbox, Grid, **and Bootstrap** | ⚠️ | Flexbox + Grid + media queries at 900px and 560px; verified at 375px phone width. **Bootstrap is not used**: see `06-design-decisions.md` §D8 |
| T3 | Data persistence with browser storage | ✅ | `localStorage` (rooms) + `sessionStorage` (per-tab identity); survives refresh |
| T4 | Collaboration: JS event listeners to sync across browser tabs | ✅ | `storage` event listener + `BroadcastChannel` — `sync.js` |
| T5 | Printing: CSS print media rules + JS receipt summary | ✅ | `@media print` shows only the receipt; black-on-white even in dark mode; one page |

## Real-world problems named in the brief (section 1)

| # | Problem | Status | How it's addressed |
|---|---|---|---|
| P1 | Communication gap (who needs what, duplicates) | ✅ | One shared cart visible to everyone, each item labelled with who added it |
| P2 | **Delivery threshold trap** (minimum order for free shipping) | ❌ | Not addressed yet. Top item in `07-limitations-and-improvements.md` |
| P3 | Lack of transparency (who added what, splitting costs) | ✅ | "Added by" on every item, activity log, per-person expense summary, receipt contribution table |

## Success criteria (section 4)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| S1 | Functionality: cart updates correctly when items are added | ✅ | Test groups [7], [9], [10] in `05-testing-report.md` |
| S2 | Design: fully responsive, phone and desktop | ✅ | Test group [17]; screenshots 11–12 |
| S3 | Collaboration: can simulate multiple users in one room | ✅ | Test groups [5], [7]–[10], [15]; screenshot 08 |
| S4 | Submission: folder structure per course guidelines | ✅ | `CartShare/` contains exactly `index.html`, `README.md`, `css/`, `js/`, `assets/` |

## Submission guidelines (section 5)

| # | Guideline | Status | Notes |
|---|---|---|---|
| G1 | GitHub repository + README explaining how to run and the features | ⏳ | README written (`CartShare/README.md`). Create the repo and push the **`CartShare` folder only** |
| G2 | Live deployment on Vercel / Netlify / GitHub Pages | ⏳ | Steps in `CartShare/README.md` → Deployment. Test the room flow on the live URL in two tabs |
| G3 | Naming: `BatchID_FullName_CartShare` | ⏳ | Use this format when submitting the link on the portal (and as the repo name) |
| G4 | Folder structure `css/`, `js/`, `assets/` | ✅ | `assets/` previously missing (empty folders are dropped by zip/git); now contains `favicon.svg` |

## Extra features (beyond the brief)

- Invite links (`?room=CODE`) with a pre-filled join form, copy button and phone share sheet
- Edit items (not just add/remove)
- Light/dark theme that follows the system and is remembered
- Form validation with clear messages
- Leave-room confirmation
- Protection against HTML injection in item and user names
- Automated browser test suite (70 checks) and a screenshot generator
