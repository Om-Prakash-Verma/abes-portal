import React, { useState, useEffect } from 'react';
import { Rocket, Download, X, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

export const CURRENT_APP_VERSION = '1.0.2';
const GITHUB_REPO = 'Om-Prakash-Verma/abes-portal';

function isVersionHigher(remote, current) {
  try {
    const rParts = remote.replace(/^v/, '').split('.').map(Number);
    const cParts = current.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] || 0;
      const c = cParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
  } catch (e) {}
  return false;
}

export default function AppUpdateChecker({ manualTrigger = false, onResetManualTrigger }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [upToDateStatus, setUpToDateStatus] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const performCheck = async (isManual = false) => {
    if (isManual) {
      setChecking(true);
      setUpToDateStatus(false);
      setCheckError(null);
      setDismissed(false);
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        cache: 'no-store'
      });

      if (!res.ok) {
        if (isManual) {
          setCheckError('Could not reach GitHub releases. Please check your internet connection.');
        }
        return;
      }

      const data = await res.json();
      const latestTag = data.tag_name || '';

      if (isVersionHigher(latestTag, CURRENT_APP_VERSION)) {
        const apkAsset = data.assets?.find((a) => a.name.endsWith('.apk'));
        const downloadUrl = apkAsset?.browser_download_url || data.html_url;

        setUpdateInfo({
          version: latestTag,
          name: data.name || latestTag,
          notes: data.body || 'Performance improvements and bug fixes.',
          downloadUrl
        });
        setDismissed(false);
      } else {
        if (isManual) {
          setUpToDateStatus(true);
        }
      }
    } catch (err) {
      if (isManual) {
        setCheckError('Network error while checking for updates. Please try again later.');
      }
    } finally {
      if (isManual) setChecking(false);
    }
  };

  // Background check on initial mount
  useEffect(() => {
    performCheck(false);
  }, []);

  // Manual trigger via prop (e.g. from Header menu or Profile modal)
  useEffect(() => {
    if (manualTrigger) {
      performCheck(true);
      if (onResetManualTrigger) onResetManualTrigger();
    }
  }, [manualTrigger]);

  const handleClose = () => {
    setDismissed(true);
    setUpToDateStatus(false);
    setCheckError(null);
  };

  // Render Nothing if dismissed and no active manual check
  if (dismissed && !checking && !upToDateStatus && !checkError) return null;

  // 1. Loading State (Manual check in progress)
  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="clay-card w-full max-w-sm p-6 text-center rounded-3xl bg-[#F4F7FB] dark:bg-[#0B0B0E] border border-white/60 dark:border-white/10 shadow-2xl space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Checking for Updates...</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Contacting GitHub release servers
          </p>
        </div>
      </div>
    );
  }

  // 2. Up to date feedback modal (Manual check result)
  if (upToDateStatus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="clay-card w-full max-w-sm p-6 text-center rounded-3xl bg-[#F4F7FB] dark:bg-[#0B0B0E] border border-white/60 dark:border-white/10 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">You're Up to Date!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              You are running the latest version <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">v{CURRENT_APP_VERSION}</span> of ABES Portal APK.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  // 3. Error modal (Manual check failure)
  if (checkError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="clay-card w-full max-w-sm p-6 text-center rounded-3xl bg-[#F4F7FB] dark:bg-[#0B0B0E] border border-white/60 dark:border-white/10 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Check Failed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {checkError}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-white/10 active:scale-95 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // 4. Update Available Modal
  if (!updateInfo || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clay-card w-full max-w-md overflow-hidden rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 bg-[#F4F7FB] dark:bg-[#0B0B0E]">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between border-b border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center shadow-clay-primary shrink-0">
              <Rocket className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Update Available!
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                  {updateInfo.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Current installed version: v{CURRENT_APP_VERSION}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="clay-btn p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="clay-inset p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto">
            <p className="font-extrabold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              What's New in {updateInfo.name}:
            </p>
            <div className="whitespace-pre-line text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              {updateInfo.notes}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={updateInfo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-clay-primary active:scale-[0.98] transition"
            >
              <Download className="w-4 h-4" />
              <span>Download & Install APK</span>
            </a>

            <button
              onClick={handleClose}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
