import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageComposer } from '../components/chat/MessageComposer';
import { InfoDrawer } from '../components/info/InfoDrawer';
import { IncomingCallModal } from '../components/call/IncomingCallModal';
import { ActiveCallOverlay } from '../components/call/ActiveCallOverlay';
import { StoryViewerModal } from '../components/story/StoryViewerModal';
import { StoryCreatorModal } from '../components/story/StoryCreatorModal';
import { CreateGroupModal } from '../components/group/CreateGroupModal';
import { CreateChannelModal } from '../components/group/CreateChannelModal';
import { CommunityModal } from '../components/community/CommunityModal';
import { NewChatModal } from '../components/contacts/NewChatModal';
import { RequestsModal } from '../components/contacts/RequestsModal';
import { SettingsModal } from '../components/settings/SettingsModal';
import { UserProfileModal } from '../components/common/UserProfileModal';
import { CopyrightBadge } from '../components/common/CopyrightBadge';
import {
  Shield,
  MessageSquare,
  Compass,
  Users,
  UserPlus,
  Sparkles,
  MessageCircle,
  Lock,
} from 'lucide-react';

export const ChatPage = () => {
  const { activeConversation, setActiveConversation, infoDrawerOpen, setInfoDrawerOpen } = useChat();
  const { activeWallpaperClass } = useTheme();

  // Modals state
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [inspectUser, setInspectUser] = useState(null);

  return (
    <div className={`h-screen w-screen flex overflow-hidden ${activeWallpaperClass} relative select-none`}>
      {/* Left Sidebar */}
      <div
        className={`${
          activeConversation ? 'hidden md:flex' : 'flex'
        } w-full md:w-[380px] lg:w-[420px] h-full flex-shrink-0 z-20`}
      >
        <Sidebar
          onOpenNewChat={() => setShowNewChat(true)}
          onOpenCreateGroup={() => setShowCreateGroup(true)}
          onOpenCreateChannel={() => setShowCreateChannel(true)}
          onOpenCommunity={() => setShowCommunityModal(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenStoryCreator={() => setShowStoryCreator(true)}
          onOpenRequests={() => setShowRequestsModal(true)}
          onSelectUserStory={(storyGroup) => setSelectedUserStory(storyGroup)}
          onInspectUser={(target) => setInspectUser(target)}
        />
      </div>

      {/* Main Chat Center Viewport */}
      <div
        className={`${
          !activeConversation ? 'hidden md:flex' : 'flex'
        } flex-1 h-full flex flex-col min-w-0 relative z-10 overflow-hidden`}
      >
        {activeConversation ? (
          <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
            <ChatHeader
              onBack={() => setActiveConversation(null)}
              onOpenInfo={() => setInfoDrawerOpen(true)}
              onInspectUser={(target) => setInspectUser(target)}
            />
            <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
              <MessageList onInspectUser={(target) => setInspectUser(target)} />
            </div>
            <MessageComposer />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
            {/* Animated Indian Theme Logo */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center mb-5 shadow-2xl animate-float">
              <MessageCircle className="w-10 h-10 text-amber-400 fill-amber-400/20" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Vaartalaap
              </h2>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> E2EE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-8 leading-relaxed">
              Next-Gen Secure Messenger. Select any conversation from the sidebar or click below to connect with friends and chat with military-grade ECDH & AES-256 encryption.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-3.5 bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Users className="w-4 h-4" />
                <span>Find Friends & Connect</span>
              </button>

              <button
                onClick={() => setShowRequestsModal(true)}
                className="p-3.5 bg-slate-800/90 hover:bg-slate-800 text-amber-300 hover:text-white rounded-2xl text-xs font-bold border border-amber-500/20 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Connection Requests</span>
              </button>

              <button
                onClick={() => setShowCommunityModal(true)}
                className="p-3.5 bg-slate-800/90 hover:bg-slate-800 text-cyan-300 hover:text-white rounded-2xl text-xs font-bold border border-cyan-500/20 hover:border-cyan-500/50 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Explore Communities</span>
              </button>

              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-3.5 bg-slate-800/90 hover:bg-slate-800 text-emerald-300 hover:text-white rounded-2xl text-xs font-bold border border-emerald-500/20 hover:border-emerald-500/50 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Create Group Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Slide-out Info Drawer */}
      {infoDrawerOpen && activeConversation && (
        <div className="w-80 h-full flex-shrink-0 z-30 border-l border-white/10 bg-slate-900/95 backdrop-blur-xl animate-slide-left">
          <InfoDrawer
            onClose={() => setInfoDrawerOpen(false)}
            onInspectUser={(target) => setInspectUser(target)}
          />
        </div>
      )}

      {/* Global Modals & Overlays */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onInspectUser={(target) => setInspectUser(target)}
        />
      )}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showCreateChannel && <CreateChannelModal onClose={() => setShowCreateChannel(false)} />}
      {showCommunityModal && (
        <CommunityModal
          onClose={() => setShowCommunityModal(false)}
          onOpenCreateGroup={() => setShowCreateGroup(true)}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStoryCreator && <StoryCreatorModal onClose={() => setShowStoryCreator(false)} />}
      {showRequestsModal && <RequestsModal onClose={() => setShowRequestsModal(false)} />}
      {selectedUserStory && (
        <StoryViewerModal
          storyGroup={selectedUserStory}
          onClose={() => setSelectedUserStory(null)}
        />
      )}

      {/* Dedicated Interactive User Profile Modal */}
      {inspectUser && (
        <UserProfileModal
          targetUser={inspectUser}
          onClose={() => setInspectUser(null)}
          onOpenChat={(conv) => setActiveConversation(conv)}
        />
      )}

      {/* WebRTC Audio/Video Call Overlays */}
      <IncomingCallModal />
      <ActiveCallOverlay />

      {/* Prominent Floating Attribution Badge */}
      <CopyrightBadge floating={true} />
    </div>
  );
};
