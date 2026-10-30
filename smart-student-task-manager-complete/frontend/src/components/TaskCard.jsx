import { deadlineInfo, formatDate } from '../utils/helpers.js';

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const info = deadlineInfo(task);
  const done = task.status === 'completed';

  return (
    <div className={`card task-card ${info.level === 'overdue' ? 'task-overdue' : ''} ${done ? 'task-done' : ''}`}>
      <div className="task-body">
        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-desc">{task.description}</p>}
        <div className="badges">
          <span className="badge badge-type">{task.taskType}</span>
          <span className="badge badge-subject">{task.subject}</span>
          <span className={`badge priority-${task.priority}`}>{task.priority} priority</span>
          <span className={`badge badge-${info.level}`}>{info.label}</span>
        </div>
        <p className="task-date">📅 {formatDate(task.dueDate)}</p>
      </div>
      <div className="task-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => onToggle(task.taskId)}>
          {done ? 'Mark Pending' : 'Mark Completed'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </div>
  );
}
