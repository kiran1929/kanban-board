/**
 * app.js
 * ─────────────────────────────────────────────────────────────
 * Application entry point.
 *
 * Responsibilities:
 *   • Wait for the DOM to be ready
 *   • Boot every module in the correct order
 *
 * Load order (enforced by <script> tags in index.html):
 *   storage.js → crud.js → dragdrop.js → features.js → ui.js → app.js
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Apply saved / system colour theme before any paint
  initTheme();

  // 2. Hydrate the tasks array from localStorage (or seed data)
  loadTasks();

  // 3. Render the board for the first time
  renderBoard();

  // 4. Attach drag-and-drop listeners to the column drop zones
  setupDropZones();

  // 5. Wire search field
  initSearch();

  // 6. Wire priority filter
  initFilter();

  // 7. Wire all modal buttons and keyboard shortcuts
  initModals();
});
