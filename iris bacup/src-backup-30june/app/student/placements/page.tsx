"use client";

import React, { useState, useEffect } from 'react';
import {
  Briefcase, FileText, Bot, HelpCircle, Users, ClipboardList,
  CheckCircle, ArrowRight, Star, MapPin, Calendar, Clock, DollarSign
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Drive {
  id: string;
  title: string;
  role: string;
  status: string;
  job_type: string;
  location: string[];
  ctc_display: string;
  min_cgpa: number;
  application_deadline: string;
  companies: {
    name: string;
    logo_url?: string;
    industry?: string;
  };
}

const MOCK_DRIVES: Drive[] = [
  {
    id: 'drive-1',
    title: 'Graduate Engineer Trainee',
    role: 'Software Engineer',
    status: 'open',
    job_type: 'full_time',
    location: ['Bangalore', 'Pune'],
    ctc_display: '₹12.5 LPA',
    min_cgpa: 7.5,
    application_deadline: new Date(Date.now() + 172800000).toISOString(),
    companies: {
      name: 'Google India',
      industry: 'Technology'
    }
  },
  {
    id: 'drive-2',
    title: 'Decision Analytics Associate',
    role: 'Data Analyst',
    status: 'open',
    job_type: 'full_time',
    location: ['Gurgaon'],
    ctc_display: '₹8.4 LPA',
    min_cgpa: 7.0,
    application_deadline: new Date(Date.now() + 345600000).toISOString(),
    companies: {
      name: 'ZS Associates',
      industry: 'Consulting'
    }
  }
];

export default function StudentPlacementsDashboard() {
  const [drives, setDrives] = useState<Drive[]>(MOCK_DRIVES);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    total_eligible: 320,
    total_placed: 215,
    avg_ctc: 7.8,
    highest_ctc: 44.0
  });

  useEffect(() => {
    loadPlacementsData();
  }, []);

  const loadPlacementsData = async () => {
    try {
      const localProfile = localStorage.getItem('iris_user_profile');
      const user = localProfile ? JSON.parse(localProfile) : null;

      const [driveRes, statsRes, offersRes] = await Promise.all([
        apiGet('/placements/drives'),
        apiGet('/placements/analytics/dashboard'),
        user ? apiGet(`/placements/offers/student/${user.id}`) : Promise.resolve({ success: false } as any),
      ]);

      if (driveRes.success && driveRes.drives?.length > 0) {
        setDrives(driveRes.drives);
      }

      if (statsRes.success && statsRes.dashboard) {
        setStats(statsRes.dashboard);
      }

      if (offersRes.success && offersRes.offers?.length > 0) {
        setProfile({ is_placed: true, placed_role: offersRes.offers[0].role, placed_ctc: offersRes.offers[0].ctc, placed_company: offersRes.offers[0].companies?.name });
      } else {
        setProfile({ is_placed: false });
      }
    } catch (err) {
      console.log('Using fallback mock data');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-3xl text-white tracking-tight flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-[#A78BFA]" />
              Placement Cell
            </h1>
            <p className="text-sm text-[#C4B5FD]/70">Explore job opportunities, optimize your resume, prepare for interviews, and connect with mentors.</p>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="flex gap-4">
            <div className="px-4 py-2.5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 flex flex-col items-center">
              <span className="text-[10px] text-[#C4B5FD]/50">Average CTC</span>
              <span className="text-base font-extrabold text-white">{stats.avg_ctc} LPA</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 flex flex-col items-center">
              <span className="text-[10px] text-[#C4B5FD]/50">Highest CTC</span>
              <span className="text-base font-extrabold text-emerald-400">{stats.highest_ctc} LPA</span>
            </div>
          </div>
        </div>

        {/* Banner: Placement Status */}
        {profile?.is_placed ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 to-[#13102A] border border-emerald-500/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Congratulations! You are placed! 🎉</h2>
                <p className="text-xs text-[#C4B5FD]/60 mt-1">Locked in at <span className="text-emerald-400 font-semibold">{profile.placed_company}</span> as {profile.placed_role} ({profile.placed_ctc} LPA)</p>
              </div>
            </div>
            <a href="/student/placements/offers" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
              View Offer Letter <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#6C2BD9]/20 to-[#13102A] border border-[#6C2BD9]/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
                <Bot className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Unlock Your Dream Career</h2>
                <p className="text-xs text-[#C4B5FD]/60 mt-1">Upload your resume to receive AI feedback, keyword suggestions, and mock practice recommendations.</p>
              </div>
            </div>
            <a href="/student/placements/resume-analyzer" className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center gap-1.5">
              Run AI Resume Analyzer <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Job Drives Feed */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#A78BFA]" />
              Active Recruitment Drives ({drives.length})
            </h2>

            <div className="flex flex-col gap-4">
              {drives.map(drive => (
                <div key={drive.id} className="bg-[#13102A]/85 border border-[#6C2BD9]/20 hover:border-[#8B5CF6]/45 transition-all p-5 rounded-2xl flex flex-col gap-4 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 flex items-center justify-center font-bold text-white text-base">
                        {drive.companies.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-[#A78BFA] transition-colors">{drive.title}</h3>
                        <p className="text-xs text-[#C4B5FD]/60 mt-0.5">{drive.companies.name} • {drive.role}</p>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-white bg-[#6C2BD9]/10 px-3 py-1 rounded-xl border border-[#6C2BD9]/20">
                      {drive.ctc_display}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-white/5 text-[10px] text-[#C4B5FD]/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#A78BFA]" />
                      {drive.location.join(', ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#A78BFA]" />
                      CGPA Cutoff: {drive.min_cgpa}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Deadline: {new Date(drive.application_deadline).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <a
                      href={`/student/placements/drives/${drive.id}`}
                      className="px-4 py-2 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all flex items-center gap-1"
                    >
                      Inspect JD & Apply
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tools Desk */}
          <div className="flex flex-col gap-6">
            <h2 className="font-bold text-lg text-white">Preparations Desk</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <a href="/student/placements/profile" className="p-4 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 flex items-center justify-center text-[#A78BFA] group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Placement Profile</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Edit academic records & resume links</p>
                </div>
              </a>

              <a href="/student/placements/mock-interview" className="p-4 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">AI Mock Interview</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Solve live technical & coding rounds</p>
                </div>
              </a>

              <a href="/student/placements/alumni" className="p-4 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Alumni Mentors</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Book slots for career counseling</p>
                </div>
              </a>

              <a href="/student/placements/applications" className="p-4 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Applications Track</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Verify interview schedules & details</p>
                </div>
              </a>

              <a href="/student/placements/offers" className="p-4 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Offers Ledger</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Accept offer letters & lock profiles</p>
                </div>
              </a>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
