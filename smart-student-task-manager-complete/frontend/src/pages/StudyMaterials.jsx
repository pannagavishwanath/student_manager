import { useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from '../utils/constants.js';
import { formatDate, formatFileSize, getExtension, validateFile } from '../utils/helpers.js';

export default function StudyMaterials({ materials, tasks, onUploadMaterial, onDownloadMaterial, onDeleteMaterial }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    setSuccess('');
    if (!file) {
      setSelectedFile(null);
      setError('');
      return;
    }
    const problem = validateFile(file);
    if (problem) {
      setError(problem);
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setError('');
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError('Please choose a file first.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await onUploadMaterial(selectedFile, taskId);
      setSelectedFile(null);
      setTaskId('');
      setSuccess('File uploaded successfully.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(material) {
    try {
      await onDownloadMaterial(material);
    } catch (downloadError) {
      setError(downloadError.message || 'Could not download this file.');
    }
  }

  function confirmDelete() {
    onDeleteMaterial(materialToDelete.materialId);
    setMaterialToDelete(null);
  }

  function linkedTaskTitle(id) {
    const task = tasks.find((task) => task.taskId === id);
    return task ? task.title : null;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Study Materials</h1>
          <p className="subtitle">Upload assignments, PDFs and notes.</p>
        </div>
      </div>
      <div className="card">
        <h2>Upload a file</h2>
        <div className="upload-grid">
          <label>
            File
            <input ref={fileInputRef} type="file" onChange={handleFileChange} />
          </label>
          <label>
            Link to a task (optional)
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">None</option>
              {tasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.title}</option>)}
            </select>
          </label>
        </div>
        <p className="muted small">
          Allowed: {ALLOWED_EXTENSIONS.join(', ')}. Maximum {MAX_FILE_SIZE_MB} MB.
        </p>
        <ErrorMessage message={error} />
        {success && <div className="alert alert-success">{success}</div>}
        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : '⬆ Upload'}
        </button>
      </div>
      <h2 className="section-title">Your files ({materials.length})</h2>
      {materials.length === 0 ? (
        <EmptyState icon="📂" title="No files yet" message="Upload your first study material above." />
      ) : (
        <div className="task-list">
          {materials.map((material) => (
            <div key={material.materialId} className="card material-item">
              <div className="material-info">
                <div className="file-badge">{getExtension(material.fileName).toUpperCase() || 'FILE'}</div>
                <div>
                  <strong>{material.fileName}</strong>
                  <div className="muted small">
                    {formatFileSize(material.fileSize)} · Uploaded {formatDate(material.uploadedAt)}
                  </div>
                  {material.taskId && linkedTaskTitle(material.taskId) && (
                    <div className="muted small">Task: {linkedTaskTitle(material.taskId)}</div>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(material)}>Download</button>
                <button className="btn btn-danger btn-sm" onClick={() => setMaterialToDelete(material)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {materialToDelete && (
        <ConfirmDialog title="Delete file?"
          message={`"${materialToDelete.fileName}" will be permanently removed.`}
          onConfirm={confirmDelete} onCancel={() => setMaterialToDelete(null)} />
      )}
    </div>
  );
}
