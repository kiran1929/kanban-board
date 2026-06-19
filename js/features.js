/**
 * features.js
 * ─────────────────────────────────────────────────────────────
 * Responsible for:
 *   • Dark-mode theme  → initTheme(), toggleTheme(), applyTheme()
 *   • Search           → initSearch(), searchTasks state
 *   • Priority filter  → initFilter(), filterTasks state
 *   • Task counters    → getFilteredTasks()
 *   • Toast system     → showToast(message, type)
 *
 * Dependencies (loaded before this file):
 *   storage.js → tasks, THEME_KEY, escapeHTML()
 *
 * Calls at runtime (loaded after this file — safe):
 *   ui.js → renderBoard()
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Filter / Search State ─────────────────────────── */
let activeFilter = 'all';
let searchQuery  = '';

/* ════════════════════════════════════════════════════
   THEME
════════════════════════════════════════════════════ */

/**
 * Initialise the colour theme on page load.
 * Reads from localStorage; falls back to the OS preference.
 * Also wires up the toggle button click handler.
 */
function initTheme() {
  let saved;
  try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}

  const theme = saved
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  applyTheme(theme);

  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}

/** Toggle between light and dark themes. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/**
 * Apply a theme ('light' | 'dark') to the document and persist it.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  _updateThemeIcon(theme);
}

function _updateThemeIcon(theme) {
  const iconLight = document.getElementById('themeIconLight');
  const iconDark  = document.getElementById('themeIconDark');
  const btn       = document.getElementById('themeToggle');

  if (!iconLight || !iconDark || !btn) return;

  if (theme === 'dark') {
    iconLight.classList.add('u-hidden');
    iconDark.classList.remove('u-hidden');
    btn.setAttribute('aria-label', 'Switch to light mode');
    btn.setAttribute('title', 'Switch to light mode');
  } else {
    iconLight.classList.remove('u-hidden');
    iconDark.classList.add('u-hidden');
    btn.setAttribute('aria-label', 'Switch to dark mode');
    btn.setAttribute('title', 'Switch to dark mode');
  }
}

/* ════════════════════════════════════════════════════
   SEARCH
════════════════════════════════════════════════════ */

/**
 * Attach input listener to the search field.
 * Re-renders the board on every keystroke.
 */
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    searchQuery = input.value.trim();
    renderBoard();
  });

  // Keyboard shortcut: Ctrl/⌘ + K
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

/* ════════════════════════════════════════════════════
   FILTER
════════════════════════════════════════════════════ */

/**
 * Attach change listener to the priority filter <select>.
 */
function initFilter() {
  const select = document.getElementById('priorityFilter');
  if (!select) return;

  select.addEventListener('change', () => {
    activeFilter = select.value;
    renderBoard();
  });
}

/**
 * Return the subset of tasks that match the current search query
 * and active priority filter.
 * @returns {object[]}
 */
function getFilteredTasks() {
  const q = searchQuery.toLowerCase();

  return tasks.filter(task => {
    const matchesPriority = activeFilter === 'all' || task.priority === activeFilter;
    const matchesSearch   = !q
      || task.title.toLowerCase().includes(q)
      || (task.description || '').toLowerCase().includes(q);

    return matchesPriority && matchesSearch;
  });
}

/* ════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
════════════════════════════════════════════════════ */

/**
 * Show a brief toast notification.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'|'warning'} [type='success']
 */
function showToast(message, type) {
  type = type || 'success';
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // Icon per type
  const icons = {
    success: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };

  toast.innerHTML =
    '<span class="toast__icon">' + (icons[type] || icons.info) + '</span>' +
    '<span class="toast__message">' + escapeHTML(message) + '</span>';

  container.appendChild(toast);

  // Trigger enter animation on the next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  });

  // Auto-dismiss after 3 s
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3000);
}
