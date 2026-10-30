import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Loader from './components/Loader.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyTasks from './pages/MyTasks.jsx';
import TaskForm from './pages/TaskForm.jsx';
import StudyPlanner from './pages/StudyPlanner.jsx';
import StudyMaterials from './pages/StudyMaterials.jsx';
import { sampleTasks, sampleMaterials } from './data/sampleData.js';
import { generateId } from './utils/helpers.js';
import { api, isApiConfigured, loadLocalCollection } from './utils/api.js';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [tasks, setTasks] = useState(() => isApiConfigured ? [] : loadLocalCollection('ssm_tasks', sampleTasks));
  const [materials, setMaterials] = useState(() => isApiConfigured ? [] : loadLocalCollection('ssm_materials', sampleMaterials));
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!isApiConfigured) {
        setLoading(false);
        return;
      }
      try {
        const [taskResult, materialResult] = await Promise.all([api.getTasks(), api.getMaterials()]);
        if (active) {
          setTasks(taskResult.tasks || []);
          setMaterials(materialResult.materials || []);
        }
      } catch (error) {
        console.error(error);
        if (active) alert(`Could not load cloud data: ${error.message}`);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isApiConfigured) localStorage.setItem('ssm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!isApiConfigured) {
      const safeMaterials = materials.map(({ localUrl, ...material }) => material);
      localStorage.setItem('ssm_materials', JSON.stringify(safeMaterials));
    }
  }, [materials]);

  function goTo(nextPage) {
    setPage(nextPage);
    window.scrollTo(0, 0);
  }

  function startAddTask() {
    setEditingTask(null);
    goTo('taskForm');
  }

  function startEditTask(task) {
    setEditingTask(task);
    goTo('taskForm');
  }

  async function saveTask(data) {
    const now = new Date().toISOString();
    try {
      if (editingTask) {
        const updated = { ...editingTask, ...data, updatedAt: now };
        if (isApiConfigured) await api.updateTask(editingTask.taskId, updated);
        setTasks((prev) => prev.map((task) => task.taskId === editingTask.taskId ? updated : task));
      } else {
        const newTask = {
          taskId: generateId('task'),
          userId: 'demo-user',
          ...data,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };
        const saved = isApiConfigured ? await api.createTask(newTask) : newTask;
        setTasks((prev) => [saved.task || saved, ...prev]);
      }
      setEditingTask(null);
      goTo('tasks');
    } catch (error) {
      alert(`Could not save task: ${error.message}`);
    }
  }

  function cancelTaskForm() {
    setEditingTask(null);
    goTo('tasks');
  }

  async function deleteTask(taskId) {
    try {
      if (isApiConfigured) await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.taskId !== taskId));
    } catch (error) {
      alert(`Could not delete task: ${error.message}`);
    }
  }

  async function toggleTaskStatus(taskId) {
    const current = tasks.find((task) => task.taskId === taskId);
    if (!current) return;
    const updated = {
      ...current,
      status: current.status === 'completed' ? 'pending' : 'completed',
      updatedAt: new Date().toISOString(),
    };
    try {
      if (isApiConfigured) await api.updateTask(taskId, updated);
      setTasks((prev) => prev.map((task) => task.taskId === taskId ? updated : task));
    } catch (error) {
      alert(`Could not update task: ${error.message}`);
    }
  }

  async function uploadMaterial(file, taskId) {
    if (isApiConfigured) {
      const material = await api.uploadMaterial(file, taskId);
      setMaterials((prev) => [material, ...prev]);
      return;
    }
    const material = {
      materialId: generateId('mat'),
      userId: 'demo-user',
      taskId: taskId || null,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      s3Key: `local-demo/${file.name}`,
      uploadedAt: new Date().toISOString(),
      localUrl: URL.createObjectURL(file),
    };
    setMaterials((prev) => [material, ...prev]);
  }

  async function downloadMaterial(material) {
    if (isApiConfigured) {
      const url = await api.getDownloadUrl(material.materialId);
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (material.localUrl) {
      const link = document.createElement('a');
      link.href = material.localUrl;
      link.download = material.fileName;
      link.click();
    } else {
      alert('This sample entry has no downloadable file. Upload a file to test download.');
    }
  }

  async function deleteMaterial(materialId) {
    try {
      if (isApiConfigured) await api.deleteMaterial(materialId);
      const target = materials.find((material) => material.materialId === materialId);
      if (target?.localUrl) URL.revokeObjectURL(target.localUrl);
      setMaterials((prev) => prev.filter((material) => material.materialId !== materialId));
    } catch (error) {
      alert(`Could not delete file: ${error.message}`);
    }
  }

  function renderPage() {
    switch (page) {
      case 'tasks':
        return <MyTasks tasks={tasks} onAddTask={startAddTask} onEditTask={startEditTask}
          onDeleteTask={deleteTask} onToggleStatus={toggleTaskStatus} />;
      case 'taskForm':
        return <TaskForm task={editingTask} onSave={saveTask} onCancel={cancelTaskForm} />;
      case 'planner':
        return <StudyPlanner tasks={tasks} onAddTask={startAddTask} />;
      case 'materials':
        return <StudyMaterials materials={materials} tasks={tasks}
          onUploadMaterial={uploadMaterial} onDownloadMaterial={downloadMaterial}
          onDeleteMaterial={deleteMaterial} />;
      default:
        return <Dashboard tasks={tasks} onAddTask={startAddTask}
          onUploadMaterial={() => goTo('materials')} onViewTasks={() => goTo('tasks')} />;
    }
  }

  return (
    <div className="app">
      <Sidebar currentPage={page === 'taskForm' ? 'tasks' : page} onNavigate={goTo} />
      <main className="main">
        <div className="page">{loading ? <Loader text="Loading your tasks..." /> : renderPage()}</div>
      </main>
    </div>
  );
}
