import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Check, WifiOff, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if device is iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chrome/Edge/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Network status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Offline Status Toast */}
      {isOffline && (
        <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 bg-amber-500/95 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg backdrop-blur flex items-center gap-2 animate-bounce">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode • Viewing 30-min cached ERP data</span>
        </div>
      )}

      {/* Floating or Inline Install App Button (if not already installed and not dismissed) */}
      {!isInstalled && !dismissed && (deferredPrompt || isIOS) && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm">
          <div className="clay-card p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3 border border-indigo-200/60 bg-[#EEF3F8]/95 backdrop-blur">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-clay-primary shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 leading-tight">Install ABES Portal</h4>
                <p className="text-[10px] text-slate-500 font-bold truncate">Quick launch & offline access</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-clay-primary flex items-center gap-1 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Share -> Add to Home Screen Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-md p-6 rounded-3xl shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 clay-btn p-1.5 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-clay-primary">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Install on iPhone / iPad</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Install as a standalone app on your home screen in 2 easy steps:
              </p>
            </div>

            <div className="space-y-3 text-left text-xs font-bold text-slate-700 bg-white/60 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-indigo-600">Share button</strong> (square with arrow) at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-indigo-600">"Add to Home Screen"</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="clay-btn w-full py-2.5 text-xs font-black text-indigo-600"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
