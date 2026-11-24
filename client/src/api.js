const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Admin Forms
  getForms: () => request('/admin/forms'),
  importForm: (payload) =>
    request('/admin/forms/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateForm: (id, payload) =>
    request(`/admin/forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteForm: (id) =>
    request(`/admin/forms/${id}`, {
      method: 'DELETE',
    }),
  getFormResponses: (id) => request(`/admin/forms/${id}/responses`),
  deleteResponse: (responseId) =>
    request(`/admin/responses/${responseId}`, {
      method: 'DELETE',
    }),
  clearFormResponses: (formId) =>
    request(`/admin/forms/${formId}/responses`, {
      method: 'DELETE',
    }),
  retrySync: (responseId) =>
    request(`/admin/responses/${responseId}/retry-sync`, {
      method: 'POST',
    }),
  getExportUrl: (id) => `${API_BASE}/admin/forms/${id}/export`,

  // Public Quiz Player
  getPublicForm: (slug) => request(`/public/forms/${slug}`),
  submitPublicForm: (slug, answers) =>
    request(`/public/forms/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};
