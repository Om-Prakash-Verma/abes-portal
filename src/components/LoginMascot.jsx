import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Sparkles, Download } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

/**
 * 3D Claymorphic Interactive Mascot for Login Page
 * States:
 * - 'idle': follows cursor smoothly, enthusiastically announces new Android APK
 * - 'typing-id': happy, cheerful, smiling mouth, blushed cheeks, head bobs
 * - 'password': covers eyes with hands in 3D (peeks if showPassword is true)
 * - 'otp': covers eyes / shyly peeks with hands
 * - 'loading': thinking / nodding
 * - 'error': dizzy / shocked expression
 */
const ANNOUNCEMENT_MESSAGES = [
  { text: "Tired of 20-min OTP relogins? 🥱", tag: "NO MORE OTPS" },
  { text: "Download APK to stay logged in! ⚡", tag: "24/7 ACTIVE" },
  { text: "Zero Relogin • Direct ERP Connection 🚀", tag: `GET APK v${APP_CONFIG.version}` }
];

export default function LoginMascot({
  mode = 'idle', // 'idle' | 'typing-id' | 'password' | 'otp'
  showPassword = false,
  isTyping = false,
  hasError = false,
  isLoading = false,
  showAppAnnouncement = true,
  onOpenDownloadApp
}) {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  // Rotate announcement messages
  useEffect(() => {
    if (!showAppAnnouncement || mode !== 'idle') return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [showAppAnnouncement, mode]);

  // Smooth mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      // Limit max angle
      const maxDistance = 450;
      const normX = Math.max(-1, Math.min(1, deltaX / maxDistance));
      const normY = Math.max(-1, Math.min(1, deltaY / maxDistance));

      setMousePos({ x: normX, y: normY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (mode !== 'password' && mode !== 'otp') {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 180);
      }
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, [mode]);

  // Periodic greeting wave when idle
  useEffect(() => {
    if (mode === 'idle') {
      const waveInterval = setInterval(() => {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1400);
      }, 5000);
      return () => clearInterval(waveInterval);
    }
  }, [mode]);

  // Determine current active posture
  const isCoveringEyes = (mode === 'password' || mode === 'otp');
  const isHappy = mode === 'typing-id';
  const isPeeking = isCoveringEyes && showPassword;

  // 3D head rotation angles
  const headRotateX = isCoveringEyes ? 5 : (isHappy ? -mousePos.y * 10 : -mousePos.y * 15);
  const headRotateY = isCoveringEyes ? 0 : mousePos.x * 20;

  // Pupil offsets
  const pupilOffsetX = isCoveringEyes ? 0 : mousePos.x * 10;
  const pupilOffsetY = isCoveringEyes ? 0 : (isHappy ? 4 : mousePos.y * 7);

  return (
    <div
      ref={containerRef}
      className="relative w-48 h-40 select-none transition-transform duration-300"
      style={{ perspective: '800px' }}
    >
      {/* ================= ENHANCED MASCOT ANNOUNCEMENT SPEECH BALLOON ================= */}
      {showAppAnnouncement && mode === 'idle' && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenDownloadApp) onOpenDownloadApp();
          }}
          className="absolute -top-16 -right-12 sm:-right-20 z-50 cursor-pointer pointer-events-auto group animate-bounce"
          style={{ animationDuration: '3.2s' }}
          title="Click to download Android APK and eliminate 20-min re-logins!"
        >
          <div className="relative px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-extrabold text-[11px] sm:text-xs shadow-2xl flex flex-col gap-0.5 border border-white/50 transform group-hover:scale-105 transition-all">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-200 animate-pulse shrink-0" />
              <span className="whitespace-nowrap font-black tracking-tight">
                {ANNOUNCEMENT_MESSAGES[msgIndex].text}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-0.5 pt-0.5 border-t border-white/20 text-[9px]">
              <span className="text-emerald-200 font-mono font-bold tracking-wide">
                {ANNOUNCEMENT_MESSAGES[msgIndex].tag}
              </span>
              <span className="bg-white/25 px-1.5 py-0.5 rounded font-mono font-black flex items-center gap-0.5 group-hover:bg-white group-hover:text-emerald-700 transition-colors">
                <Download className="w-2.5 h-2.5" /> Tap APK
              </span>
            </div>

            {/* Bubble arrow pointing down towards mascot head */}
            <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-teal-600 transform rotate-45 border-r border-b border-white/20" />
          </div>
        </div>
      )}

      {/* 3D Container with Parallax Tilt */}
      <div
        className="w-full h-full relative transition-transform ease-out duration-150"
        style={{
          transform: `rotateX(${headRotateX}deg) rotateY(${headRotateY}deg) ${
            isTyping && isHappy ? 'scale(1.03) translateY(-3px)' : 'scale(1)'
          }`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Soft Clay Shadow beneath mascot */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900/10 rounded-full blur-md" />

        {/* Mascot Body & Torso */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-16 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-t-[40px] shadow-clay-primary border-t-2 border-white/30" />

        {/* Mascot Head (Tactile Clay Sphere) */}
        <div
          onClick={() => {
            if (mode === 'idle' && onOpenDownloadApp) onOpenDownloadApp();
          }}
          className={`absolute top-6 left-1/2 -translate-x-1/2 w-32 h-28 bg-gradient-to-b from-indigo-400 via-indigo-600 to-indigo-700 rounded-[44px] shadow-2xl border-2 border-white/40 flex flex-col items-center justify-center overflow-visible ${
            mode === 'idle' ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* Subtle Clay Highlight / Specular Reflection */}
          <div className="absolute top-2 left-6 w-12 h-6 bg-white/30 rounded-full blur-[2px] transform -rotate-12" />

          {/* Cute Round Clay Ears */}
          <div className="absolute -top-2.5 left-2.5 w-7 h-7 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full border-2 border-white/30 shadow-md flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-indigo-300/60 rounded-full" />
          </div>
          <div className="absolute -top-2.5 right-2.5 w-7 h-7 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full border-2 border-white/30 shadow-md flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-indigo-300/60 rounded-full" />
          </div>

          {/* Face Area */}
          <div className="relative z-10 flex flex-col items-center mt-1">
            {/* Eyes Row */}
            <div className="flex items-center gap-5 mt-1">
              {/* Left Eye */}
              <div className="relative w-7 h-8 bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden border border-slate-200">
                {isCoveringEyes && !isPeeking ? (
                  <div className="w-4 h-1 bg-slate-700 rounded-full mt-1 transform rotate-6" />
                ) : isBlinking ? (
                  <div className="w-4 h-1 bg-slate-700 rounded-full" />
                ) : (
                  <div
                    className="relative w-4 h-4 bg-slate-900 rounded-full transition-transform duration-75 flex items-center justify-center"
                    style={{
                      transform: `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`
                    }}
                  >
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* Right Eye */}
              <div className="relative w-7 h-8 bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden border border-slate-200">
                {isCoveringEyes ? (
                  isPeeking ? (
                    <div
                      className="relative w-4 h-4 bg-slate-900 rounded-full transition-transform duration-75 flex items-center justify-center animate-pulse"
                      style={{
                        transform: `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`
                      }}
                    >
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  ) : (
                    <div className="w-4 h-1 bg-slate-700 rounded-full mt-1 transform -rotate-6" />
                  )
                ) : isBlinking ? (
                  <div className="w-4 h-1 bg-slate-700 rounded-full" />
                ) : (
                  <div
                    className="relative w-4 h-4 bg-slate-900 rounded-full transition-transform duration-75 flex items-center justify-center"
                    style={{
                      transform: `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`
                    }}
                  >
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Rosy Cheeks */}
            <div className="flex items-center justify-between w-24 -mt-2 pointer-events-none">
              <div
                className={`w-4 h-2 rounded-full bg-rose-400/60 blur-[1px] transition-all duration-300 ${
                  isHappy || (mode === 'idle' && showAppAnnouncement) ? 'opacity-100 scale-125 bg-rose-400/90' : 'opacity-40'
                }`}
              />
              <div
                className={`w-4 h-2 rounded-full bg-rose-400/60 blur-[1px] transition-all duration-300 ${
                  isHappy || (mode === 'idle' && showAppAnnouncement) ? 'opacity-100 scale-125 bg-rose-400/90' : 'opacity-40'
                }`}
              />
            </div>

            {/* Mouth */}
            <div className="mt-1 flex items-center justify-center">
              {hasError ? (
                <div className="w-4 h-2 border-t-2 border-slate-800 rounded-t-full mt-1" />
              ) : isHappy || (mode === 'idle' && showAppAnnouncement) ? (
                <div className="w-6 h-3.5 bg-rose-700 rounded-b-full border-t-2 border-slate-800 overflow-hidden relative shadow-inner animate-pulse">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-rose-400 rounded-full" />
                </div>
              ) : isCoveringEyes ? (
                <div className="w-2.5 h-1.5 bg-slate-800 rounded-full" />
              ) : (
                <div className="w-4 h-2 border-b-2 border-slate-800 rounded-b-full" />
              )}
            </div>
          </div>

          {/* 3D Left Hand */}
          <div
            className="absolute z-30 transition-all duration-500 ease-out pointer-events-none"
            style={{
              bottom: isCoveringEyes ? '32px' : '-16px',
              left: isCoveringEyes ? '20px' : '4px',
              transform: isCoveringEyes
                ? (isPeeking ? 'translateY(18px) rotate(-18deg) scale(1)' : 'translateY(0px) rotate(22deg) scale(1.15)')
                : 'translateY(24px) scale(0.8)',
              opacity: isCoveringEyes ? 1 : 0.3
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-2xl shadow-clay-primary border-2 border-white/40 flex items-center justify-around p-1">
              <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
              <div className="w-1.5 h-2.5 bg-indigo-300 rounded-full" />
              <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
            </div>
          </div>

          {/* 3D Right Hand (Actively waves & holds a mini smartphone pointing to APK when idle!) */}
          <div
            onClick={(e) => {
              if (mode === 'idle' && onOpenDownloadApp) {
                e.stopPropagation();
                onOpenDownloadApp();
              }
            }}
            className={`absolute z-30 transition-all duration-500 ease-out ${
              mode === 'idle' ? 'cursor-pointer pointer-events-auto group' : 'pointer-events-none'
            }`}
            style={{
              bottom: isCoveringEyes ? '32px' : '10px',
              right: isCoveringEyes ? '20px' : '-18px',
              transform: isCoveringEyes
                ? (isPeeking ? 'translateY(28px) rotate(25deg) scale(1.05)' : 'translateY(0px) rotate(-22deg) scale(1.15)')
                : (isWaving ? 'translateY(-14px) rotate(-28deg) scale(1.1)' : 'translateY(-4px) rotate(-12deg) scale(1)'),
              opacity: 1
            }}
            title="Download Android APK"
          >
            <div className="relative w-11 h-11 bg-gradient-to-t from-indigo-700 via-indigo-600 to-indigo-500 rounded-2xl shadow-clay-primary border-2 border-white/40 flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
              {showAppAnnouncement && !isCoveringEyes ? (
                /* Cute glowing mini phone held by mascot */
                <div className="w-6 h-8 rounded-md bg-slate-900 border border-emerald-400 flex flex-col items-center justify-between p-0.5 shadow-md">
                  <div className="w-1.5 h-0.5 bg-slate-600 rounded-full" />
                  <div className="w-4 h-4 bg-emerald-500/80 rounded-sm flex items-center justify-center">
                    <Download className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                </div>
              ) : (
                <div className="flex items-center justify-around w-full">
                  <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
                  <div className="w-1.5 h-2.5 bg-indigo-300 rounded-full" />
                  <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
