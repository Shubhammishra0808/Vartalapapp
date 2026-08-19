import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  Phone,
  QrCode,
  ArrowRight,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { CopyrightBadge } from '../components/common/CopyrightBadge';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithPhoneOtp, loginWithQr } = useAuth();
  const { themeMode, toggleThemeMode } = useTheme();

  // Login Mode: 'password' | 'phone_otp' | 'qr_code'
  const [authMode, setAuthMode] = useState('password');

  // Password Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  // Phone OTP States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [demoOtpHint, setDemoOtpHint] = useState('');

  // QR Code States
  const [qrToken, setQrToken] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load QR Code when QR Tab is selected
  const loadQrCode = async () => {
    try {
      setQrLoading(true);
      const res = await authService.getQrCode();
      if (res.success && res.qrToken) {
        setQrToken(res.qrToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (authMode === 'qr_code') {
      loadQrCode();
    }
  }, [authMode]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval = null;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // Handle Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login({ identifier: username, password, twoFactorCode });
      if (res.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }
      if (res.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
      setLoading(false);
    }
  };

  // Handle Phone: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await authService.sendPhoneOtp(phone);
      if (res.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setDemoOtpHint(res.demoOtp || '123456');
        setSuccessMsg(`Verification code sent to ${phone}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await loginWithPhoneOtp(phone, otp);
      if (res.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
      setLoading(false);
    }
  };

  // Handle 1-Click QR Scan Simulation
  const handleSimulateQrScan = async (selectedUser = 'alice') => {
    if (!qrToken) return;
    setLoading(true);
    setError('');

    try {
      const res = await loginWithQr(qrToken, selectedUser);
      if (res.success) {
        navigate('/');
      }
    } catch (err) {
      setError('QR Login verification failed.');
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
          {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          <span className="hidden sm:inline capitalize">{themeMode}</span>
        </button>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-modal-pop my-auto">
        {/* App Logo & Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30 mb-2.5 transition-transform duration-300 hover:scale-110">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">SecureChat</h1>
          <p className="text-xs text-slate-400 mt-0.5">End-to-End Encrypted Messaging & Calls</p>
        </div>

        {/* Clean, Native Authentication Mode Switcher Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-5 text-xs font-bold border border-white/5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
              authMode === 'password'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('phone_otp');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
              authMode === 'phone_otp'
                ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('qr_code');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
              authMode === 'qr_code'
                ? 'bg-indigo-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Alerts & Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-fade-blur">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-blur">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMsg}
          </div>
        )}

        {/* 1. PASSWORD LOGIN */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5 animate-modal-pop">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Username, email, or mobile number
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alice or alice@securechat.io"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {requires2FA && (
              <div className="animate-modal-pop">
                <label className="text-xs font-semibold text-indigo-300 block mb-1">
                  2FA Security Code
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit authenticator code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full bg-slate-800/80 border border-indigo-500/40 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono text-center tracking-widest"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In Securely'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. PHONE OTP LOGIN */}
        {authMode === 'phone_otp' && (
          <div className="space-y-4 animate-modal-pop">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your mobile phone number to receive a 6-digit one-time verification code.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Phone Number</label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-2xl bg-slate-800 border border-r-0 border-white/10 text-xs font-bold text-emerald-400 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-slate-800/80 border border-white/10 rounded-r-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Sending Code...' : 'Send Verification OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5 animate-modal-pop">
                <div className="text-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-slate-300">Enter code sent to <strong>+91 {phone}</strong></p>
                  {demoOtpHint && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold block mt-1">
                      Demo Code: {demoOtpHint}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 text-center">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-800/90 border border-emerald-500/40 rounded-2xl px-4 py-3 text-base text-white text-center font-mono tracking-[0.6em] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Edit Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpTimer > 0}
                    className={`font-semibold ${
                      otpTimer > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-emerald-400 hover:underline'
                    }`}
                  >
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. QR CODE SCAN LOGIN */}
        {authMode === 'qr_code' && (
          <div className="text-center space-y-4 animate-modal-pop">
            <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl relative border-4 border-indigo-500/40 mx-auto">
              {qrToken ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    qrToken
                  )}`}
                  alt="Login QR Code"
                  className="w-44 h-44 mx-auto rounded-xl"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-700 animate-pulse font-semibold">
                  Generating secure QR session...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Log in via QR Code:</p>
              <p className="text-[11px] text-slate-400">
                1. Open SecureChat on your mobile device • 2. Go to Settings & select <strong>Linked Devices</strong> • 3. Scan this QR code.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSimulateQrScan('alice')}
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" /> Instant QR Scan Demo (Alice Johnson)
              </button>

              <button
                type="button"
                onClick={loadQrCode}
                className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh QR Code
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4 transition-colors"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>

      <CopyrightBadge floating={true} />
    </div>
  );
};
