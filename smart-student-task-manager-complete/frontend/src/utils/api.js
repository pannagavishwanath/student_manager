const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const isApiConfigured = Boolean(API_BASE_URL);

async function request(path, options = {}) {
  if (!API_BASE_URL) throw new Error('VITE_API_URL is not configured.');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status}).`);
  }
  return payload;
}

export const api = {
  getTasks: () => request('/tasks'),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, task) => request(`/tasks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(task) }),
  deleteTask: (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getMaterials: () => request('/materials'),
  deleteMaterial: (id) => request(`/materials/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  async uploadMaterial(file, taskId) {
    const result = await request('/materials/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        taskId: taskId || null,
      }),
    });
    const uploadResponse = await fetch(result.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error('File upload to S3 failed.');
    return result.material;
  },
  async getDownloadUrl(id) {
    const result = await request(`/materials/${encodeURIComponent(id)}/download`);
    return result.downloadUrl;
  },
};

export function loadLocalCollection(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}
