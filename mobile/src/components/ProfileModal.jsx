import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, BookOpen, Award, Building, User } from 'lucide-react';

export default function ProfileModal({ profile, onClose }) {
  const photoUrl = profile.adm_admissionno
    ? `/api/abes/Services/ProfilePic.aspx?ID=${profile.adm_admissionno}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="clay-card w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl">
        
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

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
            <h4 className="font-extrabold text-slate-500 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              Academic Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="clay-card p-3 sm:p-3.5">
                <span className="text-slate-400 font-bold block text-[10px] sm:text-xs">Institute</span>
                <p className="font-extrabold text-slate-900 mt-0.5 text-xs sm:text-sm">{profile.Institute_Name}</p>
              </div>
              <div className="clay-card p-3 sm:p-3.5">
                <span className="text-slate-400 font-bold block text-[10px] sm:text-xs">Batch & Program</span>
                <p className="font-extrabold text-slate-900 mt-0.5 text-xs sm:text-sm">{profile.Session_Name} ({profile.Program_Name})</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-extrabold text-slate-500 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold">Email</span>
                  <span className="font-bold text-slate-900 truncate block text-[11px] sm:text-xs">{profile.adm_studentemail}</span>
                </div>
              </div>

              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold">Mobile</span>
                  <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">{profile.adm_mobileno}</span>
                </div>
              </div>

              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold">Date of Birth</span>
                  <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">{profile.adm_dob} ({profile.adm_gender})</span>
                </div>
              </div>

              <div className="clay-card p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold">Location</span>
                  <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">{profile.adm_pcity}, {profile.adm_pstate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parents Info */}
          <div>
            <h4 className="font-extrabold text-slate-500 uppercase tracking-widest text-[10px] sm:text-[11px] mb-2">
              Guardian Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="clay-card p-3 sm:p-3.5">
                <span className="text-slate-400 font-bold block text-[10px] sm:text-xs">Father's Name</span>
                <p className="font-extrabold text-slate-900 mt-0.5 text-xs sm:text-sm">{profile.adm_firstnameF}</p>
              </div>
              <div className="clay-card p-3 sm:p-3.5">
                <span className="text-slate-400 font-bold block text-[10px] sm:text-xs">Mother's Name</span>
                <p className="font-extrabold text-slate-900 mt-0.5 text-xs sm:text-sm">{profile.adm_firstnameM}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 flex justify-end bg-[#E8EEF5]/50">
          <button
            onClick={onClose}
            className="clay-btn w-full sm:w-auto px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
}
