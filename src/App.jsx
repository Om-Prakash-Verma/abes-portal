import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OverallAttendanceCard from './components/OverallAttendanceCard';
import SubjectCard from './components/SubjectCard';
import SubjectTableView from './components/SubjectTableView';
import SubjectDetailModal from './components/SubjectDetailModal';
import ProfileModal from './components/ProfileModal';
import FeeReceiptsModal from './components/FeeReceiptsModal';
import LoginPage from './components/LoginPage';
import { fetchProfile, fetchAttendance, fetchAvailableSemesters, hasValidSession, clearSession } from './services/api';
import { Search, BookOpen, AlertTriangle, CheckCircle2, ArrowUpDown, Loader2, LayoutGrid, List, Layers } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidSession());
  const [profile, setProfile] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [activeSemId, setActiveSemId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadAllData = async (targetSemId) => {
    setError('');
    setLoading(true);
    try {
      // 1. Fetch semesters and profile first
      const [profData, semsData] = await Promise.all([
        fetchProfile(),
        fetchAvailableSemesters()
      ]);
      setProfile(profData);
      setAvailableSemesters(semsData);

      const semToLoad = targetSemId || activeSemId || semsData[0]?.id || 'CS05';
      setActiveSemId(semToLoad);

      // 2. Fetch live attendance for this specific student & semester
      const attData = await fetchAttendance(semToLoad);
      setAttendance(attData);
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Failed to load ERP data:', e);
      if (e.message === 'SESSION_EXPIRED' || e.message === 'NO_SESSION') {
        clearSession();
        setIsAuthenticated(false);
        setError('Your ERP session has expired or is invalid. Please reconnect.');
      } else {
        setError(`ERP Error: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const handleSemesterChange = (newSemId) => {
    setActiveSemId(newSemId);
    loadAllData(newSemId);
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
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
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
    <div className="min-h-screen bg-[#EEF3F8] text-slate-800 transition-colors flex flex-col antialiased">
      
      {/* Header spanning full width */}
      <Header
        profile={profile}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfile(true)}
        onOpenFees={() => setShowFees(true)}
        onRefresh={() => loadAllData(activeSemId)}
        loading={loading}
      />

      {/* Main Full-Width Content Container */}
      <main className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 flex-1 space-y-7">
        
        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 text-rose-800 shadow-clay-danger flex items-center justify-between text-xs font-bold">
            <span>{error}</span>
            <button onClick={() => loadAllData(activeSemId)} className="font-extrabold underline ml-2">Retry</button>
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

            {/* Courses & Subject Section */}
            <div className="space-y-4 pt-2">
              
              {/* Controls Toolbar: Search, Semester Switcher, Filters, View Switcher */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Courses & Laboratories
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-600 clay-inset px-2.5 py-1 rounded-full">
                    {displayedSubjects.length} of {individualSubjects.length}
                  </span>

                  {/* Dynamic Semester Selector */}
                  {availableSemesters.length > 0 && (
                    <div className="clay-inset px-2 py-1 rounded-xl flex items-center gap-1.5 text-xs">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <select
                        value={activeSemId}
                        onChange={(e) => handleSemesterChange(e.target.value)}
                        className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
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

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search input with clay inset */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search courses or codes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3.5 py-2 text-xs font-bold rounded-xl clay-inset text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48 sm:w-64 transition"
                    />
                  </div>

                  {/* Status Filters */}
                  <div className="clay-inset p-1 rounded-xl flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setFilterType('ALL')}
                      className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                        filterType === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-clay-primary scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({individualSubjects.length})
                    </button>
                    <button
                      onClick={() => setFilterType('DANGER')}
                      className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
                        filterType === 'DANGER'
                          ? 'bg-rose-600 text-white shadow-clay-danger scale-[1.02]'
                          : 'text-rose-700 hover:text-rose-900'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Shortage ({dangerCount})
                    </button>
                    <button
                      onClick={() => setFilterType('SAFE')}
                      className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
                        filterType === 'SAFE'
                          ? 'bg-emerald-600 text-white shadow-clay-success scale-[1.02]'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Safe ({safeCount})
                    </button>
                  </div>

                  {/* Sort Toggle */}
                  <button
                    onClick={() => {
                      if (sortBy === 'DEFAULT') setSortBy('LOWEST');
                      else if (sortBy === 'LOWEST') setSortBy('HIGHEST');
                      else setSortBy('DEFAULT');
                    }}
                    className="clay-btn p-2 px-3 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                    title={`Sort: ${sortBy}`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">
                      {sortBy === 'LOWEST' ? 'Lowest %' : sortBy === 'HIGHEST' ? 'Highest %' : 'Sort'}
                    </span>
                  </button>

                  {/* View Mode Toggle: Grid vs Table */}
                  <div className="clay-inset p-1 rounded-xl flex items-center gap-1">
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
          </>
        )}

      </main>

      {/* Claymorphic footer */}
      <footer className="border-t border-white/60 bg-[#EEF3F8]/80 backdrop-blur py-5 text-xs text-slate-500 font-semibold">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ABES Engineering College • Modern Academic Portal</span>
          <span className="text-[11px] font-mono text-slate-500">
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

    </div>
  );
}
