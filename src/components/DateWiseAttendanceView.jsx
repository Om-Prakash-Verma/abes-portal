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

export default function DateWiseAttendanceView({ semId, subjects, onSelectSubject }) {
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
  const totalLecturesCount = dayGroups.reduce((acc, d) => acc + d.totalCount, 0);
  const totalPresentCount = dayGroups.reduce((acc, d) => acc + d.totalPresent, 0);
  const overallAvg = totalLecturesCount > 0
    ? Number(((totalPresentCount / totalLecturesCount) * 100).toFixed(1))
    : 0;

  // Filter & Search
  let displayedDays = dayGroups.filter(day => {
    // Filter by type
    if (filter === 'ABSENT_ONLY' && day.totalAbsent === 0) return false;
    if (filter === 'PRESENT_ONLY' && day.totalAbsent > 0) return false;

    // Search query
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
  displayedDays = [...displayedDays].sort((a, b) => {
    if (sortOrder === 'desc') return b.timestamp - a.timestamp;
    return a.timestamp - b.timestamp;
  });

  if (loading) {
    return (
      <div className="clay-card py-28 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-extrabold text-slate-800">Compiling Date-Wise Attendance Timeline...</p>
        <p className="text-xs text-slate-500 font-medium mt-1">Aggregating daily lecture records across all registered subjects</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Date-Wise KPI Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Working Days with Lectures */}
        <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Days
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block tabular-nums">
              {totalDays} <span className="text-xs font-semibold text-slate-500">Days</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 mt-0.5 block">
              {totalLecturesCount} total lectures held
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-clay-primary">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 100% Present Days */}
        <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Full Attendance
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block tabular-nums">
              {fullPresentDays} <span className="text-xs font-semibold text-slate-500">Days</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 mt-0.5 block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600 inline" /> 100% attendance rate
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-clay-success">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Days with Absents (Shortage) */}
        <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Missed Sessions
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 mt-1 block tabular-nums">
              {daysWithAbsents} <span className="text-xs font-semibold text-slate-500">Days</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 mt-0.5 block">
              Days with &ge;1 absent
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-clay-danger">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Overall Timeline Score */}
        <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Aggregate Rate
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block tabular-nums">
              {overallAvg}%
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5 block">
              {totalPresentCount} of {totalLecturesCount} attended
            </span>
          </div>
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            overallAvg >= 75
              ? 'bg-emerald-100 text-emerald-700 shadow-clay-success'
              : 'bg-rose-100 text-rose-700 shadow-clay-danger'
          }`}>
            <span className="text-xs font-black">{overallAvg >= 75 ? 'SAFE' : 'LOW'}</span>
          </div>
        </div>

      </div>

      {/* Date-Wise Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dates, courses, codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-bold rounded-xl clay-inset text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Filter Pills and Sort Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="clay-inset p-1 rounded-xl flex items-center gap-1 text-xs shrink-0">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs whitespace-nowrap ${
                filter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-clay-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Days ({totalDays})
            </button>
            <button
              onClick={() => setFilter('ABSENT_ONLY')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 whitespace-nowrap ${
                filter === 'ABSENT_ONLY'
                  ? 'bg-rose-600 text-white shadow-clay-danger'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Missed ({daysWithAbsents})
            </button>
            <button
              onClick={() => setFilter('PRESENT_ONLY')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 whitespace-nowrap ${
                filter === 'PRESENT_ONLY'
                  ? 'bg-emerald-600 text-white shadow-clay-success'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              Full ({fullPresentDays})
            </button>
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="clay-btn p-2 px-3 text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0"
            title="Sort Date Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </span>
          </button>
        </div>

      </div>

      {/* Date-Wise Timeline Stream */}
      {displayedDays.length === 0 ? (
        <div className="clay-card py-20 text-center p-8">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-700">
            No attendance records found matching this filter
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilter('ALL'); }}
            className="mt-3 text-xs text-indigo-600 font-extrabold hover:underline"
          >
            Reset timeline filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedDays.map((dayGroup) => {
            const isFullPresent = dayGroup.totalAbsent === 0;
            const hasAbsent = dayGroup.totalAbsent > 0;

            const badgeBg = isFullPresent
              ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
              : 'bg-rose-100 text-rose-800 shadow-clay-danger';

            return (
              <div
                key={dayGroup.date}
                className="clay-card p-4 sm:p-5 transition hover:shadow-lg"
              >
                {/* Date Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="clay-inset p-2 rounded-xl text-indigo-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {dayGroup.formattedDate || dayGroup.date}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {dayGroup.totalCount} {dayGroup.totalCount === 1 ? 'Lecture' : 'Lectures'} Conducted
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 hidden sm:inline tabular-nums">
                      <strong className="text-emerald-700">{dayGroup.totalPresent} Present</strong>
                      {hasAbsent && (
                        <> • <strong className="text-rose-700">{dayGroup.totalAbsent} Absent</strong></>
                      )}
                    </span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full tabular-nums ${badgeBg}`}>
                      {dayGroup.percentage}% Attendance
                    </span>
                  </div>
                </div>

                {/* Day's Lectures List */}
                <div className="mt-3.5 space-y-2.5">
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
                        className={`p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer group ${
                          isPresent
                            ? 'clay-btn border-l-4 border-l-emerald-500'
                            : 'clay-btn border-l-4 border-l-rose-500'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-700 shadow-clay-success'
                              : 'bg-rose-100 text-rose-700 shadow-clay-danger'
                          }`}>
                            {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold uppercase text-indigo-700 clay-inset px-2 py-0.5 rounded">
                                {lec.SubCollegeCode}
                              </span>
                              <span className="text-[10px] text-slate-500 clay-inset px-1.5 py-0.5 rounded font-bold">
                                {lec.NoOfLecture} {lec.NoOfLecture === 1 ? 'Lecture' : 'Lectures'}
                              </span>
                            </div>
                            <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors mt-1 line-clamp-1">
                              {lec.SubName}
                            </h5>
                            {lec.Topic && lec.Topic !== 'Regular Lecture' && (
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 truncate">
                                <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{lec.Topic}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
                              : 'bg-rose-100 text-rose-800 shadow-clay-danger'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                          <span className="text-slate-400 group-hover:text-indigo-600 hidden sm:inline-flex items-center text-xs font-bold">
                            Subject Logs <ChevronRight className="w-3.5 h-3.5" />
                          </span>
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
