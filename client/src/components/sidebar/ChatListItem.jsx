import React from 'react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Users, Radio, Check, CheckCheck, Lock } from 'lucide-react';

export const ChatListItem = ({ conversation, isActive, onClick }) => {
  const { user } = useAuth();
  const { onlineUsers, typingUsers } = useSocket();

  const isDirect = conversation.type === 'direct';
  const isGroup = conversation.type === 'group';
  const isChannel = conversation.type === 'channel';

  // Get recipient user for direct chat
  const otherParticipant = isDirect
    ? conversation.participants?.find((p) => p.user?._id !== user?._id)?.user
    : null;

  const chatName = isDirect
    ? otherParticipant?.name || 'User'
    : isGroup
    ? conversation.groupInfo?.name || 'Group Chat'
    : conversation.channelInfo?.name || 'Channel';

  const chatAvatar = isDirect
    ? otherParticipant?.avatar
    : isGroup
    ? conversation.groupInfo?.avatar
    : conversation.channelInfo?.avatar;

  const isUserOnline = isDirect && otherParticipant?._id ? onlineUsers.has(otherParticipant._id) : false;

  const typingState = typingUsers.get(conversation._id) || (otherParticipant && typingUsers.get(otherParticipant._id));

  // Format timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const lastMsg = conversation.lastMessage;

  return (
    <div
      onClick={onClick}
      className={`px-3.5 py-3 mx-2 my-1 rounded-xl flex items-center space-x-3 cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-indigo-600/20 border border-indigo-500/30 text-white shadow-sm'
          : 'hover:bg-white/5 text-slate-200'
      }`}
    >
      <div className="relative">
        <Avatar
          src={chatAvatar}
          name={chatName}
          size="md"
          isOnline={isUserOnline}
        />
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 p-0.5 rounded-full border border-slate-900 shadow">
            <Users className="w-3 h-3 text-white" />
          </div>
        )}
        {isChannel && (
          <div className="absolute -bottom-1 -right-1 bg-cyan-600 p-0.5 rounded-full border border-slate-900 shadow">
            <Radio className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold truncate flex items-center gap-1.5">
            {chatName}
            {isDirect && otherParticipant?.publicKey && (
              <Lock className="w-3 h-3 text-indigo-400" title="End-to-End Encrypted" />
            )}
          </h4>
          <span className="text-[11px] text-slate-400 flex-shrink-0">
            {formatTime(conversation.lastMessageAt || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-400 truncate pr-2">
            {typingState?.isTyping ? (
              <span className="text-emerald-400 font-medium animate-pulse">typing...</span>
            ) : lastMsg ? (
              <span className="flex items-center gap-1">
                {lastMsg.sender === user?._id && (
                  lastMsg.status === 'read' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
                  ) : lastMsg.status === 'delivered' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                  )
                )}
                {lastMsg.type === 'poll'
                  ? '📊 Poll'
                  : lastMsg.type === 'image'
                  ? '📷 Photo'
                  : lastMsg.type === 'video'
                  ? '🎥 Video'
                  : lastMsg.type === 'voice'
                  ? '🎙️ Voice message'
                  : lastMsg.type === 'document'
                  ? '📄 Document'
                  : lastMsg.isEncrypted
                  ? '🔒 Encrypted message'
                  : lastMsg.content || 'Message'}
              </span>
            ) : (
              'Start conversation'
            )}
          </p>

          {conversation.unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full min-w-[18px] text-center shadow-sm">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
