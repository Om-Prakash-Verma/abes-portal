import React from 'react';
import { ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SubjectCard({ subject, onSelect, targetPercent = 75 }) {
  const { SubCollegeCode, SubName, NoOfLecture, Present, Percentage } = subject;

  const isSafe = Percentage >= targetPercent;
  const isBorderline = Percentage >= targetPercent - 10 && Percentage < targetPercent;

  let statusText = '';
  if (isSafe) {
    const canBunk = Math.max(0, Math.floor((Present * 100) / targetPercent - NoOfLecture));
    statusText = canBunk > 0 ? `Can miss ${canBunk} classes` : 'On the edge (attend next)';
  } else {
    const mustAttend = Math.max(0, Math.ceil((targetPercent * NoOfLecture - 100 * Present) / (100 - targetPercent)));
    statusText = `Must attend ${mustAttend} classes`;
  }

  const badgeClass = isSafe
    ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
    : isBorderline
    ? 'bg-amber-100 text-amber-800 shadow-sm border border-amber-300'
    : 'bg-rose-100 text-rose-800 shadow-clay-danger';

  const barColor = isSafe
    ? 'bg-emerald-500'
    : isBorderline
    ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div
      onClick={() => onSelect(subject)}
      className="clay-card p-5 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top: Code & Percentage Pill */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 clay-inset px-2.5 py-1 rounded-lg">
            {SubCollegeCode || 'N/A'}
          </span>
          <span className={`text-xs font-extrabold px-3 py-1 rounded-full tabular-nums ${badgeClass}`}>
            {Percentage}%
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-extrabold text-slate-900 mt-3.5 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {SubName}
        </h3>

        {/* Progress Bar with Target Indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-bold tabular-nums">
            <span>{Present} of {NoOfLecture} attended</span>
            <span>Target: {targetPercent}%</span>
          </div>

          <div className="relative w-full h-2.5 clay-inset rounded-full overflow-hidden p-0.5">
            {/* Target Threshold Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
              style={{ left: `${targetPercent}%` }}
              title={`Target ${targetPercent}%`}
            />
            {/* The Actual Progress Fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-sm ${barColor}`}
              style={{ width: `${Math.min(Percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Bunk Prediction & Link */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
        <span className={`font-bold inline-flex items-center gap-1.5 text-xs ${
          isSafe ? 'text-emerald-700' : 'text-rose-700'
        }`}>
          {isSafe ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {statusText}
        </span>
        <span className="text-slate-500 group-hover:text-indigo-600 flex items-center gap-0.5 font-bold transition-colors text-xs">
          Logs <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
