import EmptyState from '../components/EmptyState.jsx';
import {
  buildDailyPlan,
  deadlineInfo,
  formatDate,
  formatDuration,
  sortByDueDate,
} from '../utils/helpers.js';

export default function StudyPlanner({ tasks, onAddTask }) {
  const plan = buildDailyPlan(tasks);
  const totalMinutes = plan.reduce((sum, item) => sum + item.minutes, 0);
  const timeline = sortByDueDate(tasks.filter((t) => t.status === 'pending'));

  if (timeline.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Study Planner</h1>
            <p className="subtitle">Your plan is built from deadlines and priorities.</p>
          </div>
        </div>
        <EmptyState icon="🎉" title="All caught up" message="No pending tasks to plan. Add a new task to see a plan.">
          <button className="btn btn-primary" onClick={onAddTask}>+ Add Task</button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Study Planner</h1>
          <p className="subtitle">Your plan is built from deadlines and priorities.</p>
        </div>
      </div>

      <div className="card">
        <h2>Today's Study Plan · {formatDuration(totalMinutes)}</h2>
        <p className="muted small">
          Ranked by priority and urgency. Overdue and exam tasks get extra weight.
        </p>
        <ol className="plan-list">
          {plan.map((item, index) => {
            const info = deadlineInfo(item.task);
            return (
              <li key={item.task.taskId} className="plan-item">
                <span className="plan-number">{index + 1}</span>
                <div className="plan-body">
                  <strong>{item.task.title}</strong>
                  <div className="muted small">
                    {item.task.subject} · {item.task.priority} priority · {formatDuration(item.minutes)}
                  </div>
                  <div className="small">{item.reason}</div>
                </div>
                <span className={`badge badge-${info.level}`}>{info.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card">
        <h2>Deadline Timeline</h2>
        <div className="timeline">
          {timeline.map((task) => {
            const info = deadlineInfo(task);
            return (
              <div key={task.taskId} className={`timeline-item level-${info.level}`}>
                <div>
                  <strong>{task.title}</strong>
                  <div className="muted small">
                    {task.subject} · {task.taskType} · {formatDate(task.dueDate)}
                  </div>
                </div>
                <span className={`badge badge-${info.level}`}>{info.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
