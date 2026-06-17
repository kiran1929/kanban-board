// CRUD operations for tasks

'use strict';

//Validation

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


// Create a new task and append it to the global tasks array.
function createTask(data) {
  const { valid } = validateTaskData(data);
  if (!valid) return null;

  const task = {
    id: uid(),
    title: String(data.title).trim(),
    description: String(data.description || '').trim(),
    priority: data.priority || 'low',
    column: data.column || 'todo',
    dueDate: data.dueDate || '',
    createdAt: Date.now()
  };

  task.push(task);
  saveTasks();
  return task;
}

// Update an existing task by ID.
//The updated task, or null if not found / invalid.

function updateTask(id, data) {
  const { valid } = validateTaskData(data);
  if (!valid) return null;

  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  tasks[idx] = {
    ...tasks[idx],
    title: String(data.title).trim(),
    description: String(data.description || '').trim(),
    priority: data.priority,
    column: data.column,
    dueDate: data.dueDate || '',
    updatedAt:Date.now(),
  };

  saveTasks();
  return tasks[idx];
}

//  Remove a task by ID.
//  True if a task was removed, false if not found.
 
function removeTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    saveTasks();
    return true;
}

// Find and return a single task by ID.
function getTask(id) {
  return tasks.find(t => t.id === id) || null;
}