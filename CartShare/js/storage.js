/**
 * storage.js
 * -----------------------------------------------------------------------
 * The single source of truth for CartShare's data.
 *
 * WHERE DATA LIVES:
 *  - localStorage['cartshare_rooms'] -> shared by ALL tabs/windows of this
 *    browser. Holds every room: participants, cart items, activity log.
 *  - sessionStorage['cartshare_session'] -> PER TAB. Holds "who am I in
 *    this tab": { userId, userName, roomCode }. Because each tab has its
 *    own sessionStorage, two tabs can act as two different people in the
 *    same room — that's how collaboration is simulated.
 *
 * Every function that changes a room follows the same 3 steps:
 *   1. read the room from localStorage
 *   2. change it in memory (and add an activity-log entry)
 *   3. write it back to localStorage
 * Writing to localStorage is what notifies the other tabs (see sync.js).
 *
 * LIMITATION: localStorage never leaves this browser, so rooms are shared
 * between tabs/windows of the same browser only — not across devices.
 * -----------------------------------------------------------------------
 */

const ROOMS_KEY = 'cartshare_rooms';
const SESSION_KEY = 'cartshare_session';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I, easier to read aloud
const MAX_ACTIVITY_ENTRIES = 200;
const STORAGE_FULL_MESSAGE = 'Could not save — browser storage is full or disabled.';

/** Unique-enough id for users, items and activity entries. */
function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Low-level room storage                                              */
/* ------------------------------------------------------------------ */

function getAllRooms() {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('CartShare: failed to read rooms from localStorage', err);
    return {};
  }
}

/** Saves one room back into the shared rooms object. Returns false if the
 * browser refused the write (storage full, or disabled in private mode). */
function saveRoom(room) {
  try {
    const rooms = getAllRooms();
    rooms[room.code] = room;
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    return true;
  } catch (err) {
    console.error('CartShare: failed to write rooms to localStorage', err);
    return false;
  }
}

/** Returns the room with this code, or null if it doesn't exist. */
function getRoom(code) {
  return getAllRooms()[code] || null;
}

/** Generates a 6-character code not used by any existing room. */
function generateRoomCode() {
  const rooms = getAllRooms();
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join('');
  } while (rooms[code]);
  return code;
}

/* ------------------------------------------------------------------ */
/* Session (per-tab identity)                                          */
/* ------------------------------------------------------------------ */

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** The room this tab is currently in, or null. */
function getCurrentRoom() {
  const session = getSession();
  return session ? getRoom(session.roomCode) : null;
}

/* ------------------------------------------------------------------ */
/* Activity log helper                                                 */
/* ------------------------------------------------------------------ */

function pushActivity(room, { type, userName, detail }) {
  room.activity.unshift({
    id: makeId('act'),
    type, // 'join' | 'leave' | 'add' | 'remove' | 'edit'
    userName,
    detail,
    timestamp: Date.now(),
  });
  if (room.activity.length > MAX_ACTIVITY_ENTRIES) room.activity.length = MAX_ACTIVITY_ENTRIES;
}

/* ------------------------------------------------------------------ */
/* Room actions — each returns { room, ... } or { error }              */
/* ------------------------------------------------------------------ */

/** Creates a new room and joins the creator to it. */
function createRoom(userName) {
  const code = generateRoomCode();
  const userId = makeId('user');

  const room = {
    code,
    createdAt: Date.now(),
    participants: [{ id: userId, name: userName, joinedAt: Date.now() }],
    items: [],
    activity: [],
  };
  pushActivity(room, { type: 'join', userName, detail: 'created the room' });

  if (!saveRoom(room)) return { error: STORAGE_FULL_MESSAGE };

  const session = { userId, userName, roomCode: code };
  saveSession(session);
  return { room, session };
}

/** Joins an existing room by code. */
function joinRoom(code, userName) {
  const normalizedCode = code.trim().toUpperCase();
  const room = getRoom(normalizedCode);
  if (!room) return { error: `No room found with code "${normalizedCode}".` };

  const userId = makeId('user');
  room.participants.push({ id: userId, name: userName, joinedAt: Date.now() });
  pushActivity(room, { type: 'join', userName, detail: 'joined the room' });

  if (!saveRoom(room)) return { error: STORAGE_FULL_MESSAGE };

  const session = { userId, userName, roomCode: normalizedCode };
  saveSession(session);
  return { room, session };
}

/** Removes this tab's user from their room and clears the tab's session. */
function leaveRoom() {
  const session = getSession();
  if (!session) return;

  const room = getRoom(session.roomCode);
  if (room) {
    room.participants = room.participants.filter((p) => p.id !== session.userId);
    pushActivity(room, { type: 'leave', userName: session.userName, detail: 'left the room' });
    saveRoom(room);
  }
  clearSession();
}

function addItem(session, { name, quantity, price }) {
  const room = getRoom(session.roomCode);
  if (!room) return { error: 'Room no longer exists.' };

  const item = {
    id: makeId('item'),
    name: name.trim(),
    quantity,
    price,
    addedBy: session.userId,
    addedByName: session.userName,
    addedAt: Date.now(),
  };
  room.items.push(item);
  pushActivity(room, {
    type: 'add',
    userName: session.userName,
    detail: `added "${item.name}" (x${item.quantity})`,
  });

  if (!saveRoom(room)) return { error: STORAGE_FULL_MESSAGE };
  return { room };
}

function removeItem(session, itemId) {
  const room = getRoom(session.roomCode);
  if (!room) return { error: 'Room no longer exists.' };

  const item = room.items.find((i) => i.id === itemId);
  if (!item) return { error: 'That item was already removed.' };

  room.items = room.items.filter((i) => i.id !== itemId);
  pushActivity(room, {
    type: 'remove',
    userName: session.userName,
    detail: `removed "${item.name}"`,
  });

  if (!saveRoom(room)) return { error: STORAGE_FULL_MESSAGE };
  return { room };
}

function editItem(session, itemId, { name, quantity, price }) {
  const room = getRoom(session.roomCode);
  if (!room) return { error: 'Room no longer exists.' };

  const item = room.items.find((i) => i.id === itemId);
  if (!item) return { error: 'That item was removed by someone else.' };

  const before = `${item.name} (x${item.quantity}, ${formatMoney(item.price)})`;
  item.name = name.trim();
  item.quantity = quantity;
  item.price = price;

  pushActivity(room, {
    type: 'edit',
    userName: session.userName,
    detail: `edited "${before}" → "${item.name}" (x${item.quantity}, ${formatMoney(item.price)})`,
  });

  if (!saveRoom(room)) return { error: STORAGE_FULL_MESSAGE };
  return { room };
}

/* ------------------------------------------------------------------ */
/* Derived data                                                        */
/* ------------------------------------------------------------------ */

/** Formats a number as money. The one place the currency symbol lives. */
function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

/** Totals and per-person contributions, calculated fresh from the items. */
function computeTotals(room) {
  const totalValue = room.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const totalItems = room.items.reduce((sum, i) => sum + i.quantity, 0);

  const byParticipant = {};
  room.items.forEach((item) => {
    const key = item.addedByName; // grouped by name, since a user may rejoin with a new id
    if (!byParticipant[key]) byParticipant[key] = { name: key, total: 0, itemCount: 0 };
    byParticipant[key].total += item.quantity * item.price;
    byParticipant[key].itemCount += item.quantity;
  });

  return {
    totalValue,
    totalItems,
    contributions: Object.values(byParticipant).sort((a, b) => b.total - a.total),
  };
}
