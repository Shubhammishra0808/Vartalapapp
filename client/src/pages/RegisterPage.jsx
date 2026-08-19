import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Sun,
  Moon,
  Check,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { CopyrightBadge } from '../components/common/CopyrightBadge';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useTheme();

  // Multi-step Registration: 1 = Basic Info, 2 = Dual Verification (Email & Mobile), 3 = Security
  const [step, setStep] = useState(1);

  // Step 1: Account Info
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [headline, setHeadline] = useState('');

  // Step 2: Verification States
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [demoEmailOtp, setDemoEmailOtp] = useState('');

  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isPhoneSent, setIsPhoneSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [demoPhoneOtp, setDemoPhoneOtp] = useState('');
  const [phoneTimer, setPhoneTimer] = useState(60);

  // Step 3: Security & Privacy
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for phone OTP
  useEffect(() => {
    let interval = null;
    if (isPhoneSent && phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPhoneSent, phoneTimer]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'None', width: '0%', color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Weak', width: '25%', color: 'bg-red-500' };
    if (score === 2) return { label: 'Fair', width: '50%', color: 'bg-amber-500' };
    if (score === 3) return { label: 'Good', width: '75%', color: 'bg-cyan-500' };
    return { label: 'Strong & Secure', width: '100%', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  // 1. Send Email Verification Code
  const handleSendEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address (e.g. name@domain.com).');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authService.sendEmailOtp(email.trim());
      if (res.success) {
        setIsEmailSent(true);
        if (res.demoCode) setDemoEmailOtp(res.demoCode);
        setSuccessMsg(`Verification code sent to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not dispatch verification email.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Email Code (Must match real code)
  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authService.verifyEmailOtp(email.trim(), emailOtp.trim());
      if (res.success && res.isEmailVerified) {
        setIsEmailVerified(true);
        setSuccessMsg('Email verified successfully! ✓');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Mobile Phone OTP
  const handleSendPhoneOtp = async () => {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile phone number.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authService.sendPhoneOtp(cleanPhone);
      if (res.success) {
        setIsPhoneSent(true);
        setPhoneTimer(60);
        if (res.demoOtp) setDemoPhoneOtp(res.demoOtp);
        setSuccessMsg(`SMS verification code sent to +91 ${cleanPhone}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send SMS verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify Mobile Phone OTP (Must match real code)
  const handleVerifyPhoneOtp = async () => {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!phoneOtp || phoneOtp.trim().length !== 6) {
      setError('Please enter the full 6-digit SMS code.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authService.verifyPhoneOtp(cleanPhone, phoneOtp.trim(), name);
      if (res.success && res.isPhoneVerified) {
        setIsPhoneVerified(true);
        setSuccessMsg('Mobile number verified successfully! ✓');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect mobile verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Final Registration
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authService.register({
        name,
        username,
        email,
        phone,
        password,
        headline,
        isPrivateAccount,
        twoFactorEnabled,
      });

      if (res.success) {
        setSuccessMsg('Account registered and fully verified! Redirecting to Sign In...');
        localStorage.removeItem('securechat_token');
        localStorage.removeItem('securechat_refresh_token');
        localStorage.removeItem('securechat_user');

        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your data.');
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

      {/* Ambient Gradient Orbs */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2.5s' }} />

      {/* Main Registration Card */}
      <div className="w-full max-w-lg bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-modal-pop my-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30 mb-2.5 transition-transform duration-300 hover:scale-110">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 mt-0.5">Dual-Verified Secure Registration</p>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center justify-between mb-5 px-2">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Profile</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-800'}`} />

          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Verification</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-800'}`} />

          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 3 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Security</span>
          </div>
        </div>

        {/* Alerts */}
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

        {/* STEP 1: ACCOUNT DETAILS */}
        {step === 1 && (
          <div className="space-y-3.5 animate-modal-pop">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unique Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">@</span>
                <input
                  type="text"
                  required
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Professional Headline</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Software Architect | Product Designer"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Password Security: <strong>{strength.label}</strong></span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!name || !username || !password) {
                  setError('Please fill in your full name, username, and password.');
                  return;
                }
                if (password.length < 6) {
                  setError('Password must be at least 6 characters.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              Continue to Verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: DUAL REAL VERIFICATION (EMAIL & PHONE OTP) */}
        {step === 2 && (
          <div className="space-y-4 animate-modal-pop">
            {/* 1. Email Verification */}
            <div className="p-3.5 bg-slate-800/60 border border-white/5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" /> 1. Real Email Verification
                </span>
                {isEmailVerified && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Email Verified
                  </span>
                )}
              </div>

              {!isEmailVerified ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={loading}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-all whitespace-nowrap"
                    >
                      {isEmailSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>

                  {isEmailSent && (
                    <div className="space-y-1.5 animate-fade-in pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit code"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          className="flex-1 bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono text-center tracking-widest focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Verify Email
                        </button>
                      </div>
                      {demoEmailOtp && (
                        <span className="text-[10px] text-emerald-400 font-mono block">
                          OTP Code: {demoEmailOtp}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> {email}
                </p>
              )}
            </div>

            {/* 2. Mobile Phone Verification */}
            <div className="p-3.5 bg-slate-800/60 border border-white/5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> 2. Mobile Phone Verification
                </span>
                {isPhoneVerified && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Phone Verified
                  </span>
                )}
              </div>

              {!isPhoneVerified ? (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex">
                      <span className="inline-flex items-center px-2.5 rounded-l-xl bg-slate-900 border border-r-0 border-white/10 text-xs font-bold text-emerald-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-r-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={loading}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-all whitespace-nowrap"
                    >
                      {isPhoneSent ? 'Resend' : 'Send SMS'}
                    </button>
                  </div>

                  {isPhoneSent && (
                    <div className="space-y-1.5 animate-fade-in pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter SMS code"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          className="flex-1 bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono text-center tracking-widest focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Verify Phone
                        </button>
                      </div>
                      {demoPhoneOtp && (
                        <span className="text-[10px] text-emerald-400 font-mono block">
                          SMS OTP Code: {demoPhoneOtp}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> +91 {phone}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isEmailVerified) {
                    setError('Please verify your email address with the code.');
                    return;
                  }
                  if (!isPhoneVerified) {
                    setError('Please verify your mobile number with the SMS code.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                Continue to Security <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SECURITY & PRIVACY */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-modal-pop">
            <div className="p-3.5 bg-slate-800/80 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Two-Factor Authentication (2FA)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Require a verification code on every login for maximum account security.
                </p>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-slate-800/80 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Private Account
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Require approval before non-contacts can message you.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPrivateAccount}
                onChange={(e) => setIsPrivateAccount(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
              <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> End-to-End Cryptography Keypair
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Your device will automatically generate ECDH P-256 keys to secure all messages.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Creating Verified Account...' : 'Complete Registration & Sign In'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <CopyrightBadge floating={true} />
    </div>
  );
};
