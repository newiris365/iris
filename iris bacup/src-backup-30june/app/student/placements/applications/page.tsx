"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Clock, CheckCircle2, AlertCircle, ChevronDown,
  ChevronUp, ExternalLink, Calendar, HelpCircle, Layers, XCircle
} from 'lucide-react';
import { apiGet } from '../../../../lib/api';

interface Application {
  id: string;
  drive_id: string;
  applied_at: string;
  status: string;
  current_round: number;
  rejection_reason?: string;
  feedback?: string;
  placement_drives: {
    title: string;
    role: string;
    companies: {
      name: string;
    };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  applied: { label: 'Applied', color: 'text-blue-400', bg: 'bg-blue-500/10', emoji: '📋' },
  shortlisted: { label: 'Shortlisted', color: 'text-amber-400', bg: 'bg-amber-500/10', emoji: '⭐' },
  test_scheduled: { label: 'Test Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10', emoji: '📝' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'text-indigo-400', bg: 'bg-indigo-500/10', emoji: '🤝' },
  selected: { label: 'Selected', color: 'text-emerald-400', bg: 'bg-emerald-500/10', emoji: '🎉' },
  offered: { label: 'Offered', color: 'text-[#A78BFA]', bg: 'bg-[#6C2BD9]/10', emoji: '🎁' },
  offer_accepted: { label: 'Offer Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/10', emoji: '✅' },
  offer_rejected: { label: 'Offer Declined', color: 'text-red-400', bg: 'bg-red-500/10', emoji: '❌' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10', emoji: '❌' },
  withdrawn: { label: 'Withdrawn', color: 'text-white/40', bg: 'bg-white/5', emoji: '↩️' }
};

export default function StudentApplicationsTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const localProfile = localStorage.getItem('iris_user_profile');
      if (localProfile) {
        const user = JSON.parse(localProfile);
        const res = await apiGet(`/placements/applications/student/${user.id}`);
        if (res.success && res.applications) {
          setApplications(res.applications);
        }
      }
    } catch (err) {
      console.log('Error fetching applications');
    }
    
    // Seed mock if empty
    if (applications.length === 0) {
      setApplications([
        {
          id: 'app-1',
          drive_id: 'drive-1',
          applied_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'interview_scheduled',
          current_round: 2,
          placement_drives: {
            title: 'Google SWE Summer Drive 2026',
            role: 'Software Engineer (L3)',
            companies: {
              name: 'Google India'
            }
          }
        },
        {
          id: 'app-2',
          drive_id: 'drive-2',
          applied_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'applied',
          current_round: 0,
          placement_drives: {
            title: 'ZS Consulting Campus Hiring',
            role: 'Business Technology Analyst',
            companies: {
              name: 'ZS Associates'
            }
          }
        }
      ]);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">My Applications</h1>
            <p className="text-xs text-[#C4B5FD]/70">Track live interview status, rounds checklist progression, and feedback logs.</p>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#C4B5FD]/40">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="w-12 h-12 text-[#6C2BD9]/20 mx-auto mb-3" />
            <p className="text-sm text-[#C4B5FD]/40">No applications submitted yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applications.map(app => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              const isExpanded = expandedId === app.id;
              
              return (
                <div key={app.id} className="glass-panel bg-[#13102A]/85 rounded-2xl border border-white/5 overflow-hidden hover:border-[#6C2BD9]/20 transition-all">
                  
                  {/* Summary Bar */}
                  <div
                    className="p-5 cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-lg`}>
                        {config.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{app.placement_drives.title}</h3>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{app.placement_drives.companies?.name} • Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C4B5FD]/40" /> : <ChevronDown className="w-4 h-4 text-[#C4B5FD]/40" />}
                    </div>
                  </div>

                  {/* Expanded timeline info */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 flex flex-col gap-4 bg-[#0D0A1A]/40">
                      
                      {/* Timeline status track */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-[#C4B5FD]/50">Hiring Round Progression</span>
                        
                        <div className="flex items-center gap-1.5 mt-1">
                          {[
                            { label: 'Apply', done: true },
                            { label: 'Shortlist', done: app.current_round >= 1 || app.status !== 'applied' },
                            { label: 'Technical', done: app.current_round >= 2 },
                            { label: 'HR Round', done: app.current_round >= 3 },
                            { label: 'Offer', done: ['offered', 'offer_accepted', 'offer_rejected'].includes(app.status) }
                          ].map((step, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex flex-col items-center gap-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border ${
                                  step.done 
                                    ? 'bg-[#6C2BD9]/25 border-[#6C2BD9] text-[#A78BFA]' 
                                    : 'bg-transparent border-white/10 text-white/20'
                                }`}>
                                  {step.done ? '✓' : idx + 1}
                                </div>
                                <span className="text-[7px] text-white/40">{step.label}</span>
                              </div>
                              {idx < 4 && (
                                <div className={`flex-1 h-0.5 rounded -mt-2.5 ${step.done ? 'bg-[#6C2BD9]/55' : 'bg-white/5'}`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* feedback info */}
                      {app.feedback && (
                        <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[10px] text-[#C4B5FD]/80 leading-relaxed">
                          <span className="font-bold text-white">Interviewer Feedback: </span> {app.feedback}
                        </div>
                      )}

                      {app.rejection_reason && (
                        <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-[10px] text-red-300 leading-relaxed">
                          <span className="font-bold text-red-400">Status Update: </span> {app.rejection_reason}
                        </div>
                      )}

                      {app.status === 'interview_scheduled' && (
                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 text-[10px]">
                          <div>
                            <span className="font-bold text-white">Technical Interview Round 2</span>
                            <p className="text-[#C4B5FD]/60 mt-0.5">Interviewer: Rajesh Kumar • Mode: Online</p>
                          </div>
                          <a href="https://meet.google.com" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-[#6C2BD9] hover:bg-[#8B5CF6] text-[10px] font-bold text-white flex items-center gap-1.5">
                            Join Meet <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
