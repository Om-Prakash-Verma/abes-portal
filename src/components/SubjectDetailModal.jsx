import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { fetchSubjectDetail } from '../services/api';

export default function SubjectDetailModal({ subject, semId, onClose }) {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'P' | 'A'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) | 'asc' (oldest first)

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSubjectDetail(subject.subjectId, semId);
      setLectures(data);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        onClose();
      } else {
        setError(err.message || 'Failed to load subject lecture details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subject, semId]);

  // Filter lectures
  let filteredLectures = lectures.filter(l => {
    if (filter === 'P') return l.Attendance === 'P';
    if (filter === 'A') return l.Attendance === 'A';
    return true;
  });

  // Sort lectures date-wise
  filteredLectures = [...filteredLectures].sort((a, b) => {
    if (sortOrder === 'desc') {
      return (b.timestamp || 0) - (a.timestamp || 0);
    }
    return (a.timestamp || 0) - (b.timestamp || 0);
  });

  const presentCount = lectures.filter(l => l.Attendance === 'P').length;
  const absentCount = lectures.filter(l => l.Attendance === 'A').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="clay-card w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl">
        
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 clay-inset px-2.5 py-1 rounded-lg">
                {subject.SubCollegeCode}
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                subject.Percentage >= 75
                  ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
                  : 'bg-rose-100 text-rose-800 shadow-clay-danger'
              }`}>
                {subject.Percentage}%
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5 line-clamp-2">
              {subject.SubName}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Chronological Date-Wise Attendance Log
            </p>
          </div>

          <button
            onClick={onClose}
            className="clay-btn p-2 text-slate-500 hover:text-slate-800 shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Metric Bar with Date Sort Control */}
        <div className="px-4 sm:px-6 py-3 bg-[#E8EEF5]/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          
          <div className="flex items-center gap-3 font-bold text-[11px] sm:text-xs">
            <span className="text-slate-600">
              Total: <strong className="text-slate-900">{lectures.length}</strong>
            </span>
            <span className="text-emerald-700">
              P: <strong>{presentCount}</strong>
            </span>
            <span className="text-rose-700">
              A: <strong>{absentCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Filter Pills */}
            <div className="clay-inset p-0.5 sm:p-1 rounded-xl flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-[11px] sm:text-xs shrink-0 ${
                  filter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-clay-primary'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({lectures.length})
              </button>
              <button
                onClick={() => setFilter('P')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-[11px] sm:text-xs shrink-0 ${
                  filter === 'P'
                    ? 'bg-emerald-600 text-white shadow-clay-success'
                    : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                onClick={() => setFilter('A')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-[11px] sm:text-xs shrink-0 ${
                  filter === 'A'
                    ? 'bg-rose-600 text-white shadow-clay-danger'
                    : 'text-rose-700 hover:text-rose-800'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>

            {/* Date Sorting Order */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="clay-btn p-1.5 px-2.5 text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0"
              title="Toggle Date Order"
            >
              <ArrowUpDown className="w-3 h-3 text-indigo-600" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>

        </div>

        {/* Body / Scrollable Date-Wise Lecture List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-3 flex-1">
          {error ? (
            <div className="py-12 px-4 text-center">
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3">{error}</p>
              <button
                onClick={loadData}
                className="clay-btn px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-500 mt-2">Loading attendance logs...</p>
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-bold">
              No lecture records found for this filter.
            </div>
          ) : (
            filteredLectures.map((lec, idx) => {
              const isPresent = lec.Attendance === 'P';
              return (
                <div
                  key={idx}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 transition-all ${
                    isPresent
                      ? 'clay-btn border-l-4 border-l-emerald-500'
                      : 'clay-btn border-l-4 border-l-rose-500'
                  }`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-700 shadow-clay-success'
                        : 'bg-rose-100 text-rose-700 shadow-clay-danger'
                    }`}>
                      {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {lec.formattedDate || lec.AttDate}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-600 clay-inset px-1.5 py-0.5 rounded font-bold shrink-0">
                          {lec.NoOfLecture} {lec.NoOfLecture === 1 ? 'Lecture' : 'Lectures'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1 truncate">
                        <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{lec.Topic || 'Regular Lecture'}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0 ${
                    isPresent
                      ? 'bg-emerald-100 text-emerald-800 shadow-clay-success'
                      : 'bg-rose-100 text-rose-800 shadow-clay-danger'
                  }`}>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 flex items-center justify-between bg-[#E8EEF5]/50">
          <span className="text-[11px] text-slate-500 font-bold">
            Showing {filteredLectures.length} of {lectures.length} sessions
          </span>
          <button
            onClick={onClose}
            className="clay-btn px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
}
