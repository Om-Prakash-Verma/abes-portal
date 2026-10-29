import React, { useState, useRef } from 'react';
import { GraduationCap, ShieldCheck, Key, ArrowRight, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff, Smartphone, CheckCircle2 } from 'lucide-react';
import { sendLoginOtp, verifyLoginOtp, setStoredCookie } from '../services/api';
import LoginMascot from './LoginMascot';

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP

  // Form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // Manual cookie fallback toggle
  const [showCookieFallback, setShowCookieFallback] = useState(false);
  const [manualCookie, setManualCookie] = useState('');

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password) {
      setError('Please enter your ERP ID and Password.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendLoginOtp(username.trim(), password);
      setAuthHandshake(data);
      setSuccessMsg(data.message || 'OTP sent successfully!');
      setStep(2);
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
      setError('Please enter the OTP received on your mobile / email.');
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
    <div className="min-h-screen bg-[#EEF3F8] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ABES Portal
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium px-2">
          Direct authentication with your official college credentials
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
          
          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-2xl bg-rose-100 text-rose-800 shadow-clay-danger flex items-start gap-2.5 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && step === 2 && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 shadow-clay-success flex items-start gap-2.5 text-xs font-bold">
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
                  placeholder="e.g. 2024b0101207"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-clay-primary active:scale-[0.98] transition mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with ABES Server...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Send OTP to Mobile & Email</span>
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
                  Please check the SMS on your registered phone or college email.
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
                  disabled={loading}
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Resend OTP
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
