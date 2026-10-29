import React from 'react';
import { GraduationCap, RefreshCw, LogOut, Receipt } from 'lucide-react';

export default function Header({ profile, onLogout, onOpenProfile, onOpenFees, onRefresh, loading }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#EEF3F8]/90 border-b border-white/60 transition-colors">
      <div className="w-full px-3.5 sm:px-6 lg:px-8 2xl:px-12 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Academic Meta */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-clay-primary shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 truncate">
                ABES Portal
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 shadow-clay-success border border-white/60 shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden sm:inline">Live Connected</span>
                <span className="sm:hidden">Live</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate hidden xs:block">
              {profile.Branch_Name || 'CSE'} • {profile.Samester_Name || 'Sem V'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Fee Receipts Button */}
          <button
            onClick={onOpenFees}
            className="clay-btn p-2 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5"
            title="Fee Receipts"
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Fee Receipts</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="clay-btn p-2 text-slate-600 hover:text-indigo-600"
            title="Refresh ERP Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Student Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="clay-btn flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 text-left"
            title="Student Profile"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {profile.adm_firstname ? profile.adm_firstname.charAt(0) : 'S'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {profile.adm_firstname || 'Student'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono font-medium">
                {profile.adm_admissionno || ''}
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="clay-btn p-2 text-rose-500 hover:text-rose-600"
            title="Disconnect & Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}
