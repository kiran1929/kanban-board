/**
 * ui.js
 * ─────────────────────────────────────────────────────────────
 * Responsible for:
 *   • renderBoard()       — full board re-render using filtered tasks
 *   • buildCard(task)     — create a card DOM element
 *   • buildEmptyState()   — placeholder when a column is empty
 *   • updateStats()       — update header stats chips
 *   • Modal management:
 *       openAddModal(col), closeAddModal()
 *       openEditModal(id), closeEditModal()
 *       openDeleteModal(id), closeDeleteModal()
 *       closeAllModals()   — ensure only one modal is open at a time
 *   • initModals()        — wire all modal button event listeners
 *   • shakeInput(el)      — validation shake animation
 *
 * IMPORTANT: This module orchestrates CRUD → render → toast.
 * It is the only layer that calls createTask(), updateTask(), removeTask().
 *
 * Dependencies (loaded before this file):
 *   storage.js  → tasks, escapeHTML(), capitalize(), formatDate(), colLabel()
 *   crud.js     → createTask(), updateTask(), removeTask(), getTask()
 *   features.js → getFilteredTasks(), showToast()
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Pre-cached Dialog References ─────────────────────
   Cached at module scope — safe because <script> tags
   sit at the bottom of <body>, so the DOM is fully
   parsed before any JS in this file executes.
   Calling .close() on a dialog that is already closed
   is a defined no-op (WHATWG spec §14.4.2).
────────────────────────────────────────────────────── */
const _modalAdd    = document.getElementById('addModal');
const _modalEdit   = document.getElementById('editModal');
const _modalDelete = document.getElementById('deleteModal');

/* ── Module State ──────────────────────────────────── */
let _deleteTarget    = null; // ID of task pending deletion
let _editingTaskId   = null; // ID of task currently being edited

/* ── Column Config ─────────────────────────────────── */
const COLUMNS = [
  { key: 'todo',     label: 'To Do',       bodyId: 'cards-todo',     badgeId: 'badge-todo'     },
  { key: 'progress', label: 'In Progress', bodyId: 'cards-progress', badgeId: 'badge-progress' },
  { key: 'done',     label: 'Done',        bodyId: 'cards-done',     badgeId: 'badge-done'     },
];

/* ════════════════════════════════════════════════════
   BOARD RENDERING
════════════════════════════════════════════════════ */

/**
 * Re-render every column based on the current filtered task list.
 * Preserves column-body elements (only replaces their children),
 * so setupDropZones() listeners remain valid after re-render.
 */
function renderBoard() {
  const filtered = getFilteredTasks();

  // Group filtered tasks by column, sorted by due date then creation date
  const grouped = { todo: [], progress: [], done: [] };
  filtered.forEach(t => { if (grouped[t.column]) grouped[t.column].push(t); });

  Object.keys(grouped).forEach(col => {
    grouped[col].sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return  1;
      return b.createdAt - a.createdAt;
    });
  });

  COLUMNS.forEach(({ key, bodyId, badgeId }) => {
    const body  = document.getElementById(bodyId);
    const badge = document.getElementById(badgeId);
    if (!body || !badge) return;

    // Replace column card list
    body.innerHTML = '';
    const col = grouped[key];

    if (col.length === 0) {
      body.appendChild(_buildEmptyState(key));
    } else {
      col.forEach(task => body.appendChild(buildCard(task)));
    }

    badge.textContent = col.length;
    badge.setAttribute('aria-label', col.length + ' tasks');
  });

  updateStats();
}

/* ── Stats ─────────────────────────────────────────── */
function updateStats() {
  const el = id => document.getElementById(id);
  const count = col => tasks.filter(t => t.column === col).length;

  if (el('statTodo'))     el('statTodo').textContent     = count('todo');
  if (el('statProgress')) el('statProgress').textContent = count('progress');
  if (el('statDone'))     el('statDone').textContent     = count('done');
  if (el('statTotal'))    el('statTotal').textContent    = tasks.length;
}

/* ════════════════════════════════════════════════════
   CARD BUILDER
════════════════════════════════════════════════════ */

/**
 * Build and return a single task card DOM element.
 * Attaches drag events and action button click handlers.
 * @param {object} task
 * @returns {HTMLElement}
 */
function buildCard(task) {
  const card = document.createElement('article');
  card.className = 'card card--' + task.priority;
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', 'Task: ' + task.title);

  card.innerHTML =
    '<div class="card__header">' +
      '<h3 class="card__title">' + escapeHTML(task.title) + '</h3>' +
      '<span class="badge badge--' + task.priority + '" aria-label="' + task.priority + ' priority">' +
        capitalize(task.priority) +
      '</span>' +
    '</div>' +
    (task.description
      ? '<p class="card__desc">' + escapeHTML(task.description) + '</p>'
      : '') +
    '<div class="card__footer">' +
      _buildDueDate(task.dueDate) +
      '<div class="card__actions">' +
        '<button class="card__btn card__btn--edit" data-id="' + task.id + '" ' +
          'aria-label="Edit task: ' + escapeHTML(task.title) + '" title="Edit">' +
          _icon('edit') +
        '</button>' +
        '<button class="card__btn card__btn--delete" data-id="' + task.id + '" ' +
          'aria-label="Delete task: ' + escapeHTML(task.title) + '" title="Delete">' +
          _icon('trash') +
        '</button>' +
      '</div>' +
    '</div>';

  // Drag
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragend',   onDragEnd);

  // Edit
  card.querySelector('.card__btn--edit').addEventListener('click', e => {
    e.stopPropagation();
    openEditModal(task.id);
  });

  // Delete — always close any open modal first
  card.querySelector('.card__btn--delete').addEventListener('click', e => {
    e.stopPropagation();
    closeAllModals();
    openDeleteModal(task.id);
  });

  return card;
}

/* ── Due-date helper ───────────────────────────────── */
function _buildDueDate(dueDate) {
  if (!dueDate) return '<span class="card__due"></span>';

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const due      = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.round((due - today) / 86_400_000);

  let cls   = 'card__due';
  let label = formatDate(dueDate);

  if (diffDays < 0)       { cls += ' card__due--overdue';  label = 'Overdue · ' + formatDate(dueDate); }
  else if (diffDays === 0){ cls += ' card__due--today';    label = 'Due today'; }
  else if (diffDays <= 2) { cls += ' card__due--soon';     label = 'Due in ' + diffDays + 'd'; }

  return '<span class="' + cls + '" aria-label="Due date: ' + label + '">' +
    _icon('calendar') + label +
  '</span>';
}

/* ── Empty State ───────────────────────────────────── */
function _buildEmptyState(col) {
  const hints = {
    todo:     { head: 'No tasks yet',       sub: 'Click + to create your first task' },
    progress: { head: 'Nothing in progress', sub: 'Drag a task here or add a new one' },
    done:     { head: 'No completed tasks',  sub: 'Finished tasks will appear here'   },
  };
  const h = hints[col] || { head: 'Empty', sub: '' };

  const el = document.createElement('div');
  el.className = 'empty-state';
  el.setAttribute('aria-label', h.head);
  el.innerHTML =
    '<div class="empty-state__icon" aria-hidden="true">' + _icon('inbox') + '</div>' +
    '<p class="empty-state__heading">' + h.head + '</p>' +
    '<p class="empty-state__sub">' + h.sub + '</p>';
  return el;
}

/* ════════════════════════════════════════════════════
   MODAL MANAGEMENT
   ───────────────────────────────────────────────────
   RULE: Only ONE <dialog> may ever be open at a time.

   closeAllModals() uses EXPLICIT .close() calls on
   pre-cached dialog references — NOT querySelectorAll.

   Why explicit instead of querySelectorAll('[open]'):
   • The browser reflects the [open] attribute
     synchronously, but calling .close() during a
     click event that originated INSIDE the dialog
     can cause a microtask/paint ordering edge-case
     where the attribute is briefly stale.
   • Calling .close() on an already-closed dialog
     is a defined no-op — zero risk, zero overhead.
   • Explicit references are clearer and safer.
════════════════════════════════════════════════════ */

/**
 * Close ALL dialogs unconditionally.
 * Call this BEFORE every showModal() call.
 * Safe to call when no dialogs are open.
 */
function closeAllModals() {
  _modalAdd.close();    // no-op if already closed
  _modalEdit.close();   // no-op if already closed
  _modalDelete.close(); // no-op if already closed
}

/* ── Add Modal ─────────────────────────────────────── */

function openAddModal(defaultColumn) {
  closeAllModals(); // guarantee single-modal rule

  // Reset form to blank state
  _setVal('addTitle', '');
  _setVal('addDesc', '');
  _setVal('addDueDate', '');
  _checkRadio('addPriority', 'low');
  _checkRadio('addColumn',   defaultColumn || 'todo');

  _modalAdd.showModal();
  document.getElementById('addTitle').focus();
}

function closeAddModal() {
  _modalAdd.close();
}

function _handleSaveAdd() {
  const title = document.getElementById('addTitle').value.trim();
  if (!title) { shakeInput(document.getElementById('addTitle')); return; }

  const result = createTask({
    title,
    description: document.getElementById('addDesc').value.trim(),
    priority:    _getRadio('addPriority'),
    column:      _getRadio('addColumn'),
    dueDate:     document.getElementById('addDueDate').value,
  });

  if (!result) { showToast('Could not create task. Check your input.', 'error'); return; }

  closeAddModal();
  renderBoard();
  showToast('Task created!', 'success');
}

/* ── Edit Modal ────────────────────────────────────── */

function openEditModal(id) {
  closeAllModals(); // guarantee single-modal rule

  const task = getTask(id);
  if (!task) return;

  _editingTaskId = id; // track for the in-modal delete button

  _setVal('editTaskId', id);
  _setVal('editTitle',   task.title);
  _setVal('editDesc',    task.description || '');
  _setVal('editDueDate', task.dueDate     || '');
  _checkRadio('editPriority', task.priority);
  _checkRadio('editColumn',   task.column);

  _modalEdit.showModal();
  document.getElementById('editTitle').focus();
}

function closeEditModal() {
  _modalEdit.close();
  _editingTaskId = null;
}

function _handleSaveEdit() {
  const id    = document.getElementById('editTaskId').value;
  const title = document.getElementById('editTitle').value.trim();
  if (!title) { shakeInput(document.getElementById('editTitle')); return; }

  const result = updateTask(id, {
    title,
    description: document.getElementById('editDesc').value.trim(),
    priority:    _getRadio('editPriority'),
    column:      _getRadio('editColumn'),
    dueDate:     document.getElementById('editDueDate').value,
  });

  if (!result) { showToast('Could not update task.', 'error'); return; }

  closeEditModal();
  renderBoard();
  showToast('Task updated!', 'success');
}

/**
 * Called when the Delete button INSIDE the Edit modal is clicked.
 *
 * Flow:
 *   Edit Modal open
 *     → closeAllModals()    closes Edit modal (and any others)
 *     → openDeleteModal(id) shows ONLY the Delete modal
 *
 * This is the canonical fix for the stacked-modal bug.
 */
function _handleEditModalDelete() {
  const id = _editingTaskId;
  if (!id) return;
  // closeAllModals() is called inside openDeleteModal — no need to call it twice
  openDeleteModal(id);
}

/* ── Delete Modal ──────────────────────────────────── */

/**
 * Open the delete confirmation modal.
 *
 * ALWAYS calls closeAllModals() as the very first action.
 * This is the single enforcement point for the one-modal rule.
 *
 * Callers:
 *   • Card delete button click handler
 *   • _handleEditModalDelete (delete from within Edit modal)
 *
 * @param {string} id — ID of the task to delete
 */
function openDeleteModal(id) {
  closeAllModals(); // ← critical: closes Edit (or any other) modal first

  _deleteTarget = id;
  const task   = getTask(id);
  const nameEl = document.getElementById('deleteTaskName');
  if (nameEl) nameEl.textContent = task ? '"' + task.title + '"' : 'this task';

  _modalDelete.showModal();
}

function closeDeleteModal() {
  _modalDelete.close();
  _deleteTarget = null;
}

function _handleConfirmDelete() {
  if (!_deleteTarget) return;

  const removed = removeTask(_deleteTarget);
  closeDeleteModal();

  if (removed) {
    renderBoard();
    showToast('Task deleted.', 'info');
  }
}

/* ════════════════════════════════════════════════════
   INIT MODALS — wire all event listeners once
════════════════════════════════════════════════════ */

function initModals() {
  // ── Add Modal ──────────────────────────────────────
  document.getElementById('openAddModal')
    .addEventListener('click', () => openAddModal());

  document.querySelectorAll('.column-add-btn').forEach(btn =>
    btn.addEventListener('click', () => openAddModal(btn.dataset.column))
  );

  document.getElementById('closeAddModal')
    .addEventListener('click', closeAddModal);
  document.getElementById('cancelAdd')
    .addEventListener('click', closeAddModal);
  document.getElementById('saveAdd')
    .addEventListener('click', _handleSaveAdd);

  // ── Edit Modal ─────────────────────────────────────
  document.getElementById('closeEditModal')
    .addEventListener('click', closeEditModal);
  document.getElementById('cancelEdit')
    .addEventListener('click', closeEditModal);
  document.getElementById('saveEdit')
    .addEventListener('click', _handleSaveEdit);

  // In-modal Delete button — enforces the correct flow:
  //   closeAllModals() → openDeleteModal(id)
  //   so the Edit modal is FULLY closed before Delete appears.
  const editDeleteBtn = document.getElementById('editDeleteBtn');
  if (editDeleteBtn) {
    editDeleteBtn.addEventListener('click', _handleEditModalDelete);
  }

  // ── Delete Modal ───────────────────────────────────
  document.getElementById('closeDeleteModal')
    .addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDelete')
    .addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDelete')
    .addEventListener('click', _handleConfirmDelete);

  // ── Backdrop click (clicking outside modal box) ────
  // Use cached references — do NOT rely on querySelectorAll
  // to avoid the same attribute-reflection edge case.
  [_modalAdd, _modalEdit, _modalDelete].forEach(dialog => {
    dialog.addEventListener('click', e => {
      // e.target === dialog means the click hit the ::backdrop area
      if (e.target === dialog) closeAllModals();
    });
  });

  // ── Keyboard: Esc already closes a dialog natively ──
  // Extra: Ctrl/⌘+N opens Add Modal when no modal is open
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      // Only open if every dialog is currently closed
      if (!_modalAdd.open && !_modalEdit.open && !_modalDelete.open) {
        openAddModal();
      }
    }
  });
}

/* ════════════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════════════ */

/** Shake an input and highlight it red to indicate a validation error. */
function shakeInput(el) {
  el.classList.remove('input--shake');
  void el.getBoundingClientRect(); // force reflow
  el.classList.add('input--shake', 'input--error');
  el.focus();

  el.addEventListener('input', () => {
    el.classList.remove('input--error');
  }, { once: true });

  el.addEventListener('animationend', () => {
    el.classList.remove('input--shake');
  }, { once: true });
}

/* ── Private DOM helpers ───────────────────────────── */
function _setVal(id, val)        { const el = document.getElementById(id); if (el) el.value = val; }
function _getRadio(name)         { const el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
function _checkRadio(name, val)  {
  const el = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
  if (el) el.checked = true;
}

/* ── Inline SVG Icons ──────────────────────────────── */
function _icon(name) {
  const icons = {
    edit:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
      '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>',

    trash:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="3 6 5 6 21 6"/>' +
      '<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>' +
      '<path d="M10 11v6M14 11v6"/>' +
      '<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',

    calendar:
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
      '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',

    inbox:
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="21 15 21 19 3 19 3 15"/>' +
      '<path d="M21 15H15l-3 4-3-4H3"/></svg>',
  };
  return icons[name] || '';
}
