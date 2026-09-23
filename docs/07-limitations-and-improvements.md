# 07 — Limitations and Improvements

## Current limitations

| # | Limitation | Why | Impact |
|---|---|---|---|
| L1 | Rooms work within **one browser only**, not across devices | `localStorage` never leaves the browser (by design, per the brief) | Collaboration is simulated with tabs/windows |
| L2 | No real accounts | "Login" is typing a display name, as the brief describes | Anyone in the browser can act as anyone |
| L3 | Closing a tab doesn't remove the person | Only the Leave button updates the participant list | The list can show people who have gone |
| L4 | Simultaneous writes: last one wins | No server to order the writes | Very unlikely with humans clicking; possible in theory |
| L5 | Contributions are "who added what", not an equal split | Simplest fair rule | Groups wanting an even split must calculate it themselves |
| L6 | Delivery-threshold problem not addressed | Not implemented yet | One of the brief's three named problems is unanswered |
| L7 | Bootstrap not used | See `06-design-decisions.md` §D8 | Brief lists it among responsive tools |
| L8 | Currency fixed to `$` | Single `formatMoney()` function | Easy to change (see I2) |

## Improvement roadmap

### Quick wins (under 1 hour each)

| # | Improvement | Effort | Value |
|---|---|---|---|
| I1 | **Free-delivery progress bar**: set a threshold (e.g. $75); show "$41.15 of $75 — add $33.85 for free delivery", turning green when reached | ~30 min | ⭐⭐⭐ Answers problem P2 from the brief directly |
| I2 | **Currency ₹ / configurable**: change `formatMoney()` in `storage.js` | ~5 min | ⭐⭐ Fits an Indian audience |
| I3 | **"Split equally" view**: each person's equal share and who owes whom | ~40 min | ⭐⭐ Completes the expense story |
| I4 | Shorter "Share" button label on phones | ~5 min | ⭐ Polish |
| I5 | Confirm before removing an item added by someone else | ~15 min | ⭐ Prevents accidents |

### Medium (a few hours)

| # | Improvement | Notes |
|---|---|---|
| I6 | **Presence:** mark people as "away" when their tab closes | Each tab writes a heartbeat timestamp; others treat >30 s old as away (fixes L3) |
| I7 | **Undo** for the last removal | Keep the removed item for 5 seconds with an Undo button in the toast |
| I8 | **Export** cart as CSV / share the receipt as PDF | Useful for reimbursement |
| I9 | **Item categories and "bought" checkboxes** | Turns the cart into a shopping checklist on the day |
| I10 | **Accessibility pass:** focus trap inside modals, screen-reader announcements for remote changes | Current modals return focus correctly but don't trap it |

### Large (needs a backend): real multi-device collaboration

This was prototyped in Stage 5 and removed; the design is recorded here.

- **Service:** Supabase (free tier: hosted Postgres + Realtime), or Firebase Firestore.
- **Data:** one `rooms` table: `code` (primary key), `participants`, `items`, `activity` (JSON columns), `created_at`, `updated_at`. The room object shape stays the same, so `render.js` and `receipt.js` wouldn't change.
- **Sync:** subscribe to changes on the current room's row; replace the `storage` event with those notifications.
- **Security:** the room code acts as the key. Proper protection would expose only "get room by exact code" and "update room by exact code" server functions, so no one can list all rooms.
- **Consistency:** move from "overwrite the whole room" to per-item database rows or server-side transactions, so simultaneous edits can't overwrite each other (fixes L4).
- **Accounts:** add sign-in (e.g. email magic link) to fix L2.

## What we'd do differently next time

1. Set up real-browser automated tests on day one, not after the bugs appeared.
2. Re-read the brief before starting each new phase, to keep scope on what's required.
3. Keep the report documents updated as work happens, not afterwards.
