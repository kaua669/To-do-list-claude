/* ============================================================
   TASKFLOW — API CLIENT
   ============================================================ */

const API_BASE = 'http://localhost:3001/api';

const API = {
  token: null,

  setToken(t) { this.token = t; localStorage.setItem('tf_token', t); },
  getToken() { return this.token || localStorage.getItem('tf_token'); },
  clearToken() { this.token = null; localStorage.removeItem('tf_token'); localStorage.removeItem('tf_user'); },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na requisição');
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Servidor offline. Certifique-se que o backend está rodando na porta 3001.');
      }
      throw err;
    }
  },

  get: (p) => API.request('GET', p),
  post: (p, b) => API.request('POST', p, b),
  put: (p, b) => API.request('PUT', p, b),
  patch: (p, b) => API.request('PATCH', p, b),
  delete: (p) => API.request('DELETE', p),

  // Auth
  auth: {
    login: (b) => API.post('/auth/login', b),
    register: (b) => API.post('/auth/register', b),
    demo: () => API.post('/auth/demo')
  },

  // Tasks
  tasks: {
    list: (q = '') => API.get(`/tasks${q}`),
    create: (b) => API.post('/tasks', b),
    update: (id, b) => API.put(`/tasks/${id}`, b),
    updateStatus: (id, status) => API.patch(`/tasks/${id}/status`, { status }),
    updateSubtask: (id, sid, done) => API.patch(`/tasks/${id}/subtask/${sid}`, { done }),
    delete: (id) => API.delete(`/tasks/${id}`)
  },

  // Agenda
  agenda: {
    list: (q = '') => API.get(`/agenda${q}`),
    create: (b) => API.post('/agenda', b),
    update: (id, b) => API.put(`/agenda/${id}`, b),
    delete: (id) => API.delete(`/agenda/${id}`)
  },

  // Notes
  notes: {
    list: (q = '') => API.get(`/notes${q}`),
    create: (b) => API.post('/notes', b),
    update: (id, b) => API.put(`/notes/${id}`, b),
    pin: (id) => API.patch(`/notes/${id}/pin`),
    delete: (id) => API.delete(`/notes/${id}`)
  },

  // Habits
  habits: {
    list: () => API.get('/habits'),
    create: (b) => API.post('/habits', b),
    complete: (id) => API.patch(`/habits/${id}/complete`),
    delete: (id) => API.delete(`/habits/${id}`)
  },

  // Profile
  profile: {
    get: () => API.get('/profile'),
    update: (b) => API.put('/profile', b),
    changePassword: (b) => API.put('/profile/password', b)
  },

  // Tools
  tools: {
    stats: () => API.get('/tools/stats'),
    savePomodoro: (b) => API.post('/tools/pomodoro', b),
    pomodoroStats: () => API.get('/tools/pomodoro/stats')
  }
};
