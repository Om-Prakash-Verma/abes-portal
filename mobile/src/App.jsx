import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OverallAttendanceCard from './components/OverallAttendanceCard';
import SubjectCard from './components/SubjectCard';
import SubjectTableView from './components/SubjectTableView';
import SubjectDetailModal from './components/SubjectDetailModal';
import DateWiseAttendanceView from './components/DateWiseAttendanceView';
import ProfileModal from './components/ProfileModal';
import FeeReceiptsModal from './components/FeeReceiptsModal';
import AppUpdateChecker from './components/AppUpdateChecker';
import LoginPage from './components/LoginPage';
import {
  fetchProfile,
  fetchAttendance,
  deriveSemId,
  getAvailableSemesters,
  hasValidSession,
  clearSession,
  getCachedItem,
  TTL_PROFILE,
  getSessionRemainingSeconds,
  pingKeepSessionAlive,
  setSessionStartTime
} from './services/api';
import { initGA } from './utils/analytics';
import { startBackgroundSessionKeeper, stopBackgroundSessionKeeper, getSessionKeeperStatus } from './services/sessionKeeper';
import { Search, BookOpen, AlertTriangle, CheckCircle2, ArrowUpDown, Loader2, LayoutGrid, List, Layers, Calendar, ChevronDown } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidSession());
  const [profile, setProfile] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [activeSemId, setActiveSemId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionRemainingSec, setSessionRemainingSec] = useState(() => getSessionRemainingSeconds());

  // Native Background Session Keeper & In-App Auto-Renewal
  useEffect(() => {
    if (!isAuthenticated) return;

    startBackgroundSessionKeeper();

    const syncSession = async () => {
      try {
        const status = await getSessionKeeperStatus();
        if (status && status.lastPingTimestamp > 0) {
          setSessionStartTime(status.lastPingTimestamp);
        }
      } catch (e) {}

      const renewed = await pingKeepSessionAlive();
      if (renewed) {
        setSessionStartTime(Date.now());
      }
      setSessionRemainingSec(getSessionRemainingSeconds());
    };

    syncSession();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSession();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncSession);

    // Auto-renew timer: keeps session alive without kicking the user out
    const timer = setInterval(async () => {
      let remaining = getSessionRemainingSeconds();

      // When remaining time drops under 5 minutes (or 0), attempt to renew via keep-alive ping
      if (remaining <= 300) {
        const renewed = await pingKeepSessionAlive();
        if (renewed) {
          setSessionStartTime(Date.now());
          remaining = getSessionRemainingSeconds();
        }
      }
      setSessionRemainingSec(remaining);
      // NOTE: We NEVER proactively log out the user client-side on mobile.
      // Offline attendance records & active dashboard are maintained continuously.
      // Session expiration is only handled when a real server call fails with 302/SESSION_EXPIRED.
    }, 10000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncSession);
    };
  }, [isAuthenticated]);

  // Dark mode state (OLED Black #000000 theme)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('abes_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#000000';
      localStorage.setItem('abes_theme', 'dark');
      if (metaTheme) metaTheme.setAttribute('content', '#000000');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#EEF3F8';
      localStorage.setItem('abes_theme', 'light');
      if (metaTheme) metaTheme.setAttribute('content', '#EEF3F8');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Primary perspective: 'subject' (Subject-wise view) | 'date' (Date-wise daily view)
  const [viewPerspective, setViewPerspective] = useState('subject');
  const [targetPercent, setTargetPercent] = useState(75);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Modals state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [manualUpdateTrigger, setManualUpdateTrigger] = useState(false);

  useEffect(() => {
    initGA();
  }, []);

  const loadAllData = async (targetSemId, forceRefresh = false) => {
    setError('');
    setLoading(true);
    try {
      let profData = !forceRefresh ? getCachedItem('profile', TTL_PROFILE) : null;
      if (!profData) {
        profData = await fetchProfile(forceRefresh);
      }
      setProfile(profData);

      const semsList = getAvailableSemesters(profData);
      setAvailableSemesters(semsList);

      const derivedCurrent = deriveSemId(profData);
      const semToLoad = targetSemId || derivedCurrent;
      setActiveSemId(semToLoad);

      const attData = await fetchAttendance(semToLoad, forceRefresh);
      setAttendance(attData);
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Failed to load ERP data:', e);
      if (e.message === 'SESSION_EXPIRED' || e.message === 'NO_SESSION') {
        stopBackgroundSessionKeeper();
        clearSession();
        setIsAuthenticated(false);
        setError('Your ERP session has expired or is invalid. Please log in again.');
      } else {
        setError(`ERP Error: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData(activeSemId, false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setIsAuthenticated(false);
      setProfile({});
      setAttendance([]);
      setAvailableSemesters([]);
      setActiveSemId('');
      setShowFees(false);
      setShowProfile(false);
      setSelectedSubject(null);
      setError('Your ABES ERP session has expired on the college server. Please log in again to refresh your credentials.');
    };

    window.addEventListener('abes:session_expired', handleSessionExpired);
    return () => window.removeEventListener('abes:session_expired', handleSessionExpired);
  }, []);

  const handleSemesterChange = (newSemId) => {
    setActiveSemId(newSemId);
    loadAllData(newSemId, false);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setProfile({});
    setAttendance([]);
    setAvailableSemesters([]);
    setActiveSemId('');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={() => {
            setActiveSemId('');
            setIsAuthenticated(true);
          }}
          isDark={isDark}
          onToggleDark={toggleTheme}
        />
        <AppUpdateChecker />
      </>
    );
  }

  const totalSummary = attendance.find(a => a.isTotal) || {
    NoOfLecture: 0,
    Present: 0,
    Absent: 0,
    Percentage: 0
  };

  const individualSubjects = attendance.filter(a => !a.isTotal && a.SubCollegeCode);

  let displayedSubjects = individualSubjects.filter(sub => {
    const matchesSearch =
      sub.SubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.SubCollegeCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'DANGER') return sub.Percentage < targetPercent;
    if (filterType === 'SAFE') return sub.Percentage >= targetPercent;
    return true;
  });

  if (sortBy === 'LOWEST') {
    displayedSubjects.sort((a, b) => a.Percentage - b.Percentage);
  } else if (sortBy === 'HIGHEST') {
    displayedSubjects.sort((a, b) => b.Percentage - a.Percentage);
  }

  const dangerCount = individualSubjects.filter(s => s.Percentage < targetPercent).length;
  const safeCount = individualSubjects.filter(s => s.Percentage >= targetPercent).length;

  return (
    <div className="min-h-screen bg-[#EEF3F8] dark:bg-black text-slate-800 dark:text-slate-100 transition-colors flex flex-col antialiased">
      
      <Header
        profile={profile}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfile(true)}
        onOpenFees={() => setShowFees(true)}
        onRefresh={() => loadAllData(activeSemId, true)}
        loading={loading}
        isDark={isDark}
        onToggleDark={toggleTheme}
        sessionRemainingSec={sessionRemainingSec}
        onCheckUpdate={() => setManualUpdateTrigger(true)}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 flex-1 space-y-7">
        
        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-clay-danger flex items-center justify-between text-xs font-bold">
            <span>{error}</span>
            <button onClick={() => loadAllData(activeSemId, true)} className="font-extrabold underline ml-2">Retry</button>
          </div>
        )}

        {loading && attendance.length === 0 ? (
          <div className="py-36 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-9 h-9 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Retrieving Live Academic Records...</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Directly querying ABES ERP system</p>
          </div>
        ) : (
          <>
            <OverallAttendanceCard
              totalData={totalSummary}
              targetPercent={targetPercent}
              setTargetPercent={setTargetPercent}
              subjectsCount={individualSubjects.length}
              dangerCount={dangerCount}
            />

            <div className="space-y-4 pt-2">
              {/* Modern Row 1: Perspective Switcher & Semester Selector */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <div className="bg-slate-200/70 dark:bg-white/10 p-1 rounded-2xl flex items-center gap-1">
                  <button
                    onClick={() => setViewPerspective('subject')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                      viewPerspective === 'subject'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Subjects</span>
                    <span className="text-[10px] font-mono font-bold px-1 rounded bg-black/20 dark:bg-white/20">
                      {individualSubjects.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setViewPerspective('date')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                      viewPerspective === 'date'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </button>
                </div>

                {/* Semester Selector Pill */}
                {availableSemesters.length > 0 && viewPerspective === 'subject' && (
                  <div className="relative">
                    <select
                      value={activeSemId}
                      onChange={(e) => handleSemesterChange(e.target.value)}
                      className="px-3 py-1.5 text-xs font-black rounded-xl bg-slate-200/70 dark:bg-white/10 text-indigo-700 dark:text-indigo-400 border border-slate-300/40 dark:border-white/10 cursor-pointer focus:outline-none pr-7 appearance-none"
                    >
                      {availableSemesters.map(s => (
                        <option key={s.id} value={s.id} className="dark:bg-[#0E0E14] dark:text-white font-bold">
                          {s.name} ({s.id})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>

              {viewPerspective === 'date' ? (
                <DateWiseAttendanceView
                  semId={activeSemId}
                  subjects={individualSubjects}
                  onSelectSubject={(sub) => setSelectedSubject(sub)}
                />
              ) : (
                <div className="space-y-3.5">
                  {/* Modern Row 2: Search Bar + Status Filter Chips + View Mode */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search courses or codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                    </div>

                    {/* Filter Pills & View Mode */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="bg-slate-200/70 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 p-0.5 rounded-xl flex items-center text-xs">
                        <button
                          onClick={() => setFilterType('ALL')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                            filterType === 'ALL'
                              ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          All ({individualSubjects.length})
                        </button>
                        <button
                          onClick={() => setFilterType('DANGER')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                            filterType === 'DANGER'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Alert ({dangerCount})
                        </button>
                        <button
                          onClick={() => setFilterType('SAFE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                            filterType === 'SAFE'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          Safe ({safeCount})
                        </button>
                      </div>

                      {/* View Mode Toggle: Grid vs Compact List */}
                      <div className="bg-slate-200/70 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 p-0.5 rounded-xl flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded-lg transition ${
                            viewMode === 'grid'
                              ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-400'
                          }`}
                          title="Card Grid"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`p-1.5 rounded-lg transition ${
                            viewMode === 'table'
                              ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-400'
                          }`}
                          title="Compact List"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {displayedSubjects.length === 0 ? (
                    <div className="clay-card py-24 text-center p-8">
                      <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                        No courses match the active filter criteria
                      </p>
                      <button
                        onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                        className="mt-3 text-xs text-indigo-600 font-extrabold hover:underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  ) : viewMode === 'table' ? (
                    <SubjectTableView
                      subjects={displayedSubjects}
                      onSelect={(s) => setSelectedSubject(s)}
                      targetPercent={targetPercent}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                      {displayedSubjects.map((sub, idx) => (
                        <SubjectCard
                          key={sub.SubCollegeCode || idx}
                          subject={sub}
                          onSelect={(s) => setSelectedSubject(s)}
                          targetPercent={targetPercent}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

      </main>

      <footer className="border-t border-white/60 dark:border-white/10 bg-[#EEF3F8]/80 dark:bg-black/90 backdrop-blur py-5 pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] text-xs text-slate-500 dark:text-slate-400 font-semibold transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ABES Engineering College • Native Android Portal</span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Direct Connection • Zero Worker
            </span>
            <span>•</span>
            <button
              onClick={() => setManualUpdateTrigger(true)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Check for Updates
            </button>
          </div>
        </div>
      </footer>

      {selectedSubject && (
        <SubjectDetailModal
          subject={selectedSubject}
          semId={activeSemId}
          onClose={() => setSelectedSubject(null)}
        />
      )}

      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onCheckUpdate={() => setManualUpdateTrigger(true)}
        />
      )}

      {showFees && (
        <FeeReceiptsModal
          onClose={() => setShowFees(false)}
        />
      )}

      {/* GitHub Auto-Update Checker for Native Android */}
      <AppUpdateChecker
        manualTrigger={manualUpdateTrigger}
        onResetManualTrigger={() => setManualUpdateTrigger(false)}
      />

    </div>
  );
}
