# CartShare

A collaborative shopping cart for dorms, roommates, office teams and travel
groups. Create a room, invite others with a code or link, and build one
shared cart together, with a live activity log, a per-person expense
breakdown and a printable receipt.

CartShare is a **pure frontend app** (HTML, CSS, vanilla JavaScript). It has
no backend, no database and no paid API. Data lives in the browser's
`localStorage`, and collaboration between users is simulated across browser
tabs, as the project brief requires.

---

## Run it locally

The app needs to be served over `http://`, not opened as a `file://` path.

**VS Code Live Server (easiest)**
1. File → Open Folder → select the `CartShare` folder (the one that contains `index.html`).
2. Right-click `index.html` → **Open with Live Server**.
3. It opens at `http://127.0.0.1:5500/index.html`.

**Python**
```bash
cd CartShare
python3 -m http.server 5500
```
Then open `http://localhost:5500`.

If an old version seems to be showing, press **Ctrl + Shift + R** to reload
without the browser cache.

---

## Demo: simulating multiple users

Each browser tab keeps its own identity, so two tabs = two people.

1. **Tab 1:** enter "Alice" → **Create a new room**.
2. Click **Share room** → **Copy link**.
3. **Open a new tab** (Ctrl + T), paste the link, enter "Bob" → **Join room**.
   Put the two windows side by side for the demo.
4. Tab 1 immediately shows Bob in the participant list.
5. Add an item in either tab: it appears in the other tab straight away,
   along with the updated total, activity log and expense summary.
6. Edit or remove an item in one tab and watch the other update.
7. Click **Print receipt** to show the print-only receipt.
8. Click **Leave** in Bob's tab. Alice sees "Bob left the room".

Use a **new tab with the pasted link**, not the browser's "Duplicate tab"
command. Duplicating a tab copies its identity too, so both tabs would be
the same person.

---

## Features

- **Rooms:** unique 6-character codes (no look-alike characters such as 0/O and 1/I), create, join, leave, with validation messages.
- **Invite links:** `index.html?room=CODE`, opened with the join form pre-filled; copy button, plus the native share sheet on phones.
- **Shared cart:** add, edit and remove items (name, quantity, price); shows who added each item, the running total and the item count.
- **Live sync between tabs:** every change appears in the room's other open tabs without a refresh.
- **Activity log:** joins, leaves, adds, edits and removals, each with the person's name and a timestamp.
- **Expense summary:** each person's total, item count and share of the cart.
- **Printable receipt:** room code, participants, items, contribution summary and grand total. Only the receipt prints; it always prints black-on-white, even in dark mode.
- **Light / dark theme:** follows the system setting until you choose one; your choice is remembered.
- **Responsive:** works from phone width (375px) to desktop.
- **Persistence:** refreshing the page keeps you in your room with all items.

---

## Folder structure

```
CartShare/
├── index.html          Landing view, dashboard view, modals, print-only receipt
├── README.md
├── assets/
│   └── favicon.svg     App icon
├── css/
│   └── style.css       Theme colours (CSS variables), layout, responsive + print rules
└── js/
    ├── storage.js      All data reads/writes (localStorage + sessionStorage)
    ├── sync.js         Cross-tab sync (storage event + BroadcastChannel)
    ├── validation.js   Form validation rules
    ├── render.js       Draws room data into the page
    ├── receipt.js      Builds the printable receipt
    ├── theme.js        Light/dark theme
    └── app.js          Event handling; connects everything
```

Each JS file has one job: `storage.js` never touches the page, `render.js`
never changes data, and `app.js` connects user actions to both.

---

## How it works

**Where data is stored**
- `localStorage['cartshare_rooms']`: every room (participants, items,
  activity). Shared by all tabs of the browser.
- `sessionStorage['cartshare_session']`: *who this tab is*
  (`{ userId, userName, roomCode }`). Each tab has its own, which is what
  lets two tabs act as two different people.

**A room looks like this**
```js
{
  code: "K7P2XQ",
  createdAt: 1737012345678,
  participants: [{ id, name, joinedAt }],
  items: [{ id, name, quantity, price, addedBy, addedByName, addedAt }],
  activity: [{ id, type, userName, detail, timestamp }]
}
```

**How tabs stay in sync**
1. Every change is written to `localStorage`.
2. The browser automatically fires a `storage` event in every *other* tab.
3. The changing tab also posts a message on a `BroadcastChannel`, as a backup.
4. Each tab that receives either signal re-reads its room and redraws the dashboard.

---

## Known limitations

- **Same browser only.** `localStorage` never leaves the browser, so rooms
  are shared between tabs and windows of one browser, not across devices or
  different browsers. Real multi-device use would need a server and database
  (for example Firebase or Supabase), which is outside this project's scope.
- **No real accounts.** "Logging in" means typing a display name; there are
  no passwords.
- **Closing a tab doesn't leave the room.** Only the **Leave** button
  removes a person from the participant list.
- **Simultaneous edits:** if two tabs change the cart at the same instant,
  the later write wins.

---

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `localStorage`,
`sessionStorage`, the `storage` event, `BroadcastChannel`, CSS Grid and
Flexbox, and CSS variables.

---

## Deployment

**GitHub**
```bash
git init
git add .
git commit -m "CartShare"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

**Hosting** (static site, no build step, any of these works):
- **GitHub Pages:** repository Settings → Pages → Deploy from branch → `main`, folder `/ (root)`.
- **Netlify:** drag the `CartShare` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
- **Vercel:** "Add New Project" → import the GitHub repository → Deploy (no framework preset).

To test the room feature on the deployed site, open the URL, create a room,
then open the invite link in a second tab of the same browser.
