import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Avatar
            src={incomingCall.caller?.avatar}
            name={incomingCall.caller?.name}
            size="xl"
            className="mx-auto animate-pulse"
          />

          <h3 className="text-xl font-bold text-slate-100 mt-4">
            {incomingCall.caller?.name}
          </h3>
          <p className="text-xs text-indigo-400 font-semibold mt-1 flex items-center justify-center gap-1.5">
            {incomingCall.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call...
          </p>

          <div className="flex items-center justify-center space-x-6 mt-8">
            {/* Decline */}
            <button
              onClick={rejectCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105"
              title="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105 animate-bounce"
              title="Accept Call"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
