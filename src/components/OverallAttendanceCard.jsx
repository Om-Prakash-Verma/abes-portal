import React from 'react';
import { ShieldCheck, AlertTriangle, SlidersHorizontal } from 'lucide-react';

export default function OverallAttendanceCard({
  totalData,
  targetPercent = 75,
  setTargetPercent,
  subjectsCount = 0,
  dangerCount = 0
}) {
  const present = totalData?.Present || 0;
  const total = totalData?.NoOfLecture || 0;
  const absent = totalData?.Absent || 0;
  const percentage = totalData?.Percentage || 0;

  const isSafe = percentage >= targetPercent;
  const delta = (percentage - targetPercent).toFixed(1);

  let bunkPossible = 0;
  let attendNeeded = 0;

  if (isSafe && targetPercent > 0) {
    bunkPossible = Math.max(0, Math.floor((present * 100) / targetPercent - total));
  } else if (!isSafe && targetPercent < 100) {
    attendNeeded = Math.max(0, Math.ceil((targetPercent * total - 100 * present) / (100 - targetPercent)));
  }

  const safeCount = Math.max(0, subjectsCount - dangerCount);
  const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(0) : 0;

  return (
    <div className="w-full clay-card p-4 sm:p-6 bg-gradient-to-br from-white/95 via-slate-50/90 to-indigo-50/40 dark:from-[#111116] dark:via-[#0A0A0D] dark:to-[#120E1C] border border-slate-200/80 dark:border-white/10 shadow-xl rounded-3xl overflow-hidden transition-all">
      
      {/* ================= TOP CONTROLS ROW ================= */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Attendance Overview
          </span>
        </div>

        {/* Target Threshold Switcher */}
        <div className="clay-inset p-0.5 rounded-xl flex items-center gap-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 pl-2 pr-0.5 hidden xs:inline">
            Target:
          </span>
          {[75, 80, 85].map((t) => (
            <button
              key={t}
              onClick={() => setTargetPercent(t)}
              className={`px-2.5 py-1 font-black rounded-lg transition-all text-[11px] ${
                targetPercent === t
                  ? 'bg-indigo-600 text-white shadow-clay-primary scale-[1.03]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}%
            </button>
          ))}
        </div>
      </div>

      {/* ================= HERO CONTENT: OVERALL & RUNWAY ================= */}
      <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        
        {/* Left: Overall Attendance Score */}
        <div className="flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Attendance
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                isSafe
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/40'
              }`}
            >
              {isSafe ? `+${delta}% Safe` : `${delta}% Alert`}
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {percentage}%
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Target: {targetPercent}%
            </span>
          </div>

          {/* Progress Bar with Target Notch */}
          <div className="mt-3 relative w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isSafe
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-sm'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Bunk Runway Pill Card */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isSafe
            ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-300/50 dark:border-emerald-800/40'
            : 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-300/50 dark:border-rose-800/40'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isSafe ? 'Bunk Runway' : 'Attendance Shortage'}
            </span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isSafe
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-rose-500 text-white shadow-sm'
            }`}>
              {isSafe ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
          </div>

          <div className="mt-1">
            <div className={`text-xl sm:text-2xl font-black tracking-tight tabular-nums ${
              isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}>
              {isSafe ? `${bunkPossible} Classes` : `${attendNeeded} Classes`}
            </div>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
              {isSafe
                ? `You can safely miss ${bunkPossible} more lectures.`
                : `Must attend next ${attendNeeded} classes consecutively.`}
            </p>
          </div>
        </div>

      </div>

      {/* ================= BOTTOM METRICS STRIP ================= */}
      <div className="mt-2 pt-3 border-t border-slate-200/70 dark:border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
        
        {/* Attended */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            Attended
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {present} <span className="text-[10px] text-slate-400 font-normal">/ {total}</span>
          </span>
        </div>

        {/* Missed */}
        <div className="flex flex-col items-center justify-center border-x border-slate-200/70 dark:border-white/10 px-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            Missed
          </span>
          <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {absent} <span className="text-[10px] text-slate-400 font-normal">({attendanceRate}%)</span>
          </span>
        </div>

        {/* Courses Health */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            Courses
          </span>
          <span className="text-sm sm:text-base font-black text-slate-800 dark:text-white tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">{safeCount}</span>
            <span className="text-slate-400 font-normal"> / </span>
            <span className="text-rose-600 dark:text-rose-400">{dangerCount}</span>
          </span>
        </div>

      </div>

    </div>
  );
}
