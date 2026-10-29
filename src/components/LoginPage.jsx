import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Key,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  CheckCircle2,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import {
  sendLoginOtp,
  verifyLoginOtp,
  setStoredCookie,
  getSavedCredentials,
  setSavedCredentials,
  clearSavedCredentials
} from '../services/api';
import LoginMascot from './LoginMascot';

export default function LoginPage({ onLoginSuccess, isDark, onToggleDark }) {
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP

  // Form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Saved credentials (Fast Login)
  const [rememberMe, setRememberMe] = useState(true);
  const [hasSavedCreds, setHasSavedCreds] = useState(false);

  useEffect(() => {
    const saved = getSavedCredentials();
    if (saved && saved.username && saved.password) {
      setUsername(saved.username);
      setPassword(saved.password);
      setHasSavedCreds(true);
      setRememberMe(true);
    }
  }, []);

  const handleForgetCredentials = (e) => {
    if (e) e.preventDefault();
    clearSavedCredentials();
    setUsername('');
    setPassword('');
    setHasSavedCreds(false);
  };

  // Mascot interaction state
  const [focusedField, setFocusedField] = useState(null); // 'username' | 'password' | 'otp' | null
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef(null);

  const triggerTyping = () => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 350);
  };

  // Stored state from Step 1
  const [authHandshake, setAuthHandshake] = useState(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // 60-Second Cooldown countdown timer to protect Worker quota & prevent spam
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Manual cookie fallback toggle
  const [showCookieFallback, setShowCookieFallback] = useState(false);
  const [manualCookie, setManualCookie] = useState('');

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otpCooldown > 0) {
      setError(`Please wait ${otpCooldown} seconds before requesting a new OTP.`);
      return;
    }

    if (!username.trim() || !password) {
      setError('Please enter your ERP ID and Password.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendLoginOtp(username.trim(), password);
      setAuthHandshake(data);
      setSuccessMsg(data.message || 'OTP has been sent to your official college email ID!');
      setStep(2);
      setOtpCooldown(60); // Start 60-second cooldown
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your official college email ID.');
      return;
    }

    setLoading(true);
    try {
      await verifyLoginOtp({
        username: username.trim(),
        password,
        otp: otp.trim(),
        viewState: authHandshake?.viewState,
        sessionCookie: authHandshake?.sessionCookie
      });

      if (rememberMe) {
        setSavedCredentials(username.trim(), password);
      } else {
        clearSavedCredentials();
      }

      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual cookie fallback
  const handleManualCookieSubmit = (e) => {
    e.preventDefault();
    if (!manualCookie.trim()) {
      setError('Please enter a session cookie.');
      return;
    }
    setStoredCookie(manualCookie.trim());
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#EEF3F8] dark:bg-black transition-colors flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Floating Theme Toggle on Login Screen */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
        <button
          onClick={onToggleDark}
          className="clay-btn p-2.5 text-slate-700 dark:text-amber-400 hover:text-indigo-600 dark:hover:text-amber-300"
          title={isDark ? "Switch to Light Mode" : "Switch to Black Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          ABES Portal
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium px-2">
          Modern academic & attendance portal for ABES students
        </p>
      </div>

      {/* 3D Animated Interactive Mascot sitting on top of the login card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center -mb-7 sm:-mb-8 z-10 relative">
        <LoginMascot
          mode={
            step === 2
              ? 'otp'
              : focusedField === 'password'
              ? 'password'
              : focusedField === 'username'
              ? 'typing-id'
              : 'idle'
          }
          showPassword={showPassword}
          isTyping={isTyping}
          hasError={Boolean(error)}
          isLoading={loading}
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="clay-card py-6 sm:py-8 px-5 sm:px-9 pt-9 sm:pt-10">
          
          {/* Official ERP Credentials Notice */}
          <div className="mb-4 sm:mb-5 p-2.5 sm:p-3 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-[11px] sm:text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Login credentials are your original ABES ERP portal login details.</span>
          </div>

          {/* Fast Login Detected Banner */}
          {hasSavedCreds && step === 1 && (
            <div className="mb-4 sm:mb-5 p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Fast Login: Credentials saved on this device</span>
              </div>
              <button
                type="button"
                onClick={handleForgetCredentials}
                className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline font-semibold ml-2 shrink-0"
                title="Remove saved credentials from this browser"
              >
                Forget
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-clay-danger flex items-start gap-2.5 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && step === 2 && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-clay-success flex items-start gap-2.5 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: CREDENTIALS ================= */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  ERP User ID / Admission No.
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    triggerTyping();
                  }}
                  placeholder="Enter your ERP ID / Admission No."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl clay-inset text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  ERP Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      triggerTyping();
                    }}
                    placeholder="Enter your ERP password"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 pr-10 text-xs sm:text-sm font-bold rounded-xl clay-inset text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Credentials Checkbox */}
              <div className="flex items-center justify-between pt-0.5 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <span>Remember credentials on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || otpCooldown > 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-clay-primary active:scale-[0.98] transition mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with ABES Server...</span>
                  </>
                ) : otpCooldown > 0 ? (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Resend available in {otpCooldown}s</span>
                  </>
                ) : hasSavedCreds ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Send OTP to College Email (Fast Login)</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send OTP to College Email</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: VERIFY OTP ================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5 sm:space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    6-Digit Verification OTP
                  </label>
                  <span className="text-xs font-mono text-indigo-700 font-extrabold">
                    {username}
                  </span>
                </div>

                <input
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={otp}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    triggerTyping();
                  }}
                  placeholder="Enter OTP (e.g. 942047)"
                  className="w-full px-4 py-3 sm:py-3.5 text-center tracking-widest text-xl sm:text-2xl font-mono font-extrabold rounded-2xl clay-inset text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <p className="text-[11px] font-medium text-slate-500 mt-2 text-center">
                  Please check the inbox and spam folder of your official college email ID.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-clay-primary active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Credentials
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || otpCooldown > 0}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ================= OPTIONAL FALLBACK ================= */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
            <button
              type="button"
              onClick={() => setShowCookieFallback(!showCookieFallback)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              {showCookieFallback ? 'Hide cookie options' : 'Advanced: Paste Session Cookie'}
            </button>

            {showCookieFallback && (
              <form onSubmit={handleManualCookieSubmit} className="mt-3 text-left space-y-2">
                <textarea
                  rows={2}
                  value={manualCookie}
                  onChange={(e) => setManualCookie(e.target.value)}
                  placeholder="ASP.NET_SessionId=...; MyAuth=..."
                  className="w-full p-3 font-mono text-xs rounded-xl clay-inset text-slate-900"
                />
                <button
                  type="submit"
                  className="clay-btn w-full py-2 px-3 text-xs font-bold text-slate-700"
                >
                  Connect with Cookie
                </button>
              </form>
            )}

            <p className="mt-4 text-[10px] sm:text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Direct connection • Your credentials never leave your browser
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
