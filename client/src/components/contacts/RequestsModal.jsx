import React, { useState, useEffect } from 'react';
import { X, UserCheck, UserX, Shield, Check, Ban, Clock, UserPlus, Trash2 } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const RequestsModal = ({ onClose }) => {
  const { fetchConversations, setActiveConversation } = useChat();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing' | 'blocked'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [blockedList, setBlockedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const reqRes = await chatService.getFriendRequests();
      if (reqRes.success) {
        setIncoming(reqRes.incoming || []);
        setOutgoing(reqRes.outgoing || []);
      }
      const blockRes = await chatService.getBlockedUsers();
      if (blockRes.success) {
        setBlockedList(blockRes.blockedUsers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Accept or Decline Request
  const handleRespond = async (requestId, action) => {
    try {
      setActionLoadingId(requestId);
      const res = await chatService.respondFriendRequest(requestId, action);
      if (res.success) {
        if (action === 'accept') {
          await fetchConversations();
          if (res.conversation) {
            setActiveConversation(res.conversation);
            onClose();
            return;
          }
        }
        await loadData();
      }
    } catch (e) {
      alert('Operation failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel Outgoing Request
  const handleCancelOutgoing = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await chatService.cancelFriendRequest(requestId);
      if (res.success) {
        await loadData();
      }
    } catch (e) {
      alert('Failed to cancel request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Unblock User
  const handleUnblock = async (userId) => {
    try {
      setActionLoadingId(userId);
      await chatService.toggleBlockUser(userId);
      await loadData();
    } catch (e) {
      alert('Failed to unblock.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Connection Requests
            </h3>
            <p className="text-xs text-slate-400">Manage incoming & outgoing friend requests</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-4 text-xs font-bold border border-white/5">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'incoming'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Incoming ({incoming.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'outgoing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sent ({outgoing.length})
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'blocked'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked ({blockedList.length})
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="text-center py-12 text-xs text-indigo-400 font-semibold animate-pulse">
              Loading requests...
            </div>
          ) : activeTab === 'incoming' ? (
            incoming.length > 0 ? (
              incoming.map((req) => (
                <div key={req._id} className="p-3.5 rounded-2xl bg-slate-800/70 border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Avatar src={req.sender?.avatar} name={req.sender?.name} size="md" isOnline={req.sender?.isOnline} />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{req.sender?.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">@{req.sender?.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {req.message && (
                    <p className="text-xs text-slate-200 bg-black/30 p-2.5 rounded-xl italic border border-white/5">
                      "{req.message}"
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      disabled={actionLoadingId === req._id}
                      onClick={() => handleRespond(req._id, 'decline')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                    >
                      Decline
                    </button>
                    <button
                      disabled={actionLoadingId === req._id}
                      onClick={() => handleRespond(req._id, 'accept')}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all hover:scale-105"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {actionLoadingId === req._id ? 'Connecting...' : 'Accept & Start Chat'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-14 text-xs text-slate-400">
                <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-300">No incoming requests</p>
                <p className="text-[11px] text-slate-500 mt-1">When someone sends you a friend request, it will show up here.</p>
              </div>
            )
          ) : activeTab === 'outgoing' ? (
            outgoing.length > 0 ? (
              outgoing.map((req) => (
                <div key={req._id} className="p-3.5 rounded-2xl bg-slate-800/70 border border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar src={req.recipient?.avatar} name={req.recipient?.name} size="md" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{req.recipient?.name}</h4>
                      <p className="text-[11px] text-slate-400">@{req.recipient?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-500/20">
                      Pending
                    </span>
                    <button
                      disabled={actionLoadingId === req._id}
                      onClick={() => handleCancelOutgoing(req._id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold transition-all"
                      title="Cancel Request"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-14 text-xs text-slate-400">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-300">No outgoing requests</p>
                <p className="text-[11px] text-slate-500 mt-1">You have no pending requests sent to others.</p>
              </div>
            )
          ) : (
            blockedList.length > 0 ? (
              blockedList.map((u) => (
                <div key={u._id} className="p-3.5 rounded-2xl bg-slate-800/70 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar src={u.avatar} name={u.name} size="md" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{u.name}</h4>
                      <p className="text-[11px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                  <button
                    disabled={actionLoadingId === u._id}
                    onClick={() => handleUnblock(u._id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Unblock
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-14 text-xs text-slate-400">
                <Ban className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-300">No blocked users</p>
                <p className="text-[11px] text-slate-500 mt-1">Your blocked users list is completely clear.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
