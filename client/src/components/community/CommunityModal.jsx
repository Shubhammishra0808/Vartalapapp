import React, { useState } from 'react';
import {
  X,
  Compass,
  Users,
  Sparkles,
  Shield,
  Code,
  Gamepad2,
  Cpu,
  Layers,
  CheckCircle2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { chatService } from '../../services/chatService';

const EXPLORE_COMMUNITIES = [
  {
    id: 'comm_tech_01',
    name: '💻 Full-Stack & AI Developers',
    category: 'Technology',
    icon: Code,
    color: 'from-blue-600 to-indigo-600',
    members: 1420,
    description: 'A global community of web developers, system architects, and AI engineers discussing modern tech stacks.',
    channels: ['#general-tech', '#ai-discussions', '#code-reviews'],
  },
  {
    id: 'comm_cyber_02',
    name: '🛡️ Cybersecurity & Cryptography',
    category: 'Security',
    icon: Shield,
    color: 'from-emerald-600 to-teal-600',
    members: 890,
    description: 'End-to-End cryptography, zero-knowledge proofs, ethical hacking, and secure network infrastructure.',
    channels: ['#zero-trust', '#crypto-research', '#security-alerts'],
  },
  {
    id: 'comm_ai_03',
    name: '🤖 Next-Gen AI & Robotics',
    category: 'Artificial Intelligence',
    icon: Cpu,
    color: 'from-purple-600 to-pink-600',
    members: 2150,
    description: 'Deep learning models, agentic workflows, autonomous systems, and neural architectures.',
    channels: ['#llm-agents', '#neural-art', '#hardware'],
  },
  {
    id: 'comm_gaming_04',
    name: '🎮 Gaming & Esports Arena',
    category: 'Gaming',
    icon: Gamepad2,
    color: 'from-amber-600 to-rose-600',
    members: 3400,
    description: 'Multiplayer game lobbies, voice chat channels, strategy guides, and esports tournament streams.',
    channels: ['#lfg-squads', '#tournaments', '#clips-and-highlights'],
  },
];

export const CommunityModal = ({ onClose, onOpenCreateGroup }) => {
  const { fetchConversations, setActiveConversation } = useChat();
  const [activeCategory, setActiveCategory] = useState('All');
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [joiningId, setJoiningId] = useState(null);

  // New Community Creation sub-state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  const handleJoinCommunity = async (comm) => {
    try {
      setJoiningId(comm.id);
      const res = await chatService.createChannel({
        name: comm.name,
        description: comm.description,
        isPublic: true,
      });

      if (res.success && res.channel) {
        setJoinedCommunities((prev) => [...prev, comm.id]);
        await fetchConversations();
        setActiveConversation(res.channel);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (e) {
      alert('Could not join community.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateCommunitySubmit = async (e) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    try {
      setJoiningId('new');
      const res = await chatService.createChannel({
        name: newCommName.trim(),
        description: newCommDesc.trim(),
        isPublic: true,
      });

      if (res.success && res.channel) {
        await fetchConversations();
        setActiveConversation(res.channel);
        onClose();
      }
    } catch (e) {
      alert('Failed to create community.');
    } finally {
      setJoiningId(null);
    }
  };

  const categories = ['All', 'Technology', 'Security', 'Artificial Intelligence', 'Gaming'];

  const filteredCommunities =
    activeCategory === 'All'
      ? EXPLORE_COMMUNITIES
      : EXPLORE_COMMUNITIES.filter((c) => c.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl h-[650px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Community & Groups Hub</h3>
              <p className="text-xs text-slate-400">Discover and join global communities or create your own</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenCreateGroup) onOpenCreateGroup();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Make a Group
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isCreatingNew ? (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-2 flex-shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Community Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
              {filteredCommunities.map((comm) => {
                const Icon = comm.icon;
                const isJoined = joinedCommunities.includes(comm.id);
                return (
                  <div
                    key={comm.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${comm.color} flex items-center justify-center shadow`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold bg-white/5 px-2.5 py-1 rounded-full text-slate-300 flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-400" /> {comm.members.toLocaleString()} members
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white mb-1">{comm.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{comm.description}</p>

                      {/* Channels Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {comm.channels.map((ch, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-slate-900/60 px-2 py-0.5 rounded-md text-cyan-300 border border-white/5">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinCommunity(comm)}
                      disabled={joiningId === comm.id}
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow ${
                        isJoined
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {joiningId === comm.id ? (
                        'Joining Hub...'
                      ) : isJoined ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Joined • Open Chat
                        </>
                      ) : (
                        <>
                          Join Community <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Create Custom Community Bar */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">Want to launch a brand new public community?</span>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Create Custom Community
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCommunitySubmit} className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Start a Public Community Hub
              </h4>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Community Hub Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Prompt Engineers Hub, Robotics India"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Community Purpose / Description</label>
                <textarea
                  placeholder="Describe your community guidelines and topics..."
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Back to Explore
              </button>
              <button
                type="submit"
                disabled={joiningId === 'new'}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                {joiningId === 'new' ? 'Creating...' : 'Launch Community Hub'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
