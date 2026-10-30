import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OverallAttendanceCard from './components/OverallAttendanceCard';
import SubjectCard from './components/SubjectCard';
import SubjectTableView from './components/SubjectTableView';
import SubjectDetailModal from './components/SubjectDetailModal';
import DateWiseAttendanceView from './components/DateWiseAttendanceView';
import ProfileModal from './components/ProfileModal';
import FeeReceiptsModal from './components/FeeReceiptsModal';
import DownloadAppModal from './components/DownloadAppModal';
import InstallPrompt from './components/InstallPrompt';
import LoginPage from './components/LoginPage';
import { initGA, trackLoginSuccess, trackAttendanceView } from './utils/analytics';
import {
  fetchProfile,
  fetchAttendance,
  deriveSemId,
  getAvailableSemesters,
  hasValidSession,
  clearSession,
  getCachedItem,
  TTL_PROFILE,
  getSessionRemainingSeconds
} from './services/api';
import { Search, BookOpen, AlertTriangle, CheckCircle2, ArrowUpDown, Loader2, LayoutGrid, List, Layers, Calendar } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidSession());
  const [profile, setProfile] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [activeSemId, setActiveSemId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionRemainingSec, setSessionRemainingSec] = useState(() => getSessionRemainingSeconds());

  // 20-minute Microsoft IIS ASP.NET ERP Session Timeout Tracker
  useEffect(() => {
    if (!isAuthenticated) return;

    setSessionRemainingSec(getSessionRemainingSeconds());

    const timer = setInterval(() => {
      const remaining = getSessionRemainingSeconds();
      setSessionRemainingSec(remaining);

      if (remaining <= 0) {
        clearSession();
        setIsAuthenticated(false);
        setProfile({});
        setAttendance([]);
        setAvailableSemesters([]);
        setActiveSemId('');
        setShowFees(false);
        setShowProfile(false);
        setSelectedSubject(null);
        setError('Your 20-minute college ERP session has expired for security (Microsoft ASP.NET IIS timeout). Fast Login is ready — tap "Send OTP" to reconnect!');
      }
    }, 5000);

    return () => clearInterval(timer);
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

  // Target threshold state (75%, 80%, 85%)
  const [targetPercent, setTargetPercent] = useState(75);

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState('grid');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, DANGER, SAFE
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, LOWEST, HIGHEST

  // Modals state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);

  // Initialize Google Analytics on initial mount
  useEffect(() => {
    initGA();
  }, []);

  const loadAllData = async (targetSemId, forceRefresh = false) => {
    setError('');
    setLoading(true);
    try {
      // 1. Fetch profile (checks 30-day cache first to save Worker invocation)
      let profData = !forceRefresh ? getCachedItem('profile', TTL_PROFILE) : null;
      if (!profData) {
        profData = await fetchProfile(forceRefresh);
      }
      setProfile(profData);

      // 2. Derive dynamic semester and available options
      const semsList = getAvailableSemesters(profData);
      setAvailableSemesters(semsList);

      const derivedCurrent = deriveSemId(profData);
      const semToLoad = targetSemId || derivedCurrent;
      setActiveSemId(semToLoad);

      // 3. Fetch live attendance (uses 12-hour cache unless forceRefresh)
      const attData = await fetchAttendance(semToLoad, forceRefresh);
      setAttendance(attData);
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Failed to load ERP data:', e);
      if (e.message === 'SESSION_EXPIRED' || e.message === 'NO_SESSION') {
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

  // Global listener for session expiration triggered by any ERP endpoint
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
      <LoginPage
        onLoginSuccess={() => {
          setActiveSemId('');
          setIsAuthenticated(true);
        }}
        isDark={isDark}
        onToggleDark={toggleTheme}
      />
    );
  }

  // Split overall total data and individual subject cards
  const totalSummary = attendance.find(a => a.isTotal) || {
    NoOfLecture: 0,
    Present: 0,
    Absent: 0,
    Percentage: 0
  };

  const individualSubjects = attendance.filter(a => !a.isTotal && a.SubCollegeCode);

  // Filter & Search
  let displayedSubjects = individualSubjects.filter(sub => {
    const matchesSearch =
      sub.SubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.SubCollegeCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'DANGER') return sub.Percentage < targetPercent;
    if (filterType === 'SAFE') return sub.Percentage >= targetPercent;
    return true;
  });

  // Sorting
  if (sortBy === 'LOWEST') {
    displayedSubjects.sort((a, b) => a.Percentage - b.Percentage);
  } else if (sortBy === 'HIGHEST') {
    displayedSubjects.sort((a, b) => b.Percentage - a.Percentage);
  }

  const dangerCount = individualSubjects.filter(s => s.Percentage < targetPercent).length;
  const safeCount = individualSubjects.filter(s => s.Percentage >= targetPercent).length;

  return (
    <div className="min-h-screen bg-[#EEF3F8] dark:bg-black text-slate-800 dark:text-slate-100 transition-colors flex flex-col antialiased">
      
      {/* Header spanning full width */}
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
        onOpenDownloadApp={() => setShowDownloadApp(true)}
      />

      {/* Main Full-Width Content Container */}
      <main className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 flex-1 space-y-7">
        
        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 text-rose-800 shadow-clay-danger flex items-center justify-between text-xs font-bold">
            <span>{error}</span>
            <button onClick={() => loadAllData(activeSemId, true)} className="font-extrabold underline ml-2">Retry</button>
          </div>
        )}

        {/* Loading state indicator */}
        {loading && attendance.length === 0 ? (
          <div className="py-36 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-9 h-9 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-extrabold text-slate-800">Retrieving Live Academic Records...</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Directly querying ABES ERP system</p>
          </div>
        ) : (
          <>
            {/* Executive KPI Overview Ribbon */}
            <OverallAttendanceCard
              totalData={totalSummary}
              targetPercent={targetPercent}
              setTargetPercent={setTargetPercent}
              subjectsCount={individualSubjects.length}
              dangerCount={dangerCount}
            />

            {/* Perspective Switcher & Controls Section */}
            <div className="space-y-4 pt-2">
              
              {/* Primary Perspective Toggle: Subject Wise vs Date Wise */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
                <div className="clay-inset p-1 rounded-2xl flex items-center gap-1">
                  <button
                    onClick={() => setViewPerspective('subject')}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-extrabold transition text-xs sm:text-sm flex items-center gap-2 ${
                      viewPerspective === 'subject'
                        ? 'bg-indigo-600 text-white shadow-clay-primary scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Subject-Wise Attendance</span>
                    <span className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      viewPerspective === 'subject' ? 'bg-indigo-700/80 text-white' : 'clay-inset text-slate-600'
                    }`}>
                      {individualSubjects.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setViewPerspective('date')}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-extrabold transition text-xs sm:text-sm flex items-center gap-2 ${
                      viewPerspective === 'date'
                        ? 'bg-indigo-600 text-white shadow-clay-primary scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Date-Wise Attendance</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md">
                      Timeline
                    </span>
                  </button>
                </div>

                {/* Dynamic Semester Selector (Persistent across both views) */}
                {availableSemesters.length > 0 && (
                  <div className="clay-inset px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold text-slate-500 hidden sm:inline">Semester:</span>
                    <select
                      value={activeSemId}
                      onChange={(e) => handleSemesterChange(e.target.value)}
                      className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer text-xs"
                    >
                      {availableSemesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Conditional Perspective Content */}
              {viewPerspective === 'date' ? (
                /* Date-Wise Daily Attendance View */
                <DateWiseAttendanceView
                  semId={activeSemId}
                  subjects={individualSubjects}
                  onSelectSubject={(s) => setSelectedSubject(s)}
                />
              ) : (
                /* Subject-Wise View (Cards & Table) */
                <div className="space-y-4">
                  {/* Subject Controls Toolbar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pt-1">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                        Courses & Laboratories
                      </h3>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-600 clay-inset px-2.5 py-1 rounded-full">
                        {displayedSubjects.length} of {individualSubjects.length}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Search input with clay inset */}
                      <div className="relative flex-1 sm:flex-initial w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search courses or codes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2 text-xs font-bold rounded-xl clay-inset text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                        {/* Status Filters */}
                        <div className="clay-inset p-1 rounded-xl flex items-center gap-0.5 sm:gap-1 text-xs overflow-x-auto">
                          <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-xs whitespace-nowrap ${
                              filterType === 'ALL'
                                ? 'bg-indigo-600 text-white shadow-clay-primary scale-[1.02]'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            All ({individualSubjects.length})
                          </button>
                          <button
                            onClick={() => setFilterType('DANGER')}
                            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 whitespace-nowrap ${
                              filterType === 'DANGER'
                                ? 'bg-rose-600 text-white shadow-clay-danger scale-[1.02]'
                                : 'text-rose-700 hover:text-rose-900'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Shortage</span>
                            <span className="sm:hidden">Short</span> ({dangerCount})
                          </button>
                          <button
                            onClick={() => setFilterType('SAFE')}
                            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 whitespace-nowrap ${
                              filterType === 'SAFE'
                                ? 'bg-emerald-600 text-white shadow-clay-success scale-[1.02]'
                                : 'text-emerald-700 hover:text-emerald-900'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Safe ({safeCount})
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {/* Sort Toggle */}
                          <button
                            onClick={() => {
                              if (sortBy === 'DEFAULT') setSortBy('LOWEST');
                              else if (sortBy === 'LOWEST') setSortBy('HIGHEST');
                              else setSortBy('DEFAULT');
                            }}
                            className="clay-btn p-2 px-2.5 sm:px-3 text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0"
                            title={`Sort: ${sortBy}`}
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="hidden md:inline">
                              {sortBy === 'LOWEST' ? 'Lowest %' : sortBy === 'HIGHEST' ? 'Highest %' : 'Sort'}
                            </span>
                          </button>

                          {/* View Mode Toggle: Grid vs Table */}
                          <div className="clay-inset p-1 rounded-xl flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setViewMode('grid')}
                              className={`p-1.5 rounded-lg transition ${
                                viewMode === 'grid'
                                  ? 'bg-indigo-600 text-white shadow-clay-primary'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Grid View"
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewMode('table')}
                              className={`p-1.5 rounded-lg transition ${
                                viewMode === 'table'
                                  ? 'bg-indigo-600 text-white shadow-clay-primary'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Table View (Full Screen Density)"
                            >
                              <List className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Data View: Table or Grid */}
                  {displayedSubjects.length === 0 ? (
                    <div className="clay-card py-24 text-center p-8">
                      <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-extrabold text-slate-700">
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

      {/* Claymorphic footer */}
      <footer className="border-t border-white/60 dark:border-white/10 bg-[#EEF3F8]/80 dark:bg-black/90 backdrop-blur py-5 text-xs text-slate-500 dark:text-slate-400 font-semibold transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ABES Engineering College • Modern Academic Portal</span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Active Verified Session • Cloudflare Edge Proxy
          </span>
        </div>
      </footer>

      {/* Modals */}
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
        />
      )}

      {showFees && (
        <FeeReceiptsModal
          onClose={() => setShowFees(false)}
        />
      )}

      {/* Download Native Android APK Modal */}
      <DownloadAppModal
        isOpen={showDownloadApp}
        onClose={() => setShowDownloadApp(false)}
      />

      {/* PWA Install & Offline Status */}
      <InstallPrompt />

    </div>
  );
}
