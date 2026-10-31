import React from 'react';
import {
  Smartphone,
  Download,
  X,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Bell
} from 'lucide-react';
import { trackApkDownloadClick } from '../utils/analytics';

export const LATEST_APK_VERSION = '1.0.8';
const GITHUB_RELEASES_URL = 'https://github.com/Om-Prakash-Verma/abes-portal/releases/latest';
const DIRECT_APK_DOWNLOAD_URL = 'https://github.com/Om-Prakash-Verma/abes-portal/releases/latest/download/abes-portal.apk';

export default function DownloadAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleDownload = () => {
    trackApkDownloadClick();
    window.open(DIRECT_APK_DOWNLOAD_URL, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clay-card w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 bg-[#F4F7FB] dark:bg-[#0B0B0E]">
        
        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 border-b border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center shadow-clay-primary shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  ABES Portal Android App
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                  v{LATEST_APK_VERSION} Latest
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Faster performance, direct ERP connection & 0 Cloudflare Worker usage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="clay-btn p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="clay-card p-3 flex items-start gap-2.5 bg-white/70 dark:bg-black/40">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-800 dark:text-slate-200">Zero Worker Overhead</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Connects 100% directly from your device to the college server.
                </p>
              </div>
            </div>

            <div className="clay-card p-3 flex items-start gap-2.5 bg-white/70 dark:bg-black/40">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-800 dark:text-slate-200">1-Tap Fast Login</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Remember credentials securely to bypass password retyping.
                </p>
              </div>
            </div>

            <div className="clay-card p-3 flex items-start gap-2.5 bg-white/70 dark:bg-black/40">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-800 dark:text-slate-200">Official Signing Key</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Signed with permanent keystore for seamless 1-tap updates.
                </p>
              </div>
            </div>

            <div className="clay-card p-3 flex items-start gap-2.5 bg-white/70 dark:bg-black/40">
              <Bell className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-800 dark:text-slate-200">In-App Updates</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Checks and downloads latest APK releases directly inside the app.
                </p>
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Installation Guide for Android:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-indigo-800/90 dark:text-indigo-300">
              <li>Tap <strong>Download Android APK v{LATEST_APK_VERSION}</strong> below.</li>
              <li>Open the downloaded <code className="font-mono">abes-portal.apk</code> from notifications.</li>
              <li>If you had an earlier preview installed, uninstall it first to apply the permanent official certificate.</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-clay-primary active:scale-[0.98] transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK v{LATEST_APK_VERSION}</span>
            </button>

            <a
              href={GITHUB_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-center transition"
            >
              <span>View GitHub Releases & What's New</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
