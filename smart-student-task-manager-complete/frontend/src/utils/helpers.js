import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from './constants.js';

// ---------- IDs and dates ----------

export function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Today's date as "YYYY-MM-DD" in the user's local time
export function todayStr() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Returns a "YYYY-MM-DD" string for today + n days
export function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Number of days from today until the date (negative = already passed)
export function daysUntil(dateStr) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
}

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// ---------- Task helpers ----------

export function isOverdue(task) {
  return task.status === 'pending' && daysUntil(task.dueDate) < 0;
}

export function sortByDueDate(tasks) {
  return [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function computeStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending = total - completed; // pending includes overdue tasks
  const overdue = tasks.filter(isOverdue).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, overdue, percent };
}

// level is used by CSS to choose a colour: done, overdue, today, soon, normal
export function deadlineInfo(task) {
  if (task.status === 'completed') return { level: 'done', label: 'Completed' };
  const d = daysUntil(task.dueDate);
  if (d < 0) return { level: 'overdue', label: `Overdue by ${-d} day${-d === 1 ? '' : 's'}` };
  if (d === 0) return { level: 'today', label: 'Due today' };
  if (d === 1) return { level: 'soon', label: 'Due tomorrow' };
  if (d <= 3) return { level: 'soon', label: `Due in ${d} days` };
  return { level: 'normal', label: `Due in ${d} days` };
}

// ---------- Rule-based daily study plan ----------
// Score = priority points + urgency points (+1 for exams).
// The highest scores go to the top of today's plan.

const PRIORITY_POINTS = { High: 3, Medium: 2, Low: 1 };
const PRIORITY_MINUTES = { High: 90, Medium: 60, Low: 30 };

function urgencyPoints(task) {
  const d = daysUntil(task.dueDate);
  if (d < 0) return 6;
  if (d === 0) return 5;
  if (d <= 2) return 4;
  if (d <= 7) return 2;
  return 0;
}

function planReason(task) {
  const d = daysUntil(task.dueDate);
  if (d < 0) return `Overdue by ${-d} day${-d === 1 ? '' : 's'}. Finish this first.`;
  if (d === 0) return 'Due today.';
  if (d <= 2) return `Due in ${d} day${d === 1 ? '' : 's'}. Start now.`;
  if (task.priority === 'High') return 'High priority. Make a good start today.';
  return 'Steady progress keeps the deadline stress-free.';
}

export function buildDailyPlan(tasks, maxItems = 4) {
  return tasks
    .filter((t) => t.status === 'pending')
    .map((task) => {
      let score = PRIORITY_POINTS[task.priority] + urgencyPoints(task);
      if (task.taskType === 'Exam') score += 1;
      return {
        task,
        score,
        minutes: PRIORITY_MINUTES[task.priority],
        reason: planReason(task),
      };
    })
    .sort((a, b) => b.score - a.score || a.task.dueDate.localeCompare(b.task.dueDate))
    .slice(0, maxItems);
}

// ---------- File helpers ----------

export function getExtension(fileName) {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns an error message, or an empty string if the file is fine
export function validateFile(file) {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type ".${ext || 'unknown'}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`;
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return 'The file is empty.';
  }
  return '';
}
