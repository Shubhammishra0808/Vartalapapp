import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Image,
  Video,
  FileText,
  MapPin,
  BarChart2,
  X,
  Trash2,
  Eye,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { chatService } from '../../services/chatService';

const QUICK_EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '🚀', '❤️', '👏', '✨', '😎', '🙏', '💯', '🤝', '🥳', '🙌'];

export const MessageComposer = () => {
  const { activeConversation, sendMessage, replyingTo, setReplyingTo } = useChat();
  const { emitTyping } = useSocket();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isUploading, setIsUploading] = useState(false);
  const [isViewOnceSelected, setIsViewOnceSelected] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording } =
    useAudioRecorder();

  // Typing emitter
  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(activeConversation?._id, null, true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTyping(activeConversation?._id, null, false);
    }, 2000);
  };

  // Submit Text Message
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    sendMessage({ content: text.trim(), type: 'text' });
    setText('');
    setShowEmojiPicker(false);
    emitTyping(activeConversation?._id, null, false);
  };

  // File Upload Handler
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setShowAttachmentMenu(false);
      const res = await chatService.uploadFile(file);

      let msgType = 'document';
      if (file.type.startsWith('image/')) msgType = 'image';
      else if (file.type.startsWith('video/')) msgType = 'video';
      else if (file.type.startsWith('audio/')) msgType = 'audio';

      await sendMessage({
        type: msgType,
        mediaUrl: res.fileUrl,
        isViewOnce: isViewOnceSelected,
        mediaMeta: {
          fileName: res.fileName,
          fileSize: res.fileSize,
          mimeType: res.mimeType,
        },
      });

      setIsViewOnceSelected(false);
    } catch (err) {
      console.error(err);
      alert('Failed to upload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send Voice Note
  const handleSendVoiceNote = async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob) return;

    try {
      setIsUploading(true);
      const file = new File([audioBlob], `voice_${Date.now()}.mp3`, { type: 'audio/mp3' });
      const res = await chatService.uploadFile(file);

      await sendMessage({
        type: 'voice',
        mediaUrl: res.fileUrl,
        mediaMeta: {
          duration: recordingDuration,
          fileSize: res.fileSize,
        },
      });
    } catch (err) {
      alert('Failed to upload voice note.');
    } finally {
      setIsUploading(false);
    }
  };

  // Share Location
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setShowAttachmentMenu(false);
        await sendMessage({
          type: 'location',
          content: `Location Shared: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          mediaMeta: {
            latitude,
            longitude,
          },
        });
      },
      () => {
        alert('Unable to retrieve your location.');
      }
    );
  };

  // Create Interactive Poll
  const handleCreatePoll = async () => {
    if (!pollQuestion.trim()) return;
    const validOptions = pollOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options for the poll.');
      return;
    }

    await sendMessage({
      type: 'poll',
      poll: {
        question: pollQuestion.trim(),
        options: validOptions.map((text) => ({ text, votes: [] })),
      },
    });

    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  return (
    <div className="w-full p-3 sm:p-4 bg-slate-950/90 border-t border-white/10 relative z-20 flex-shrink-0 backdrop-blur-xl">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="mb-2 p-2 rounded-xl bg-slate-800 border-l-4 border-indigo-500 flex items-center justify-between animate-fade-in shadow">
          <div className="min-w-0 text-xs">
            <span className="font-bold text-indigo-400">
              Replying to {replyingTo.sender?.name || 'Message'}
            </span>
            <p className="text-slate-300 truncate text-[11px]">{replyingTo.content || 'Media'}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-slate-900/95 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in">
          <div className="grid grid-cols-8 gap-2">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-xl p-1.5 hover:bg-white/10 rounded-xl hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu Popover */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-4 sm:left-12 bg-slate-900/95 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in grid grid-cols-3 gap-2 w-72 sm:w-80">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-2.5 rounded-xl hover:bg-white/10 text-slate-200 transition-all text-xs"
          >
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white mb-1.5 shadow">
              <Image className="w-4 h-4" />
            </div>
            <span>Photos</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-2.5 rounded-xl hover:bg-white/10 text-slate-200 transition-all text-xs"
          >
            <div className="p-2.5 bg-pink-600 rounded-xl text-white mb-1.5 shadow">
              <Video className="w-4 h-4" />
            </div>
            <span>Videos</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-2.5 rounded-xl hover:bg-white/10 text-slate-200 transition-all text-xs"
          >
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white mb-1.5 shadow">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document</span>
          </button>

          <button
            onClick={handleShareLocation}
            className="flex flex-col items-center p-2.5 rounded-xl hover:bg-white/10 text-slate-200 transition-all text-xs"
          >
            <div className="p-2.5 bg-cyan-600 rounded-xl text-white mb-1.5 shadow">
              <MapPin className="w-4 h-4" />
            </div>
            <span>Location</span>
          </button>

          <button
            onClick={() => {
              setShowAttachmentMenu(false);
              setShowPollModal(true);
            }}
            className="flex flex-col items-center p-2.5 rounded-xl hover:bg-white/10 text-slate-200 transition-all text-xs"
          >
            <div className="p-2.5 bg-amber-600 rounded-xl text-white mb-1.5 shadow">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Poll</span>
          </button>

          <button
            onClick={() => {
              setIsViewOnceSelected(!isViewOnceSelected);
              fileInputRef.current?.click();
            }}
            className="flex flex-col items-center p-2.5 rounded-xl hover:bg-white/10 text-slate-200 transition-all text-xs"
          >
            <div className={`p-2.5 rounded-xl text-white mb-1.5 shadow ${isViewOnceSelected ? 'bg-purple-600' : 'bg-slate-700'}`}>
              <Eye className="w-4 h-4" />
            </div>
            <span>View Once (1x)</span>
          </button>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-slate-900 border border-red-500/40 rounded-2xl px-4 py-2.5 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-record-pulse" />
            <span className="text-xs font-semibold text-red-400">
              Recording Voice Note... ({recordingDuration}s)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={cancelRecording}
              className="p-2 hover:bg-white/10 text-slate-400 hover:text-red-400 rounded-xl"
              title="Cancel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendVoiceNote}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      ) : (
        /* Regular Message Composer Input Bar */
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
            title="Attach Media / Files / Polls / View Once"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder={isUploading ? 'Uploading attachment...' : 'Type an encrypted message...'}
            value={text}
            onChange={handleTextChange}
            disabled={isUploading}
            className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all"
          />

          {text.trim() ? (
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-transform active:scale-95 flex-shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl shadow transition-all active:scale-95 flex-shrink-0"
              title="Hold to Record Voice Message"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </form>
      )}

      {/* Interactive Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" /> Create Interactive Poll
              </h3>
              <button
                onClick={() => setShowPollModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Question</label>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Options</label>
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 mb-2 focus:outline-none focus:border-indigo-500"
                  />
                ))}

                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPollModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePoll}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
