import React from 'react';
import { GraduationCap, RefreshCw, LogOut, Receipt } from 'lucide-react';

export default function Header({ profile, onLogout, onOpenProfile, onOpenFees, onRefresh, loading }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#EEF3F8]/85 border-b border-white/60 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 h-18 flex items-center justify-between gap-4 py-2">
        
        {/* Brand & Academic Meta */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-clay-primary">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                ABES Portal
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shadow-clay-success border border-white/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {profile.Branch_Name || 'Computer Science & Engineering'} • {profile.Samester_Name || 'Sem V'}
            </p>
          </div>
        </div>

        {/* Center / Right Navigation Shortcuts */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          <button
            onClick={onOpenFees}
            className="clay-btn hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700"
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Fee Receipts</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="clay-btn p-2.5 text-slate-600 hover:text-indigo-600"
            title="Refresh ERP Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Student Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="clay-btn flex items-center gap-2.5 px-3 py-1.5 text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
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
            className="clay-btn p-2.5 text-rose-500 hover:text-rose-600"
            title="Disconnect & Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}
