import React, { useEffect, useState } from 'react';
import { X, Calendar, BookOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { fetchSubjectDetail } from '../services/api';

export default function SubjectDetailModal({ subject, semId, onClose }) {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchSubjectDetail(subject.subjectId, semId);
      setLectures(data);
      setLoading(false);
    }
    loadData();
  }, [subject, semId]);

  const filteredLectures = lectures.filter(l => {
    if (filter === 'P') return l.Attendance === 'P';
    if (filter === 'A') return l.Attendance === 'A';
    return true;
  });

  const presentCount = lectures.filter(l => l.Attendance === 'P').length;
  const absentCount = lectures.filter(l => l.Attendance === 'A').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="clay-card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 clay-inset px-2.5 py-1 rounded-lg">
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
            <h2 className="text-lg font-extrabold text-slate-900 mt-2">
              {subject.SubName}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Day-by-day attendance & topic logs
            </p>
          </div>

          <button
            onClick={onClose}
            className="clay-btn p-2 text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Metric Bar */}
        <div className="px-6 py-3.5 bg-[#E8EEF5]/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-4 font-bold">
            <span className="text-slate-600">
              Total: <strong className="text-slate-900">{lectures.length}</strong>
            </span>
            <span className="text-emerald-700">
              Present: <strong>{presentCount}</strong>
            </span>
            <span className="text-rose-700">
              Absent: <strong>{absentCount}</strong>
            </span>
          </div>

          {/* Filter Pills */}
          <div className="clay-inset p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                filter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-clay-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({lectures.length})
            </button>
            <button
              onClick={() => setFilter('P')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                filter === 'P'
                  ? 'bg-emerald-600 text-white shadow-clay-success'
                  : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setFilter('A')}
              className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                filter === 'A'
                  ? 'bg-rose-600 text-white shadow-clay-danger'
                  : 'text-rose-700 hover:text-rose-800'
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>

        </div>

        {/* Body / Scrollable Lecture List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
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
                  className={`p-4 rounded-2xl flex items-center justify-between gap-4 transition-all ${
                    isPresent
                      ? 'clay-btn border-l-4 border-l-emerald-500'
                      : 'clay-btn border-l-4 border-l-rose-500'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-700 shadow-clay-success'
                        : 'bg-rose-100 text-rose-700 shadow-clay-danger'
                    }`}>
                      {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {lec.AttDate}
                        </span>
                        <span className="text-[10px] text-slate-600 clay-inset px-2 py-0.5 rounded font-bold">
                          {lec.NoOfLecture} {lec.NoOfLecture > 1 ? 'Lectures' : 'Lecture'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {lec.Topic || 'Topic not specified'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
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
        <div className="p-4 border-t border-slate-200/80 flex justify-end bg-[#E8EEF5]/50">
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
