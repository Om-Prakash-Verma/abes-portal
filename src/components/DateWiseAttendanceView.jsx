import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Search,
  BookOpen,
  ChevronRight,
  Loader2,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { fetchAllDateWiseAttendance } from '../services/api';

export default function DateWiseAttendanceView({ semId, subjects = [], onSelectSubject }) {
  const [dayGroups, setDayGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ABSENT_ONLY' | 'PRESENT_ONLY'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest) | 'asc' (oldest)

  useEffect(() => {
    let isMounted = true;
    async function loadTimeline() {
      setLoading(true);
      try {
        const data = await fetchAllDateWiseAttendance(semId, subjects);
        if (isMounted) {
          setDayGroups(data);
        }
      } catch (err) {
        console.error('Failed to load date-wise attendance timeline:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (subjects && subjects.length > 0) {
      loadTimeline();
    }
    return () => { isMounted = false; };
  }, [semId, subjects]);

  // Total summary calculations
  const totalDays = dayGroups.length;
  const fullPresentDays = dayGroups.filter(d => d.totalAbsent === 0 && d.totalPresent > 0).length;
  const daysWithAbsents = dayGroups.filter(d => d.totalAbsent > 0).length;

  // Filter & Search
  let displayedDays = dayGroups.filter(day => {
    if (filter === 'ABSENT_ONLY' && day.totalAbsent === 0) return false;
    if (filter === 'PRESENT_ONLY' && day.totalAbsent > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesDate = (day.date || '').toLowerCase().includes(q) ||
                          (day.formattedDate || '').toLowerCase().includes(q);
      const matchesSubject = day.lectures.some(l =>
        (l.SubName || '').toLowerCase().includes(q) ||
        (l.SubCollegeCode || '').toLowerCase().includes(q) ||
        (l.Topic || '').toLowerCase().includes(q)
      );
      if (!matchesDate && !matchesSubject) return false;
    }

    return true;
  });

  // Sort by date
  displayedDays.sort((a, b) => {
    const parse = (dStr) => {
      if (!dStr) return 0;
      const parts = dStr.split(/[-/]/);
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
      }
      return new Date(dStr).getTime() || 0;
    };
    const tA = parse(a.date);
    const tB = parse(b.date);
    return sortOrder === 'desc' ? tB - tA : tA - tB;
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2.5" />
        <p className="text-xs font-black text-slate-700 dark:text-slate-300">Loading Daily Attendance Timeline...</p>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Fetching day-by-day logs from ERP</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      
      {/* ================= COMPACT TIMELINE CONTROLS & FILTER BAR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dates, courses, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-bold rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filter Pills and Sort Toggle */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="bg-slate-200/70 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 p-0.5 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                filter === 'ALL'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({totalDays})
            </button>
            <button
              onClick={() => setFilter('ABSENT_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                filter === 'ABSENT_ONLY'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Missed ({daysWithAbsents})
            </button>
            <button
              onClick={() => setFilter('PRESENT_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                filter === 'PRESENT_ONLY'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Full ({fullPresentDays})
            </button>
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition shrink-0"
            title={sortOrder === 'desc' ? 'Sorted: Newest First' : 'Sorted: Oldest First'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
          </button>
        </div>

      </div>

      {/* ================= TIMELINE ACTIVITY STREAM ================= */}
      {displayedDays.length === 0 ? (
        <div className="clay-card py-16 text-center p-6 bg-white/60 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            No attendance records matching this search or filter
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilter('ALL'); }}
            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-black hover:underline"
          >
            Reset timeline filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedDays.map((dayGroup) => {
            const isFullPresent = dayGroup.totalAbsent === 0;
            const hasAbsent = dayGroup.totalAbsent > 0;

            const badgeBg = isFullPresent
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/40';

            return (
              <div
                key={dayGroup.date}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0D0D12] border border-slate-200/80 dark:border-white/10 shadow-sm transition hover:shadow-md"
              >
                {/* Clean Date Header Row */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {dayGroup.formattedDate || dayGroup.date}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {dayGroup.totalPresent} of {dayGroup.totalCount} {dayGroup.totalCount === 1 ? 'Lecture' : 'Lectures'} Attended
                      </p>
                    </div>
                  </div>

                  {/* Attendance Percentage Badge */}
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full tabular-nums ${badgeBg}`}>
                    {dayGroup.percentage}%
                  </span>
                </div>

                {/* Day's Lecture Feed Rows */}
                <div className="mt-2.5 space-y-1.5">
                  {dayGroup.lectures.map((lec, idx) => {
                    const isPresent = lec.Attendance === 'P';
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (onSelectSubject) {
                            const fullSub = subjects.find(s => s.SubCollegeCode === lec.SubCollegeCode);
                            if (fullSub) onSelectSubject(fullSub);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl flex items-center justify-between gap-2.5 transition cursor-pointer group ${
                          isPresent
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/30'
                            : 'bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-100/60 dark:hover:bg-rose-950/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Present/Absent Indicator */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isPresent
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-black uppercase text-indigo-700 dark:text-indigo-400 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded">
                                {lec.SubCollegeCode}
                              </span>
                              <h5 className="text-xs font-black text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {lec.SubName}
                              </h5>
                            </div>
                            {lec.Topic && lec.Topic !== 'Regular Lecture' && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {lec.Topic}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Label & Action */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isPresent
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
