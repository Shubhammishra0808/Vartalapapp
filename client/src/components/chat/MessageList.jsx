import React, { useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';
import { Shield, Lock, Sparkles, MessageCircle, Hand } from 'lucide-react';

export const MessageList = ({ onInspectUser }) => {
  const { user } = useAuth();
  const { messages, loadingMessages, activeConversation, sendMessage } = useChat();
  const { typingUsers } = useSocket();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Check if other participant is typing in this active conversation
  const isDirect = activeConversation?.type === 'direct' || (!activeConversation?.isGroup && !activeConversation?.isChannel);
  const otherParticipant = isDirect
    ? activeConversation?.participants?.find((p) => (p.user?._id || p._id) !== user?._id)?.user ||
      activeConversation?.participants?.find((p) => (p.user?._id || p._id) !== user?._id)
    : null;

  const isTyping =
    (activeConversation && typingUsers.get(activeConversation._id)?.isTyping) ||
    (otherParticipant && typingUsers.get(otherParticipant._id)?.isTyping);

  // Helper to format date groups
  const getDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSendIcebreaker = (text) => {
    sendMessage({ content: text, type: 'text' });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-0">
      {/* End-to-End Encryption Banner */}
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-1.5 px-3.5 py-1 bg-slate-900/85 border border-amber-500/20 rounded-full text-amber-300 text-[11px] font-medium shadow-md backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Vaartalaap E2EE: All messages are protected with ECDH P-256 & AES-256.</span>
        </div>
      </div>

      {loadingMessages ? (
        <div className="text-center py-16 text-xs text-amber-400 animate-pulse font-semibold flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading secure messages...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 px-4 max-w-md mx-auto animate-fade-in">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 shadow-xl">
            <MessageCircle className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-100 mb-1">
            Start Your Encrypted Conversation
          </h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Send an instant message or choose a quick starter below to break the ice!
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleSendIcebreaker('Hello! How are you doing?')}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold transition-all hover:scale-105 shadow flex items-center gap-1.5"
            >
              <Hand className="w-3.5 h-3.5 text-amber-200" />
              <span>👋 Hello! How are you?</span>
            </button>
            <button
              onClick={() => handleSendIcebreaker('🔒 Connected securely on Vaartalaap with E2EE!')}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold transition-all hover:scale-105 shadow flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>🔒 E2EE Session Active</span>
            </button>
            <button
              onClick={() => handleSendIcebreaker('✨ Great to connect with you on Vaartalaap!')}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold transition-all hover:scale-105 shadow flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ Glad to connect!</span>
            </button>
          </div>
        </div>
      ) : (
        messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDateDivider =
            !prevMsg ||
            new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

          return (
            <React.Fragment key={msg._id || index}>
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-0.5 bg-slate-900/80 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-md shadow-sm">
                    {getDateLabel(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                onInspectUser={onInspectUser}
              />
            </React.Fragment>
          );
        })
      )}

      {/* Live Partner Typing Bubble */}
      {isTyping && (
        <div className="flex items-center gap-2 px-3 py-1.5 max-w-fit bg-slate-800/90 border border-white/10 rounded-2xl text-xs text-slate-300 shadow-md animate-fade-in">
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            {otherParticipant?.name || 'Partner'} is typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
