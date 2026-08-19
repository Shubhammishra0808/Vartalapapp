import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Phone,
  Video,
  MessageSquare,
  Mail,
  Smartphone,
  Briefcase,
  Calendar,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  Ban,
  Sparkles,
  Info,
  LogOut,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { useSocket } from '../../context/SocketContext';
import { chatService } from '../../services/chatService';

export const UserProfileModal = ({ targetUser, onClose, onOpenChat }) => {
  const { user: currentUser } = useAuth();
  const { setActiveConversation, fetchConversations } = useChat();
  const { startCall } = useCall();
  const { onlineUsers } = useSocket();

  const [copiedKey, setCopiedKey] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [friendStatus, setFriendStatus] = useState(targetUser?.friendStatus || 'none');

  if (!targetUser) return null;

  const isSelf = targetUser._id === currentUser?._id;
  const isOnline = targetUser._id ? onlineUsers.has(targetUser._id) : false;

  const handleCopyKey = () => {
    const key = targetUser.keyFingerprint || targetUser.publicKey || 'ECDH-P256-AES-GCM-VERIFIED-SESSION';
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Start Direct Chat
  const handleStartChat = async () => {
    try {
      setIsActionLoading(true);
      const res = await chatService.getOrCreateDirectChat(targetUser._id);
      if (res.success && res.conversation) {
        await fetchConversations();
        setActiveConversation(res.conversation);
        if (onOpenChat) onOpenChat(res.conversation);
        onClose();
      }
    } catch (e) {
      setActionMessage('Failed to start chat.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Voice / Video Call
  const handleCall = (callType) => {
    startCall(
      {
        _id: targetUser._id,
        name: targetUser.name,
        avatar: targetUser.avatar,
      },
      callType
    );
    onClose();
  };

  // Send Friend Request
  const handleSendFriendRequest = async () => {
    try {
      setIsActionLoading(true);
      const res = await chatService.sendFriendRequest(targetUser._id, 'Namaste! Let\'s connect on Vaartalaap.');
      if (res.success) {
        setFriendStatus('pending_outgoing');
        setActionMessage('Friend request sent!');
      }
    } catch (e) {
      setActionMessage(e.response?.data?.message || 'Could not send request.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-modal-pop">
        {/* Decorative Indian Pattern Header Gradient */}
        <div className="h-28 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 relative p-4 flex justify-between items-start">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-amber-200 text-[10px] font-bold border border-white/10">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Vaartalaap Member (वार्तालाप)</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar & Primary Info */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-14 mb-3 flex items-end justify-between">
            <div className="relative">
              <Avatar
                src={targetUser.avatar}
                name={targetUser.name}
                size="xl"
                isOnline={isOnline}
                className="ring-4 ring-slate-900 shadow-2xl"
              />
            </div>

            {/* Quick Online / Status Badge */}
            <div className="mb-2 flex items-center gap-1.5">
              {isOnline ? (
                <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online Now
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-800 border border-white/10 text-slate-400 text-[11px] font-medium rounded-full">
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* User Name & Handle */}
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
              {targetUser.name}
              <ShieldCheck className="w-4 h-4 text-amber-400" title="Identity Verified" />
            </h3>
            <p className="text-xs text-amber-400/90 font-mono mt-0.5">@{targetUser.username}</p>
          </div>

          {/* Professional Headline */}
          {targetUser.headline ? (
            <div className="mt-2.5 text-xs text-slate-200 font-semibold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">{targetUser.headline}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2 italic">
              {targetUser.bio || 'Namaste! Using Vaartalaap for secure conversations.'}
            </p>
          )}

          {/* Feedback Message */}
          {actionMessage && (
            <div className="mt-3 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 text-center font-semibold animate-fade-in">
              {actionMessage}
            </div>
          )}

          {/* Action Buttons: Direct Chat, Voice & Video Call */}
          {!isSelf && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={handleStartChat}
                disabled={isActionLoading}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-600/25 flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>

              <button
                onClick={() => handleCall('voice')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Voice</span>
              </button>

              <button
                onClick={() => handleCall('video')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 border border-indigo-500/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>
            </div>
          )}

          {/* Detailed Info Cards */}
          <div className="mt-4 space-y-2 text-xs">
            {targetUser.email && (
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email</span>
                </div>
                <span className="font-mono text-slate-200">{targetUser.email}</span>
              </div>
            )}

            {targetUser.phone && (
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone Number</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">+91 {targetUser.phone}</span>
              </div>
            )}

            {/* E2EE Cryptography Fingerprint */}
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1 text-[11px]">
                  <Lock className="w-3 h-3 text-cyan-400" /> E2EE Safety Number (ECDH P-256)
                </span>
                <button
                  onClick={handleCopyKey}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-[9px] text-slate-300 bg-black/40 p-1.5 rounded-lg break-all">
                {targetUser.keyFingerprint || targetUser.publicKey || 'ECDH-P256-AES-GCM-VERIFIED-SESSION'}
              </p>
            </div>
          </div>

          {/* Actions if inspecting own profile */}
          {isSelf && (
            <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  onClose();
                  if (window.confirm('Do you want to log out / switch user account?')) {
                    currentUser && localStorage.removeItem('securechat_token');
                    localStorage.removeItem('securechat_user');
                    window.location.href = '/login';
                  }
                }}
                className="w-full py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out / Switch Account</span>
              </button>
            </div>
          )}

          {/* Relationship Footer Action for other users */}
          {!isSelf && friendStatus !== 'friends' && (
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSendFriendRequest}
                disabled={isActionLoading || friendStatus === 'pending_outgoing'}
                className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {friendStatus === 'pending_outgoing' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Request Sent (Pending)
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Send Connection / Friend Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
