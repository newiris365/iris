"use client";

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../lib/api';
import { 
  User, Calendar, FileText, CheckCircle2, AlertCircle, Clock, 
  ArrowRight, ShieldCheck, Download, CalendarDays, ExternalLink, HelpCircle
} from 'lucide-react';

interface ProgramSelection {
  id: string;
  preference_order: number;
  status: string;
  allocated: boolean;
  programs: {
    name: string;
    code: string;
    degree_type: string;
  };
}

interface ApplicationData {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string; // draft, submitted, verified, shortlisted, offered, admitted, rejected
  created_at: string;
  applicant_programs?: ProgramSelection[];
  academic_records?: any[];
  entrance_scores?: any[];
}

export default function ApplicantDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await apiGet('/admissions/application/my');
        if (res.success && res.applicant) {
          setData(res.applicant);
          setDocuments(res.documents || []);
        } else {
          throw new Error(res.error || 'Failed to fetch application data');
        }
      } catch (err: any) {
        console.warn('Backend connection failed. Using high-fidelity candidate sandbox data.');
        // High fidelity offline fallback mock data
        const mockData: ApplicationData = {
          id: 'b0000000-0000-0000-0000-000000009999',
          application_number: 'SIET-2026-884920',
          first_name: 'Khushal',
          last_name: 'Gehlot',
          email: 'khushal@gmail.com',
          phone: '+91 98765 43210',
          status: 'verified', // Change this to inspect different states
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          applicant_programs: [
            {
              id: 'sel-1',
              preference_order: 1,
              status: 'pending',
              allocated: false,
              programs: {
                name: 'Bachelor of Technology in Computer Science (B.Tech CSE)',
                code: 'BTECH-CSE',
                degree_type: 'UG'
              }
            },
            {
              id: 'sel-2',
              preference_order: 2,
              status: 'pending',
              allocated: false,
              programs: {
                name: 'Bachelor of Technology in Artificial Intelligence (B.Tech AI-DS)',
                code: 'BTECH-AIDS',
                degree_type: 'UG'
              }
            }
          ],
          academic_records: [
            { id: 'acad-1', level: '10th', board_university: 'CBSE', year_of_passing: 2022, percentage: 92.4 },
            { id: 'acad-2', level: '12th', board_university: 'CBSE', year_of_passing: 2024, percentage: 89.6 }
          ],
          entrance_scores: [
            { exam_name: 'JEE Main', score: 184, percentile: 97.42, rank: 28492 }
          ]
        };

        const mockDocs = [
          { id: 'doc-1', document_type: 'photo', status: 'verified', verification_note: null },
          { id: 'doc-2', document_type: 'signature', status: 'verified', verification_note: null },
          { id: 'doc-3', document_type: 'marksheet_10th', status: 'verified', verification_note: null },
          { id: 'doc-4', document_type: 'marksheet_12th', status: 'verified', verification_note: null },
          { id: 'doc-5', document_type: 'aadhar_card', status: 'pending', verification_note: null }
        ];

        setData(mockData);
        setDocuments(mockDocs);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Candidate Session...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 rounded-3xl border border-red-500/30 bg-red-500/10 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h3 className="font-bold text-white text-lg">No Active Application</h3>
        <p className="text-xs text-[#C4B5FD]/70 mt-2">
          We could not find an active admission application for your account. Please log out and submit an application through the Admissions Portal.
        </p>
      </div>
    );
  }

  // Define status steps
  const steps = [
    { key: 'draft', label: 'Draft Started', desc: 'Profile initialized' },
    { key: 'submitted', label: 'Submitted', desc: 'Application fee paid' },
    { key: 'verified', label: 'Docs Verified', desc: 'Verification audit complete' },
    { key: 'shortlisted', label: 'Shortlisted', desc: 'Eligible for merit' },
    { key: 'offered', label: 'Offer Issued', desc: 'Seat offer extended' },
    { key: 'admitted', label: 'Admitted', desc: 'Enrollment confirmed' }
  ];

  // Helper to get active step index
  const getStatusIndex = (status: string) => {
    if (status === 'rejected') return -1;
    return steps.findIndex(s => s.key === status);
  };

  const currentStepIndex = getStatusIndex(data.status);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Header banner */}
      <div className="relative rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A]/90 to-[#1D1740]/80 p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[10px] font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Session Verified
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {data.first_name}!
            </h1>
            <p className="text-sm text-[#C4B5FD]/70 max-w-xl">
              Track the progress of your application, manage uploads, check counseling slots, and complete fee payments to confirm enrollment.
            </p>
          </div>

          <div className="bg-[#0A0818]/60 border border-white/5 rounded-2xl p-4 min-w-[220px] text-right md:text-left">
            <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 block tracking-wider">Application Number</span>
            <span className="text-lg font-mono font-black text-[#A78BFA] block mt-1">{data.application_number}</span>
            <div className="flex items-center gap-2 mt-3 text-xs justify-end md:justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-white capitalize font-semibold">{data.status} Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Timeline Tracker */}
      <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-8 shadow-xl">
        <h3 className="text-base font-bold text-white mb-8 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#A78BFA]" />
          Application Lifecycle Tracker
        </h3>

        {data.status === 'rejected' ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Application Rejected</h4>
              <p className="text-xs text-[#C4B5FD]/70 mt-1 leading-relaxed">
                Unfortunately, your application has been rejected by the admissions officer. Please inspect the Document Center or email notification notes for guidelines on re-submitting eligible forms.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCompleted ? 'bg-[#6C2BD9] border-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30' : 'bg-[#0D0A1A] border-white/10 text-white/40'}
                    ${isCurrent ? 'ring-4 ring-[#8B5CF6]/30 animate-pulse' : ''}
                  `}>
                    {isCompleted && !isCurrent ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold mt-3 ${isCurrent ? 'text-[#A78BFA]' : isCompleted ? 'text-white' : 'text-white/40'}`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-[#C4B5FD]/40 mt-1 max-w-[120px]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
            {/* Timeline connectors (large screens) */}
            <div className="absolute top-5 left-[8%] right-[8%] h-0.5 bg-white/5 -z-10 hidden md:block" />
            <div 
              className="absolute top-5 left-[8%] h-0.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] -z-10 hidden md:block transition-all duration-500" 
              style={{ width: `${Math.max(0, currentStepIndex) * 16.8}%` }}
            />
          </div>
        )}
      </div>

      {/* Dashboard Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Preference & Summary Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Selected Programs Preferences */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/50 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-[#A78BFA]" />
              Course Preferences Summary
            </h3>
            <div className="space-y-3">
              {data.applicant_programs?.map((pref) => (
                <div key={pref.id} className="p-4 rounded-2xl bg-[#0D0A1A]/60 border border-[#6C2BD9]/10 flex justify-between items-center hover:border-[#6C2BD9]/30 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[9px] font-bold">
                        Pref {pref.preference_order}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#C4B5FD]">{pref.programs.code}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{pref.programs.name}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-[#C4B5FD]">
                    {pref.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Records snapshot */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/50 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-[#A78BFA]" />
              Academic Metrics Check
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.academic_records?.map((rec) => (
                <div key={rec.id} className="p-4 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider">{rec.level} Certificate</span>
                    <span className="text-xs text-white/50">{rec.year_of_passing}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] text-[#C4B5FD]/40 uppercase font-mono block">BOARD/UNIV</span>
                      <span className="text-xs font-bold text-white">{rec.board_university}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#C4B5FD]/40 uppercase font-mono block">PERCENTAGE</span>
                      <span className="text-lg font-mono font-extrabold text-emerald-400">{rec.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Task & Document Audit checklist Column */}
        <div className="space-y-6">
          {/* Required Action Card */}
          <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-b from-[#6C2BD9]/10 to-transparent p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#A78BFA]" /> Required Actions Checklist
            </h4>
            
            <div className="space-y-3">
              {/* Submission task */}
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block">Application Submission</span>
                  <span className="text-[10px] text-[#C4B5FD]/70">Application fee was successfully validated.</span>
                </div>
              </div>

              {/* Uploads task */}
              <div className="flex items-start gap-2 text-xs">
                {documents.every(d => d.status === 'verified') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                )}
                <div>
                  <span className="text-white font-bold block">Upload Document Verifications</span>
                  <span className="text-[10px] text-[#C4B5FD]/70">
                    {documents.filter(d => d.status === 'verified').length} / {documents.length} files approved by audits.
                  </span>
                </div>
              </div>

              {/* Offer confirmation fee task */}
              <div className="flex items-start gap-2 text-xs">
                {currentStepIndex >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`${currentStepIndex >= 4 ? 'text-white' : 'text-white/40'} font-bold block`}>Accept Offer & Confirm Seat</span>
                  <span className="text-[10px] text-[#C4B5FD]/40">Locked until merit rounds release.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider">Help & Support</h4>
            <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
              If your academic credentials or document captures are marked as incomplete or rejected, please navigate to the Document Center to upload valid scans. For portal helpline assistance, contact us at:
            </p>
            <div className="space-y-1.5 text-xs text-[#A78BFA] font-semibold">
              <p className="flex items-center gap-1.5">📧 admissions@siet.edu.in</p>
              <p className="flex items-center gap-1.5">📞 +91 291 276 3310</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
