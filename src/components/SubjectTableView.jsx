import React from 'react';
import { ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SubjectTableView({ subjects, onSelect, targetPercent = 75 }) {
  return (
    <div className="w-full clay-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 bg-[#E8EEF5]/60">
              <th className="py-4 px-6">Course / Subject</th>
              <th className="py-4 px-4">Code</th>
              <th className="py-4 px-4">Attended / Total</th>
              <th className="py-4 px-4 min-w-[150px]">Progress</th>
              <th className="py-4 px-4 text-center">Percentage</th>
              <th className="py-4 px-4">Runway Status</th>
              <th className="py-4 px-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 text-xs">
            {subjects.map((sub, idx) => {
              const { SubCollegeCode, SubName, NoOfLecture, Present, Percentage } = sub;
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
                <tr
                  key={SubCollegeCode || idx}
                  onClick={() => onSelect(sub)}
                  className="hover:bg-white/60 transition-colors cursor-pointer group"
                >
                  {/* Course Name */}
                  <td className="py-4 px-6 font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {SubName}
                  </td>

                  {/* Code */}
                  <td className="py-4 px-4 font-mono text-[11px]">
                    <span className="clay-inset px-2.5 py-1 rounded-lg font-bold text-slate-600">
                      {SubCollegeCode || 'N/A'}
                    </span>
                  </td>

                  {/* Attended / Total */}
                  <td className="py-4 px-4 font-bold text-slate-700 tabular-nums">
                    <span className="text-slate-900 font-extrabold">{Present}</span> / {NoOfLecture}
                  </td>

                  {/* Progress Bar */}
                  <td className="py-4 px-4">
                    <div className="relative w-full clay-inset h-2.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 shadow-sm ${barColor}`}
                        style={{ width: `${Math.min(Percentage, 100)}%` }}
                      />
                    </div>
                  </td>

                  {/* Percentage Badge */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold tabular-nums ${badgeClass}`}>
                      {Percentage}%
                    </span>
                  </td>

                  {/* Runway Status */}
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 font-bold text-xs ${
                      isSafe ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isSafe ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      {statusText}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td className="py-4 px-6 text-right">
                    <span className="text-slate-500 group-hover:text-indigo-600 inline-flex items-center gap-1 font-bold transition-colors text-xs">
                      View Logs <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
