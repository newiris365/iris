"use client";

import React, { useState, useEffect } from 'react';
import { User, Calendar, Mail, Phone, Briefcase, RefreshCw } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  employee_type: string;
  shift: string;
}

export default function HodTeamOverview() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock department team
      setTeam([]);
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
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Department Roster</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">My Department Team</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Monitor reporting employees profiles, contact metadata, designations, and assigned shift details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading department members...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(member => (
            <div key={member.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-6 flex flex-col justify-between hover:border-[#6C2BD9]/50 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-full -z-10"></div>
              
              <div className="flex flex-col gap-3.5">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-white">
                    <User className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#C4B5FD]">
                    {member.employee_type}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-base text-white group-hover:text-[#A78BFA] transition-colors">{member.name}</h3>
                  <span className="text-xs text-[#C4B5FD]/60 font-semibold">{member.designation}</span>
                </div>

                <div className="flex flex-col gap-2 text-[11px] text-[#C4B5FD]/75 border-t border-white/5 pt-3 mt-1 font-semibold">
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#8B5CF6]" /> {member.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#8B5CF6]" /> {member.phone}
                  </span>
                  <span className="flex items-center gap-2 mt-1.5 text-white">
                    <Briefcase className="w-3.5 h-3.5 text-[#8B5CF6]" /> {member.shift}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
