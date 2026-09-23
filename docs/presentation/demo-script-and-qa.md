# Live Demo Script + Q&A Preparation

## Before you present (10 minutes before)

- [ ] Open the **deployed URL** (or Live Server) in Chrome/Edge
- [ ] Clear old demo data: DevTools (F12) → Application → Local Storage → right-click → Clear; then refresh
- [ ] Two browser **windows** side by side (Win + ← and Win + →), not two tabs in one window
- [ ] Zoom to ~125% (Ctrl + +) so the audience can read it
- [ ] Light theme on (switch to dark during the demo for effect)
- [ ] Screenshots from `docs/screenshots/` open in a folder, as backup
- [ ] Turn off notifications (Windows Focus Assist)

## Demo script (~3 minutes)

| Step | Do | Say |
|---|---|---|
| 1 | Left window: type "Priya" → **Create a new room** | "I create a room for my flat. It gets a unique 6-character code." |
| 2 | Click **Share room** → **Copy link** | "I can share an invite link: this uses the phone share sheet on mobile." |
| 3 | Right window: paste the link, type "Rahul" → **Join room** | "Rahul opens the link, and the room code is already filled in." |
| 4 | Point at the left window | "Priya's screen updated instantly: Rahul is listed. No refresh." |
| 5 | Left: add "Basmati rice 5 kg", 1, 12.50 | "Priya adds rice…" |
| 6 | Right: add "Milk 1 L", 4, 1.20 | "…Rahul adds milk. Both carts, totals and activity logs update in both windows." |
| 7 | Right: ✎ Milk → qty 6 → **Save** | "Edits are logged too: who changed what, from what to what." |
| 8 | Point at **Expense summary** | "Here's what each person put in, and their share of the total." |
| 9 | Click the theme toggle | "Dark mode, remembered between visits." |
| 10 | **Print receipt** → show preview → Cancel | "An audit-ready receipt: only the receipt prints, always black on white." |
| 11 | Right: **Leave** → **Leave room** | "When Rahul leaves, Priya sees it in the log." |

**If something goes wrong:** say "let me show you the captured version" and
switch to `08-two-tabs-in-sync.png`. Don't debug live.

## Likely questions and answers

**Q: Is this really real-time? Can two phones use it?**
It's real-time between tabs and windows of the same browser. That's what the
brief asked for: simulating multiple users with browser storage and tab sync.
Two different phones would need a server; we designed that (Supabase, in
`07-limitations-and-improvements.md`) and deliberately left it out of scope.

**Q: How do the tabs talk to each other?**
When one tab writes to `localStorage`, the browser automatically fires a
`storage` event in every other tab of the site. Each tab listens for it,
re-reads the room and redraws. `BroadcastChannel` is a backup message channel.

**Q: If both tabs share localStorage, how are they different people?**
Identity is kept in `sessionStorage`, which is separate for each tab. The
cart is shared; who you are isn't.

**Q: What if two people edit at exactly the same moment?**
Each change re-reads the latest room before saving, so normal use keeps
everyone's changes. If two saves happen in the same instant, the last one
wins. Fixing that fully needs a server to order writes; it's in future work.

**Q: Why no Bootstrap? The brief mentions it.**
The layout uses CSS Grid and Flexbox, which the brief also lists, with media
queries tested down to 375px. The app has its own design system; Bootstrap
would have overridden it and added a large dependency for layout that
already works.

**Q: Why not use React?**
The syllabus is HTML, CSS and JavaScript, the app is small, and plain JS
means no build step: it runs straight from the files and deploys anywhere.

**Q: Is it secure?**
There are no passwords because the brief's "login" is a name form. Every
piece of user-typed text is escaped before it's shown, so names like
`<script>` display as text and can't run (we have automated tests for this).

**Q: How did you test it?**
An automated suite drives the real app in a real browser: 70 checks,
including two tabs acting as two users, printing, phone layout and zero
console errors. Plus manual checks for printing, clipboard and phones.

**Q: What was the hardest bug?**
The pop-ups couldn't be closed. The cause was a CSS rule that overrode the
HTML `hidden` attribute, so the "close" code ran but nothing visibly changed.
Our logic tests all passed because they didn't run CSS. That's why we moved
to real-browser testing.

**Q: How are expenses split?**
Each person's share is the total of the items they added (quantity × price).
An equal-split view is the next planned feature.

**Q: What happens if I refresh or close the browser?**
Refreshing keeps you in the room with everything intact (data is in
`localStorage`, identity in `sessionStorage`). Closing the tab ends that
tab's identity; the room and cart stay saved in the browser.
