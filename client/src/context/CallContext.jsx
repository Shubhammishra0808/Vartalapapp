import React, { createContext, useContext } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const rtc = useWebRTC(user);

  return <CallContext.Provider value={rtc}>{children}</CallContext.Provider>;
};

export const useCall = () => useContext(CallContext);
