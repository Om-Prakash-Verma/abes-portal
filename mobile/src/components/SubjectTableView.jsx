import React from 'react';
import { ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SubjectTableView({ subjects = [], onSelect, targetPercent = 75 }) {
  return (
    <div className="w-full space-y-2.5">
      {subjects.map((sub, idx) => {
        const { SubCollegeCode, SubName, NoOfLecture, Present, Percentage } = sub;
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
          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
          : isBorderline
          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40'
          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/40';

        const barColor = isSafe
          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
          : isBorderline
          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
          : 'bg-gradient-to-r from-rose-500 to-red-400';

        return (
          <div
            key={SubCollegeCode || idx}
            onClick={() => onSelect(sub)}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0E0E14] border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-sm active:scale-[0.99] transition-all cursor-pointer group"
          >
            {/* Top row: Code + Percentage badge + Chevron */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-black uppercase text-slate-500 dark:text-slate-400 clay-inset px-2 py-0.5 rounded-md">
                {SubCollegeCode}
              </span>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums ${badgeClass}`}>
                  {Percentage}%
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Course Title */}
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {SubName}
            </h4>

            {/* Progress bar */}
            <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.min(Percentage, 100)}%` }}
              />
            </div>

            {/* Bottom info strip: Attendance count + Bunk status */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span>{Present} of {NoOfLecture} attended</span>

              <span className={`flex items-center gap-1 font-bold ${
                isSafe
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isBorderline
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}>
                {isSafe ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>{statusText}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
