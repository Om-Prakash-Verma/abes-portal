import React from 'react';
import { ShieldCheck, AlertTriangle, SlidersHorizontal } from 'lucide-react';

export default function OverallAttendanceCard({ totalData, targetPercent, setTargetPercent, subjectsCount, dangerCount }) {
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

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      
      {/* Subheader & Target Threshold Selector */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 px-0.5">
        <h2 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-500">
          Attendance Overview
        </h2>

        {/* Clay Target Threshold Switcher */}
        <div className="clay-inset p-1 rounded-2xl flex items-center gap-1 self-start xs:self-auto text-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 pl-2 pr-0.5 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-indigo-600" /> Target:
          </span>
          {[75, 80, 85].map((t) => (
            <button
              key={t}
              onClick={() => setTargetPercent(t)}
              className={`px-2.5 sm:px-3 py-1 font-bold rounded-xl transition-all text-[11px] sm:text-xs ${
                targetPercent === t
                  ? 'bg-indigo-600 text-white shadow-clay-primary scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}%
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column on Mobile, 4-Column on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* Metric 1: Overall Percentage */}
        <div className="clay-card p-3.5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              Overall
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-extrabold shrink-0 ${
              isSafe
                ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
                : 'bg-rose-100 text-rose-800 shadow-clay-danger'
            }`}>
              {isSafe ? `+${delta}%` : `${delta}%`}
            </span>
          </div>

          <div className="mt-2.5 sm:mt-4 flex items-baseline gap-1 sm:gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
              {percentage}%
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 hidden xs:inline">
              / min {targetPercent}%
            </span>
          </div>

          <div className="mt-2.5 sm:mt-4 w-full clay-inset h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isSafe ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500 shadow-sm'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Bunk Runway / Class Buffer */}
        <div className="clay-card p-3.5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              {isSafe ? 'Bunk Runway' : 'Shortage'}
            </span>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
              isSafe ? 'bg-emerald-100 text-emerald-700 shadow-clay-success' : 'bg-rose-100 text-rose-700 shadow-clay-danger'
            }`}>
              {isSafe ? <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <AlertTriangle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 flex items-baseline gap-1">
            <span className={`text-xl sm:text-4xl font-extrabold tracking-tight tabular-nums truncate ${
              isSafe ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {isSafe ? `${bunkPossible} Classes` : `${attendNeeded} Classes`}
            </span>
          </div>

          <p className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 line-clamp-2">
            {isSafe ? `Can miss ${bunkPossible} more classes.` : `Must attend next ${attendNeeded} classes.`}
          </p>
        </div>

        {/* Metric 3: Lectures Breakdown */}
        <div className="clay-card p-3.5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lectures
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500">
              {total} Total
            </span>
          </div>

          <div className="mt-2.5 sm:mt-4 flex items-center justify-between gap-2 sm:gap-4">
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
                {present}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Attended
              </span>
            </div>

            <div className="h-7 sm:h-10 w-px bg-slate-300/60" />

            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-rose-700 tabular-nums">
                {absent}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Missed
              </span>
            </div>
          </div>

          <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium truncate">
            Rate: <strong className="text-slate-800 tabular-nums">{((present / (total || 1)) * 100).toFixed(0)}%</strong>
          </div>
        </div>

        {/* Metric 4: Subject Health */}
        <div className="clay-card p-3.5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Courses
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500">
              {subjectsCount} Total
            </span>
          </div>

          <div className="mt-2.5 sm:mt-4 flex items-center justify-between gap-2 sm:gap-4">
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
                {safeCount}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Safe
              </span>
            </div>

            <div className="h-7 sm:h-10 w-px bg-slate-300/60" />

            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-rose-700 tabular-nums">
                {dangerCount}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Shortage
              </span>
            </div>
          </div>

          <p className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 truncate">
            {dangerCount === 0 ? 'All courses safe' : `${dangerCount} courses < ${targetPercent}%`}
          </p>
        </div>

      </div>

    </div>
  );
}
