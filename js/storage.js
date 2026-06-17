// Storage Key
const STORAGE_KEY = "kanbanTasks";

// Load tasks from localStorage
function loadTasks() {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return [];
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading tasks:", error);
        return [];
    }
}

// Save tasks to localStorage
function saveTasks(tasks) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}

// Add new task
function addTask(task) {
    const tasks = loadTasks();

    tasks.push(task);

    saveTasks(tasks);
}

// Update task
function updateTask(updatedTask) {
    const tasks = loadTasks();

    const newTasks = tasks.map(task => {
        return task.id === updatedTask.id
            ? updatedTask
            : task;
    });

    saveTasks(newTasks);
}

// Delete task
function deleteTask(taskId) {
    const tasks = loadTasks();

    const filteredTasks = tasks.filter(task => {
        return task.id !== taskId;
    });

    saveTasks(filteredTasks);
}

// Move task between columns
function updateTaskStatus(taskId, newStatus) {
    const tasks = loadTasks();

    const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
            task.status = newStatus;
        }

        return task;
    });

    saveTasks(updatedTasks);
}