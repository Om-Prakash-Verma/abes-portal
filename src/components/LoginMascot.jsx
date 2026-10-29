import React, { useState, useEffect, useRef } from 'react';

/**
 * 3D Claymorphic Interactive Mascot for Login Page
 * States:
 * - 'idle': follows cursor smoothly with 3D tilt and pupil tracking
 * - 'typing-id': happy, cheerful, smiling mouth, blushed cheeks, head bobs
 * - 'password': covers eyes with hands in 3D (peeks if showPassword is true)
 * - 'otp': covers eyes / shyly peeks with hands
 * - 'loading': thinking / nodding
 * - 'error': dizzy / shocked expression
 */
export default function LoginMascot({
  mode = 'idle', // 'idle' | 'typing-id' | 'password' | 'otp'
  showPassword = false,
  isTyping = false,
  hasError = false,
  isLoading = false
}) {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

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
      className="relative w-44 h-40 select-none pointer-events-none transition-transform duration-300"
      style={{ perspective: '800px' }}
    >
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
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-28 bg-gradient-to-b from-indigo-400 via-indigo-600 to-indigo-700 rounded-[44px] shadow-2xl border-2 border-white/40 flex flex-col items-center justify-center overflow-visible">
          
          {/* Subtle Clay Highlight / Specular Reflection */}
          <div className="absolute top-2 left-5 w-12 h-6 bg-white/30 rounded-full blur-[2px] transform -rotate-12" />

          {/* Academic Graduation Cap */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            {/* Mortarboard Diamond Top */}
            <div className="w-24 h-11 bg-slate-800 rounded-sm shadow-xl transform rotate-[-5deg] border border-slate-700 relative flex items-center justify-center">
              {/* Gold Button on top */}
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-md border border-amber-300 z-10" />
              {/* Tassel String & Tassel */}
              <div className="absolute top-1/2 right-3 w-7 h-0.5 bg-amber-400 transform rotate-[45deg] origin-left" />
              <div className="absolute top-5 right-1 w-2.5 h-4 bg-amber-400 rounded-sm shadow" />
            </div>
            {/* Skull Cap Base */}
            <div className="w-14 h-4 bg-slate-900 rounded-b-xl -mt-1 shadow-md" />
          </div>

          {/* Mascot Ears */}
          <div className="absolute -top-1 -left-2 w-6 h-6 bg-indigo-500 rounded-full border-2 border-white/20 shadow-sm" />
          <div className="absolute -top-1 -right-2 w-6 h-6 bg-indigo-500 rounded-full border-2 border-white/20 shadow-sm" />

          {/* Face Area */}
          <div className="relative z-10 flex flex-col items-center mt-3">
            
            {/* Eyes Row */}
            <div className="flex items-center gap-5 mt-1">
              
              {/* Left Eye */}
              <div className="relative w-7 h-8 bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden border border-slate-200">
                {isCoveringEyes && !isPeeking ? (
                  // Closed eye curve
                  <div className="w-4 h-1 bg-slate-700 rounded-full mt-1 transform rotate-6" />
                ) : isBlinking ? (
                  // Blinking line
                  <div className="w-4 h-1 bg-slate-700 rounded-full" />
                ) : (
                  // Open Eye with tracking pupil
                  <div
                    className="relative w-4 h-4 bg-slate-900 rounded-full transition-transform duration-75 flex items-center justify-center"
                    style={{
                      transform: `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`
                    }}
                  >
                    {/* Specular Catchlight Sparkle */}
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* Right Eye */}
              <div className="relative w-7 h-8 bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden border border-slate-200">
                {isCoveringEyes ? (
                  isPeeking ? (
                    // Peeking open eye!
                    <div
                      className="relative w-4 h-4 bg-slate-900 rounded-full transition-transform duration-75 flex items-center justify-center animate-pulse"
                      style={{
                        transform: `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`
                      }}
                    >
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  ) : (
                    // Closed eye curve
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

            {/* Rosy Cheeks (Glows brighter when typing ID) */}
            <div className="flex items-center justify-between w-24 -mt-2 pointer-events-none">
              <div className={`w-4 h-2 rounded-full bg-rose-400/60 blur-[1px] transition-all duration-300 ${
                isHappy ? 'opacity-100 scale-125 bg-rose-400/90' : 'opacity-40'
              }`} />
              <div className={`w-4 h-2 rounded-full bg-rose-400/60 blur-[1px] transition-all duration-300 ${
                isHappy ? 'opacity-100 scale-125 bg-rose-400/90' : 'opacity-40'
              }`} />
            </div>

            {/* Mouth */}
            <div className="mt-1 flex items-center justify-center">
              {hasError ? (
                // Shocked/sad mouth
                <div className="w-4 h-2 border-t-2 border-slate-800 rounded-t-full mt-1" />
              ) : isHappy ? (
                // Happy big open smile with tongue
                <div className="w-6 h-3.5 bg-rose-700 rounded-b-full border-t-2 border-slate-800 overflow-hidden relative shadow-inner animate-pulse">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-rose-400 rounded-full" />
                </div>
              ) : isCoveringEyes ? (
                // Shy little mouth
                <div className="w-2.5 h-1.5 bg-slate-800 rounded-full" />
              ) : (
                // Default subtle happy curve
                <div className="w-4 h-2 border-b-2 border-slate-800 rounded-b-full" />
              )}
            </div>

          </div>

          {/* 3D Hands / Paws for covering eyes */}
          {/* Left Hand */}
          <div
            className="absolute z-30 transition-all duration-500 ease-out"
            style={{
              bottom: isCoveringEyes ? '32px' : '-16px',
              left: isCoveringEyes ? '20px' : '4px',
              transform: isCoveringEyes
                ? (isPeeking ? 'translateY(18px) rotate(-18deg) scale(1)' : 'translateY(0px) rotate(22deg) scale(1.15)')
                : 'translateY(24px) scale(0.8)',
              opacity: isCoveringEyes ? 1 : 0.2
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-2xl shadow-clay-primary border-2 border-white/40 flex items-center justify-around p-1">
              {/* Paw pads */}
              <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
              <div className="w-1.5 h-2.5 bg-indigo-300 rounded-full" />
              <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
            </div>
          </div>

          {/* Right Hand */}
          <div
            className="absolute z-30 transition-all duration-500 ease-out"
            style={{
              bottom: isCoveringEyes ? '32px' : '-16px',
              right: isCoveringEyes ? '20px' : '4px',
              transform: isCoveringEyes
                ? (isPeeking ? 'translateY(28px) rotate(25deg) scale(1.05)' : 'translateY(0px) rotate(-22deg) scale(1.15)')
                : 'translateY(24px) scale(0.8)',
              opacity: isCoveringEyes ? 1 : 0.2
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-2xl shadow-clay-primary border-2 border-white/40 flex items-center justify-around p-1">
              <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
              <div className="w-1.5 h-2.5 bg-indigo-300 rounded-full" />
              <div className="w-1.5 h-2 bg-indigo-300 rounded-full" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
