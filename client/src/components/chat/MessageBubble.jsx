import React, { useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Lock,
  Play,
  Pause,
  FileText,
  Download,
  MapPin,
  User,
  Reply,
  Smile,
  BarChart2,
  Eye,
  EyeOff,
  Flame,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { chatService } from '../../services/chatService';

const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '😂', '🎉', '😮', '👏', '🚀'];

export const MessageBubble = ({ message, onInspectUser }) => {
  const { user } = useAuth();
  const { setReplyingTo } = useChat();

  const isMe = message.sender?._id === user?._id || message.sender === user?._id;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [viewOnceOpened, setViewOnceOpened] = useState(false);

  const audioRef = useRef(null);
  const lastTapRef = useRef(0);

  // Double tap to react with ❤️
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleReact('❤️');
    }
    lastTapRef.current = now;
  };

  // Audio playback controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const togglePlaybackSpeed = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  // React to message
  const handleReact = async (emoji) => {
    setShowReactionPicker(false);
    try {
      await chatService.reactToMessage(message._id, emoji);
    } catch (e) {
      console.error(e);
    }
  };

  // Vote on poll
  const handleVotePoll = async (optionId) => {
    try {
      await chatService.votePoll(message._id, optionId);
    } catch (e) {
      console.error(e);
    }
  };

  // Format time
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const displayContent = message.decryptedContent || message.content;

  return (
    <div className={`flex flex-col my-1 ${isMe ? 'items-end' : 'items-start'} group relative px-2`}>
      {/* Sender name for group chats */}
      {!isMe && message.sender?.name && (
        <span
          onClick={() => onInspectUser && onInspectUser(message.sender)}
          className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer mb-0.5 ml-2"
          title="Click to view profile"
        >
          {message.sender.name}
        </span>
      )}

      {/* Main Bubble Container */}
      <div className="relative flex items-center gap-1.5 max-w-[88%] sm:max-w-[72%]">
        {/* Action button menu on hover */}
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
            isMe ? 'order-first' : 'order-last'
          }`}
        >
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
            title="React"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={() => setReplyingTo(message)}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
        </div>

        {/* Reaction Picker Popover */}
        {showReactionPicker && (
          <div className="absolute -top-10 left-0 bg-slate-900/95 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-2xl z-30 animate-fade-in backdrop-blur-xl">
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="hover:scale-130 transition-transform text-base active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Card Bubble */}
        <div
          onClick={handleDoubleTap}
          className={`rounded-2xl p-3 shadow-md backdrop-blur-md transition-all select-none ${
            isMe
              ? 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-cyan-600 text-white rounded-tr-sm shadow-indigo-500/10'
              : 'bg-slate-800/95 text-slate-100 rounded-tl-sm border border-white/10 shadow-slate-950/20'
          }`}
        >
          {/* Quoted reply preview */}
          {message.replyTo && (
            <div className="mb-2 p-2 rounded-xl bg-black/25 border-l-2 border-indigo-400 text-xs text-slate-200">
              <span className="font-bold block text-[11px] text-cyan-300">
                {message.replyTo.sender?.name || 'Replying'}
              </span>
              <p className="truncate text-slate-300 mt-0.5">{message.replyTo.content || 'Media'}</p>
            </div>
          )}

          {/* Type: Text */}
          {message.type === 'text' && (
            <div className="text-xs sm:text-sm break-words whitespace-pre-wrap leading-relaxed">
              {message.isEncrypted && (
                <span className="inline-flex items-center text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-md mr-1.5 font-semibold">
                  <Lock className="w-2.5 h-2.5 mr-1" /> E2EE
                </span>
              )}
              {displayContent}
            </div>
          )}

          {/* View Once Photo/Video */}
          {message.isViewOnce && message.mediaUrl ? (
            <div className="p-1">
              {viewOnceOpened ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>View-Once Media Expired</span>
                </div>
              ) : (
                <button
                  onClick={() => setViewOnceOpened(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-xl text-xs font-bold text-white transition-all shadow"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>View Once Media (Click to Open)</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Type: Photo / Image */}
              {message.type === 'image' && message.mediaUrl && (
                <div className="rounded-xl overflow-hidden mb-1 max-w-sm">
                  <img
                    src={message.mediaUrl}
                    alt="attachment"
                    className="w-full h-auto max-h-80 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer rounded-xl"
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                  />
                  {message.content && <p className="text-xs mt-1.5 font-medium">{message.content}</p>}
                </div>
              )}

              {/* Type: Video */}
              {message.type === 'video' && message.mediaUrl && (
                <div className="rounded-xl overflow-hidden mb-1 max-w-sm">
                  <video src={message.mediaUrl} controls className="w-full max-h-80 rounded-xl" />
                  {message.content && <p className="text-xs mt-1.5">{message.content}</p>}
                </div>
              )}

              {/* Type: Audio / Voice Note */}
              {message.type === 'voice' && message.mediaUrl && (
                <div className="flex items-center space-x-3 p-1 min-w-[200px]">
                  <audio
                    ref={audioRef}
                    src={message.mediaUrl}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={handleAudioEnded}
                  />
                  <button
                    onClick={togglePlayAudio}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all flex-shrink-0"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <div className="flex-1">
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-100 rounded-full"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-white/80">
                      <span>{message.mediaMeta?.duration || 0}s</span>
                      <button
                        onClick={togglePlaybackSpeed}
                        className="font-bold px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                      >
                        {playbackRate}x
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Type: Document */}
              {message.type === 'document' && message.mediaUrl && (
                <div className="flex items-center space-x-3 p-2 bg-black/20 rounded-xl max-w-xs">
                  <FileText className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-slate-100">
                      {message.mediaMeta?.fileName || 'Document'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {message.mediaMeta?.fileSize
                        ? `${(message.mediaMeta.fileSize / 1024).toFixed(1)} KB`
                        : 'File'}
                    </p>
                  </div>
                  <a
                    href={message.mediaUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Type: Location */}
              {message.type === 'location' && (
                <div className="p-2 bg-black/20 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                    <MapPin className="w-4 h-4" />
                    <span>Live Location</span>
                  </div>
                  <p className="text-xs text-slate-200">{message.content}</p>
                </div>
              )}

              {/* Type: Interactive Poll */}
              {message.type === 'poll' && message.poll && (
                <div className="p-3 bg-black/25 rounded-2xl min-w-[240px] space-y-2.5">
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" /> {message.poll.question}
                  </h4>
                  <div className="space-y-1.5">
                    {message.poll.options?.map((opt, i) => {
                      const totalVotes = message.poll.options.reduce(
                        (sum, o) => sum + (o.votes?.length || 0),
                        0
                      );
                      const voteCount = opt.votes?.length || 0;
                      const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                      const hasVoted = opt.votes?.includes(user?._id);

                      return (
                        <div
                          key={i}
                          onClick={() => handleVotePoll(i)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer relative overflow-hidden transition-all ${
                            hasVoted
                              ? 'border-cyan-400 bg-cyan-500/20 text-white'
                              : 'border-white/10 bg-slate-900/60 hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <div
                            className="absolute top-0 left-0 bottom-0 bg-cyan-500/20 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                          <div className="relative flex justify-between items-center z-10">
                            <span className="font-medium">{opt.text}</span>
                            <span className="font-bold font-mono text-[11px]">{percent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Time & Read Receipts */}
          <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-white/70">
            <span>{time}</span>
            {isMe && (
              message.readBy && message.readBy.length > 0 ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/60 inline" />
              )
            )}
          </div>
        </div>
      </div>

      {/* Reaction Badge Pills */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
          {message.reactions.map((r, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 bg-slate-900/90 border border-white/10 rounded-full text-[11px] shadow-sm backdrop-blur-md flex items-center gap-1"
            >
              <span>{r.emoji}</span>
              {r.count > 1 && <span className="font-bold text-[10px] text-slate-400">{r.count}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
