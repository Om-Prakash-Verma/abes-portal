import React, { useState, useEffect } from 'react';
import { Rocket, Download, X, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

export const CURRENT_APP_VERSION = '1.0.0';
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

export default function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        const latestTag = data.tag_name || '';

        if (isVersionHigher(latestTag, CURRENT_APP_VERSION)) {
          // Find apk asset if attached
          const apkAsset = data.assets?.find(a => a.name.endsWith('.apk'));
          const downloadUrl = apkAsset?.browser_download_url || data.html_url;

          setUpdateInfo({
            version: latestTag,
            name: data.name || latestTag,
            notes: data.body || 'Performance improvements and bug fixes.',
            downloadUrl
          });
        }
      } catch (err) {
        // Non-blocking background check
      }
    }

    checkForUpdates();
  }, []);

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
            onClick={() => setDismissed(true)}
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
              onClick={() => setDismissed(true)}
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
