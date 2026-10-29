import React from 'react';
import { ShieldCheck, AlertTriangle, SlidersHorizontal, ArrowUpRight, TrendingUp } from 'lucide-react';

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
    <div className="w-full space-y-4">
      
      {/* Subheader & Target Threshold Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
            Semester Attendance Metrics
          </h2>
        </div>

        {/* Clay Target Threshold Switcher */}
        <div className="clay-inset p-1 rounded-2xl flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="text-[11px] font-bold text-slate-500 pl-2 pr-1 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Target:
          </span>
          {[75, 80, 85].map((t) => (
            <button
              key={t}
              onClick={() => setTargetPercent(t)}
              className={`px-3 py-1 font-bold rounded-xl transition-all text-xs ${
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

      {/* 4-Column Claymorphic KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Overall Percentage */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Attendance
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
              isSafe
                ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
                : 'bg-rose-100 text-rose-800 shadow-clay-danger'
            }`}>
              {isSafe ? `+${delta}% above target` : `${delta}% shortage`}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
              {percentage}%
            </span>
            <span className="text-xs font-bold text-slate-400">
              / target {targetPercent}%
            </span>
          </div>

          <div className="mt-4 w-full clay-inset h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isSafe ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500 shadow-sm'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Bunk Runway / Class Buffer */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isSafe ? 'Bunk Runway' : 'Attendance Shortage'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isSafe ? 'bg-emerald-100 text-emerald-700 shadow-clay-success' : 'bg-rose-100 text-rose-700 shadow-clay-danger'
            }`}>
              {isSafe ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tracking-tight tabular-nums ${
              isSafe ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {isSafe ? `${bunkPossible} Classes` : `${attendNeeded} Classes`}
            </span>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {isSafe ? `You can miss ${bunkPossible} more lectures and maintain >= ${targetPercent}%.` : `Must attend next ${attendNeeded} lectures continuously.`}
          </p>
        </div>

        {/* Metric 3: Lectures Breakdown */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lectures Logged
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {total} Total
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold text-emerald-700 tabular-nums">
                {present}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Attended
              </span>
            </div>

            <div className="h-10 w-px bg-slate-300/60" />

            <div>
              <div className="text-3xl font-extrabold text-rose-700 tabular-nums">
                {absent}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Missed
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Presence Rate:</span>
            <strong className="text-slate-800 tabular-nums font-bold">
              {((present / (total || 1)) * 100).toFixed(0)}% overall
            </strong>
          </div>
        </div>

        {/* Metric 4: Subject Health */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Course Health
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {subjectsCount} Courses
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold text-emerald-700 tabular-nums">
                {safeCount}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Safe (&ge;{targetPercent}%)
              </span>
            </div>

            <div className="h-10 w-px bg-slate-300/60" />

            <div>
              <div className="text-3xl font-extrabold text-rose-700 tabular-nums">
                {dangerCount}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Shortage (&lt;{targetPercent}%)
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            {dangerCount === 0 ? 'All courses comply with attendance standards!' : `${dangerCount} courses are below university threshold.`}
          </p>
        </div>

      </div>

    </div>
  );
}
