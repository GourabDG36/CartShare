/**
 * theme.js
 * -----------------------------------------------------------------------
 * Light/dark theme system.
 *  - Persisted in localStorage['cartshare_theme'] as 'light' | 'dark'.
 *  - If the user has never chosen, we respect prefers-color-scheme.
 *  - Applied via a `data-theme` attribute on <html>, which every CSS
 *    variable block in style.css keys off. This is the ONLY place theme
 *    is decided in JS; components never hardcode colors, so switching
 *    the attribute is enough to re-theme the whole app instantly.
 * -----------------------------------------------------------------------
 */

const THEME_KEY = 'cartshare_theme';

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null; // storage blocked (some private-browsing modes): fall back to system theme
  }
}

function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    toggle.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
  }
}

function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Can't persist; the theme still switches for this page view.
  }
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');

  const toggle = document.getElementById('theme-toggle');
  if (toggle && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toggle.classList.remove('is-switching');
    // Force reflow so the animation can restart on repeated clicks.
    void toggle.offsetWidth;
    toggle.classList.add('is-switching');
  }
}

function initTheme() {
  applyTheme(getPreferredTheme());

  // If the user hasn't made an explicit choice, keep following the OS setting live.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });

  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);
}
