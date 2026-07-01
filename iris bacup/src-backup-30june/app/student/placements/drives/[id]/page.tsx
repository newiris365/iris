"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Briefcase, MapPin, Calendar, Clock, Lock,
  CheckCircle, ShieldAlert, Sparkles, FileText, ChevronRight
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../../lib/api';

interface Drive {
  id: string;
  title: string;
  role: string;
  job_description: string;
  job_type: string;
  location: string[];
  ctc_display: string;
  min_cgpa: number;
  backlogs_allowed: number;
  eligible_branches: string[];
  eligible_batches: string[];
  application_deadline: string;
  drive_date: string;
  drive_mode: string;
  venue?: string;
  companies: {
    name: string;
    logo_url?: string;
    industry?: string;
    website?: string;
  };
}

export default function StudentDriveDetail() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;

  const [drive, setDrive] = useState<Drive | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    loadDriveAndProfile();
  }, [driveId]);

  const loadDriveAndProfile = async () => {
    try {
      // 1. Fetch drive
      const driveRes = await apiGet(`/placements/drives/${driveId}`);
      if (driveRes.success && driveRes.drive) {
        setDrive(driveRes.drive);
      }

      // 2. Mock student profile parameters
      setStudentProfile({
        cgpa: 8.45,
        active_backlogs: 0,
        branch: 'CSE',
        batch: '2026',
        is_placed: false
      });
    } catch (err) {
      console.log('Error loading drive data');
    }
    setLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drive) return;

    setApplying(true);
    try {
      const res = await apiPost(`/placements/drives/${drive.id}/apply`, {
        cover_letter: coverLetter,
        resume_url: 'https://supabase.co/storage/v1/object/public/resumes/my_resume.pdf'
      });
      if (res.success) {
        setApplied(true);
      }
    } catch (err) {
      console.log('Failed apply submission');
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin text-[#A78BFA]" /> Loading Drive details...
        </div>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-6">
        <p className="text-center text-[#C4B5FD]/40">Recruitment drive details not found.</p>
      </div>
    );
  }

  // Verification Rules
  const meetsCgpa = studentProfile.cgpa >= drive.min_cgpa;
  const meetsBacklogs = studentProfile.active_backlogs <= drive.backlogs_allowed;
  const meetsBranch = drive.eligible_branches?.includes(studentProfile.branch) ?? true;
  const meetsBatch = drive.eligible_batches?.includes(studentProfile.batch) ?? true;
  const isEligible = meetsCgpa && meetsBacklogs && meetsBranch && meetsBatch && !studentProfile.is_placed;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Recruitment Drive Details</h1>
            <p className="text-xs text-[#C4B5FD]/70">{drive.companies?.name} recruitment pipeline</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* JD details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Header Box */}
            <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 flex items-center justify-center font-bold text-white text-lg">
                    {drive.companies.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-white">{drive.title}</h2>
                    <p className="text-xs text-[#C4B5FD]/60 mt-0.5">{drive.companies.name} • {drive.role}</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-white bg-[#6C2BD9]/10 px-3.5 py-1 rounded-xl border border-[#6C2BD9]/20">
                  {drive.ctc_display}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 border-t border-white/5 pt-4 text-[10px] text-[#C4B5FD]/60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/40">JOB TYPE</span>
                  <span className="font-bold text-white uppercase">{drive.job_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/40">LOCATION</span>
                  <span className="font-bold text-white">{drive.location?.join(', ')}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/40">DRIVE MODE</span>
                  <span className="font-bold text-white uppercase">{drive.drive_mode}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/40">DRIVE DATE</span>
                  <span className="font-bold text-white">{new Date(drive.drive_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Description Box */}
            <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-white">Job Description & Responsibilities</h3>
              <p className="text-xs leading-relaxed text-[#C4B5FD]/70 whitespace-pre-line">
                {drive.job_description || `We are looking for self-motivated Software Engineers to join our dynamic product teams. As part of this role, you will be responsible for building highly scalable web services, collaborating with cross-functional product designers, and shipping high-quality code. Ideal candidates show strong computer science fundamentals and structured debugging systems.`}
              </p>
            </div>

          </div>

          {/* Eligibility & Apply Desk */}
          <div className="flex flex-col gap-6">
            
            {/* Eligibility parameters */}
            <div className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
              <h3 className="font-bold text-xs text-white">Eligibility Criteria Status</h3>
              
              <div className="flex flex-col gap-3 text-[10px] text-[#C4B5FD]/60">
                <div className="flex justify-between items-center">
                  <span>Minimum CGPA: {drive.min_cgpa}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${meetsCgpa ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {meetsCgpa ? 'Meets' : 'Below'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Backlogs Allowed: {drive.backlogs_allowed}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${meetsBacklogs ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {meetsBacklogs ? 'Meets' : 'Exceeds'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Branches: {drive.eligible_branches?.join(', ')}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${meetsBranch ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {meetsBranch ? 'Meets' : 'Ineligible'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Batches: {drive.eligible_batches?.join(', ')}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${meetsBatch ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {meetsBatch ? 'Meets' : 'Ineligible'}
                  </span>
                </div>
              </div>

              <div className={`mt-2 p-3 rounded-xl border text-[10px] flex items-center gap-2 ${
                isEligible 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                  : 'bg-red-500/5 border-red-500/20 text-red-300'
              }`}>
                {isEligible ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>You are fully eligible to apply for this campus drive.</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>You do not meet one or more eligibility constraints.</span>
                  </>
                )}
              </div>
            </div>

            {/* Apply Action Card */}
            {isEligible && (
              <div className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
                <h3 className="font-bold text-xs text-white">Application Submission</h3>
                
                {applied ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center gap-2 text-center text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <span className="font-bold text-white">Application Submitted!</span>
                    <span className="text-[10px] text-[#C4B5FD]/60">Track your progress under the Applications tab.</span>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Cover Letter (Optional)</label>
                      <textarea
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        placeholder="State why you are a good fit for this role..."
                        rows={4}
                        className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center justify-center gap-1"
                    >
                      {applying ? 'Applying...' : 'Submit Application'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
