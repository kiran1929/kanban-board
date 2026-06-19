# Kanban Task Board

A professional, modular Trello-style Kanban board built with **HTML5**, **CSS3**, and **Vanilla JavaScript**.

---

## Features

- **Drag & Drop** — move tasks between columns with visual feedback
- **CRUD** — create, read, update, delete tasks
- **Priority levels** — High, Medium, Low with colour-coded badges and left-border indicators
- **Due dates** — with Overdue / Due Today / Due Soon highlighting
- **Search** — real-time filter by title or description (`⌘K` / `Ctrl+K` shortcut)
- **Priority filter** — dropdown to isolate a priority level
- **Dark Mode** — respects `prefers-color-scheme`; persisted in `localStorage`
- **Toast notifications** — non-intrusive feedback for every action
- **LocalStorage persistence** — tasks survive page refreshes
- **Responsive layout** — 3 columns (desktop) → 2 (tablet) → 1 (mobile)
- **Keyboard shortcuts** — `⌘N` / `Ctrl+N` to open Add Task modal

---

## Project Structure

```
Kanban-Task-Board/
├── index.html          # HTML shell — structure only, no business logic
│
├── css/
│   └── style.css       # All styles — design tokens, layout, components
│
├── js/
│   ├── storage.js      # State, localStorage, seed data, shared utilities
│   ├── crud.js         # Pure data operations (create, update, delete, get)
│   ├── dragdrop.js     # HTML5 Drag & Drop event handlers
│   ├── features.js     # Theme, search, filter, toast notifications
│   ├── ui.js           # DOM rendering, card builder, modal management
│   └── app.js          # Application bootstrap (DOMContentLoaded)
│
├── assets/             # Static assets (images, icons, etc.)
└── README.md
```

---

## JavaScript Module Responsibilities

| File | Responsibility | Key Exports |
|---|---|---|
| `storage.js` | Global state, persistence, pure utilities | `tasks`, `loadTasks()`, `saveTasks()`, `uid()`, `escapeHTML()`, `formatDate()`, `colLabel()` |
| `crud.js` | Task data operations only — no DOM | `createTask()`, `updateTask()`, `removeTask()`, `getTask()` |
| `dragdrop.js` | HTML5 drag events — no rendering | `setupDropZones()`, `onDragStart()`, `onDragEnd()` |
| `features.js` | Theme, search, filter, toasts | `initTheme()`, `toggleTheme()`, `getFilteredTasks()`, `initSearch()`, `initFilter()`, `showToast()` |
| `ui.js` | Board rendering, modal orchestration | `renderBoard()`, `buildCard()`, `openAddModal()`, `openEditModal()`, `openDeleteModal()`, `closeAllModals()`, `initModals()` |
| `app.js` | Application entry point | `DOMContentLoaded` → boots all modules |

### Script Load Order

Enforced by `<script>` tags in `index.html`:

```
storage.js → crud.js → dragdrop.js → features.js → ui.js → app.js
```

Each file may call functions from files loaded **before** it at parse time,
and may call functions from files loaded **after** it at **runtime** (safe because
all scripts are evaluated before `DOMContentLoaded` fires).

---

## Architecture: Separation of Concerns

```
index.html       Pure HTML structure — no JS, no style attributes
css/style.css    All visual styling — tokens, layout, dark mode
js/storage.js    Data layer — state & persistence
js/crud.js       Domain layer — business rules & validation
js/dragdrop.js   Interaction layer — drag & drop only
js/features.js   Feature layer — theme, search, filter, toasts
js/ui.js         Presentation layer — DOM generation & modal flow
js/app.js        Composition root — wires everything together
```

---

## Modal Rule: One Modal at a Time

`closeAllModals()` in `ui.js` is called **before every** `openXxxModal()` call.

This prevents the stacked-modal bug where the delete confirmation could appear on top of the edit modal.

```
User clicks Delete on a card
  → closeAllModals()   (closes any open modal including edit)
  → openDeleteModal()  (only the delete modal is now visible)
```

---

## How to Run

No build step required. Simply open `index.html` in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or serve locally (avoids some browser security restrictions)
npx serve .
# then visit http://localhost:3000
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Focus the search bar |
| `⌘N` / `Ctrl+N` | Open the Add Task modal |
| `Escape` | Close any open modal |

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
Uses `<dialog>` for modals (Baseline Widely Available since 2022).

---

## Team Notes

- **Adding a new feature?** Start in the relevant module. Do not add DOM code to `crud.js` or data logic to `ui.js`.
- **Changing the design?** Edit `css/style.css` only. All colours are CSS custom properties in `:root`.
- **Adding a new column?** Update `COLUMNS` array in `ui.js`, add column HTML in `index.html`, add CSS classes in `style.css`.
- **Debugging state?** Open DevTools console and inspect the global `tasks` array directly.
