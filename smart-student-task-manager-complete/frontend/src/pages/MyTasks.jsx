import { useState } from 'react';
import TaskCard from '../components/TaskCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SUBJECTS, PRIORITIES } from '../utils/constants.js';
import { isOverdue, sortByDueDate } from '../utils/helpers.js';

export default function MyTasks({ tasks, onAddTask, onEditTask, onDeleteTask, onToggleStatus }) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [taskToDelete, setTaskToDelete] = useState(null);

  const filtered = sortByDueDate(
    tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.trim().toLowerCase());
      const matchesSubject = subject === 'All' || task.subject === subject;
      const matchesPriority = priority === 'All' || task.priority === priority;
      let matchesStatus = true;
      if (status === 'Pending') matchesStatus = task.status === 'pending';
      if (status === 'Completed') matchesStatus = task.status === 'completed';
      if (status === 'Overdue') matchesStatus = isOverdue(task);
      return matchesSearch && matchesSubject && matchesPriority && matchesStatus;
    })
  );

  function clearFilters() {
    setSearch('');
    setSubject('All');
    setPriority('All');
    setStatus('All');
  }

  function confirmDelete() {
    onDeleteTask(taskToDelete.taskId);
    setTaskToDelete(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="subtitle">{filtered.length} of {tasks.length} tasks shown</p>
        </div>
        <button className="btn btn-primary" onClick={onAddTask}>+ Add Task</button>
      </div>

      <div className="card filters">
        <input
          type="text"
          placeholder="🔍 Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="All">All subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Overdue">Overdue</option>
        </select>
        <button className="btn btn-secondary" onClick={clearFilters}>Clear</button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon="📝" title="No tasks yet" message="Add your first task to get started.">
          <button className="btn btn-primary" onClick={onAddTask}>+ Add Task</button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔎" title="No matching tasks" message="Try changing or clearing the filters." />
      ) : (
        <div className="task-list">
          {filtered.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onToggle={onToggleStatus}
              onEdit={onEditTask}
              onDelete={setTaskToDelete}
            />
          ))}
        </div>
      )}

      {taskToDelete && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${taskToDelete.title}" will be permanently removed.`}
          onConfirm={confirmDelete}
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
}
