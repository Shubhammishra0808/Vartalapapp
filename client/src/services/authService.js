import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.accessToken) {
      localStorage.setItem('securechat_token', response.data.accessToken);
      localStorage.setItem('securechat_refresh_token', response.data.refreshToken);
      localStorage.setItem('securechat_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.accessToken) {
      localStorage.setItem('securechat_token', response.data.accessToken);
      localStorage.setItem('securechat_refresh_token', response.data.refreshToken);
      localStorage.setItem('securechat_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Email Verification
  async sendEmailOtp(email) {
    const response = await api.post('/auth/send-email-otp', { email });
    return response.data;
  },

  async verifyEmailOtp(email, code) {
    const response = await api.post('/auth/verify-email-otp', { email, code });
    return response.data;
  },

  // Phone Verification
  async sendPhoneOtp(phone) {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },

  async verifyPhoneOtp(phone, otp, name) {
    const response = await api.post('/auth/verify-otp', { phone, otp, name });
    if (response.data.accessToken) {
      localStorage.setItem('securechat_token', response.data.accessToken);
      localStorage.setItem('securechat_refresh_token', response.data.refreshToken);
      localStorage.setItem('securechat_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // QR Code Login
  async getQrCode() {
    const response = await api.get('/auth/qr-code');
    return response.data;
  },

  async qrLogin(qrToken, username) {
    const response = await api.post('/auth/qr-login', { qrToken, username });
    if (response.data.accessToken) {
      localStorage.setItem('securechat_token', response.data.accessToken);
      localStorage.setItem('securechat_refresh_token', response.data.refreshToken);
      localStorage.setItem('securechat_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('securechat_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.warn('Logout API warning', e);
    } finally {
      localStorage.removeItem('securechat_token');
      localStorage.removeItem('securechat_refresh_token');
      localStorage.removeItem('securechat_user');
      localStorage.removeItem('securechat_private_key');
      localStorage.removeItem('securechat_public_key');
      localStorage.removeItem('securechat_key_fingerprint');
      localStorage.removeItem('securechat_e2ee_pub');
      localStorage.removeItem('securechat_e2ee_priv');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
