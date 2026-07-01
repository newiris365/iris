"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Award, FileText, Bookmark, Calendar, ArrowUpRight, RefreshCw } from 'lucide-react';

interface Publication {
  id: string;
  title: string;
  journal_conference: string;
  publication_type: string;
  year: number;
  impact_factor?: number;
  indexed_in?: string[];
  document_url?: string;
  staff_name?: string;
}

interface Fdp {
  id: string;
  program_type: string;
  title: string;
  organizing_body: string;
  date: string;
  duration_days: number;
  staff_name?: string;
}

export default function AdminFacultyDevelopment() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [fdps, setFdps] = useState<Fdp[]>([]);
  
  const [stats, setStats] = useState({
    total_publications: 18,
    scopus_indexed: 12,
    wos_indexed: 6,
    average_impact_factor: 3.42
  });

  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await fetch('/api/v1/obe/publications/stats', {
        headers: getAuthHeaders()
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Mock Publications
      setPublications([
        { id: 'pub-1', title: 'Decentralized Sharding Indexes in PostgreSQL Supabase Platforms', journal_conference: 'IEEE Transactions on Cloud Systems', publication_type: 'journal', year: 2026, impact_factor: 4.82, indexed_in: ['Scopus', 'Web of Science'], staff_name: 'Dr. Amit Mehta' },
        { id: 'pub-2', title: 'Curriculum attainment analytics engine for NBA accreditation workflows', journal_conference: 'Journal of Outcome Education', publication_type: 'journal', year: 2025, impact_factor: 2.15, indexed_in: ['Scopus'], staff_name: 'Prof. Satish Kumar' }
      ]);

      // Mock FDPs
      setFdps([
        { id: 'fdp-1', program_type: 'fdp', title: 'Outcome Based Education and Curriculum Design under NEP', organizing_body: 'IIT Jodhpur MHRD Cell', date: '2026-05-10', duration_days: 7, staff_name: 'Dr. Amit Mehta' },
        { id: 'fdp-2', program_type: 'workshop', title: 'Next.js 14 App Router and Edge Middleware Architectures', organizing_body: 'Vercel Campus Developer Forum', date: '2026-06-02', duration_days: 3, staff_name: 'Prof. Satish Kumar' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Academic Research desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Faculty Development & Research Timeline</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Monitor institutional research publications, journal impact factors, Scopus lists, and workshop development records.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading publication timeline...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stats Ratios grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Publications', value: stats.total_publications, icon: BookOpen, color: '#6C2BD9' },
              { label: 'Scopus Indexed', value: stats.scopus_indexed, icon: Award, color: '#8B5CF6' },
              { label: 'Web of Science (WoS)', value: stats.wos_indexed, icon: Bookmark, color: '#A78BFA' },
              { label: 'Average Impact Factor', value: stats.average_impact_factor, icon: ArrowUpRight, color: '#10B981' }
            ].map((kpi, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-[#6C2BD9]/50 transition-all bg-[#13102A]/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-bold">{kpi.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <h3 className="font-extrabold text-xl text-white">{kpi.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Publications List */}
            <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Recent Research Articles</h3>
              
              <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {publications.map(pub => (
                  <div key={pub.id} className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="text-xs font-extrabold text-white leading-normal">{pub.title}</h4>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex-shrink-0">
                        IF: {pub.impact_factor}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-[#C4B5FD]/75 font-semibold">
                      Journal: {pub.journal_conference} ({pub.year})
                    </p>

                    <div className="flex justify-between items-center mt-1 text-[10px]">
                      <span className="text-white font-bold">Author: {pub.staff_name}</span>
                      <div className="flex gap-2">
                        {pub.indexed_in?.map(idxName => (
                          <span key={idxName} className="px-2 py-0.5 rounded bg-[#6C2BD9]/15 text-[#A78BFA] font-bold border border-[#8B5CF6]/30 text-[8px] uppercase">
                            {idxName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FDPs List */}
            <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Faculty Training Participations</h3>
              
              <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {fdps.map(fdp => (
                  <div key={fdp.id} className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-[#A78BFA] uppercase font-mono bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded">
                        {fdp.program_type}
                      </span>
                      <span className="text-[9px] text-[#C4B5FD]/50 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {fdp.date}
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-white leading-normal">{fdp.title}</h4>
                    <p className="text-[10px] text-[#C4B5FD]/70 leading-normal font-semibold">Organized by: {fdp.organizing_body}</p>

                    <div className="flex justify-between items-center mt-1 text-[10px] text-[#C4B5FD]/50 font-semibold border-t border-white/5 pt-2">
                      <span className="text-white">Staff: {fdp.staff_name}</span>
                      <span>Duration: {fdp.duration_days} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
