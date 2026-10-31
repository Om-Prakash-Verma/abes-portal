import React from 'react';
import { ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SubjectCard({ subject, onSelect, targetPercent = 75 }) {
  const { SubCollegeCode, SubName, NoOfLecture, Present, Percentage } = subject;

  const isSafe = Percentage >= targetPercent;
  const isBorderline = Percentage >= targetPercent - 10 && Percentage < targetPercent;

  let statusText = '';
  if (isSafe) {
    const canBunk = Math.max(0, Math.floor((Present * 100) / targetPercent - NoOfLecture));
    statusText = canBunk > 0 ? `Can miss ${canBunk} classes` : 'Attend next lecture';
  } else {
    const mustAttend = Math.max(0, Math.ceil((targetPercent * NoOfLecture - 100 * Present) / (100 - targetPercent)));
    statusText = `Must attend ${mustAttend} classes`;
  }

  const badgeClass = isSafe
    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 shadow-sm'
    : isBorderline
    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40 shadow-sm'
    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/40 shadow-sm';

  const barColor = isSafe
    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
    : isBorderline
    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
    : 'bg-gradient-to-r from-rose-500 to-red-400';

  return (
    <div
      onClick={() => onSelect(subject)}
      className="clay-card p-4 sm:p-5 cursor-pointer flex flex-col justify-between group bg-white/90 dark:bg-[#0D0D12] border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div>
        {/* Top: Code Pill & Percentage */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 clay-inset px-2.5 py-1 rounded-lg">
            {SubCollegeCode || 'N/A'}
          </span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums ${badgeClass}`}>
            {Percentage}%
          </span>
        </div>

        {/* Course Title */}
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {SubName}
        </h3>

        {/* Progress Bar & Counter */}
        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-bold tabular-nums">
            <span>{Present} of {NoOfLecture} attended</span>
            <span>Target: {targetPercent}%</span>
          </div>

          <div className="relative w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-sm ${barColor}`}
              style={{ width: `${Math.min(Percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Bunk Prediction & Logs Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
        <span className={`font-bold inline-flex items-center gap-1.5 text-[11px] sm:text-xs ${
          isSafe
            ? 'text-emerald-700 dark:text-emerald-400'
            : isBorderline
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-rose-700 dark:text-rose-400'
        }`}>
          {isSafe ? <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate max-w-[190px]">{statusText}</span>
        </span>

        <span className="text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center font-extrabold transition-colors text-[11px] shrink-0">
          Logs <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </div>
  );
}
