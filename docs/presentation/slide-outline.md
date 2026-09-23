# Slide Outline (~12 slides, 10–12 minutes)

Screenshots referenced are in `../screenshots/`. Keep slides light: one idea
each, a picture where possible, details in your speaking.

---

**1. Title**
- CartShare: a collaborative shopping cart
- Your name, batch ID, date
- Visual: `01-landing-light.png`

**2. The problem**
- Shared living/working groups coordinate purchases over WhatsApp, sticky notes, spreadsheets
- Three pain points from the brief: communication gap, delivery-threshold trap, no transparency on who added what
- *Say:* "Everyone's buying for the same flat, but nobody has one list."

**3. The solution in one sentence**
- "One shared cart per group, where everyone sees every change, who made it, and what they owe."
- Four features: rooms, shared cart, live activity log, printable receipt

**4. Live demo** (switch to the browser; follow `demo-script-and-qa.md`)
- Backup if the demo fails: `08-two-tabs-in-sync.png`, `06-dashboard-light.png`, `10-receipt.png`

**5. How it works: architecture**
- Plain HTML/CSS/JavaScript, no framework, no backend, as the brief specifies
- One job per file: storage / sync / render / app (diagram from `02-architecture.md`)

**6. How tabs stay in sync** (the key technical slide)
- `localStorage` = the shared cart (all tabs); `sessionStorage` = who you are (per tab)
- A write in one tab → browser fires a `storage` event in the others → they redraw
- `BroadcastChannel` as a backup channel
- Visual: sequence diagram from `02-architecture.md`

**7. Design & responsiveness**
- Light/dark theme with CSS variables; follows the system setting; no flash
- Grid + Flexbox, works from 375px phones to desktop
- Visual: `07-dashboard-dark.png` next to `11-mobile-dashboard.png`

**8. Printable receipt**
- `@media print` shows only the receipt, black on white even in dark mode, one page
- Visual: `10-receipt.png`

**9. Challenges and how we solved them**
- Pop-ups that couldn't be closed: a CSS rule overriding the `hidden` attribute (B02)
- Receipt invisible when printed in dark mode (B03)
- Sideways scrolling on phones (B08)
- Lesson: logic tests passed while the page was broken → test in a real browser
- (Pick 2–3 from `04-bug-report.md`; 15 found and fixed in total)

**10. Testing**
- Automated browser tests: **70 checks, all passing**
- Two tabs act as two users; checks sync, validation, printing, phone layout, security, zero console errors
- Plus a manual checklist for printing, clipboard and real phones

**11. Limitations & future work**
- Same-browser only (by design); a backend (e.g. Supabase) would enable real devices
- Next: free-delivery progress bar, equal-split view, presence indicators
- *Say:* "We know exactly what it would take to go multi-device, and chose not to add risk the brief didn't ask for."

**12. Summary / thank you**
- All required features delivered and tested
- Links: GitHub repo + live URL (QR code if possible)
- Questions?
