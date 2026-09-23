/**
 * app.js
 * -----------------------------------------------------------------------
 * Wires everything together: switches between the landing view and the
 * dashboard view, handles every form and button, and re-draws the
 * dashboard after local changes and changes made in other tabs.
 *
 * Division of responsibility:
 *   storage.js  -> reads/writes data        (no DOM)
 *   render.js   -> draws data into the page (no data changes)
 *   app.js      -> reacts to user events and connects the two
 * -----------------------------------------------------------------------
 */

let currentlyEditingItemId = null;

/* ------------------------------------------------------------------ */
/* View switching                                                      */
/* ------------------------------------------------------------------ */

function showView(viewName) {
  document.getElementById('view-landing').hidden = viewName !== 'landing';
  document.getElementById('view-dashboard').hidden = viewName !== 'dashboard';
  document.getElementById('room-badge').classList.toggle('is-visible', viewName === 'dashboard');
}

/** Re-reads this tab's room from storage and draws it. Runs after every
 * local action and every change announced by another tab. */
function refreshDashboard() {
  const session = getSession();
  if (!session) {
    showView('landing');
    return;
  }

  const room = getRoom(session.roomCode);
  if (!room) {
    // The room's data is gone (e.g. browser storage was cleared).
    clearSession();
    showToast('That room no longer exists. You have been returned to the home screen.', 'error');
    showView('landing');
    return;
  }

  showView('dashboard');
  renderDashboard(room, session);
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

const TOAST_ICON = { success: '✓', error: '!', info: '·' };

function showToast(message, kind = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${kind}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="toast__icon" aria-hidden="true">${TOAST_ICON[kind] || ''}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast--visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ------------------------------------------------------------------ */
/* Form error helpers                                                  */
/* ------------------------------------------------------------------ */

function setFieldError(fieldId, message) {
  const el = document.getElementById(`${fieldId}-error`);
  if (el) el.textContent = message || '';
}

function clearFieldErrors(...fieldIds) {
  fieldIds.forEach((id) => setFieldError(id, null));
}

/* ------------------------------------------------------------------ */
/* Invite links (?room=CODE)                                           */
/* ------------------------------------------------------------------ */

/** Removes `?room=` from the address bar without reloading the page, so
 * a used invite doesn't trigger again on refresh. */
function clearInviteParamFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('room')) return;
  url.searchParams.delete('room');
  window.history.replaceState({}, '', url.toString());
}

/** Builds the invite link for a room from wherever the app is hosted
 * (Live Server, GitHub Pages, Netlify...), plus `?room=CODE`. */
function buildRoomLink(roomCode) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', roomCode);
  return url.toString();
}

/** If the page was opened from an invite link, switch to the Join tab,
 * pre-fill the code, and say whether that room exists in this browser. */
function handleInviteLink() {
  const rawCode = new URLSearchParams(window.location.search).get('room');
  if (!rawCode) return;

  const code = rawCode.trim().toUpperCase();
  const session = getSession();

  // This tab is already in a room: say so instead of silently ignoring the link.
  if (session) {
    clearInviteParamFromUrl();
    if (session.roomCode !== code) {
      showToast(`You're already in room ${session.roomCode}. Leave it first to join ${code}.`, 'info');
    }
    return;
  }

  const banner = document.getElementById('invite-banner');
  document.getElementById('tab-join').click();
  document.getElementById('join-code').value = code;

  if (validateRoomCode(code)) {
    banner.textContent = `That invite link's room code looks wrong (${rawCode}). Check it, or ask for a new link.`;
    banner.className = 'invite-banner invite-banner--warning';
  } else if (getRoom(code)) {
    banner.textContent = `You've been invited to room ${code}. Enter your name to join.`;
    banner.className = 'invite-banner';
  } else {
    banner.textContent = `Room ${code} wasn't found in this browser. Rooms are saved in the browser that created them, so open the link in that same browser.`;
    banner.className = 'invite-banner invite-banner--warning';
  }
  banner.hidden = false;
  document.getElementById('join-name').focus();
}

/* ------------------------------------------------------------------ */
/* Landing view: create / join                                         */
/* ------------------------------------------------------------------ */

function wireLandingForms() {
  const tabCreate = document.getElementById('tab-create');
  const tabJoin = document.getElementById('tab-join');
  const formCreate = document.getElementById('form-create');
  const formJoin = document.getElementById('form-join');
  const inviteBanner = document.getElementById('invite-banner');

  tabCreate.addEventListener('click', () => {
    tabCreate.classList.add('is-active');
    tabJoin.classList.remove('is-active');
    formCreate.hidden = false;
    formJoin.hidden = true;
    inviteBanner.hidden = true;
    clearFieldErrors('join-name', 'join-code');
  });

  tabJoin.addEventListener('click', () => {
    tabJoin.classList.add('is-active');
    tabCreate.classList.remove('is-active');
    formJoin.hidden = false;
    formCreate.hidden = true;
    clearFieldErrors('create-name');
  });

  formCreate.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('create-name').value;
    const nameErr = validateName(name);
    setFieldError('create-name', nameErr);
    if (nameErr) return;

    const result = createRoom(name.trim());
    if (result.error) {
      showToast(result.error, 'error');
      return;
    }
    announceRoomUpdate(result.room.code);
    clearInviteParamFromUrl();
    formCreate.reset();
    showToast(`Room ${result.room.code} created. Use "Share room" to invite others.`, 'success');
    refreshDashboard();
  });

  formJoin.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('join-name').value;
    const code = document.getElementById('join-code').value;
    const nameErr = validateName(name);
    const codeErr = validateRoomCode(code);
    setFieldError('join-name', nameErr);
    setFieldError('join-code', codeErr);
    if (nameErr || codeErr) return;

    const result = joinRoom(code, name.trim());
    if (result.error) {
      setFieldError('join-code', result.error);
      return;
    }
    announceRoomUpdate(result.room.code);
    clearInviteParamFromUrl();
    formJoin.reset();
    inviteBanner.hidden = true;
    showToast(`Joined room ${result.room.code}.`, 'success');
    refreshDashboard();
  });

  // Upper-case the room code as it's typed.
  document.getElementById('join-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

/**
 * In-page replacement for window.confirm(), which some embedded viewers
 * silently block. Resolves true (confirm) or false (cancel / Escape /
 * click outside). Enter is NOT handled here on purpose: pressing Enter
 * activates whichever button has focus, so Tab-to-Cancel + Enter cancels.
 */
function confirmDialog(message, confirmLabel = 'Leave room') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-modal');
    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const previouslyFocused = document.activeElement;

    document.getElementById('confirm-modal-message').textContent = message;
    okBtn.textContent = confirmLabel;
    overlay.hidden = false;
    cancelBtn.focus(); // the safe choice has focus by default

    function close(result) {
      overlay.hidden = true;
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onKeydown);
      if (previouslyFocused) previouslyFocused.focus();
      resolve(result);
    }
    function onOk() { close(true); }
    function onCancel() { close(false); }
    function onOverlayClick(e) { if (e.target === overlay) close(false); }
    function onKeydown(e) { if (e.key === 'Escape') close(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKeydown);
  });
}

/** Copies text to the clipboard: modern Clipboard API first, then the
 * older execCommand('copy') fallback. Returns true on success. */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      const ok = document.execCommand('copy');
      temp.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function openShareModal(room) {
  document.getElementById('share-modal-code').textContent = room.code;
  const linkInput = document.getElementById('share-link-input');
  linkInput.value = buildRoomLink(room.code);
  document.getElementById('native-share-btn').hidden = !navigator.share;

  document.getElementById('share-modal').hidden = false;
  linkInput.focus();
  linkInput.select();
}

function closeShareModal() {
  const overlay = document.getElementById('share-modal');
  if (overlay.hidden) return;
  overlay.hidden = true;
  document.getElementById('share-room-btn').focus();
}

function wireShareModal() {
  const overlay = document.getElementById('share-modal');

  document.getElementById('share-room-btn').addEventListener('click', () => {
    const room = getCurrentRoom();
    if (room) openShareModal(room);
  });

  document.getElementById('share-modal-close').addEventListener('click', closeShareModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeShareModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShareModal(); });

  document.getElementById('copy-link-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const linkInput = document.getElementById('share-link-input');
    if (await copyToClipboard(linkInput.value)) {
      btn.textContent = 'Copied ✓';
      showToast('Invite link copied.', 'success');
      setTimeout(() => { btn.textContent = 'Copy link'; }, 1600);
    } else {
      linkInput.focus();
      linkInput.select();
      showToast('Could not copy automatically. The link is selected: press Ctrl/Cmd + C.', 'error');
    }
  });

  document.getElementById('native-share-btn').addEventListener('click', async () => {
    const room = getCurrentRoom();
    if (!room) return;
    try {
      await navigator.share({
        title: 'Join my CartShare room',
        text: `Join room ${room.code} on CartShare:`,
        url: buildRoomLink(room.code),
      });
    } catch (err) {
      // AbortError = the person closed the share sheet; not worth a message.
      if (err && err.name !== 'AbortError') showToast('Sharing is not available here.', 'error');
    }
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard: room controls                                            */
/* ------------------------------------------------------------------ */

function wireRoomControls() {
  document.getElementById('leave-room-btn').addEventListener('click', async () => {
    const session = getSession();
    if (!session) return;
    const confirmed = await confirmDialog('Leave this room? You can rejoin later with the room code.');
    if (!confirmed) return;

    leaveRoom();
    announceRoomUpdate(session.roomCode);
    exitEditMode();
    document.getElementById('form-add-item').reset();
    clearFieldErrors('item-name', 'item-qty', 'item-price');
    showToast('You left the room.', 'info');
    showView('landing');
  });

  wireShareModal();

  document.getElementById('print-receipt-btn').addEventListener('click', () => {
    const room = getCurrentRoom();
    if (room) printReceipt(room);
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard: add / edit / remove items                                */
/* ------------------------------------------------------------------ */

function wireItemForm() {
  const form = document.getElementById('form-add-item');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const session = getSession();
    if (!session) return;

    const nameInput = document.getElementById('item-name');
    const qtyInput = document.getElementById('item-qty');
    const priceInput = document.getElementById('item-price');

    const nameErr = validateItemName(nameInput.value);
    const qtyErr = validateQuantity(qtyInput.value);
    const priceErr = validatePrice(priceInput.value);
    setFieldError('item-name', nameErr);
    setFieldError('item-qty', qtyErr);
    setFieldError('item-price', priceErr);
    if (nameErr || qtyErr || priceErr) return;

    const payload = {
      name: nameInput.value.trim(),
      quantity: parseInt(qtyInput.value, 10),
      price: Math.round(parseFloat(priceInput.value) * 100) / 100, // store whole cents only
    };

    const wasEditing = Boolean(currentlyEditingItemId);
    const result = wasEditing
      ? editItem(session, currentlyEditingItemId, payload)
      : addItem(session, payload);

    if (result.error) {
      showToast(result.error, 'error');
      if (wasEditing) { exitEditMode(); form.reset(); refreshDashboard(); }
      return;
    }

    announceRoomUpdate(session.roomCode);
    showToast(wasEditing ? 'Item updated.' : `Added "${payload.name}".`, 'success');
    exitEditMode();
    form.reset();
    refreshDashboard();
    nameInput.focus(); // ready for the next item
  });

  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    exitEditMode();
    form.reset();
    clearFieldErrors('item-name', 'item-qty', 'item-price');
  });

  // One listener on the table body handles every row's Edit/Remove button.
  document.getElementById('cart-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const itemId = btn.closest('tr').dataset.itemId;
    const session = getSession();
    if (!session) return;

    if (btn.dataset.action === 'remove') {
      const result = removeItem(session, itemId);
      if (result.error) { showToast(result.error, 'error'); refreshDashboard(); return; }
      if (currentlyEditingItemId === itemId) { exitEditMode(); document.getElementById('form-add-item').reset(); }
      announceRoomUpdate(session.roomCode);
      showToast('Item removed.', 'info');
      refreshDashboard();
    }

    if (btn.dataset.action === 'edit') {
      const room = getCurrentRoom();
      const item = room && room.items.find((i) => i.id === itemId);
      if (item) enterEditMode(item);
    }
  });
}

function enterEditMode(item) {
  currentlyEditingItemId = item.id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-qty').value = item.quantity;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-form-title').textContent = 'Edit item';
  document.getElementById('item-form-submit').textContent = 'Save changes';
  document.getElementById('cancel-edit-btn').hidden = false;
  clearFieldErrors('item-name', 'item-qty', 'item-price');
  document.getElementById('item-name').focus();
}

function exitEditMode() {
  currentlyEditingItemId = null;
  document.getElementById('item-form-title').textContent = 'Add an item';
  document.getElementById('item-form-submit').textContent = 'Add to cart';
  document.getElementById('cancel-edit-btn').hidden = true;
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function init() {
  initTheme();
  wireLandingForms();
  wireRoomControls();
  wireItemForm();

  // Another tab changed room data: re-draw if we're looking at a room.
  onRoomUpdated(() => {
    if (!document.getElementById('view-dashboard').hidden) refreshDashboard();
  });

  handleInviteLink();
  refreshDashboard(); // opens the dashboard directly if this tab is already in a room
}

document.addEventListener('DOMContentLoaded', init);
