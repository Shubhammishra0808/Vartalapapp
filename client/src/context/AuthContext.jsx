import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('securechat_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('securechat_token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('securechat_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session check failed, clearing storage', err.message);
          localStorage.removeItem('securechat_token');
          localStorage.removeItem('securechat_refresh_token');
          localStorage.removeItem('securechat_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const loginWithPhoneOtp = async (phone, otp, name) => {
    const res = await authService.verifyPhoneOtp(phone, otp, name);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const loginWithQr = async (qrToken, username) => {
    const res = await authService.qrLogin(qrToken, username);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('securechat_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithPhoneOtp,
        loginWithQr,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
