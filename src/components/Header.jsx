import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  RefreshCw,
  LogOut,
  Receipt,
  Sun,
  Moon,
  User,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Check,
  Clock,
  Smartphone,
  Zap
} from 'lucide-react';

export default function Header({
  profile,
  onLogout,
  onOpenProfile,
  onOpenFees,
  onRefresh,
  loading,
  isDark,
  onToggleDark,
  sessionRemainingSec = 0,
  onOpenDownloadApp
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const formatTimer = (s) => {
    if (!s || s <= 0) return 'Expired';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec < 10 ? '0' : ''}${sec}s`;
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const studentName = profile.adm_firstname || 'Student';
  const admissionNo = profile.adm_admissionno || '';
  const branchName = profile.Branch_Name || 'CSE';
  const semesterName = profile.Samester_Name || 'Sem V';
  const initial = studentName.charAt(0).toUpperCase();
  const photoUrl = admissionNo
    ? `/api/abes/Services/ProfilePic.aspx?ID=${admissionNo}`
    : null;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#EEF3F8]/85 dark:bg-black/85 border-b border-slate-200/60 dark:border-white/10 transition-colors">
      <div className="w-full px-3.5 sm:px-6 lg:px-8 2xl:px-12 h-16 sm:h-18 flex items-center justify-between gap-3">
        
        {/* ================= LEFT: BRAND & ACADEMIC MONOGRAM ================= */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Micro Icon Shield */}
          <div className="relative group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center shadow-clay-primary transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
            </div>
            {/* Ambient Pulse Dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-black"></span>
            </span>
          </div>

          {/* Clean Typography Anchor */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-none">
                ABES<span className="text-indigo-600 dark:text-indigo-400">Portal</span>
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live ERP</span>
              </span>
            </div>

            {/* Academic Info Micro-Pill */}
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              <span className="truncate">{branchName}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="truncate">{semesterName}</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: SCULPTED COMMAND CAPSULE ================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Utility Capsule: Fast 1-Click Controls */}
          <div className="clay-inset p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex items-center gap-1">
            
            {/* 1-Click Sync Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 transition-all"
              title="Sync ERP Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            </button>

            {/* Fee Receipts Quick Action (Desktop & Tablet) */}
            <button
              onClick={onOpenFees}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 transition-all"
              title="View Fee Receipts & History"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Fees</span>
            </button>

            {/* Android APK Download Shortcut */}
            <button
              onClick={onOpenDownloadApp}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 transition-all"
              title="Download Android APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Get APK</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleDark}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 dark:text-amber-400 hover:text-indigo-600 dark:hover:text-amber-300 hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 transition-all"
              title={isDark ? "Switch to Light Mode" : "Switch to OLED Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
              )}
            </button>

          </div>

          {/* Interactive Profile Hub & Flyout Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`clay-btn flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 rounded-xl sm:rounded-2xl transition-all ${
                menuOpen ? 'ring-2 ring-indigo-500/50 scale-[0.98]' : ''
              }`}
              title="Student Account & Options"
              aria-expanded={menuOpen}
            >
              {/* Monogram Initial Avatar */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                {initial}
              </div>

              {/* Student Name & Dropdown Chevron */}
              <div className="hidden sm:flex flex-col text-left leading-tight pr-0.5">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white truncate max-w-[100px]">
                  {studentName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[100px]">
                  {admissionNo ? admissionNo.substring(0, 10) : 'Account'}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  menuOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                }`}
              />
            </button>

            {/* ================= FLOATING GLASS FLYOUT POPUP ================= */}
            {menuOpen && (
              <div className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0B0B0E]/95 backdrop-blur-2xl shadow-2xl border border-slate-200/90 dark:border-white/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                
                {/* Popover Student Hero Card */}
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shrink-0 overflow-hidden relative border border-white/20">
                      <span className="font-extrabold text-sm">{initial}</span>
                      {photoUrl && (
                        <img
                          src={photoUrl}
                          alt={studentName}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {studentName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium truncate">
                          {admissionNo || 'Student'}
                        </span>
                        {(branchName || semesterName) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                            {branchName} • {semesterName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dual Status Pill Cards (No text wrapping) */}
                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
                    <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">Student Status</span>
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                        Active Verified
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">Session Life</span>
                      </div>
                      <div className="mt-0.5 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                        {formatTimer(sessionRemainingSec)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Nav Actions */}
                <div className="p-1.5 space-y-0.5">
                  
                  {/* View Full Profile */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div>Student Profile</div>
                      <div className="text-[10px] text-slate-400 font-normal">Personal & academic details</div>
                    </div>
                  </button>

                  {/* Fee Receipts */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenFees();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div>Fee Receipts</div>
                      <div className="text-[10px] text-slate-400 font-normal">Past payments & transactions</div>
                    </div>
                  </button>

                  {/* Get Android App (Direct APK) */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDownloadApp();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Get Android App</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">APK</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Faster native app with 0 worker delay</div>
                    </div>
                  </button>

                  {/* Force ERP Sync */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRefresh();
                    }}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition text-left disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <div>Force ERP Refresh</div>
                      <div className="text-[10px] text-slate-400 font-normal">Bypass 12h cache & fetch live</div>
                    </div>
                  </button>

                </div>

                  {/* Sleek 1-Row Appearance Toggle */}
                  <button
                    onClick={onToggleDark}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.99] transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </div>
                      <div>
                        <div>Appearance</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {isDark ? 'OLED Pitch Black' : 'Light Neumorphic'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>

                {/* Disconnect / Sign Out */}
                <div className="p-1.5 pt-1 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div>Disconnect Session</div>
                      <div className="text-[10px] text-rose-400/80 font-normal">Clear cookie & sign out</div>
                    </div>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
