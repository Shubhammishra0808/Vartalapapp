import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // convId -> { name, isTyping }

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('securechat_token');
    const socketBase = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : window.location.origin);
    const newSocket = io(socketBase, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server as', user.username);
    });

    newSocket.on('user:status', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    newSocket.on('typing:status', ({ conversationId, userId, name, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(conversationId || userId, { name, isTyping: true });
        } else {
          next.delete(conversationId || userId);
        }
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  const emitTyping = (conversationId, recipientId, isTyping) => {
    if (!socket) return;
    if (isTyping) {
      socket.emit('typing:start', { conversationId, recipientId });
    } else {
      socket.emit('typing:stop', { conversationId, recipientId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
