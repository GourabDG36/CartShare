# 04 — Bug Report

Every defect found during development: what the user saw, the actual
cause, the fix, and how the fix was verified. Test group numbers refer to
`05-testing-report.md`.

**Severity:** 🔴 high (feature unusable) · 🟠 medium (wrong result / bad experience) · 🟡 low (cosmetic / minor)

## Summary

| ID | Bug | Severity | Status |
|---|---|---|---|
| B01 | Leave button did nothing in the preview window | 🔴 | Fixed |
| B02 | Pop-ups always visible; Close/Cancel appeared broken | 🔴 | Fixed |
| B03 | Receipt printed almost invisible in dark mode | 🔴 | Fixed |
| B04 | Blank extra pages printed after the receipt | 🟠 | Fixed |
| B05 | Tab to Cancel + Enter still left the room | 🟠 | Fixed |
| B06 | Quote characters in names broke the page markup (HTML injection) | 🟠 | Fixed |
| B07 | Console 404 for favicon; `assets/` folder missing from submission | 🟠 | Fixed |
| B08 | Page on phones scrolled sideways | 🟠 | Fixed |
| B09 | White flash on load in dark mode | 🟡 | Fixed |
| B10 | Share pop-up text described the wrong behaviour | 🟡 | Fixed |
| B11 | Invite link silently ignored when already in a room | 🟡 | Fixed |
| B12 | Long text pushed activity timestamps off screen | 🟡 | Fixed |
| B13 | Receipt number columns left-aligned | 🟡 | Fixed |
| B14 | Cart table number headings left-aligned | 🟡 | Fixed |
| B15 | Old error messages stayed visible after leaving / switching tabs | 🟡 | Fixed |

---

### B01: Leave button did nothing in the preview window 🔴
- **Symptom:** clicking Leave had no effect and showed no error.
- **Root cause:** the handler used `window.confirm()`. Sandboxed embedded pages (like the in-chat preview) silently block `confirm()`: no dialog appears and it immediately returns `false`, so the code exited as if the user had clicked Cancel.
- **Fix:** in-page confirmation modal (`confirmDialog()` in `app.js`) that behaves the same everywhere.
- **Verified:** test group [15].
- **Note:** this fix caused B02.

### B02: Pop-ups always visible; Close/Cancel appeared broken 🔴
- **Symptom:** on Live Server the Invite pop-up showed on page load with an empty link; ✕ and Cancel did nothing.
- **Root cause:** modals are hidden with the HTML `hidden` attribute, which only works through the browser's default stylesheet. The app's rule `.modal-overlay { display: flex }` overrides it, so the modals were always displayed, and setting `hidden = true` had no visible effect. The same conflict also affected the landing view (`.landing { display: grid }`).
- **Fix:** `[hidden] { display: none !important; }` in `style.css`.
- **Verified:** test groups [1], [4], [15].
- **Why it was missed:** all earlier checks ran JavaScript in Node, where CSS doesn't exist.

### B03: Receipt printed almost invisible in dark mode 🔴
- **Symptom:** printing while in dark mode gave light-grey text on white paper.
- **Root cause:** the receipt used the theme's colour variables; in dark mode `--text` is near-white.
- **Fix:** `@media print` forces the colour variables to black-on-white, and turns off transitions and animations while printing.
- **Verified:** test group [14] (colour check + PDF inspected by eye).

### B04: Blank extra pages printed after the receipt 🟠
- **Root cause:** print CSS used `visibility: hidden`, which hides the rest of the page but keeps its space; `html, body { height: 100% }` also forced one full sheet of height.
- **Fix:** `body > *:not(#receipt-print) { display: none }` and `height: auto` in print.
- **Verified:** test group [14]: generated PDF has exactly 1 page.

### B05: Tab to Cancel + Enter still left the room 🟠
- **Root cause:** the modal listened for Enter on the whole document and treated it as "confirm", regardless of which button had focus.
- **Fix:** removed the Enter handler (Enter now activates the focused button); Cancel gets focus by default, the safer choice; focus returns to the Leave button afterwards.
- **Verified:** test group [15].

### B06: Quote characters in names broke the page markup (HTML injection) 🟠
- **Symptom:** an item named `Evil" onmouseover="…` would break out of the button's `aria-label="…"` attribute and could run code.
- **Root cause:** `escapeHtml()` escaped `< > &` but not quotes.
- **Fix:** `escapeHtml()` now escapes `& < > " '`.
- **Verified:** test group [8]: injection attempts render as plain text and never run.

### B07: Console 404 for favicon; `assets/` folder missing 🟠
- **Root cause:** no icon was defined, so every browser requested `/favicon.ico` and got a 404 error in the console. Separately, `assets/` was empty, and zip files and git drop empty folders, so the required folder vanished from the submission.
- **Fix:** added `assets/favicon.svg` and linked it; this fixes both.
- **Verified:** test groups [1] and [18] (zero console/HTTP errors).

### B08: Page on phones scrolled sideways 🟠
- **Symptom:** at 375px the dashboard was 449px wide.
- **Root causes:** (1) the 5-column cart table's minimum width stretched its grid column, because a `1fr` column never shrinks below its content; (2) the header couldn't fit logo + room controls + theme toggle on one line.
- **Fix:** grid columns `minmax(0, 1fr)`; table wrapped in a scroll container; header wraps onto two rows under 560px.
- **Verified:** test group [17]; screenshots inspected.

### B09: White flash on load in dark mode 🟡
- **Root cause:** the theme was applied by `theme.js` at the end of the page, after the first paint.
- **Fix:** 8-line inline script in `<head>` sets the theme before anything is drawn.

### B10: Share pop-up text described the wrong behaviour 🟡
- **Root cause:** it said the link "drops straight into the room"; it actually opens the join form with the code filled in.
- **Fix:** accurate wording, plus a plain note that rooms work within one browser.

### B11: Invite link silently ignored when already in a room 🟡
- **Fix:** shows "You're already in room X. Leave it first to join Y." and cleans the URL.
- **Verified:** test group [12].

### B12: Long text pushed activity timestamps off screen 🟡
- **Root cause:** same `1fr`-won't-shrink behaviour as B08, inside the activity row grid.
- **Fix:** `minmax(0, 1fr)` + `overflow-wrap: anywhere`.
- **Found by:** inspecting the phone screenshot by eye.

### B13 / B14: Number columns left-aligned (receipt and cart headings) 🟡
- **Root cause:** a more specific rule (`.receipt-table td { text-align: left }`, `.cart-table th { text-align: left }`) beat the general `.cell-num { text-align: right }`.
- **Fix:** more specific right-align rules for number cells.

### B15: Old error messages stayed visible 🟡
- **Fix:** field errors are cleared on leaving a room, switching Create/Join tabs, cancelling an edit, and starting an edit.
- **Verified:** test group [2].

---

## Also improved during the audit (not bugs, but worth mentioning)

- **One redraw per change instead of two:** the `storage` event and `BroadcastChannel` both fire for each change; they're now merged.
- **Prices stored in whole cents** (`4.199` → `4.20`), so totals never show rounding noise.
- **Clear message when editing an item someone else just removed**, instead of a silent failure.
- **Storage failures reported** ("browser storage is full or disabled") instead of silently losing data.
- **Theme works when storage is blocked** (some private-browsing modes).
- **Removed dead code** left from earlier stages (unused styles and backend references).
