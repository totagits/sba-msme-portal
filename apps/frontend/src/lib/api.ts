import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helpers ───────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
  updateProfile: (data: { phone?: string | null, emergencyContactName?: string | null, emergencyContactPhone?: string | null, profileImageUrl?: string | null }) => api.put('/auth/profile', data),
};

export const msmeApi = {
  list: (params?: Record<string, any>) => api.get('/msmes', { params }),
  getById: (id: string) => api.get(`/msmes/${id}`),
  create: (data: any) => api.post('/msmes', data),
  update: (id: string, data: any) => api.put(`/msmes/${id}`, data),
  delete: (id: string) => api.delete(`/msmes/${id}`),
  workflow: (id: string, data: { action: string; comment?: string; assignedToId?: string }) => api.post(`/msmes/${id}/workflow`, data),
  mapData: (params?: Record<string, any>) => api.get('/msmes/map', { params }),
  export: (params?: Record<string, any>) => api.get('/msmes/export', { params, responseType: 'blob' }),
};

export const bdspApi = {
  list: (params?: Record<string, any>) => api.get('/bdsps', { params }),
  getById: (id: string) => api.get(`/bdsps/${id}`),
  create: (data: any) => api.post('/bdsps', data),
  update: (id: string, data: any) => api.put(`/bdsps/${id}`, data),
  delete: (id: string) => api.delete(`/bdsps/${id}`),
  workflow: (id: string, data: any) => api.post(`/bdsps/${id}/workflow`, data),
  mapData: () => api.get('/bdsps/map'),
  export: () => api.get('/bdsps/export', { responseType: 'blob' }),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  publicStats: () => api.get('/analytics/public-stats'),
  msmesByCounty: () => api.get('/analytics/msmes-by-county'),
  msmesBySector: () => api.get('/analytics/msmes-by-sector'),
  msmesByCategory: () => api.get('/analytics/msmes-by-category'),
  msmesByStatus: () => api.get('/analytics/msmes-by-status'),
  monthlyRegistrations: () => api.get('/analytics/monthly-registrations'),
  dataQuality: () => api.get('/analytics/data-quality'),
};

export const reportsApi = {
  list: (params?: Record<string, any>) => api.get('/reports', { params }),
  getById: (id: string) => api.get(`/reports/${id}`),
  generate: (data: any) => api.post('/reports', data),
  export: (id: string) => api.get(`/reports/${id}/export`, { responseType: 'blob' }),
};

export const usersApi = {
  list: (params?: Record<string, any>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  updateRoles: (id: string, roleNames: string[]) => api.put(`/users/${id}/roles`, { roleNames }),
  delete: (id: string) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles'),
  getPermissions: () => api.get('/users/permissions'),
};

export const notificationsApi = {
  list: (params?: Record<string, any>) => api.get('/notifications', { params }),
  getCount: () => api.get('/notifications/count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const auditApi = {
  list: (params?: Record<string, any>) => api.get('/audit-logs', { params }),
  getById: (id: string) => api.get(`/audit-logs/${id}`),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
  getCounties: () => api.get('/settings/counties'),
  getSectors: () => api.get('/settings/sectors'),
  getDistricts: (countyId?: string) => api.get('/settings/districts', { params: { countyId } }),
};

export const opportunitiesApi = {
  list: (params?: Record<string, any>) => api.get('/opportunities', { params }),
  getById: (id: string) => api.get(`/opportunities/${id}`),
  create: (data: any) => api.post('/opportunities', data),
  update: (id: string, data: any) => api.put(`/opportunities/${id}`, data),
  delete: (id: string) => api.delete(`/opportunities/${id}`),
  addMatch: (id: string, msmeId: string) => api.post(`/opportunities/${id}/matches`, { msmeId }),
  updateMatch: (id: string, matchId: string, data: any) => api.patch(`/opportunities/${id}/matches/${matchId}`, data),
};

export const verificationsApi = {
  list: (params?: Record<string, any>) => api.get('/verifications', { params }),
  getById: (id: string) => api.get(`/verifications/${id}`),
  create: (data: any) => api.post('/verifications', data),
  update: (id: string, data: any) => api.put(`/verifications/${id}`, data),
};

export const importsApi = {
  list: () => api.get('/imports'),
  getById: (id: string) => api.get(`/imports/${id}`),
  upload: (file: File, entityType: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entityType', entityType);
    return api.post('/imports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  rollback: (id: string) => api.post(`/imports/${id}/rollback`),
};

export const filesApi = {
  upload: (file: File, meta: { msmeId?: string; bdspId?: string; documentType?: string }) => {
    const fd = new FormData();
    fd.append('file', file);
    if (meta.msmeId) fd.append('msmeId', meta.msmeId);
    if (meta.bdspId) fd.append('bdspId', meta.bdspId);
    if (meta.documentType) fd.append('documentType', meta.documentType);
    return api.post('/files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  list: (params: { msmeId?: string; bdspId?: string }) => api.get('/files', { params }),
};

export const syncApi = {
  sync: (records: any[]) => api.post('/sync/sync', { records }),
  startSession: (data: any) => api.post('/sync/session', data),
  endSession: (id: string, data: any) => api.patch(`/sync/session/${id}`, data),
};
