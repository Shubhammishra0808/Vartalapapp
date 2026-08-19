import React, { useState } from 'react';
import { X, Radio, Compass } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';

export const CreateChannelModal = ({ onClose }) => {
  const { fetchConversations, setActiveConversation } = useChat();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await chatService.createChannel({
        name: name.trim(),
        username: username.trim() || undefined,
        description: description.trim(),
      });
      if (res.success && res.channel) {
        await fetchConversations();
        setActiveConversation(res.channel);
        onClose();
      }
    } catch (e) {
      alert('Failed to create channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" /> Create Broadcast Channel
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Channel Name</label>
            <input
              type="text"
              placeholder="e.g. Tech News, Daily Announcements"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Channel Username (@handle)</label>
            <div className="flex items-center bg-slate-800 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-xs text-slate-400 mr-1">@</span>
              <input
                type="text"
                placeholder="channel_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Description (Optional)</label>
            <textarea
              placeholder="Describe what your subscribers will receive..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
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
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" /> Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
