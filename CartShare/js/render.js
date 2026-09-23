/**
 * render.js
 * -----------------------------------------------------------------------
 * DOM rendering. Each function takes the current room/session state and
 * writes it into the DOM. Nothing here mutates data — app.js owns state
 * changes (via storage.js) and calls these functions afterward to reflect
 * the new state on screen. Keeping "compute/mutate" (storage.js) separate
 * from "paint" (render.js) is what lets the cart re-render instantly
 * without a page reload, from both local actions and cross-tab syncs.
 * -----------------------------------------------------------------------
 */

function fmtTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

const ACTIVITY_ICON = { join: '→', leave: '←', add: '+', remove: '−', edit: '✎' };

function renderRoomHeader(room, session) {
  document.getElementById('room-code-display').textContent = room.code;
  document.getElementById('participant-count').textContent =
    `${room.participants.length} ${room.participants.length === 1 ? 'person' : 'people'}`;

  const list = document.getElementById('participant-list');
  list.innerHTML = '';
  room.participants.forEach((p) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    if (p.id === session.userId) chip.classList.add('chip--you');
    chip.textContent = p.id === session.userId ? `${p.name} (you)` : p.name;
    list.appendChild(chip);
  });
}

// Tracks item ids already painted, so we only animate genuinely NEW rows
// (avoids replaying the entrance animation on every re-render/sync).
const knownItemIds = new Set();

function renderCart(room, session) {
  const tbody = document.getElementById('cart-body');
  const emptyState = document.getElementById('cart-empty');
  tbody.innerHTML = '';

  if (room.items.length === 0) {
    emptyState.hidden = false;
    knownItemIds.clear();
  } else {
    emptyState.hidden = true;
    const currentIds = new Set(room.items.map((i) => i.id));
    room.items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.dataset.itemId = item.id;
      if (!knownItemIds.has(item.id)) tr.classList.add('row-enter');

      const lineTotal = item.quantity * item.price;
      const mine = item.addedBy === session.userId;

      tr.innerHTML = `
        <td class="cell-name">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-owner">added by ${mine ? 'you' : escapeHtml(item.addedByName)}</span>
        </td>
        <td class="cell-num">${item.quantity}</td>
        <td class="cell-num">${formatMoney(item.price)}</td>
        <td class="cell-num cell-total">${formatMoney(lineTotal)}</td>
        <td class="cell-actions">
          <button class="icon-btn" data-action="edit" title="Edit item" aria-label="Edit ${escapeHtml(item.name)}">✎</button>
          <button class="icon-btn icon-btn--danger" data-action="remove" title="Remove item" aria-label="Remove ${escapeHtml(item.name)}">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    knownItemIds.clear();
    currentIds.forEach((id) => knownItemIds.add(id));
  }

  const totals = computeTotals(room);
  updateTotalDisplay('cart-total-value', formatMoney(totals.totalValue));
  updateTotalDisplay('cart-total-count', String(totals.totalItems));
  return totals;
}

/** Sets a total's text and, if it actually changed, replays a small "bump"
 * animation so the number visibly registers as live/reactive. */
function updateTotalDisplay(elementId, newText) {
  const el = document.getElementById(elementId);
  if (el.textContent === newText) return;
  el.textContent = newText;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.classList.remove('is-updating');
  void el.offsetWidth;
  el.classList.add('is-updating');
}

let lastSeenActivityId = null;

function renderActivity(room) {
  const list = document.getElementById('activity-list');
  const emptyState = document.getElementById('activity-empty');
  list.innerHTML = '';

  if (room.activity.length === 0) {
    emptyState.hidden = false;
    lastSeenActivityId = null;
    return;
  }
  emptyState.hidden = true;

  const newestId = room.activity[0].id;
  const isFreshEntry = newestId !== lastSeenActivityId;
  lastSeenActivityId = newestId;

  room.activity.slice(0, 40).forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = `activity-item activity-item--${entry.type}`;
    if (index === 0 && isFreshEntry) li.classList.add('activity-item--fresh');
    li.innerHTML = `
      <span class="activity-icon" aria-hidden="true">${ACTIVITY_ICON[entry.type] || '•'}</span>
      <span class="activity-text">
        <strong>${escapeHtml(entry.userName)}</strong> ${escapeHtml(entry.detail)}
      </span>
      <span class="activity-time">${fmtTime(entry.timestamp)}</span>
    `;
    list.appendChild(li);
  });
}

function renderExpenses(totals) {
  const list = document.getElementById('expense-list');
  const emptyState = document.getElementById('expense-empty');
  list.innerHTML = '';

  if (totals.contributions.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  totals.contributions.forEach((c) => {
    const pct = totals.totalValue > 0 ? (c.total / totals.totalValue) * 100 : 0;
    const row = document.createElement('li');
    row.className = 'expense-row';
    row.innerHTML = `
      <div class="expense-row__top">
        <span class="expense-name">${escapeHtml(c.name)}</span>
        <span class="expense-amount">${formatMoney(c.total)}</span>
      </div>
      <div class="expense-bar"><div class="expense-bar__fill" style="width:${pct.toFixed(1)}%"></div></div>
      <div class="expense-row__meta">${c.itemCount} item${c.itemCount === 1 ? '' : 's'} · ${pct.toFixed(0)}% of total</div>
    `;
    list.appendChild(row);
  });
}

/** Renders every dashboard panel from the current room + session. */
function renderDashboard(room, session) {
  renderRoomHeader(room, session);
  const totals = renderCart(room, session);
  renderActivity(room);
  renderExpenses(totals);
}

/** Makes user-typed text safe to insert into HTML, including inside
 * attribute values like aria-label="..." (hence the quote escaping). */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
