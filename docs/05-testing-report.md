# 05 — Testing Report

## Approach

| Level | What | Tool | When |
|---|---|---|---|
| Logic | Room/item functions and validation rules in isolation | Node.js | Stages 1–5 |
| **End-to-end** | The real app in a real browser, driven like a user | **Playwright + headless Chromium** | From Stage 6 onwards; every change |
| Visual | Screenshots and the printed PDF inspected by eye | Playwright screenshots / PDF | Stage 7 onwards |

**Why end-to-end:** logic tests passed while the actual page was broken (bug
B02, a CSS problem). Only a real browser applies the CSS, fires the
`storage` event between tabs and prints. So the main suite drives the
real page.

**How multiple users are simulated in the tests:** two pages in one browser
context share `localStorage` but each has its own `sessionStorage`,
exactly like two tabs of one browser. Tab A is "Alice", tab B is "Bob".

## Result

**70 checks, 70 passed, 0 failed.** The latest raw log is in `../tests/test-results/report.txt`.

| Group | What it proves | Checks |
|---|---|---|
| [1] Initial load | Landing shows; dashboard, both modals and join form hidden; favicon linked | 6 |
| [2] Landing validation | Empty name, short code, unknown room rejected; errors clear when switching tabs | 4 |
| [3] Create room | Valid 6-char code (no look-alike characters); dashboard opens; empty-cart message | 3 |
| [4] Share modal | Opens with the correct link; closes via ✕, Escape and clicking outside | 5 |
| [5] Join via invite link | Link opens Join tab with code filled + "invited" banner; joins same room; URL cleaned; **other tab sees the new person** | 7 |
| [6] Item validation | Empty name, qty 0, price 0, fractional qty rejected | 4 |
| [7] Add + cross-tab sync | Items added in either tab appear in the other; totals, item count, expense summary, activity log correct; price rounded to cents | 7 |
| [8] HTML-injection safety | Names containing `"` or `<img onerror>` display as text and never run code | 3 |
| [9] Edit | Edit form pre-fills; saving updates the **other tab's** total; activity shows "edited" | 5 |
| [10] Remove | Removal in one tab disappears in the other | 1 |
| [11] Refresh persistence | After reload: still in the room, items still there | 2 |
| [12] Invite while in a room | Stays in own room; message explains why | 2 |
| [13] Theme | Toggle works; choice survives reload | 3 |
| [14] Print receipt (dark mode) | Receipt built; only the receipt is shown in print; text black; **exactly 1 page** | 4 |
| [15] Leave room | Cancel focused by default; Enter on Cancel and Escape both keep you in; confirming leaves; badge hides; **other tab sees "left"** | 9 |
| [16] New room after leaving | Can create a different, empty room | 2 |
| [17] Mobile (375px) | No sideways scrolling on landing or dashboard | 2 |
| [18] Errors | Zero JavaScript errors and zero failed network requests in any tab | 1 |
| | **Total** | **70** |

## Bugs found by testing

- **B02** (pop-ups always visible) was confirmed and fixed by the first real-browser run.
- The first full-suite run scored **61/64** before stopping early: it found B04 (extra blank printed pages) and B08 (sideways scrolling on phones). Two other failures were mistakes in the test itself, which were corrected.
- Inspecting the output by eye found **B12** and **B13**.

## How to run the tests yourself

Needs Node.js (one-time setup is in the workspace instructions).

```powershell
cd tests
npm install                          # first time only
npx playwright install chromium      # first time only
npm test                             # runs all 70 checks (about 15 seconds)
npm run screenshots                  # regenerates docs/screenshots
```

The tests start their own small web server, so Live Server doesn't need to be running.

## Manual checks (automation can't cover these)

Do these once before the presentation, ideally on the deployed URL:

- [ ] **Print dialog:** Print receipt → the browser's print preview shows only the receipt, on one page
- [ ] **Clipboard:** Share room → Copy link → paste into a new tab works
- [ ] **Two windows side by side:** add, edit and remove items in one; the other updates without refreshing
- [ ] **Phone:** open the deployed URL on a real phone; layout fits; "Share via…" opens the share sheet
- [ ] **Other browsers:** quick run in Edge and Firefox (or Safari)
- [ ] **Dark mode:** toggle, refresh (stays dark), print (receipt still black on white)
- [ ] **Hard refresh:** after deploying, Ctrl + Shift + R to make sure you're not seeing an old cached version

## Known test gaps

- Real print dialogs, the real clipboard and native share sheets can't be driven by automated tests; covered by the manual checklist above.
- Tests run in Chromium only. The app uses standard features supported by current Edge, Firefox and Safari, but only Chromium is automatically tested.
