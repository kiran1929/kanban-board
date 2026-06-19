/**
 * storage.js
 * ─────────────────────────────────────────────────────────────
 * Responsible for:
 *   • Global task state  (let tasks = [])
 *   • loadTasks()        — hydrate from localStorage or seed
 *   • saveTasks()        — persist to localStorage
 *   • getSeedTasks()     — default demo data
 *   • Pure utilities shared across all modules:
 *       uid(), escapeHTML(), capitalize(), formatDate(), colLabel()
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Constants ─────────────────────────────────────── */
const STORAGE_KEY = 'kanban_tasks_v3';
const THEME_KEY   = 'kanban_theme_v3';

/* ── Global State ──────────────────────────────────── */
let tasks = [];

/* ── Utilities ─────────────────────────────────────── */

/** Generate a unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Escape HTML special characters to prevent XSS */
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Capitalise first letter */
function capitalize(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

/** Format ISO date string (YYYY-MM-DD) → "Jun 20, 2026" */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Map column key to display label */
function colLabel(col) {
  const map = { todo: 'To Do', progress: 'In Progress', done: 'Done' };
  return map[col] || col;
}

/* ── Seed Data ─────────────────────────────────────── */
function getSeedTasks() {
  const today  = new Date();
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: uid(), title: 'Design system setup',
      description: 'Create colour tokens, typography scale, and base component styles for the design system.',
      priority: 'high', column: 'todo', dueDate: addDays(3), createdAt: Date.now() - 7000,
    },
    {
      id: uid(), title: 'Research competitor products',
      description: 'Analyse top five competitors for UX patterns and feature gaps worth targeting.',
      priority: 'medium', column: 'todo', dueDate: addDays(8), createdAt: Date.now() - 6000,
    },
    {
      id: uid(), title: 'Write API documentation',
      description: 'Document all REST endpoints with request/response examples and error codes.',
      priority: 'low', column: 'todo', dueDate: addDays(13), createdAt: Date.now() - 5000,
    },
    {
      id: uid(), title: 'Implement drag and drop',
      description: 'Build task drag-and-drop using the HTML5 Drag and Drop API with placeholder feedback.',
      priority: 'high', column: 'progress', dueDate: addDays(1), createdAt: Date.now() - 4000,
    },
    {
      id: uid(), title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated linting, testing, and deployment workflows.',
      priority: 'medium', column: 'progress', dueDate: addDays(5), createdAt: Date.now() - 3000,
    },
    {
      id: uid(), title: 'User authentication flow',
      description: 'Design and implement login, registration, and password-reset screens with validation.',
      priority: 'high', column: 'done', dueDate: addDays(-2), createdAt: Date.now() - 2000,
    },
    {
      id: uid(), title: 'Responsive layout testing',
      description: 'Test all pages across mobile, tablet, and desktop breakpoints; fix regressions.',
      priority: 'medium', column: 'done', dueDate: addDays(-1), createdAt: Date.now() - 1000,
    },
  ];
}

/* ── Persistence ───────────────────────────────────── */

/** Load tasks from localStorage. Falls back to seed data on error. */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : getSeedTasks();
  } catch (err) {
    console.warn('[KanbanBoard] Failed to load tasks, using seed data.', err);
    tasks = getSeedTasks();
  }
}

/** Persist current tasks array to localStorage. */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('[KanbanBoard] Failed to save tasks to localStorage.', err);
  }
}
