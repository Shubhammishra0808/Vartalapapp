import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { storyService } from '../../services/storyService';
import { Avatar } from '../common/Avatar';

export const StoryViewerModal = ({ userStoryGroup, onClose }) => {
  const { user } = useAuth();
  const { sendMessage, setActiveConversation, conversations } = useChat();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const stories = userStoryGroup?.stories || [];
  const currentStory = stories[currentIndex];
  const isMine = userStoryGroup?.user?._id === user?._id;

  // Mark viewed
  useEffect(() => {
    if (currentStory && !isMine) {
      storyService.viewStory(currentStory._id);
    }
  }, [currentStory?._id, isMine]);

  // Story progress timer
  useEffect(() => {
    if (!currentStory) return;
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 5000); // 5 seconds per story

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Reply to Story
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    // Find or create direct conversation with story owner
    const targetConv = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participants?.some((p) => p.user?._id === userStoryGroup.user?._id)
    );

    if (targetConv) {
      setActiveConversation(targetConv);
      await sendMessage({
        content: `Replied to your status: "${replyText.trim()}"`,
        type: 'text',
      });
    }

    setReplyText('');
    onClose();
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm h-[600px] rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl bg-slate-900 border border-white/10">
        {/* Progress Bar Segments */}
        <div className="absolute top-3 left-3 right-3 flex items-center space-x-1.5 z-30">
          {stories.map((s, idx) => (
            <div key={s._id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-pulse' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* User Header */}
        <div className="relative z-30 p-4 pt-7 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center space-x-2.5">
            <Avatar
              src={userStoryGroup.user?.avatar}
              name={userStoryGroup.user?.name}
              size="sm"
            />
            <div>
              <h4 className="text-xs font-bold text-white">{userStoryGroup.user?.name}</h4>
              <p className="text-[10px] text-slate-300">
                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Content Viewport */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {currentStory.type === 'text' ? (
            <div
              className="w-full h-full flex items-center justify-center p-8 text-center text-white text-lg font-bold"
              style={{ backgroundColor: currentStory.backgroundColor || '#4f46e5' }}
            >
              {currentStory.content}
            </div>
          ) : (
            <div className="w-full h-full relative">
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
              {currentStory.caption && (
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-center text-xs text-white">
                  {currentStory.caption}
                </div>
              )}
            </div>
          )}

          {/* Navigation Click Areas */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Bar: Reply or Viewer Count */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black/80 to-transparent">
          {isMine ? (
            <div className="flex items-center justify-between text-xs text-white px-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-4 h-4 text-cyan-400" /> {currentStory.viewers?.length || 0} Viewers
              </span>
              <button
                onClick={async () => {
                  await storyService.deleteStory(currentStory._id);
                  onClose();
                }}
                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-1 text-[11px]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Reply to status..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-white/20 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
