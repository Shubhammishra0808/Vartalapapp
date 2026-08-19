import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  Mail,
  Phone,
  QrCode,
  ArrowRight,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Sparkles,
  UserPlus,
  LogIn,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { CopyrightBadge } from '../components/common/CopyrightBadge';

export const AuthPage = ({ initialTab = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, register, loginWithPhoneOtp, loginWithQr } = useAuth();
  const { themeMode, toggleThemeMode } = useTheme();

  // If user is already authenticated, directly enter chat
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  // Active top-level Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/register' || initialTab === 'register' ? 'register' : 'login'
  );

  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // Login Mode: 'password' | 'phone' | 'qr'
  const [loginMode, setLoginMode] = useState('password');

  // --- LOGIN FIELDS ---
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  // Phone Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  // QR Login
  const [qrToken, setQrToken] = useState('');

  // --- 1-STEP REGISTER FIELDS ---
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
    if (tab === 'register' && loginIdentifier && !regUsername) {
      setRegUsername(loginIdentifier.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
      setRegName(loginIdentifier);
    }
    window.history.replaceState(null, '', `/${tab}`);
  };

  // QR Code loader
  useEffect(() => {
    if (activeTab === 'login' && loginMode === 'qr') {
      authService.getQrCode().then((res) => {
        if (res.success && res.qrToken) setQrToken(res.qrToken);
      });
    }
  }, [activeTab, loginMode]);

  // -------------------------------------------------------------
  // 1. FAST SINGLE-STEP SIGN IN -> STRAIGHT TO CHAT
  // -------------------------------------------------------------
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Please enter your username/email and password.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
        twoFactorCode,
      });

      if (res.requires2FA) {
        setRequires2FA(true);
        return;
      }

      if (res.success) {
        setSuccessMsg('Signing in... Entering Vaartalaap...');
        window.location.href = '/';
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid username or password. If you are new, click "Create Account" above to register in 5 seconds!'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = async (identifier, password) => {
    setLoading(true);
    setError('');
    setSuccessMsg('Authenticating...');
    try {
      const res = await login({ identifier, password });
      if (res.success) {
        window.location.href = '/';
      } else {
        setError(res.message || 'Demo login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Send
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    if (!loginPhone.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await authService.sendPhoneOtp(loginPhone);
      if (res.success) {
        setOtpSent(true);
        if (res.demoOtp) setDemoOtp(res.demoOtp);
        setSuccessMsg(`OTP sent to +91 ${loginPhone}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send SMS code.');
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Verify -> Direct to Chat
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!loginOtp.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await loginWithPhoneOtp(loginPhone, loginOtp);
      if (res.success) {
        setSuccessMsg('Verified! Entering Vaartalaap...');
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. FAST 1-STEP REGISTER -> STRAIGHT TO CHAT
  // -------------------------------------------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in your Name, Username, Email, and Password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await register({
        name: regName.trim(),
        username: regUsername.toLowerCase().trim().replace(/[^a-z0-9_.]/g, ''),
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
      });

      if (res.success) {
        setSuccessMsg('Account created! Entering chat section...');
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Username or email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-theme-obsidian relative overflow-x-hidden transition-colors duration-300">
      {/* Top Floating Dark/Light Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleThemeMode}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-amber-400 backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          <span className="hidden sm:inline capitalize">{themeMode}</span>
        </button>
      </div>

      {/* Decorative Orbs with Indian Saffron & Emerald Accent */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-modal-pop my-auto">
        {/* App Logo & Header */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25 mb-2.5 transition-transform duration-300 hover:scale-110">
            <MessageCircle className="w-8 h-8 text-white fill-white/20" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Vaartalaap</h1>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              E2EE
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Next-Gen Secure Messenger • Developed by Shubham Mishra</p>
        </div>

        {/* Master Switch: 1-Step Sign In ⇄ Quick Register */}
        <div className="flex bg-slate-800/90 p-1.5 rounded-2xl mb-5 text-xs font-bold border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchTab('login')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('register')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-fade-blur space-y-1">
            <div>{error}</div>
            {activeTab === 'login' && error.includes('Invalid') && (
              <button
                type="button"
                onClick={() => handleSwitchTab('register')}
                className="text-[11px] text-amber-300 underline font-bold block"
              >
                👉 Click here to create your account in 5 seconds
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-blur">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: STREAMLINED SIGN IN (Direct straight to chat)     */}
        {/* ========================================================= */}
        {activeTab === 'login' && (
          <div className="space-y-4 animate-modal-pop">
            {/* Quick Login Mode Selector */}
            <div className="flex bg-slate-800/60 p-1 rounded-xl text-[11px] font-semibold border border-white/5">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  loginMode === 'password'
                    ? 'bg-amber-500 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3 h-3" /> Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('phone')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  loginMode === 'phone'
                    ? 'bg-emerald-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3 h-3" /> Phone (+91 OTP)
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('qr')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  loginMode === 'qr'
                    ? 'bg-indigo-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3 h-3" /> QR Code
              </button>
            </div>

            {/* Standard Password Login */}
            {loginMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Username, Phone or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. shubham or shubham@gmail.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {requires2FA && (
                  <div>
                    <label className="text-xs font-semibold text-amber-300 block mb-1">2FA Security Code</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="w-full bg-slate-800 border border-amber-500/40 rounded-2xl px-4 py-2 text-center font-mono tracking-widest text-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In & Open Chat'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Phone OTP Login */}
            {loginMode === 'phone' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Mobile Phone Number
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-2xl bg-slate-800 border border-r-0 border-white/10 text-xs font-bold text-emerald-400 font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="flex-1 bg-slate-800/80 border border-white/10 rounded-r-2xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Sending Code...' : 'Send Verification OTP'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                    <div className="text-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300">
                      Code sent to +91 {loginPhone}
                      {demoOtp && (
                        <span className="block font-mono text-emerald-400 font-bold mt-0.5">
                          Code: {demoOtp}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-500/40 rounded-2xl px-4 py-2.5 text-center font-mono tracking-widest text-base text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enter Vaartalaap'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* QR Code Login */}
            {loginMode === 'qr' && (
              <div className="text-center space-y-3">
                <div className="p-3 bg-white rounded-3xl inline-block shadow-2xl border-4 border-amber-500/40">
                  {qrToken ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrToken)}`}
                      alt="Login QR"
                      className="w-40 h-40 mx-auto rounded-xl"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-700 animate-pulse">
                      Generating Secure QR...
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Scan this QR code with the Vaartalaap Mobile App to link your account.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: FAST 1-STEP CREATE ACCOUNT                        */}
        {/* ========================================================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 animate-modal-pop">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Shubham Mishra"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Username *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">@</span>
                <input
                  type="text"
                  required
                  placeholder="shubham"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="shubham@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cryptographic Keypair Note */}
            <div className="p-2.5 bg-amber-950/30 border border-amber-500/20 rounded-2xl flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-[10px] text-slate-300">
                Automatic device-level ECDH P-256 & AES-256 end-to-end encryption keypair will be generated.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {loading ? 'Creating Account...' : 'Register & Enter Chat'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <CopyrightBadge floating={true} />
    </div>
  );
};
