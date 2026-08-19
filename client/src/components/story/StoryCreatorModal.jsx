import React, { useState, useRef } from 'react';
import { X, Image, Type, Send } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { chatService } from '../../services/chatService';

const BG_COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#0f172a'];

export const StoryCreatorModal = ({ onClose, onCreated }) => {
  const [type, setType] = useState('text'); // 'text' | 'image'
  const [text, setText] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const res = await chatService.uploadFile(file);
      setMediaUrl(res.fileUrl);
      setType('image');
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (type === 'text' && !text.trim()) return;
    if (type === 'image' && !mediaUrl) return;

    try {
      setIsSubmitting(true);
      await storyService.createStory({
        type,
        content: text.trim(),
        mediaUrl,
        backgroundColor: selectedBg,
        caption: caption.trim(),
      });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert('Could not publish status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-slate-100">Create New Status</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Text vs Image */}
        <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
          <button
            onClick={() => setType('text')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              type === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            <Type className="w-4 h-4" /> Text Status
          </button>
          <button
            onClick={() => {
              setType('image');
              if (!mediaUrl) fileInputRef.current?.click();
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              type === 'image' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            <Image className="w-4 h-4" /> Photo Status
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
        />

        {/* Preview Area */}
        <div className="w-full h-64 rounded-2xl overflow-hidden relative mb-4 shadow-inner flex items-center justify-center">
          {type === 'text' ? (
            <div
              className="w-full h-full flex items-center justify-center p-6 transition-colors"
              style={{ backgroundColor: selectedBg }}
            >
              <textarea
                placeholder="Type your status..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                className="w-full bg-transparent text-white text-center font-bold text-lg placeholder-white/60 resize-none focus:outline-none"
                rows={4}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Choose Photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        {type === 'text' ? (
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-xs text-slate-400 font-semibold mr-1">Color:</span>
            {BG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedBg(color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  selectedBg === color ? 'scale-125 border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : (
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 mb-6 focus:outline-none focus:border-indigo-500"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Publish 24h
          </button>
        </div>
      </div>
    </div>
  );
};
