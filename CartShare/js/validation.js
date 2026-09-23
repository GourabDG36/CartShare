/**
 * validation.js
 * -----------------------------------------------------------------------
 * Small, framework-free validation helpers. Each returns null (valid) or
 * a human-readable error string. Kept separate from app.js so validation
 * rules are easy to find, test, and explain independently of DOM wiring.
 * -----------------------------------------------------------------------
 */

function validateName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Please enter your name.';
  if (trimmed.length > 40) return 'Name must be 40 characters or fewer.';
  return null;
}

function validateRoomCode(code) {
  const trimmed = (code || '').trim();
  if (!trimmed) return 'Please enter a room code.';
  if (!/^[A-Z0-9]{6}$/i.test(trimmed)) return 'Room codes are 6 letters/numbers, e.g. K7P2XQ.';
  return null;
}

function validateItemName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Item name is required.';
  if (trimmed.length > 60) return 'Item name must be 60 characters or fewer.';
  return null;
}

function validateQuantity(qty) {
  const n = Number(qty);
  if (qty === '' || qty === null || qty === undefined) return 'Quantity is required.';
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 'Quantity must be a whole number.';
  if (n < 1) return 'Quantity must be at least 1.';
  if (n > 9999) return 'Quantity is too large.';
  return null;
}

function validatePrice(price) {
  const n = Number(price);
  if (price === '' || price === null || price === undefined) return 'Price is required.';
  if (!Number.isFinite(n)) return 'Price must be a number.';
  if (n <= 0) return 'Price must be greater than 0.';
  if (n > 1000000) return 'Price is too large.';
  return null;
}
