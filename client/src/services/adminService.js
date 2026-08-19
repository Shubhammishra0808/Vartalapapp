import axios from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('securechat_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminService = {
  async login(credentials) {
    const response = await adminApi.post('/admin/login', credentials);
    if (response.data.token) {
      localStorage.setItem('securechat_admin_token', response.data.token);
      localStorage.setItem('securechat_admin_user', JSON.stringify(response.data.admin));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('securechat_admin_token');
    localStorage.removeItem('securechat_admin_user');
  },

  async getOverview() {
    const response = await adminApi.get('/admin/overview');
    return response.data;
  },

  async getUsers(search = '', page = 1) {
    const response = await adminApi.get(`/admin/users?search=${encodeURIComponent(search)}&page=${page}`);
    return response.data;
  },

  async toggleSuspendUser(userId, isSuspended, reason) {
    const response = await adminApi.post(`/admin/users/${userId}/suspend`, { isSuspended, reason });
    return response.data;
  },

  async deleteUserAccount(userId) {
    const response = await adminApi.delete(`/admin/users/${userId}`);
    return response.data;
  },

  async resetUserSecurity(userId) {
    const response = await adminApi.post(`/admin/users/${userId}/reset-security`);
    return response.data;
  },

  async getReports() {
    const response = await adminApi.get('/admin/reports');
    return response.data;
  },

  async resolveReport(reportId, reportData) {
    const response = await adminApi.put(`/admin/reports/${reportId}`, reportData);
    return response.data;
  },

  async getAuditLogs() {
    const response = await adminApi.get('/admin/audit-logs');
    return response.data;
  },

  // Super Admin Special Powers
  async sendBroadcast(title, message) {
    const response = await adminApi.post('/admin/broadcast', { title, message });
    return response.data;
  },

  async getConversations() {
    const response = await adminApi.get('/admin/conversations');
    return response.data;
  },

  async deleteConversation(convId) {
    const response = await adminApi.delete(`/admin/conversations/${convId}`);
    return response.data;
  },

  async getSystemHealth() {
    const response = await adminApi.get('/admin/health-telemetry');
    return response.data;
  },
};
