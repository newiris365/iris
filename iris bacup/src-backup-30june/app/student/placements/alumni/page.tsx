"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Users, Calendar, Clock, MessageCircle, Globe,
  Linkedin, Award, CheckCircle, Search, Sparkles
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface Alumni {
  id: string;
  graduation_year: number;
  current_company: string;
  current_role: string;
  location: string;
  linkedin_url?: string;
  is_mentor: boolean;
  mentoring_slots: number;
  students: {
    first_name: string;
    last_name: string;
    branch: string;
  };
}

export default function StudentAlumniMentors() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingAlumni, setBookingAlumni] = useState<Alumni | null>(null);
  
  const [topic, setTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      const res = await apiGet('/placements/alumni');
      if (res.success && res.alumni?.length > 0) {
        setAlumni(res.alumni);
      }
    } catch (err) {
      console.log('Error loading alumni');
    }
    
    // Seed mock if empty
    if (alumni.length === 0) {
      setAlumni([
        {
          id: 'alum-1',
          graduation_year: 2023,
          current_company: 'Microsoft',
          current_role: 'Software Engineer II',
          location: 'Hyderabad',
          linkedin_url: 'https://linkedin.com',
          is_mentor: true,
          mentoring_slots: 3,
          students: {
            first_name: 'Aditya',
            last_name: 'Vyas',
            branch: 'CSE'
          }
        },
        {
          id: 'alum-2',
          graduation_year: 2022,
          current_company: 'Zomato',
          current_role: 'Product Manager',
          location: 'Gurgaon',
          linkedin_url: 'https://linkedin.com',
          is_mentor: true,
          mentoring_slots: 2,
          students: {
            first_name: 'Shreya',
            last_name: 'Choudhary',
            branch: 'ECE'
          }
        }
      ]);
    }
    setLoading(false);
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingAlumni) return;

    setSubmitting(true);
    try {
      const res = await apiPost('/placements/alumni/book', {
        alumni_id: bookingAlumni.id,
        topic,
        session_date: new Date(sessionDate).toISOString()
      });
      if (res.success) {
        setBooked(true);
        setTimeout(() => {
          setBooked(false);
          setBookingAlumni(null);
          setTopic('');
          setSessionDate('');
        }, 2500);
      }
    } catch (err) {
      console.log('Error booking slot');
    }
    setSubmitting(false);
  };

  const filteredAlumni = alumni.filter(item => {
    const term = searchTerm.toLowerCase();
    const fullName = `${item.students?.first_name} ${item.students?.last_name}`.toLowerCase();
    const company = item.current_company?.toLowerCase() || '';
    const role = item.current_role?.toLowerCase() || '';
    return fullName.includes(term) || company.includes(term) || role.includes(term);
  });

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/student/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="font-extrabold text-2xl text-white">Alumni Network</h1>
              <p className="text-xs text-[#C4B5FD]/70">Connect with featured college seniors, browse industry roles, and schedule mentoring calls.</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-64 max-w-full">
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by company, role..."
              className="w-full pl-9 pr-4 py-2 bg-[#13102A]/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40 text-xs">🔍</span>
          </div>
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#C4B5FD]/40">Loading mentors...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlumni.map(item => (
              <div key={item.id} className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-3 hover:border-[#8B5CF6]/50 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 flex items-center justify-center font-bold text-white text-base">
                      {item.students?.first_name.slice(0, 1).toUpperCase()}
                      {item.students?.last_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-[#A78BFA] transition-colors">
                        {item.students?.first_name} {item.students?.last_name}
                      </h3>
                      <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">{item.current_role} at <span className="text-white font-medium">{item.current_company}</span></p>
                    </div>
                  </div>

                  {item.linkedin_url && (
                    <a href={item.linkedin_url} target="_blank" rel="noreferrer" className="text-[#C4B5FD]/40 hover:text-blue-400">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#C4B5FD]/50 border-t border-white/5 pt-3">
                  <span>Branch: {item.students?.branch} ({item.graduation_year})</span>
                  <span>Location: {item.location}</span>
                </div>

                {item.is_mentor && (
                  <button
                    onClick={() => setBookingAlumni(item)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book 1-on-1 Session
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {bookingAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBookingAlumni(null)}>
          <div className="w-full max-w-md bg-[#13102A] rounded-2xl border border-white/10 p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" /> Book Mentoring Call
              </h3>
              <button onClick={() => setBookingAlumni(null)} className="text-[#C4B5FD]/50 hover:text-white text-xs">×</button>
            </div>

            {booked ? (
              <div className="py-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <span className="text-xs font-bold text-white">Session Scheduled Successfully!</span>
                <span className="text-[9px] text-[#C4B5FD]/50">Check your calendar or notices for joining credentials.</span>
              </div>
            ) : (
              <form onSubmit={handleBookSession} className="flex flex-col gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-[10px] text-[#C4B5FD]/60 leading-relaxed">
                  Booking a 45-minute virtual meeting with <span className="text-white font-bold">{bookingAlumni.students?.first_name} {bookingAlumni.students?.last_name}</span> ({bookingAlumni.current_role} at {bookingAlumni.current_company}).
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Discuss Topic</label>
                  <input
                    required
                    placeholder="e.g. Mock interview checklist, Resume evaluation, Referral opportunity..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Preferred Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/20"
                >
                  {submitting ? 'Booking...' : 'Confirm Call Request'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </main>
  );
}
