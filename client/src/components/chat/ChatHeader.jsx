import React from 'react';
import { Phone, Video, Info, Lock, ArrowLeft, Shield, Users, Radio, User } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';

export const ChatHeader = ({ onBack, onOpenInfo, onInspectUser }) => {
  const { user } = useAuth();
  const { activeConversation, infoDrawerOpen, setInfoDrawerOpen } = useChat();
  const { onlineUsers, typingUsers } = useSocket();
  const { startCall } = useCall();

  if (!activeConversation) return null;

  const isDirect = activeConversation.type === 'direct' || (!activeConversation.isGroup && !activeConversation.isChannel);
  const otherParticipant = isDirect
    ? activeConversation.participants?.find((p) => (p.user?._id || p._id) !== user?._id)?.user ||
      activeConversation.participants?.find((p) => (p.user?._id || p._id) !== user?._id)
    : null;

  const chatName = isDirect
    ? otherParticipant?.name || 'User'
    : activeConversation.name || activeConversation.groupInfo?.name || activeConversation.channelInfo?.name || 'Group';

  const chatAvatar = isDirect
    ? otherParticipant?.avatar
    : activeConversation.avatar || activeConversation.groupInfo?.avatar || activeConversation.channelInfo?.avatar;

  const isOnline = isDirect && otherParticipant?._id ? onlineUsers.has(otherParticipant._id) : false;
  const typing = typingUsers.get(activeConversation._id) || (otherParticipant && typingUsers.get(otherParticipant._id));

  // Universal Call Trigger (Direct 1-on-1 or Group Call)
  const handleInitiateCall = (callType) => {
    if (isDirect && otherParticipant) {
      startCall(otherParticipant, callType);
    } else {
      startCall(
        {
          _id: activeConversation._id,
          name: chatName,
          avatar: chatAvatar,
          isGroup: true,
        },
        callType
      );
    }
  };

  const handleHeaderClick = () => {
    if (isDirect && otherParticipant && onInspectUser) {
      onInspectUser(otherParticipant);
    } else if (onOpenInfo) {
      onOpenInfo();
    } else {
      setInfoDrawerOpen(!infoDrawerOpen);
    }
  };

  return (
    <div className="h-16 px-3 sm:px-4 glass-panel border-b border-white/10 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {/* Universal Back Button */}
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-all flex items-center gap-1 active:scale-95 group flex-shrink-0"
          title="Back to All Chats"
        >
          <ArrowLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold text-slate-300 hidden sm:inline">Back</span>
        </button>

        <div
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0 hover:opacity-90 transition-opacity"
          onClick={handleHeaderClick}
          title="Click to view full profile & user info"
        >
          <Avatar
            src={chatAvatar}
            name={chatName}
            size="md"
            isOnline={isOnline}
          />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
              {chatName}
              {isDirect && (
                <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> E2EE
                </span>
              )}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {typing?.isTyping ? (
                <span className="text-emerald-400 font-medium animate-pulse">typing...</span>
              ) : isDirect ? (
                isOnline ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </span>
                ) : (
                  'Offline • Click to inspect profile'
                )
              ) : activeConversation.isChannel ? (
                `${activeConversation.subscribers?.length || activeConversation.channelInfo?.subscribersCount || 1} subscribers`
              ) : (
                `${activeConversation.participants?.length || 0} members • Click for info`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Voice Call, Video Call, and Profile / Info */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
        {/* Voice Call Button */}
        <button
          onClick={() => handleInitiateCall('voice')}
          className="p-2 sm:p-2.5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all active:scale-95 shadow-sm"
          title={isDirect ? 'Voice Call (WebRTC)' : 'Start Group Voice Conference'}
        >
          <Phone className="w-4 h-4" />
        </button>

        {/* Video Call Button */}
        <button
          onClick={() => handleInitiateCall('video')}
          className="p-2 sm:p-2.5 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 rounded-xl transition-all active:scale-95 shadow-sm"
          title={isDirect ? 'Video Call (WebRTC)' : 'Start Group Video Conference'}
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Profile Inspection / Information Drawer Toggle Button */}
        <button
          onClick={handleHeaderClick}
          className="p-2 sm:p-2.5 hover:bg-amber-600/20 text-slate-300 hover:text-amber-400 rounded-xl transition-all active:scale-95"
          title={isDirect ? 'View Profile Details' : 'Group Information'}
        >
          {isDirect ? <User className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
