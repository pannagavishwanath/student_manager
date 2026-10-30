import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { computeStats, deadlineInfo, formatDate, isOverdue, sortByDueDate } from '../utils/helpers.js';

export default function Dashboard({ tasks, onAddTask, onUploadMaterial, onViewTasks }) {
  const stats = computeStats(tasks);
  const upcoming = sortByDueDate(
    tasks.filter((t) => t.status === 'pending' && !isOverdue(t))
  ).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">An overview of your academic work.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAddTask}>+ Add Task</button>
          <button className="btn btn-secondary" onClick={onUploadMaterial}>⬆ Upload Material</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tasks" value={stats.total} tone="blue" />
        <StatCard label="Pending" value={stats.pending} tone="orange" />
        <StatCard label="Completed" value={stats.completed} tone="green" />
        <StatCard label="Overdue" value={stats.overdue} tone="red" />
      </div>

      <div className="two-col">
        <div className="card progress-card">
          <h2>Completion</h2>
          <div
            className="ring"
            style={{ background: `conic-gradient(var(--primary) ${stats.percent * 3.6}deg, var(--border) 0deg)` }}
          >
            <div className="ring-inner">{stats.percent}%</div>
          </div>
          <p className="muted">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </div>

        <div className="card">
          <h2>Upcoming Deadlines</h2>
          {upcoming.length === 0 ? (
            <EmptyState icon="🎉" title="Nothing upcoming" message="You have no pending tasks with future deadlines." />
          ) : (
            <ul className="simple-list">
              {upcoming.map((task) => {
                const info = deadlineInfo(task);
                return (
                  <li key={task.taskId} className="simple-item">
                    <div>
                      <strong>{task.title}</strong>
                      <div className="muted small">
                        {task.subject} · {formatDate(task.dueDate)}
                      </div>
                    </div>
                    <span className={`badge badge-${info.level}`}>{info.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <button className="btn btn-secondary btn-sm link-button" onClick={onViewTasks}>
            View all tasks
          </button>
        </div>
      </div>
    </div>
  );
}
