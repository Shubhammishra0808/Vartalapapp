import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { ThemeProvider } from './context/ThemeContext';

import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

// Public Route: Redirects logged-in users directly to chat (/), otherwise shows Login/Register
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#090D16] text-amber-400 font-semibold text-xs animate-pulse">
        Initializing Vaartalaap cryptography & session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Protected Route: Redirects non-logged-in users directly to login (/login), otherwise shows Chat
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#090D16] text-amber-400 font-semibold text-xs animate-pulse">
        Initializing Vaartalaap cryptography & session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <CallProvider>
                <Routes>
                  {/* Public Authentication Routes for New Users */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <AuthPage initialTab="login" />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <AuthPage initialTab="register" />
                      </PublicRoute>
                    }
                  />

                  {/* Dedicated Admin Portal */}
                  <Route path="/admin" element={<AdminDashboard />} />

                  {/* Protected Chat Application for Logged In Users */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </CallProvider>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
