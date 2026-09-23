# 03 — Development Log

A record of how CartShare was built, in order, including the detours.
Dates are from September 2026.

---

## Stage 1: Functional build (17 Sep)

**Goal:** implement every required feature with a deliberately plain design (brief: "Phase 1 — restricted colour palette").

**Built**
- Landing page: pitch, Create/Join forms, theme toggle
- Room system: unique 6-character codes, join by code, leave, per-tab identity
- Shared cart: add / edit / remove, owner per item, live totals
- Activity log, expense summary, printable receipt
- Light/dark theme with CSS variables, saved choice, follows system setting
- Cross-tab sync using the `storage` event + `BroadcastChannel`
- Responsive layout with Grid/Flexbox and breakpoints
- `README.md` with run and deployment instructions

**Structure decision:** split the JavaScript into one-job files
(`storage`, `sync`, `render`, `receipt`, `theme`, `validation`, `app`).

**Checked:** room/item logic tested in Node (create, join, add, edit,
remove, leave, totals, validation rules).

---

## Stage 2: Visual polish (20 Sep)

**Goal:** make it feel like a finished product without changing behaviour (brief: "Phase 2").

**Added**
- Second accent colour and proper success / warning / error colour pairs for both themes
- Button hover/press feedback, card hover shadows, animated theme-toggle
- New cart rows slide in (only genuinely new rows); totals "bump" when they change
- Activity icons coloured by action type; animated expense bars
- Empty states with icons and helpful text
- One entrance animation on the landing page
- Everything respects the system "reduce motion" setting

---

## Stage 3: Fix round 1 (21 Sep)

**Requested:** remove the footer text; fix the Leave button "not working".

- Footer and its CSS removed.
- **Leave button:** diagnosed as `window.confirm()` being silently blocked
  in the sandboxed preview window (no dialog, no console error, returns
  `false`). Replaced with an in-page confirmation modal. → **B01**
- Also cleared a half-finished item edit when leaving.

⚠️ **This fix introduced a new bug (B02)** that wasn't caught for two days.
See Stage 6.

---

## Stage 4: Shareable invite links (21 Sep)

**Requested:** replace "Copy code" with a proper invitation.

- "Share room" button opens a modal with a link `index.html?room=CODE`,
  a Copy button (Clipboard API with a fallback), and the phone share sheet
  (Web Share API) where available.
- Opening a link switches to the Join tab with the code filled in, and
  shows a banner saying whether the room exists in this browser.
- The `?room=` parameter is removed from the address bar after use.

---

## Stage 5: Cross-device backend attempt (22–23 Sep), later removed

**Requested:** real collaboration across different devices.

- Designed and implemented an optional **Supabase** (hosted Postgres +
  Realtime) mode: a `rooms` table with JSON columns, access policies,
  a lazy-loaded client, and realtime subscriptions per room. Local mode
  remained the default.
- Tested only against a **mock** of Supabase, never a real project.

**Removed on 23 Sep.** Re-reading the brief showed it asks for *browser
storage* and *syncing across browser tabs* to **simulate** multiple users.
The backend added setup steps, async code everywhere and demo risk,
for something the brief doesn't require. The design is kept in
`07-limitations-and-improvements.md` as future work.

---

## Stage 6: The pop-up bug (23 Sep)

**Reported:** on Live Server the Invite pop-up appeared on page load with
an empty link, and its Close button did nothing.

- Root cause: the CSS rule `.modal-overlay { display: flex }` overrode the
  HTML `hidden` attribute, so **both** modals were always on screen, and
  "closing" them had no visible effect. → **B02**
- Fixed with one global rule: `[hidden] { display: none !important; }`.
- **First test in a real browser** (headless Chromium via Playwright)
  confirmed the fix across the whole flow.

**Lesson:** every earlier check tested JavaScript logic in Node. A CSS bug
can't show up that way. From here on, every change was verified in a real browser.

---

## Stage 7: Full audit and clean-up (23 Sep)

**Requested:** clear out the backend, check everything, make it reliable before the presentation.

1. **Removed all backend code**: 3 files deleted; `storage.js` and `sync.js`
   returned to simple synchronous, browser-only code; data format unchanged.
2. **Read every file line by line**, then tested and inspected the output (steps 3–4).
   Together these found and fixed 13 more defects (B03–B15), including
   dark-mode receipts printing nearly invisible, extra blank printed pages,
   Tab-to-Cancel + Enter leaving the room anyway, HTML injection through
   quote characters, sideways scrolling on phones, a console 404, a theme
   flash on load, and a missing `assets/` folder.
3. **Wrote an automated browser test suite**: 70 checks across 18 groups, with two
   tabs acting as two users. First run: 61/64 → fixed → **70/70**.
4. **Looked at the output**: the printed receipt PDF and phone screenshots were
   inspected by eye, which caught two layout issues the checks alone didn't (B12, B13).
5. **Rewrote the README** for the browser-only app, with a demo script.

---

## Stage 8: Documentation (23 Sep)

- Workspace reorganised into `CartShare/` (submission), `docs/`, `tests/`.
- Tests made runnable on a normal PC (own mini web server; no Live Server needed).
- Screenshot generator producing 12 figures + receipt PDF with clean demo data.
- This documentation set.

---

## Process lessons (useful for the report)

1. **Test in the real environment.** Logic tests passed while the UI was
   broken (B02). Real-browser tests catch what unit tests can't.
2. **Every fix is a change that needs testing too.** B02 was introduced by the fix for B01.
3. **Re-read the brief before adding scope.** The backend (Stage 5) solved a
   problem the brief didn't set, and was removed.
4. **Automate the checks you repeat.** 70 checks run in about 15 seconds;
   manually that's 20+ minutes and easy to skip.
5. **Keep one source of truth for files.** At one point the working copy and
   the delivered zip had drifted apart; now every delivery is built from the
   tested copy.
