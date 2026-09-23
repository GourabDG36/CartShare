# 06 — Design Decisions

Why things are built the way they are. Each entry: the decision, the
alternatives, and the trade-off. These make good answers in Q&A.

---

### D1. No backend: browser storage only
- **Decision:** all data in `localStorage`; no server or database.
- **Why:** the brief asks for exactly this: *"Use the browser's storage to keep cart data alive"* and *"sync data across browser tabs"* to **simulate** multiple users. It also means zero setup, zero cost, and nothing that can go down during a demo.
- **Alternative tried:** an optional Supabase backend for real cross-device rooms (Stage 5). It was removed because it wasn't required and added complexity and demo risk.
- **Trade-off:** rooms can't be shared between different devices or browsers.

### D2. `localStorage` for rooms, `sessionStorage` for identity
- **Why:** the cart must be identical in every tab, and `localStorage` is shared across tabs. Identity must be different per tab, and `sessionStorage` is per tab. This split is what makes one browser behave like several users.
- **Consequence:** the browser's "Duplicate tab" command copies `sessionStorage`, so a duplicated tab is the same person. The demo uses a new tab with the invite link instead.

### D3. `storage` event **and** `BroadcastChannel` for sync
- **Why both:** the `storage` event is built into every browser and fires automatically in other tabs; `BroadcastChannel` is an explicit message channel used as a backup. If one isn't available, the other still works.
- **Detail:** both usually fire for the same change, so they're merged into one redraw per animation frame.
- **Alternative:** polling `localStorage` on a timer. Rejected: wasteful and slower to update.

### D4. Plain JavaScript, no framework
- **Why:** the syllabus covers HTML, CSS and JavaScript; the app is small (~2,200 lines); no build step means it opens straight in Live Server and deploys anywhere as static files. Every line can be explained in a review.
- **Trade-off:** re-drawing is done by hand (`render.js`), where a framework like React would do it automatically.

### D5. One job per file
- **Why:** `storage.js` changes data but never touches the page; `render.js` draws but never changes data; `app.js` connects them. Easier to find bugs, test and explain.

### D6. Re-draw the whole dashboard on every change
- **Why:** simple and always correct: the page is rebuilt from the stored room, so it can't show stale data. The data is small (a few dozen items), so it's instant.
- **Detail:** new cart rows and new activity entries are tracked so only genuinely new ones animate.

### D7. Every write re-reads the latest room first
- **Why:** another tab may have changed the room since this tab last drew it. Reading → changing → writing keeps other people's changes.
- **Trade-off:** two tabs writing in the *same instant* could still overwrite each other (last write wins). Acceptable for a few people clicking by hand; a real multi-user system would need a server that serialises writes.

### D8. Flexbox + Grid instead of Bootstrap
- **The brief lists:** Flexbox, Grid **and** Bootstrap.
- **Decision:** layout built with CSS Grid, Flexbox and two media queries (900px, 560px); verified at 375px.
- **Why:** the design uses its own colour system and components; adding Bootstrap late would override them (buttons, forms, spacing) and add ~200 KB for layout that already works. Fewer dependencies also means nothing loaded from outside except the font.
- **If asked:** "Bootstrap was considered; plain Grid and Flexbox gave full control over the design with no framework overrides, and the layout is tested at phone width."

### D9. Custom confirmation modal instead of `window.confirm()`
- **Why:** `confirm()` is silently blocked in some embedded/sandboxed viewers (bug B01), and can't be styled for dark mode. The in-page modal works everywhere and matches the theme.
- **Safety detail:** Cancel is focused by default, so an accidental Enter never leaves the room (bug B05).

### D10. Receipt built into a hidden element and printed with `@media print`
- **Why:** meets the brief's "CSS print media rules" requirement directly. Print CSS removes everything except the receipt and forces black-on-white, so it's clean and readable on paper in either theme.
- **Alternative:** opening a new window with the receipt. Rejected: pop-up blockers, and harder to style.

### D11. Room codes: 6 characters from 32 symbols
- **Why:** the letters/digits exclude `0 O 1 I`, which are easy to confuse when read aloud or typed. 32⁶ ≈ **1.07 billion** combinations; codes are also checked against existing rooms, so they're unique.

### D12. Totals are calculated, never stored
- **Why:** `computeTotals()` derives totals, item counts and each person's share from the item list every time, so they can never disagree with the cart.
- **Expense split rule:** each person's contribution = the sum of (quantity × price) for items **they added**. (Equal splitting is listed as future work.)

### D13. Invite links via a URL parameter (`?room=CODE`)
- **Why:** works on any host (Live Server, GitHub Pages, Netlify) with no configuration, because the link is built from the current page address. The parameter is removed after use so a refresh doesn't repeat the invite.

### D14. Theme with CSS variables + an early `<head>` script
- **Why:** every colour is a variable; switching `data-theme` re-colours the whole app at once. The small script in `<head>` applies the saved/system theme before the first paint, so there's no flash (bug B09).

### D15. Safety of user-typed text
- **Why:** names and item names are shown to other "users" and inserted into HTML, so everything passes through `escapeHtml()` (escaping `& < > " '`) to prevent HTML injection (bug B06).
