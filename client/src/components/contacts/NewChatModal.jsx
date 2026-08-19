import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  MessageSquare,
  Shield,
  Lock,
  UserPlus,
  Clock,
  Check,
  Sparkles,
  Users,
  Send,
  UserCheck,
  Compass,
} from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const NewChatModal = ({ onClose, onOpenRequests, onInspectUser }) => {
  const { setActiveConversation, fetchConversations } = useChat();
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'friends'
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Selected user to send request with custom note
  const [requestTargetUser, setRequestTargetUser] = useState(null);
  const [requestNote, setRequestNote] = useState('Hey! Let\'s connect and chat on SecureChat.');

  const loadUsers = async (searchVal = '') => {
    try {
      setLoading(true);
      const res = await chatService.searchUsers(searchVal);
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(query);
  }, [query]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // 1. Send Friend Request
  const handleSendFriendRequest = async (targetUser, customMsg) => {
    try {
      setActionLoadingId(targetUser._id);
      const res = await chatService.sendFriendRequest(targetUser._id, customMsg || 'Hey! Let\'s connect on SecureChat.');
      if (res.success) {
        showToast(`Friend request sent to ${targetUser.name}!`);
        setRequestTargetUser(null);
        await loadUsers(query);
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Could not send friend request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Cancel Sent Friend Request
  const handleCancelRequest = async (targetUser) => {
    if (!targetUser.requestId) return;
    try {
      setActionLoadingId(targetUser._id);
      const res = await chatService.cancelFriendRequest(targetUser.requestId);
      if (res.success) {
        showToast(`Request to ${targetUser.name} cancelled.`);
        await loadUsers(query);
      }
    } catch (e) {
      showToast('Could not cancel request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Accept Incoming Friend Request & Open Chat
  const handleAcceptRequest = async (targetUser) => {
    if (!targetUser.requestId) return;
    try {
      setActionLoadingId(targetUser._id);
      const res = await chatService.respondFriendRequest(targetUser.requestId, 'accept');
      if (res.success) {
        showToast(`Connected with ${targetUser.name}! Opening chat...`);
        await fetchConversations();
        if (res.conversation) {
          setActiveConversation(res.conversation);
          onClose();
        } else {
          await loadUsers(query);
        }
      }
    } catch (e) {
      showToast('Could not accept request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Open Direct Chat
  const handleOpenDirectChat = async (targetUser) => {
    try {
      setActionLoadingId(targetUser._id);
      const res = await chatService.getOrCreateDirectChat(targetUser._id);
      if (res.success && res.conversation) {
        await fetchConversations();
        setActiveConversation(res.conversation);
        onClose();
      }
    } catch (e) {
      showToast('Could not open conversation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (activeTab === 'friends') return u.friendStatus === 'friends';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <span>Find Friends & Start Chat</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Connect with users & start encrypted conversations</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {toastMsg && (
          <div className="mb-3 p-2.5 rounded-2xl bg-indigo-600/90 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg('')} className="ml-2 text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-3 text-xs font-bold border border-white/5">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'discover'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover & Search ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'friends'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Friends ({users.filter((u) => u.friendStatus === 'friends').length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username (@alice) or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Users List Viewport */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {loading ? (
            <div className="text-center py-12 text-xs text-indigo-400 font-semibold animate-pulse space-y-2">
              <Compass className="w-8 h-8 mx-auto animate-spin" />
              <p>Discovering registered users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const isLoading = actionLoadingId === u._id;
              const isFriend = u.friendStatus === 'friends';
              const isOutgoing = u.friendStatus === 'pending_outgoing';
              const isIncoming = u.friendStatus === 'pending_incoming';

              return (
                <div
                  key={u._id}
                  className="p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div
                    className="flex items-center space-x-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onInspectUser && onInspectUser(u)}
                    title="Click to view full profile"
                  >
                    <Avatar src={u.avatar} name={u.name} size="md" isOnline={u.isOnline} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-100 truncate hover:text-amber-400 transition-colors">
                          {u.name}
                        </h4>
                        {u.publicKey && (
                          <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> E2EE
                          </span>
                        )}
                        {isFriend && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-bold">
                            Friends ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono">@{u.username}</p>
                      {u.headline && (
                        <p className="text-[10px] text-amber-300/80 truncate max-w-xs">{u.headline}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions according to relationship */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {isFriend ? (
                      <button
                        onClick={() => handleOpenDirectChat(u)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                    ) : isOutgoing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Sent
                        </span>
                        <button
                          onClick={() => handleCancelRequest(u)}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-xl text-[11px] font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isIncoming ? (
                      <button
                        onClick={() => handleAcceptRequest(u)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept & Chat
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRequestTargetUser(u)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                          title="Send a personalized friend request"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Friend
                        </button>
                        <button
                          onClick={() => handleOpenDirectChat(u)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-white/10 flex items-center gap-1 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-14 text-slate-400 text-xs">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-slate-300">
                {activeTab === 'friends' ? 'No friends added yet' : 'No users found'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {activeTab === 'friends'
                  ? 'Switch to "Discover & Search" above to send friend requests!'
                  : 'Try searching with a different username or name.'}
              </p>
            </div>
          )}
        </div>

        {/* Send Friend Request Modal Note Popup */}
        {requestTargetUser && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl p-6 rounded-3xl flex flex-col justify-center animate-fade-in z-20">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Send Friend Request to {requestTargetUser.name}
              </h4>
              <button
                onClick={() => setRequestTargetUser(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Add a friendly invitation message. When they accept, you'll be connected and can start chatting immediately!
            </p>

            <textarea
              rows={3}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Write a message..."
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-4 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestTargetUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === requestTargetUser._id}
                onClick={() => handleSendFriendRequest(requestTargetUser, requestNote)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {actionLoadingId === requestTargetUser._id ? 'Sending...' : 'Send Friend Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
