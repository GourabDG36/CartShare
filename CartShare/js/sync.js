/**
 * sync.js
 * -----------------------------------------------------------------------
 * Keeps every open tab of a room up to date — this is the "real-time
 * collaboration" simulation. Two mechanisms, used together:
 *
 * 1. The native `storage` event. The browser fires it automatically in
 *    every OTHER tab (never the tab that made the change) whenever
 *    localStorage is written. Needs no setup and works in every browser.
 *
 * 2. BroadcastChannel. A same-origin message channel. After each change,
 *    the tab that made it posts a "room-updated" message. This is a
 *    backup for the storage event; if a browser lacks BroadcastChannel,
 *    (1) still keeps tabs in sync on its own.
 *
 * Both only reach tabs/windows of the same browser on the same device.
 * -----------------------------------------------------------------------
 */

const CHANNEL_NAME = 'cartshare_channel';

const broadcastChannel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;

/** Tells other tabs that a room changed. Call after every write. */
function announceRoomUpdate(roomCode) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'room-updated', roomCode, at: Date.now() });
  }
}

/**
 * Runs `callback(roomCode)` whenever another tab changes room data.
 * Both mechanisms usually fire for the same change, so calls that arrive
 * within the same animation frame are merged into one — the dashboard is
 * re-drawn once per change, not twice.
 */
function onRoomUpdated(callback) {
  let pending = false;
  function schedule(roomCode) {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      callback(roomCode);
    });
  }

  window.addEventListener('storage', (e) => {
    // e.key is null when storage was cleared entirely — treat that as a change too.
    if (e.key === ROOMS_KEY || e.key === null) schedule(null);
  });

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'room-updated') schedule(e.data.roomCode);
    });
  }
}
