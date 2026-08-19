import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const ActiveCallOverlay = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callDuration,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideoCall = activeCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-4 sm:p-8 animate-fade-in">
      {/* Top Bar: Caller info & Timer */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-lg z-20">
        <div className="flex items-center space-x-3">
          <Avatar
            src={activeCall.peerUser?.avatar}
            name={activeCall.peerUser?.name}
            size="sm"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {activeCall.peerUser?.name}
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" title="End-to-End Encrypted Call" />
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeCall.status === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <Wifi className="w-3.5 h-3.5" />
          <span>HD Encrypted Call</span>
        </div>
      </div>

      {/* Center Viewport */}
      <div className="flex-1 w-full max-w-4xl my-4 relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
        {isVideoCall && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Avatar
              src={activeCall.peerUser?.avatar}
              name={activeCall.peerUser?.name}
              size="xl"
              className="w-28 h-28 mx-auto ring-4 ring-indigo-500/30 animate-pulse-subtle"
            />
            <h2 className="text-2xl font-bold text-slate-100 mt-6">{activeCall.peerUser?.name}</h2>
            <p className="text-sm text-indigo-400 mt-1 font-medium">
              {activeCall.status === 'calling' ? 'Ringing...' : 'Secure Voice Call Connected'}
            </p>
          </div>
        )}

        {/* Local Video PIP Preview */}
        {isVideoCall && localStream && (
          <div className="absolute bottom-4 right-4 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-black z-30">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Dock */}
      <div className="flex items-center space-x-4 bg-slate-900/80 backdrop-blur-md px-8 py-3.5 rounded-full border border-white/10 shadow-2xl z-20">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-full transition-transform active:scale-95 shadow ${
            isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Video */}
        {isVideoCall && (
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-transform active:scale-95 shadow ${
              isVideoOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>
        )}

        {/* Screen Sharing */}
        {isVideoCall && (
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-transform active:scale-95 shadow ${
              isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Share Screen"
          >
            <ScreenShare className="w-5 h-5" />
          </button>
        )}

        {/* End Call */}
        <button
          onClick={endCall}
          className="p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform active:scale-95 hover:scale-105 shadow-xl"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
