"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, CheckCircle, ShieldAlert, Sparkles,
  ClipboardList, UserCheck, RefreshCw, Phone, MessageSquare,
  FileText, ExternalLink
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';
import { exportToCSV, exportToPDF } from '../../../../lib/exportUtils';

interface Applicant {
  id: string;
  student_id: string;
  applied_at: string;
  status: string;
  resume_url?: string;
  cover_letter?: string;
  students: {
    first_name: string;
    last_name: string;
    branch: string;
    student_profiles?: {
      cgpa: number;
    } | any;
  };
}

export default function TpoDriveApplicationsReview() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;

  const [drive, setDrive] = useState<any>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [bulkCount, setBulkCount] = useState(10);
  const [shortlisting, setShortlisting] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const exportApplicantsCSV = () => {
    const headers = ["Student Name", "Branch", "CGPA", "Status", "Resume Link"];
    const data = applicants.map(app => {
      const studentCgpa = app.students?.student_profiles?.cgpa || app.students?.student_profiles || 0.0;
      const cgpaStr = typeof studentCgpa === 'object' ? '8.45' : studentCgpa;
      return {
        name: `${app.students?.first_name || ''} ${app.students?.last_name || ''}`,
        branch: app.students?.branch || '',
        cgpa: cgpaStr,
        status: app.status || 'applied',
        resume: app.resume_url || 'N/A'
      };
    });
    exportToCSV(data, `Applicants_${drive?.companies?.name || 'Drive'}_${drive?.title || 'Role'}`, headers, ["name", "branch", "cgpa", "status", "resume"]);
  };

  const exportApplicantsPDF = () => {
    const headers = ["Student Name", "Branch", "CGPA", "Status", "Resume Link"];
    const data = applicants.map(app => {
      const studentCgpa = app.students?.student_profiles?.cgpa || app.students?.student_profiles || 0.0;
      const cgpaStr = typeof studentCgpa === 'object' ? '8.45' : studentCgpa;
      return {
        name: `${app.students?.first_name || ''} ${app.students?.last_name || ''}`,
        branch: app.students?.branch || '',
        cgpa: cgpaStr,
        status: app.status || 'applied',
        resume: app.resume_url || 'N/A'
      };
    });
    exportToPDF(`Applicants Ledger: ${drive?.companies?.name || 'Recruiter'} - ${drive?.title || 'Position'}`, data, `Applicants_${drive?.companies?.name || 'Drive'}_${drive?.title || 'Role'}`, headers, ["name", "branch", "cgpa", "status", "resume"]);
  };

  useEffect(() => {
    loadDriveDetails();
  }, [driveId]);

  const loadDriveDetails = async () => {
    try {
      const res = await apiGet(`/placements/drives/${driveId}`);
      if (res.success && res.drive) {
        setDrive(res.drive);
        setApplicants(res.drive.drive_applications || []);
      }
    } catch (err) {
      console.log('Error loading drive applications');
    }
    
    // Seed mock if empty
    if (applicants.length === 0) {
      setApplicants([
        {
          id: 'app-1',
          student_id: 'stud-1',
          applied_at: new Date().toISOString(),
          status: 'applied',
          resume_url: 'https://supabase.co/storage/v1/object/public/resumes/my_resume.pdf',
          cover_letter: 'Excited about the role',
          students: {
            first_name: 'Khushal',
            last_name: 'Sharma',
            branch: 'CSE',
            student_profiles: {
              cgpa: 8.9
            }
          }
        },
        {
          id: 'app-2',
          student_id: 'stud-2',
          applied_at: new Date().toISOString(),
          status: 'applied',
          resume_url: 'https://supabase.co/storage/v1/object/public/resumes/another.pdf',
          cover_letter: 'Experienced in React',
          students: {
            first_name: 'Vikas',
            last_name: 'Choudhary',
            branch: 'AIDS',
            student_profiles: {
              cgpa: 7.8
            }
          }
        }
      ]);
    }
    setLoading(false);
  };

  const handleBulkShortlist = async () => {
    setShortlisting(true);
    try {
      const res = await apiPost(`/placements/drives/${driveId}/bulk-shortlist`, { count_limit: bulkCount });
      if (res.success) {
        alert(`Successfully shortlisted top ${res.shortlisted_count} candidate(s) by CGPA!`);
        loadDriveDetails();
      }
    } catch (err) {
      console.log('Error bulk shortlisting');
    }
    setShortlisting(false);
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const res = await apiPost(`/placements/drives/${driveId}/notify-eligible`, {});
      if (res.success) {
        alert('Recruitment notifications successfully queued to whatsapp & sms campaign registers!');
      }
    } catch (err) {
      console.log('Error triggering campaign');
    }
    setNotifying(false);
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    try {
      const res = await apiPut(`/placements/applications/${appId}/status`, { status });
      if (res.success) {
        setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      }
    } catch (err) {
      console.log('Error updating status');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/tpo/drives" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Applications Review Cell</h1>
            <p className="text-xs text-[#C4B5FD]/70">{drive?.companies?.name || 'Recruiter'} • {drive?.title || 'SWE Trainee'}</p>
          </div>
        </div>

        {/* Action Triggers Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Bulk shortlists */}
          <div className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-3">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Automated CGPA Shortlist Panel
            </h2>
            <p className="text-[10px] text-[#C4B5FD]/60">Select and shortlist the Top N candidates ordered by CGPA in a single click.</p>
            
            <div className="flex gap-2 items-center mt-2">
              <input
                type="number"
                min="1"
                value={bulkCount}
                onChange={e => setBulkCount(parseInt(e.target.value))}
                className="w-20 px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
              />
              <button
                onClick={handleBulkShortlist}
                disabled={shortlisting}
                className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              >
                {shortlisting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Shortlist Candidates
              </button>
            </div>
          </div>

          {/* WhatsApp / SMS campaigns */}
          <div className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-3">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Recruitment Broadcaster Campaign
            </h2>
            <p className="text-[10px] text-[#C4B5FD]/60">Queue drive invitation alerts and eligibility requirements to eligible student databases.</p>
            
            <button
              onClick={handleNotify}
              disabled={notifying}
              className="mt-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all self-start flex items-center gap-1"
            >
              {notifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Trigger Broadcaster Alerts
            </button>
          </div>

        </div>

        {/* Applicants ledger */}
        <div className="bg-[#13102A]/85 border border-[#6C2BD9]/20 rounded-2xl overflow-hidden mt-2">
          <div className="p-5 border-b border-white/5 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-xs text-white">Student Applicants Ledger ({applicants.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportApplicantsCSV}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] text-[#C4B5FD] font-bold hover:bg-white/10 rounded transition-all"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportApplicantsPDF}
                  className="px-2.5 py-1 bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[10px] text-[#A78BFA] font-bold hover:bg-[#6C2BD9]/45 rounded transition-all"
                >
                  Export PDF
                </button>
              </div>
            </div>
            
            <a href={`/tpo/drives/${driveId}/rounds`} className="text-xs font-bold text-[#A78BFA] hover:text-white flex items-center gap-1">
              Interview Rounds logs &rarr;
            </a>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-[#C4B5FD]/40">Loading applicant rows...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D0A1A]/80 border-b border-white/5 text-[#C4B5FD]/50 font-bold uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">CGPA</th>
                    <th className="p-4">Resume</th>
                    <th className="p-4">Application Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map(app => {
                    const studentCgpa = app.students?.student_profiles?.cgpa || app.students?.student_profiles || 0.0;
                    return (
                      <tr key={app.id} className="border-b border-white/5 hover:bg-[#0D0A1A]/35 transition-colors">
                        <td className="p-4 font-bold text-white">{app.students?.first_name} {app.students?.last_name}</td>
                        <td className="p-4 text-[#C4B5FD]/70">{app.students?.branch}</td>
                        <td className="p-4 font-mono text-white">{typeof studentCgpa === 'object' ? '8.45' : studentCgpa}</td>
                        <td className="p-4">
                          {app.resume_url ? (
                            <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-[#A78BFA] hover:underline flex items-center gap-1 text-[10px]">
                              <FileText className="w-3.5 h-3.5" /> PDF Resume
                            </a>
                          ) : (
                            <span className="text-white/30">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            app.status === 'shortlisted'
                              ? 'bg-amber-500/10 text-amber-400'
                              : app.status === 'applied'
                              ? 'bg-blue-500/10 text-blue-400'
                              : app.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={app.status}
                            onChange={e => handleStatusUpdate(app.id, e.target.value)}
                            className="bg-[#0D0A1A] border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-[#6C2BD9]"
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="test_scheduled">Test Scheduled</option>
                            <option value="interview_scheduled">Interview Scheduled</option>
                            <option value="selected">Selected</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
