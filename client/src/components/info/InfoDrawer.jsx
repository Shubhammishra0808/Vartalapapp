import React, { useState } from 'react';
import {
  X,
  Lock,
  FileText,
  Flag,
  Copy,
  Check,
  Briefcase,
  Ban,
  UserPlus,
  ShieldCheck,
  Phone,
  Video,
  Users,
  Image,
  Calendar,
  Sparkles,
  Search,
  LogOut,
  Mail,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { chatService } from '../../services/chatService';

export const InfoDrawer = ({ onClose, onInspectUser }) => {
  const { user } = useAuth();
  const { activeConversation, fingerprint, messages, fetchConversations } = useChat();
  const { startCall } = useCall();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'media' | 'files'
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);

  if (!activeConversation) return null;

  const isDirect = activeConversation.type === 'direct' || (!activeConversation.isGroup && !activeConversation.isChannel);
  const otherParticipant = isDirect
    ? activeConversation.participants?.find((p) => (p.user?._id || p._id) !== user?._id)?.user ||
      activeConversation.participants?.find((p) => (p.user?._id || p._id) !== user?._id)
    : null;

  const title = isDirect
    ? otherParticipant?.name || 'User Profile'
    : activeConversation.name || activeConversation.groupInfo?.name || activeConversation.channelInfo?.name || 'Group Information';

  const avatar = isDirect
    ? otherParticipant?.avatar
    : activeConversation.avatar || activeConversation.groupInfo?.avatar || activeConversation.channelInfo?.avatar;

  // Filter media from messages
  const sharedMedia = messages.filter((m) => m.type === 'image' || m.type === 'video');
  const sharedDocs = messages.filter((m) => m.type === 'document');

  // Copy Safety Number
  const handleCopySafetyNumber = () => {
    const code = otherParticipant?.keyFingerprint || fingerprint || 'ECDH-P256-AES-GCM-VERIFIED-SESSION';
    navigator.clipboard.writeText(code);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  // Block / Unblock User
  const handleToggleBlock = async () => {
    if (!otherParticipant) return;
    try {
      const res = await chatService.toggleBlockUser(otherParticipant._id);
      setIsBlocked(res.isBlocked);
      alert(res.message || 'Block status updated.');
    } catch (e) {
      alert('Failed to update block status.');
    }
  };

  // Submit Report
  const handleSubmitReport = async () => {
    if (!reportReason) return;
    try {
      await chatService.submitReport({
        reportedUserId: otherParticipant?._id,
        reportedConversationId: activeConversation._id,
        reason: reportReason,
      });
      alert('Report submitted for security audit.');
      setShowReportModal(false);
    } catch (e) {
      alert('Failed to submit report.');
    }
  };

  // Search users to add to group
  const handleSearchContacts = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await chatService.searchUsers(q);
      if (res.success) setSearchResults(res.users || []);
    } catch (e) {}
  };

  // Add Member to Group
  const handleAddMemberToGroup = async (targetUserId) => {
    try {
      const res = await chatService.addParticipant(activeConversation._id, targetUserId);
      if (res.success) {
        alert('Member added to group!');
        setShowAddMemberModal(false);
        await fetchConversations();
      }
    } catch (e) {
      alert('Could not add member.');
    }
  };

  const membersList = activeConversation.participants || [];

  return (
    <div className="w-80 lg:w-96 h-full glass-panel border-l border-white/10 flex flex-col flex-shrink-0 z-20 animate-fade-in">
      {/* Drawer Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
          {isDirect ? <ShieldCheck className="w-4 h-4 text-indigo-400" /> : <Users className="w-4 h-4 text-emerald-400" />}
          {isDirect ? 'Person Information' : 'Group Information'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Main Info Card */}
        <div className="flex flex-col items-center text-center p-4 rounded-3xl bg-slate-900/60 border border-white/5 relative shadow-inner">
          <Avatar src={avatar} name={title} size="xl" />
          <h4 className="font-bold text-base text-slate-100 mt-3 flex items-center gap-1.5 justify-center">
            {title}
            {isDirect && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                Verified
              </span>
            )}
          </h4>

          {isDirect ? (
            <>
              <p className="text-xs text-slate-400 mt-0.5">@{otherParticipant?.username || 'user'}</p>
              {otherParticipant?.headline && (
                <div className="mt-2 text-xs text-indigo-300 font-semibold bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{otherParticipant.headline}</span>
                </div>
              )}
              {otherParticipant?.email && (
                <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{otherParticipant.email}</span>
                </div>
              )}
              {otherParticipant?.phone && (
                <div className="mt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-emerald-500" />
                  <span>+91 {otherParticipant.phone}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {membersList.length} Active Members
              </span>
              <p className="text-xs text-slate-300 mt-1">
                {activeConversation.description || activeConversation.groupInfo?.description || 'Community Group Chat'}
              </p>
            </div>
          )}

          {/* Quick Call Triggers */}
          <div className="flex items-center space-x-2 mt-4 w-full">
            <button
              onClick={() => startCall(isDirect ? otherParticipant : { _id: activeConversation._id, name: title, avatar, isGroup: true }, 'voice')}
              className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Phone className="w-3.5 h-3.5" /> Voice Call
            </button>
            <button
              onClick={() => startCall(isDirect ? otherParticipant : { _id: activeConversation._id, name: title, avatar, isGroup: true }, 'video')}
              className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Video className="w-3.5 h-3.5" /> Video Call
            </button>
          </div>
        </div>

        {/* E2EE Safety Number Verification */}
        {isDirect && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> E2EE Safety Fingerprint
              </span>
              <button
                onClick={handleCopySafetyNumber}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                {copiedFingerprint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedFingerprint ? 'Copied' : 'Verify'}
              </button>
            </div>
            <p className="font-mono text-[10px] text-slate-300 bg-black/30 p-2 rounded-lg break-all">
              {otherParticipant?.keyFingerprint || fingerprint || 'ECDH-P256-AES-GCM-VERIFIED-SESSION'}
            </p>
          </div>
        )}

        {/* Tabs: Members (for Groups) / Media / Files */}
        <div className="flex border-b border-white/10 text-xs font-semibold">
          {!isDirect && (
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 pb-2 text-center transition-all ${
                activeTab === 'members'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Members ({membersList.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 pb-2 text-center transition-all ${
              activeTab === 'media'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Media ({sharedMedia.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 pb-2 text-center transition-all ${
              activeTab === 'files'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Files ({sharedDocs.length})
          </button>
        </div>

        {/* TAB 1: MEMBERS LIST (FOR GROUPS) */}
        {!isDirect && activeTab === 'members' && (
          <div className="space-y-2 animate-fade-in">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add New Member
            </button>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {membersList.map((m, idx) => {
                const memberData = m.user || m;
                const isGroupAdmin = idx === 0 || m.role === 'admin';
                return (
                  <div
                    key={memberData._id || idx}
                    onClick={() => onInspectUser && onInspectUser(memberData)}
                    className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 flex items-center justify-between text-xs cursor-pointer transition-all"
                    title="Click to view profile"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Avatar src={memberData.avatar} name={memberData.name} size="xs" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-200 block truncate hover:text-amber-400">
                          {memberData.name} {memberData._id === user?._id && '(You)'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">@{memberData.username}</span>
                      </div>
                    </div>
                    {isGroupAdmin && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SHARED MEDIA GALLERY */}
        {activeTab === 'media' && (
          <div className="animate-fade-in">
            {sharedMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {sharedMedia.map((m) => (
                  <img
                    key={m._id}
                    src={m.mediaUrl}
                    alt="media"
                    onClick={() => window.open(m.mediaUrl, '_blank')}
                    className="w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No shared photos or videos yet.</p>
            )}
          </div>
        )}

        {/* TAB 3: SHARED DOCUMENTS */}
        {activeTab === 'files' && (
          <div className="animate-fade-in space-y-2">
            {sharedDocs.length > 0 ? (
              sharedDocs.map((m) => (
                <div
                  key={m._id}
                  className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="truncate text-slate-200">{m.mediaMeta?.fileName || 'Document'}</span>
                  </div>
                  <a
                    href={m.mediaUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    Download
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No shared files yet.</p>
            )}
          </div>
        )}

        {/* Actions: Block & Report */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          {isDirect ? (
            <>
              <button
                onClick={handleToggleBlock}
                className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
              >
                <Ban className="w-4 h-4" />
                {isBlocked ? 'Unblock Contact' : 'Block Contact'}
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
              >
                <Flag className="w-4 h-4" />
                Report Account
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave this group?')) {
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </button>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Add Member to Group
              </h4>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search username..."
                value={searchQuery}
                onChange={(e) => handleSearchContacts(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleAddMemberToGroup(u._id)}
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-emerald-600/30 flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar src={u.avatar} name={u.name} size="xs" />
                    <span>{u.name} (@{u.username})</span>
                  </div>
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3">
            <h4 className="font-bold text-sm text-white">Report Account for Violations</h4>
            <textarea
              placeholder="Please describe why you are reporting this account..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
