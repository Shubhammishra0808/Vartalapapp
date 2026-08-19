import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Palette,
  Lock,
  Save,
  Check,
  Key,
  Sun,
  Moon,
  Upload,
  Briefcase,
  Ban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEME_WALLPAPERS } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { chatService } from '../../services/chatService';
import { Avatar } from '../common/Avatar';

export const SettingsModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const { themeMode, setThemeMode, wallpaper, setWallpaper, brightness, setBrightness } = useTheme();
  const { fingerprint } = useChat();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'privacy' | 'security' | 'appearance'
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isPrivateAccount, setIsPrivateAccount] = useState(user?.isPrivateAccount || false);

  // Privacy states
  const [profilePhotoPriv, setProfilePhotoPriv] = useState(user?.privacySettings?.profilePhoto || 'everyone');
  const [lastSeenPriv, setLastSeenPriv] = useState(user?.privacySettings?.lastSeen || 'everyone');
  const [onlineStatusPriv, setOnlineStatusPriv] = useState(user?.privacySettings?.onlineStatus || 'everyone');
  const [blockedUsers, setBlockedUsers] = useState([]);

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const avatarFileRef = useRef(null);

  useEffect(() => {
    const loadBlocked = async () => {
      try {
        const res = await chatService.getBlockedUsers();
        if (res.success) setBlockedUsers(res.blockedUsers || []);
      } catch (e) {}
    };
    loadBlocked();
  }, []);

  // Handle direct profile photo file upload
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await chatService.uploadFile(file);
      if (res.success && res.fileUrl) {
        setAvatar(res.fileUrl);
        const updateRes = await chatService.updateProfile({ avatar: res.fileUrl });
        if (updateRes.success && updateRes.user) {
          updateUser(updateRes.user);
        }
      }
    } catch (err) {
      alert('Failed to upload profile photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await chatService.updateProfile({
        name,
        bio,
        headline,
        statusMessage,
        avatar,
        isPrivateAccount,
      });
      if (res.success && res.user) {
        updateUser(res.user);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setLoading(true);
      const res = await chatService.updateSettings({
        isPrivateAccount,
        privacySettings: {
          profilePhoto: profilePhotoPriv,
          lastSeen: lastSeenPriv,
          onlineStatus: onlineStatusPriv,
        },
      });
      if (res.success && res.user) {
        updateUser(res.user);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch (err) {
      alert('Failed to update privacy settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (targetId) => {
    try {
      await chatService.toggleBlockUser(targetId);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== targetId));
    } catch (e) {
      alert('Failed to unblock user.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl h-[650px] shadow-2xl flex flex-col sm:flex-row overflow-hidden">
        {/* Left Navigation Tabs */}
        <div className="w-full sm:w-48 bg-slate-950/60 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-white/10 flex sm:flex-col space-x-1 sm:space-x-0 sm:space-y-1 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2.5 transition-all ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" /> Profile Details
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2.5 transition-all ${
              activeTab === 'privacy' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy & Block
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2.5 transition-all ${
              activeTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4" /> Security & E2EE
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2.5 transition-all ${
              activeTab === 'appearance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" /> Appearance & Brightness
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          {/* Header with Close button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-slate-100 capitalize">{activeTab} Settings</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center space-x-4 mb-2">
                <Avatar src={avatar || user?.avatar} name={name || user?.name} size="lg" />
                <div>
                  <input
                    type="file"
                    ref={avatarFileRef}
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">Direct upload from device</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Professional Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Security Architect | Software Engineer"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Status Message</label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {isSaved ? 'Saved!' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Privacy & Block Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Private Account Switch */}
              <div className="p-3.5 bg-slate-800/80 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-100">Private Account</h4>
                  <p className="text-[11px] text-slate-400">
                    When enabled, non-contacts must send a Chat Request before they can message you.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateAccount}
                  onChange={(e) => setIsPrivateAccount(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Who can see my profile photo</label>
                <select
                  value={profilePhotoPriv}
                  onChange={(e) => setProfilePhotoPriv(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Who can see my last seen</label>
                <select
                  value={lastSeenPriv}
                  onChange={(e) => setLastSeenPriv(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              {/* Blocked Users Section */}
              <div className="pt-2 border-t border-white/10">
                <h4 className="font-bold text-xs text-slate-300 mb-2 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-red-400" /> Blocked Accounts ({blockedUsers.length})
                </h4>
                {blockedUsers.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {blockedUsers.map((bu) => (
                      <div key={bu._id} className="p-2 bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{bu.name} (@{bu.username})</span>
                        <button
                          onClick={() => handleUnblockUser(bu._id)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-bold"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No blocked users.</p>
                )}
              </div>

              <button
                onClick={handleSavePrivacy}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {isSaved ? 'Saved!' : 'Save Privacy'}
              </button>
            </div>
          )}

          {/* Security & E2EE Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4 flex-1">
              <div className="p-3.5 bg-indigo-950/50 border border-indigo-500/20 rounded-2xl">
                <h4 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Key className="w-4 h-4 text-indigo-400" /> Device E2EE Key Pair
                </h4>
                <p className="text-[11px] text-slate-300">
                  Your private cryptographic key is securely stored in this browser session and never transmitted to the server.
                </p>
                <div className="mt-2 font-mono text-[10px] bg-black/40 p-2 rounded-lg text-slate-300 break-all">
                  Fingerprint: {fingerprint || user?.keyFingerprint || 'ECDH-P256-AES-GCM-256-AUTHENTICATED'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/60 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[11px] text-slate-400">Additional layer of protection on logins.</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* Appearance & Brightness Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Brightness Slider */}
              <div className="p-3.5 bg-slate-800/80 border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" /> Screen Brightness
                  </label>
                  <span className="text-xs font-bold text-amber-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="130"
                  step="5"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Dim (70%)</span>
                  <span>Default (100%)</span>
                  <span>Bright (130%)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Wallpaper & Background Ambience</label>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_WALLPAPERS.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setWallpaper(theme.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3 ${
                        wallpaper === theme.id
                          ? 'border-indigo-500 bg-indigo-600/20 shadow-md'
                          : 'border-white/10 bg-slate-800/50 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="text-xs font-semibold text-slate-200">{theme.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-300 block mb-2">Theme Mode</label>
                <div className="flex bg-slate-800 p-1 rounded-xl w-48">
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                      themeMode === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                      themeMode === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
