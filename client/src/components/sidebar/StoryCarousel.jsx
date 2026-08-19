import React, { useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useAuth } from '../../context/AuthContext';

export const StoryCarousel = ({ onOpenCreator, onSelectStory, onSelectUserStory }) => {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);

  const handleSelect = onSelectStory || onSelectUserStory;

  const loadStories = async () => {
    try {
      const res = await storyService.getActiveStories();
      if (res.success) {
        setFeed(res.storyFeed || []);
      }
    } catch (err) {
      console.error('Error fetching stories', err);
    }
  };

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, 15000);
    return () => clearInterval(interval);
  }, []);

  const myStoryGroup = feed.find((f) => f.user?._id === user?._id);
  const otherStories = feed.filter((f) => f.user?._id !== user?._id);

  return (
    <div className="px-4 py-2.5 overflow-x-auto flex items-center space-x-3.5 no-scrollbar">
      {/* My Story / Add Story Button */}
      <div
        className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        onClick={() => {
          if (myStoryGroup && handleSelect) {
            handleSelect(myStoryGroup);
          } else {
            onOpenCreator();
          }
        }}
      >
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-full p-[2px] transition-transform duration-200 group-hover:scale-105 ${
              myStoryGroup
                ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md'
                : 'border-2 border-dashed border-slate-600 group-hover:border-indigo-400'
            }`}
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt="My Status"
              className="w-full h-full rounded-full object-cover bg-slate-800"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreator();
            }}
            className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform active:scale-95 hover:scale-110"
            title="Post New Status"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[11px] font-semibold text-slate-300 mt-1 truncate w-14 text-center">
          {myStoryGroup ? 'My Status' : 'Add Status'}
        </span>
      </div>

      {/* Friends & Contacts Stories */}
      {otherStories.map((group) => (
        <div
          key={group.user?._id}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
          onClick={() => handleSelect && handleSelect(group)}
        >
          <div
            className={`w-14 h-14 rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105 ${
              group.hasUnviewed
                ? 'bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-400 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-700 opacity-80'
            }`}
          >
            <img
              src={group.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${group.user?.username}`}
              alt={group.user?.name}
              className="w-full h-full rounded-full object-cover bg-slate-800"
            />
          </div>
          <span className="text-[11px] font-medium text-slate-300 mt-1 truncate w-14 text-center">
            {group.user?.name?.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
};
