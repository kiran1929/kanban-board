/**
 * dragdrop.js
 * ─────────────────────────────────────────────────────────────
 * Responsible for:
 *   • onDragStart(e)   — mark dragged card, set transfer data
 *   • onDragEnd(e)     — clean up drag classes & placeholder
 *   • setupDropZones() — attach dragover / dragleave / drop
 *                        listeners to all .column-body elements
 *
 * Dependencies (loaded before this file):
 *   storage.js → tasks, saveTasks(), colLabel()
 *
 * Calls at runtime (loaded after this file — safe):
 *   ui.js      → renderBoard()
 *   features.js → showToast()
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── State ─────────────────────────────────────────── */
let draggedId = null;

/* ── Handlers ──────────────────────────────────────── */

function onDragStart(e) {
  draggedId = e.currentTarget.dataset.id;
  e.currentTarget.classList.add('is-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedId);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('is-dragging');
  _clearDragUI();
  draggedId = null;
}

/* ── Drop Zone Setup ────────────────────────────────── */

/**
 * Attach HTML5 drag-and-drop event listeners to every column body.
 * Call once after the initial render; the column bodies persist across
 * renderBoard() calls (only their child cards are replaced).
 */
function setupDropZones() {
  document.querySelectorAll('.column-body').forEach(zone => {
    zone.addEventListener('dragover',  _onDragOver);
    zone.addEventListener('dragleave', _onDragLeave);
    zone.addEventListener('drop',      _onDrop);
  });
}

/* ── Private Helpers ────────────────────────────────── */

function _onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const zone = e.currentTarget;
  zone.classList.add('drag-over');
  zone.closest('.column').classList.add('column--drag-target');

  if (!zone.querySelector('.drag-placeholder')) {
    const ph = document.createElement('div');
    ph.className = 'drag-placeholder';
    zone.appendChild(ph);
  }
}

function _onDragLeave(e) {
  const zone = e.currentTarget;
  if (zone.contains(e.relatedTarget)) return; // still inside zone

  zone.classList.remove('drag-over');
  zone.closest('.column').classList.remove('column--drag-target');
  zone.querySelector('.drag-placeholder')?.remove();
}

function _onDrop(e) {
  e.preventDefault();
  const zone   = e.currentTarget;
  const id     = e.dataTransfer.getData('text/plain') || draggedId;
  const newCol = zone.dataset.column;

  zone.classList.remove('drag-over');
  zone.closest('.column').classList.remove('column--drag-target');
  zone.querySelector('.drag-placeholder')?.remove();

  if (!id || !newCol) return;

  const task = tasks.find(t => t.id === id);
  if (!task || task.column === newCol) return;

  task.column = newCol;
  saveTasks();
  renderBoard();
  showToast('Moved to ' + colLabel(newCol), 'info');
}

function _clearDragUI() {
  document.querySelectorAll('.column-body').forEach(z => z.classList.remove('drag-over'));
  document.querySelectorAll('.column').forEach(c => c.classList.remove('column--drag-target'));
  document.querySelectorAll('.drag-placeholder').forEach(el => el.remove());
}
