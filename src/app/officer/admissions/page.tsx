"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { 
  Users, Search, Filter, RefreshCw, ChevronRight, UserCheck, 
  BookOpen, Eye, ArrowRight, ShieldCheck, Mail, Phone, Calendar
} from 'lucide-react';

interface ApplicantRecord {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  merit_score: number;
  rank_overall?: number;
  academic_records?: any[];
  entrance_scores?: any[];
}

export default function OfficerQueuePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantRecord | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  async function fetchQueue(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      if (programFilter) params.program = programFilter;

      const res = await apiGet('/admissions/applications', params);
      if (res.success && res.applicants) {
        setApplicants(res.applicants);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Offline fallback mock data
      const mockApplicants: ApplicantRecord[] = [];
      setApplicants(mockApplicants);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, programFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-white/50 bg-white/5 border-white/10';
      case 'submitted': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'under_review': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'verified': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'shortlisted': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'offered': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'admitted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-[#C4B5FD]/60 bg-white/5 border-transparent';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#6C2BD9]/20 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#A78BFA]" />
            Application Processing Queue
          </h1>
          <p className="text-xs text-[#C4B5FD]/70 mt-1">Audit prospective submissions, screen program allocations, and filter verification stages.</p>
        </div>

        <button
          onClick={() => fetchQueue(true)}
          disabled={refreshing}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] hover:text-white transition-all disabled:opacity-50"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters Toolbar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#13102A]/40 border border-white/5 p-4 rounded-2xl shadow-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#C4B5FD]/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or app ID..."
            className="w-full bg-white/5 border border-[#6C2BD9]/25 pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-white/25 outline-none focus:border-[#8B5CF6] transition-all"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#13102A] border border-[#6C2BD9]/25 py-2 px-3 rounded-xl text-xs text-white outline-none focus:border-[#8B5CF6] transition-all"
          >
            <option value="">All Status Levels</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="offered">Offered</option>
            <option value="admitted">Admitted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="w-full bg-[#13102A] border border-[#6C2BD9]/25 py-2 px-3 rounded-xl text-xs text-white outline-none focus:border-[#8B5CF6] transition-all"
          >
            <option value="">All Program Options</option>
            <option value="BTECH-CSE">B.Tech CSE</option>
            <option value="BTECH-AIDS">B.Tech AI-DS</option>
            <option value="MBA-CORE">MBA Core</option>
          </select>
        </div>

        <button
          type="submit"
          className="py-2 px-4 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs transition-all shadow-md shadow-[#6C2BD9]/20"
        >
          Apply Filters
        </button>
      </form>

      {/* Main Queue layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Queue (Left) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
              <p className="text-xs text-[#C4B5FD]/70 font-mono">Loading Applications Queue...</p>
            </div>
          ) : applicants.length === 0 ? (
            <p className="text-xs text-[#C4B5FD]/50 text-center py-20 border border-dashed border-white/5 rounded-2xl">
              No matching applicant entries found in the queue.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">Applicant</th>
                    <th className="pb-3 px-2">Application ID</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Score</th>
                    <th className="pb-3 pl-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applicants.map((app) => (
                    <tr 
                      key={app.id} 
                      onClick={() => setSelectedApplicant(app)}
                      className={`hover:bg-[#6C2BD9]/5 transition-colors cursor-pointer group ${
                        selectedApplicant?.id === app.id ? 'bg-[#6C2BD9]/10' : ''
                      }`}
                    >
                      <td className="py-3.5 pr-2 font-bold text-white">
                        {app.first_name} {app.last_name}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-indigo-400">
                        {app.application_number}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-emerald-400 font-bold">
                        {app.merit_score || '0.0'}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <ChevronRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-white transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Inspector (Right) */}
        <div className="space-y-6">
          {selectedApplicant ? (
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/50 p-6 shadow-xl space-y-6 animate-fade-in">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {selectedApplicant.first_name} {selectedApplicant.last_name}
                  </h3>
                  <span className="text-[10px] text-indigo-400 font-mono mt-1 block">{selectedApplicant.application_number}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${getStatusColor(selectedApplicant.status)}`}>
                  {selectedApplicant.status}
                </span>
              </div>

              {/* Profile details */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5 text-[#C4B5FD]/80">
                  <Mail className="w-4 h-4 text-[#A78BFA] shrink-0" />
                  <span className="truncate">{selectedApplicant.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#C4B5FD]/80">
                  <Phone className="w-4 h-4 text-[#A78BFA] shrink-0" />
                  <span>{selectedApplicant.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#C4B5FD]/80">
                  <Calendar className="w-4 h-4 text-[#A78BFA] shrink-0" />
                  <span>Registered: {new Date(selectedApplicant.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Academic Overview */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 tracking-widest block">Academic Credentials</span>
                {selectedApplicant.academic_records && selectedApplicant.academic_records.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedApplicant.academic_records.map((rec, idx) => (
                      <div key={idx} className="p-3 bg-[#0D0A1A]/60 border border-white/5 rounded-xl">
                        <span className="text-[9px] font-bold text-[#A78BFA] block">{rec.level} Board</span>
                        <span className="text-sm font-mono font-bold text-white mt-1 block">{rec.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#C4B5FD]/40 italic">No academic records loaded.</p>
                )}
              </div>

              {/* National Entrance Scores */}
              {selectedApplicant.entrance_scores && selectedApplicant.entrance_scores.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 tracking-widest block">National Entrance Exams</span>
                  {selectedApplicant.entrance_scores.map((score, idx) => (
                    <div key={idx} className="p-3 bg-[#0D0A1A]/60 border border-white/5 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-white block">{score.exam_name}</span>
                        <span className="text-[8px] text-[#C4B5FD]/40 font-mono mt-0.5 block">Roll: {score.roll_number}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-[#C4B5FD]/40 block">Percentile</span>
                        <span className="text-xs font-mono font-bold text-[#A78BFA]">{score.percentile}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick actions panel */}
              <div className="pt-4 border-t border-white/5">
                <a 
                  href={`/officer/admissions/verify?id=${selectedApplicant.id}`}
                  className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#6C2BD9]/20"
                >
                  Open Verification Desk <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-10 text-center space-y-4">
              <Users className="w-10 h-10 text-[#A78BFA]/40 mx-auto" />
              <h4 className="font-bold text-white text-sm">Select an Applicant</h4>
              <p className="text-[10px] text-[#C4B5FD]/60 leading-relaxed">
                Click on any applicant record in the queue list to inspect details and launch verification checklists.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
