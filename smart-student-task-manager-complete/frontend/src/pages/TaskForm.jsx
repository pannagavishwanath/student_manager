import { useState } from 'react';
import { SUBJECTS, TASK_TYPES, PRIORITIES } from '../utils/constants.js';

const emptyForm = {
  title: '',
  description: '',
  subject: SUBJECTS[0],
  taskType: TASK_TYPES[0],
  priority: 'Medium',
  dueDate: '',
};

export default function TaskForm({ task, onSave, onCancel }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(
    task
      ? {
          title: task.title,
          description: task.description,
          subject: task.subject,
          taskType: task.taskType,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const found = {};
    if (!form.title.trim()) found.title = 'Title is required.';
    else if (form.title.trim().length > 100) found.title = 'Title must be 100 characters or fewer.';
    if (form.description.length > 500) found.description = 'Description must be 500 characters or fewer.';
    if (!form.dueDate) found.dueDate = 'Due date is required.';
    return found;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Task' : 'Add Task'}</h1>
          <p className="subtitle">Fields marked * are required.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <label>
          Title *
          <input name="title" type="text" value={form.title} onChange={handleChange} maxLength={120} />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>

        <label>
          Description
          <textarea name="description" rows="3" value={form.description} onChange={handleChange} />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </label>

        <div className="form-row">
          <label>
            Subject *
            <select name="subject" value={form.subject} onChange={handleChange}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Task type *
            <select name="taskType" value={form.taskType} onChange={handleChange}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Priority *
            <select name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>
            Due date *
            <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
            {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
