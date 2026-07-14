"use client";

import React, { useState, useEffect } from 'react';
import { Home, Users, Bell, AlertTriangle, Calendar, FileText, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { apiGet } from '../../lib/api';
import Link from 'next/link';
import SubscriptionGate from '../../components/SubscriptionGate';

function HostelContent() {
  const [allocation, setAllocation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('iris_jwt_token') || '');
    }
  }, []);

  const loadData = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const [allocRes, noticesRes] = await Promise.all([
        apiGet(`/hostel/allocations?studentId=${studentId}`),
        apiGet(`/hostel/notices`)
      ]);

      if (allocRes.success && allocRes.allocations?.length > 0) {
        const activeAlloc = allocRes.allocations[0];
        setAllocation(activeAlloc);
        
        // Fetch roommates for this room (exclude self)
        const roomRes = await apiGet(`/hostel/allocations`);
        if (roomRes.success) {
          const roomies = roomRes.allocations.filter(
            (a: any) => a.room_id === activeAlloc.room_id && a.student_id !== studentId
          );
          setRoommates(roomies);
        }
      } else {
        setAllocation(null);
        setRoommates([]);
      }

      if (noticesRes.success) {
        setNotices(noticesRes.notices || []);
      } else {
        setNotices([]);
      }
    } catch (err) {
      setAllocation(null);
      setRoommates([]);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS Hostel</h1>
              <p className="text-sm text-[#C4B5FD]/70">My Room • Companions • Notices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Main Side: Room Details & Roommates */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Room Allocation Info */}
          {allocation ? (
            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BD9]/5 rounded-full blur-3xl" />
              
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA]">
                    {allocation.hostel_rooms?.hostel_blocks?.name}
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mt-3">{allocation.hostel_rooms?.room_number}</h2>
                  <p className="text-xs text-[#C4B5FD]/50 mt-1 capitalize">{allocation.hostel_rooms?.room_type} Sharing Room • Floor {allocation.hostel_rooms?.floor}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Monthly Rent</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">₹{allocation.hostel_rooms?.monthly_rent?.toLocaleString()}</p>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <h4 className="text-xs font-bold text-[#C4B5FD]/60 mb-2.5">Room Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {allocation.hostel_rooms?.amenities?.map((am: string) => (
                    <span key={am} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-[#C4B5FD]/80 font-medium">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              {/* Letter Download */}
              <div className="mt-6 flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Allotment Certificate</h4>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Allotted on {new Date(allocation.allotted_date).toLocaleDateString()}</p>
                </div>
                <a
                  href={allocation?.id ? `/api/v1/hostel/allocations/${allocation.id}/report/pdf?token=${token}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] p-6 relative overflow-hidden shadow-2xl text-center py-12">
              <Home className="w-12 h-12 text-[#C4B5FD]/30 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-white">No Active Room Allocation</h3>
              <p className="text-xs text-[#C4B5FD]/50 mt-1">Please contact the warden or administration office for room allocation details.</p>
            </div>
          )}

          {/* Roommates Card */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#A78BFA]" /> My Roommates
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roommates.map((r, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5">
                  <h4 className="text-xs font-bold text-white">{r.students?.name}</h4>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{r.students?.roll_number} • {r.students?.department}</p>
                  <p className="text-[9px] text-[#A78BFA] mt-1.5 font-mono">{r.students?.email || 'N/A'}</p>
                </div>
              ))}
              {roommates.length === 0 && (
                <p className="text-xs text-[#C4B5FD]/40 py-4">You are currently the sole occupant in this room.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Portal Links & Notices */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/hostel/complaints" className="p-4 rounded-2xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-2 group">
              <AlertTriangle className="w-5 h-5 text-[#A78BFA] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Complaints</span>
              <span className="text-[9px] text-[#C4B5FD]/40">Raise repairs or query rooms</span>
            </Link>
            <Link href="/hostel/leave" className="p-4 rounded-2xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-2 group">
              <Calendar className="w-5 h-5 text-[#A78BFA] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Leave Requests</span>
              <span className="text-[9px] text-[#C4B5FD]/40">Apply for outbound leaves</span>
            </Link>
            <Link href="/hostel/visitors" className="p-4 rounded-2xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-2 group">
              <ShieldCheck className="w-5 h-5 text-[#A78BFA] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Visitors Access</span>
              <span className="text-[9px] text-[#C4B5FD]/40">Approve guest entries</span>
            </Link>
            <Link href="/hostel/fees" className="p-4 rounded-2xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-2 group">
              <CreditCard className="w-5 h-5 text-[#A78BFA] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Rents Ledger</span>
              <span className="text-[9px] text-[#C4B5FD]/40">Hostel monthly payments</span>
            </Link>
          </div>

          {/* Notices Bulletins */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 flex-1 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#A78BFA]" /> Notice Board
            </h3>
            
            <div className="flex flex-col gap-4">
              {notices.map((n, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                    <span className="text-[9px] text-[#C4B5FD]/40 whitespace-nowrap">{new Date(n.posted_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-[#C4B5FD]/70 leading-relaxed">{n.content}</p>
                </div>
              ))}
              {notices.length === 0 && (
                <p className="text-xs text-[#C4B5FD]/40 text-center py-6">No announcements currently active.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function StudentHostelDashboard() {
  const [user, setUser] = useState<any>(null);
  const [instId, setInstId] = useState('');

  useEffect(() => {
    const profile = localStorage.getItem('iris_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setUser(parsed);
      setInstId(parsed.institution_id || 'a0000000-0000-0000-0000-000000000001');
    }
  }, []);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <SubscriptionGate serviceType="hostel" institutionId={instId} studentId={user.student_id || user.id}>
      <HostelContent />
    </SubscriptionGate>
  );
}
