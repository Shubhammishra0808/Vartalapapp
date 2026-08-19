import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Radio,
  Phone,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  Compass,
  UserPlus,
  Sun,
  Moon,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { ChatListItem } from './ChatListItem';
import { StoryCarousel } from './StoryCarousel';
import { chatService } from '../../services/chatService';

export const Sidebar = ({
  onOpenSettings,
  onOpenNewChat,
  onOpenCreateGroup,
  onOpenCreateChannel,
  onOpenRequests,
  onOpenCommunity,
  onOpenStoryCreator,
  onSelectUserStory,
  onInspectUser,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, conversations, activeConversation, setActiveConversation } = useChat();
  const { themeMode, toggleThemeMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out / switch account? (क्या आप लॉगआउट करना चाहते हैं?)')) {
      await logout();
      navigate('/login');
    }
  };

  const checkRequests = async () => {
    try {
      const res = await chatService.getFriendRequests();
      if (res.success && res.incoming) {
        setPendingRequestsCount(res.incoming.length);
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkRequests();
    const interval = setInterval(checkRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'direct', label: 'Direct', icon: MessageSquare },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'channels', label: 'Channels', icon: Radio },
    { id: 'calls', label: 'Calls', icon: Phone },
  ];

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'direct' && c.isGroup) return false;
    if (activeTab === 'groups' && (!c.isGroup || c.isChannel)) return false;
    if (activeTab === 'channels' && !c.isChannel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = c.isGroup ? c.name : c.participants?.find((p) => (p.user?._id || p._id) !== user?._id)?.name || '';
      return name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col glass-panel border-r border-white/10 flex-shrink-0 relative z-20">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div
          className="flex items-center space-x-3 cursor-pointer min-w-0 group hover:opacity-90 transition-opacity"
          onClick={() => {
            if (user && onInspectUser) onInspectUser(user);
            else onOpenSettings();
          }}
          title="Click to view & edit your profile"
        >
          <Avatar
            src={user?.avatar}
            name={user?.name}
            size="md"
            isOnline={true}
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-100 truncate flex items-center gap-1">
              {user?.name}
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" title="Security Verified" />
            </h3>
            <p className="text-xs text-amber-400/90 font-mono truncate">
              {user?.headline || `@${user?.username}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 relative flex-shrink-0">
          {/* Quick Add Friend / Discover Button */}
          <button
            onClick={onOpenNewChat}
            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
            title="Find & Add Friends"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Friend</span>
          </button>

          {/* Connection Requests Notification Button */}
          <button
            onClick={onOpenRequests}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-indigo-400 transition-all relative active:scale-95"
            title="Incoming Connection & Friend Requests"
          >
            <Users className="w-4 h-4" />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-full text-[9px] font-extrabold shadow ring-2 ring-slate-900 animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {/* Quick Dark / Light Mode Toggle */}
          <button
            onClick={toggleThemeMode}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-amber-400 transition-all active:scale-95"
            title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Logout / Switch User Button */}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all active:scale-95"
            title="Log Out / Switch Account (लॉगआउट)"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Plus Create Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all active:scale-95"
            title="Create New..."
          >
            <Plus className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 glass-dropdown rounded-2xl py-2 z-50 animate-fade-in shadow-2xl border border-white/10">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenNewChat();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:text-white flex items-center gap-2.5"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" /> New 1-on-1 Chat
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenCreateGroup();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-emerald-600/20 hover:text-white flex items-center gap-2.5"
              >
                <Users className="w-4 h-4 text-emerald-400" /> Create New Group
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenCommunity) onOpenCommunity();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-cyan-600/20 hover:text-white flex items-center gap-2.5"
              >
                <Compass className="w-4 h-4 text-cyan-400" /> Explore Communities
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenCreateChannel();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:text-white flex items-center gap-2.5"
              >
                <Radio className="w-4 h-4 text-indigo-400" /> Create Channel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stories Section */}
      <div className="border-b border-white/5 py-2">
        <StoryCarousel
          onOpenCreator={onOpenStoryCreator}
          onSelectStory={onSelectUserStory}
        />
      </div>

      {/* Search Input Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations, groups, or communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pb-2 flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Community Banner Teaser */}
      <div className="px-3 mb-1">
        <div
          onClick={onOpenCommunity}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-cyan-950/60 border border-indigo-500/20 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                Explore Communities
              </h4>
              <p className="text-[10px] text-slate-400">Tech Hub, Cyber Security, Gaming</p>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ChatListItem
              key={conv._id}
              conversation={conv}
              isActive={activeConversation?._id === conv._id}
              onClick={() => setActiveConversation(conv)}
            />
          ))
        ) : (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-slate-400">No active conversations found.</p>
            <button
              onClick={onOpenCommunity}
              className="mt-3 px-4 py-2 bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-600/40 transition-all inline-flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" /> Explore Public Communities
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar: Settings & Logout */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 text-xs font-medium text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all flex-1 min-w-0"
            title="App Settings"
          >
            <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Settings & Themes</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl border border-red-500/20 transition-all flex-shrink-0"
            title="Log Out & Switch User"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>

        <div className="text-[10px] text-center text-slate-400 select-none pt-1">
          <span>Developed with ❤️ by </span>
          <span className="text-amber-400 font-bold">Shubham Mishra</span>
        </div>
      </div>
    </div>
  );
};
