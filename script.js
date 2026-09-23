const STORAGE_KEY = "daily-planner-tasks";

let tasks = loadTasks();
let activeFilter = "all";
let editingTaskId = null;

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const formMessage = document.querySelector("#form-message");
const currentDate = document.querySelector("#current-date");

currentDate.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date());

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks)
      ? savedTasks.filter((task) => task && typeof task.title === "string")
      : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getVisibleTasks() {
  if (activeFilter === "pending")
    return tasks.filter((task) => !task.completed);
  if (activeFilter === "completed")
    return tasks.filter((task) => task.completed);
  return tasks;
}

function render() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML =
      "<strong>No tasks here yet</strong><span>Add something small and make the day yours.</span>";
    taskList.append(emptyState);
  } else {
    visibleTasks.forEach((task) => taskList.append(createTaskElement(task)));
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}${completedCount ? ` · ${completedCount} done` : ""}`;
}

function createTaskElement(task) {
  const item = document.createElement("article");
  item.className = `task-item${task.completed ? " completed" : ""}`;
  item.dataset.taskId = task.id;

  const checkbox = document.createElement("input");
  checkbox.className = "task-check";
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark ${task.title} as complete`);
  checkbox.dataset.action = "toggle";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.innerHTML =
    '<button class="icon-button" type="button" data-action="edit">Edit</button><button class="icon-button delete" type="button" data-action="delete">Delete</button>';

  item.append(checkbox, title, actions);
  return item;
}

function addTask(title) {
  tasks.unshift({
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
  });
  saveTasks();
  render();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task,
  );
  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  if (editingTaskId === taskId) editingTaskId = null;
  saveTasks();
  render();
}

function startEditing(item, task) {
  editingTaskId = task.id;
  item.replaceChildren();
  const input = document.createElement("input");
  input.className = "edit-input";
  input.value = task.title;
  input.maxLength = 160;
  input.setAttribute("aria-label", "Edit task");

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.innerHTML =
    '<button class="icon-button" type="button" data-action="save">Save</button><button class="icon-button" type="button" data-action="cancel">Cancel</button>';
  item.append(input, actions);
  input.focus();
  input.select();
}

function saveEdit(item, task) {
  const input = item.querySelector(".edit-input");
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }
  tasks = tasks.map((currentTask) =>
    currentTask.id === task.id ? { ...currentTask, title } : currentTask,
  );
  editingTaskId = null;
  saveTasks();
  render();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    formMessage.textContent = "Write a task before adding it.";
    taskInput.focus();
    return;
  }
  formMessage.textContent = "";
  addTask(title);
  taskInput.value = "";
  taskInput.focus();
});

document.querySelector(".filter-group").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((filterButton) => {
    const isActive = filterButton === button;
    filterButton.classList.toggle("active", isActive);
    filterButton.setAttribute("aria-pressed", String(isActive));
  });
  render();
});

taskList.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const item = actionElement.closest("[data-task-id]");
  const task = tasks.find(
    (currentTask) => currentTask.id === item.dataset.taskId,
  );
  if (!task) return;

  if (actionElement.dataset.action === "edit") startEditing(item, task);
  if (actionElement.dataset.action === "delete") deleteTask(task.id);
  if (actionElement.dataset.action === "save") saveEdit(item, task);
  if (actionElement.dataset.action === "cancel") {
    editingTaskId = null;
    render();
  }
});

taskList.addEventListener("change", (event) => {
  if (event.target.dataset.action !== "toggle") return;
  toggleTask(event.target.closest("[data-task-id]").dataset.taskId);
});

taskList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !event.target.classList.contains("edit-input"))
    return;
  const item = event.target.closest("[data-task-id]");
  const task = tasks.find(
    (currentTask) => currentTask.id === item.dataset.taskId,
  );
  saveEdit(item, task);
});

render();
