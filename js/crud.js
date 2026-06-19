/**
 * crud.js
 * ─────────────────────────────────────────────────────────────
 * Responsible for:
 *   • createTask(data)    — add a new task and persist
 *   • updateTask(id,data) — edit an existing task and persist
 *   • removeTask(id)      — delete a task and persist
 *   • getTask(id)         — retrieve a single task by ID
 *   • validateTaskData()  — shared input validation
 *
 * Dependencies (loaded before this file):
 *   storage.js → tasks, saveTasks(), uid()
 *
 * NOTE: This module is pure data logic.
 * It does NOT call renderBoard() or showToast().
 * The UI layer (ui.js) calls these after invoking CRUD functions.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Validation ────────────────────────────────────── */

/**
 * Validate task input data.
 * @param {object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTaskData(data) {
  const errors = [];
  if (!data.title || !String(data.title).trim()) {
    errors.push('Title is required.');
  }
  if (data.title && String(data.title).trim().length > 120) {
    errors.push('Title must be 120 characters or fewer.');
  }
  const validPriorities = ['low', 'medium', 'high'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.push('Priority must be low, medium, or high.');
  }
  const validColumns = ['todo', 'progress', 'done'];
  if (data.column && !validColumns.includes(data.column)) {
    errors.push('Column must be todo, progress, or done.');
  }
  return { valid: errors.length === 0, errors };
}

/* ── CRUD Operations ────────────────────────────────── */

/**
 * Create a new task and append it to the global tasks array.
 * @param {{ title, description, priority, column, dueDate }} data
 * @returns {object} The newly created task object, or null on validation failure.
 */
function createTask(data) {
  const { valid } = validateTaskData(data);
  if (!valid) return null;

  const task = {
    id:          uid(),
    title:       String(data.title).trim(),
    description: String(data.description || '').trim(),
    priority:    data.priority || 'low',
    column:      data.column   || 'todo',
    dueDate:     data.dueDate  || '',
    createdAt:   Date.now(),
  };

  tasks.push(task);
  saveTasks();
  return task;
}

/**
 * Update an existing task by ID.
 * @param {string} id
 * @param {{ title, description, priority, column, dueDate }} data
 * @returns {object|null} The updated task, or null if not found / invalid.
 */
function updateTask(id, data) {
  const { valid } = validateTaskData(data);
  if (!valid) return null;

  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  tasks[idx] = {
    ...tasks[idx],
    title:       String(data.title).trim(),
    description: String(data.description || '').trim(),
    priority:    data.priority,
    column:      data.column,
    dueDate:     data.dueDate || '',
    updatedAt:   Date.now(),
  };

  saveTasks();
  return tasks[idx];
}

/**
 * Remove a task by ID.
 * @param {string} id
 * @returns {boolean} True if a task was removed, false if not found.
 */
function removeTask(id) {
  const before = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  const removed = tasks.length < before;
  if (removed) saveTasks();
  return removed;
}

/**
 * Find and return a single task by ID.
 * @param {string} id
 * @returns {object|null}
 */
function getTask(id) {
  return tasks.find(t => t.id === id) || null;
}
