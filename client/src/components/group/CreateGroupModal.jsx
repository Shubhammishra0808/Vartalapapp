import React, { useState, useEffect } from 'react';
import { X, Users, FolderPlus, Search, Check, Shield, Image, Sparkles } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80',
];

export const CreateGroupModal = ({ onClose }) => {
  const { fetchConversations, setActiveConversation } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group Permissions
  const [permSendMessages, setPermSendMessages] = useState(true);
  const [permSendMedia, setPermSendMedia] = useState(true);
  const [permCreatePolls, setPermCreatePolls] = useState(true);
  const [permAddMembers, setPermAddMembers] = useState(true);

  // Search users to add
  useEffect(() => {
    const search = async () => {
      if (!searchUser.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await chatService.searchUsers(searchUser);
        if (res.success) setSearchResults(res.users || []);
      } catch (e) {}
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchUser]);

  const toggleMember = (u) => {
    if (selectedMembers.some((m) => m._id === u._id)) {
      setSelectedMembers((prev) => prev.filter((m) => m._id !== u._id));
    } else {
      setSelectedMembers((prev) => [...prev, u]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await chatService.createGroup({
        name: name.trim(),
        description: description.trim(),
        avatar,
        memberIds: selectedMembers.map((m) => m._id),
        permissions: {
          sendMessages: permSendMessages,
          sendMedia: permSendMedia,
          createPolls: permCreatePolls,
          addMembers: permAddMembers,
        },
      });

      if (res.success && res.group) {
        await fetchConversations();
        setActiveConversation(res.group);
        onClose();
      }
    } catch (e) {
      alert('Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-emerald-400" /> Create New Group
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Avatar Icon Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Group Avatar Icon</label>
            <div className="flex items-center space-x-3">
              <img src={avatar} alt="Group Avatar" className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow" />
              <div className="flex gap-2">
                {PRESET_AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="preset"
                    onClick={() => setAvatar(src)}
                    className={`w-10 h-10 rounded-xl object-cover cursor-pointer transition-all ${
                      avatar === src ? 'ring-2 ring-emerald-500 scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Group Name *</label>
            <input
              type="text"
              placeholder="e.g. Developers Core, UI/UX Team, Cyber Defense"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
            <textarea
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Member Search & Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Add Members ({selectedMembers.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts to add..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Selected Member Chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedMembers.map((m) => (
                  <span key={m._id} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                    {m.name}
                    <button type="button" onClick={() => toggleMember(m)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-800/40 p-2 rounded-2xl border border-white/5">
                {searchResults.map((u) => {
                  const isSelected = selectedMembers.some((m) => m._id === u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleMember(u)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs ${
                        isSelected ? 'bg-emerald-600/30 text-white' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar src={u.avatar} name={u.name} size="xs" />
                        <span>{u.name} (@{u.username})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group Permissions */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-white/5 space-y-2">
            <h4 className="text-xs font-bold text-slate-200">Member Permissions</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={permSendMessages} onChange={(e) => setPermSendMessages(e.target.checked)} className="accent-emerald-500 rounded" />
                <span>Send Messages</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={permSendMedia} onChange={(e) => setPermSendMedia(e.target.checked)} className="accent-emerald-500 rounded" />
                <span>Send Media</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={permCreatePolls} onChange={(e) => setPermCreatePolls(e.target.checked)} className="accent-emerald-500 rounded" />
                <span>Create Polls</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={permAddMembers} onChange={(e) => setPermAddMembers(e.target.checked)} className="accent-emerald-500 rounded" />
                <span>Add Members</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Create Group ({selectedMembers.length + 1} members)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
