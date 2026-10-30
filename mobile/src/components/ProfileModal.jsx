import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Sparkles, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';
import { CURRENT_APP_VERSION } from './AppUpdateChecker';

export default function ProfileModal({ profile, onClose, onCheckUpdate }) {
  const photoUrl = profile.adm_admissionno
    ? `/api/abes/Services/ProfilePic.aspx?ID=${profile.adm_admissionno}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="clay-card w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl bg-[#F4F7FB] dark:bg-[#0B0B0E] border border-white/60 dark:border-white/10">
        
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header with Photo */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white rounded-t-2xl sm:rounded-t-[1.25rem] shadow-clay-primary">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 p-1 backdrop-blur-md shadow-lg overflow-hidden shrink-0">
              <img
                src={photoUrl || ''}
                alt="Student Photo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="w-full h-full hidden items-center justify-center bg-indigo-900 rounded-xl font-extrabold text-2xl text-white">
                {profile.adm_firstname?.charAt(0) || 'S'}
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                {profile.adm_admissionstatus || 'Active Student'}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold mt-1 truncate">
                {profile.adm_firstname}
              </h2>
              <p className="text-[11px] sm:text-xs text-indigo-100 font-mono mt-0.5">
                Adm: {profile.adm_admissionno} • Roll: {profile.adm_rollno}
              </p>
              <p className="text-[11px] sm:text-xs text-indigo-200 mt-1 font-medium truncate">
                {profile.Branch_Name} • {profile.Samester_Name}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs flex-1">
          
          {/* Academic Info */}
          <div>
            <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              Academic Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="clay-card p-3 sm:p-3.5 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] sm:text-xs">Institute</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 text-xs sm:text-sm">{profile.Institute_Name || 'ABES Engineering College'}</p>
              </div>
              <div className="clay-card p-3 sm:p-3.5 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] sm:text-xs">Batch & Program</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 text-xs sm:text-sm">{profile.Session_Name} ({profile.Program_Name})</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] sm:text-[10px] font-bold">Email</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate block text-[11px] sm:text-xs">{profile.adm_studentemail}</span>
                </div>
              </div>

              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] sm:text-[10px] font-bold">Mobile</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] sm:text-xs">{profile.adm_mobileno}</span>
                </div>
              </div>

              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] sm:text-[10px] font-bold">Date of Birth</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] sm:text-xs">{profile.adm_dob} ({profile.adm_gender})</span>
                </div>
              </div>

              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] sm:text-[10px] font-bold">Location</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] sm:text-xs">{profile.adm_pcity}, {profile.adm_pstate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parents Info */}
          <div>
            <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              Guardian Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="clay-card p-3 sm:p-3.5 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] sm:text-xs">Father's Name</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 text-xs sm:text-sm">{profile.adm_firstnameF || 'N/A'}</p>
              </div>
              <div className="clay-card p-3 sm:p-3.5 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] sm:text-xs">Mother's Name</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 text-xs sm:text-sm">{profile.adm_firstnameM || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Native App Updates Section */}
          <div>
            <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              App Version & System
            </h4>
            <div className="clay-card p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-clay-primary">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">ABES Portal APK</span>
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      v{CURRENT_APP_VERSION}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    100% Direct Connection • Zero Cloudflare Worker Usage
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (onCheckUpdate) onCheckUpdate();
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-clay-primary flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Check for Updates</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-white/10 flex justify-end bg-[#E8EEF5]/50 dark:bg-white/5">
          <button
            onClick={onClose}
            className="clay-btn w-full sm:w-auto px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
}
