"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Users, BookOpen, CreditCard, ShieldCheck, MapPin, 
  Phone, Mail, ArrowLeft, RefreshCw, Activity, ArrowRight, 
  CheckCircle, ShieldAlert, Award, Compass, Key
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

interface StudentListItem {
  id: string;
  roll_number: string;
  user_id: string;
  semester: number;
  batch_year: string;
  users?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface StudentProfile {
  id: string;
  roll_number: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  semester: number;
  attendance_rate: number;
  fee_status: string;
  recent_movements: any[];
  canteen_wallet_balance: number;
  active_subscriptions: {
    transit: string;
    gym: string;
    library: string;
  };
}

export default function StudentLookupPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentsList, setStudentsList] = useState<StudentListItem[]>([]);
  const [filteredList, setFilteredList] = useState<StudentListItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoadingList(true);
    try {
      const res = await apiGet('/students');
      if (res.success) {
        setStudentsList(res.students || []);
        setFilteredList(res.students || []);

        // Check if query parameter ID is present
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const queryId = urlParams ? urlParams.get('id') : null;
        
        if (queryId) {
          setSelectedStudentId(queryId);
          loadStudentProfile(queryId);
        } else if (res.students && res.students.length > 0) {
          setSelectedStudentId(res.students[0].id);
          loadStudentProfile(res.students[0].id);
        }
      }
    } catch {
      // Sandbox Fallbacks
      const fallbackList = [
        { id: 's1', roll_number: 'CS23B1042', user_id: 'u1', semester: 4, batch_year: '2023', users: { name: 'Khushal Gehlot', email: 'khushal@siet.edu.in', phone: '+91 99999 88888' } },
        { id: 's2', roll_number: 'EC23B2011', user_id: 'u2', semester: 4, batch_year: '2023', users: { name: 'Rohan Sharma', email: 'rohan@siet.edu.in', phone: '+91 99999 12345' } },
        { id: 's3', roll_number: 'ME24B1008', user_id: 'u3', semester: 2, batch_year: '2024', users: { name: 'Vikram Gehlot', email: 'vikram@siet.edu.in', phone: '+91 99999 54321' } }
      ];
      setStudentsList(fallbackList);
      setFilteredList(fallbackList);

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const queryId = urlParams ? urlParams.get('id') : 's1';
      setSelectedStudentId(queryId);
      loadStudentProfile(queryId);
    } finally {
      setLoadingList(false);
    }
  };

  const loadStudentProfile = async (id: string) => {
    setLoadingProfile(true);
    try {
      const res = await apiGet(`/director/student/${id}/full-profile`);
      if (res.success) {
        setProfile(res.profile);
      }
    } catch {
      // Sandbox fallback profiles
      if (id === 's2') {
        setProfile({
          id: 's2',
          roll_number: 'EC23B2011',
          name: 'Rohan Sharma',
          email: 'rohan@siet.edu.in',
          phone: '+91 99999 12345',
          department: 'Electronics',
          semester: 4,
          attendance_rate: 67,
          fee_status: 'Outstanding Balance',
          recent_movements: [
            { id: 'm1', direction: 'in', gate_number: 'main', timestamp: new Date(Date.now() - 3600000).toISOString(), entry_method: 'rfid' },
            { id: 'm2', direction: 'out', gate_number: 'main', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), entry_method: 'manual' }
          ],
          canteen_wallet_balance: 120,
          active_subscriptions: { transit: 'Active (Route 4)', gym: 'Active (Slot B)', library: '1 Book overdue' }
        });
      } else {
        setProfile({
          id: 's1',
          roll_number: 'CS23B1042',
          name: 'Khushal Gehlot',
          email: 'khushal@siet.edu.in',
          phone: '+91 99999 88888',
          department: 'Computer Science',
          semester: 4,
          attendance_rate: 88,
          fee_status: 'Fully Paid',
          recent_movements: [
            { id: 'm3', direction: 'in', gate_number: 'main', timestamp: new Date().toISOString(), entry_method: 'qr' },
            { id: 'm4', direction: 'out', gate_number: 'canteen_exit', timestamp: new Date(Date.now() - 3600000).toISOString(), entry_method: 'biometric' },
            { id: 'm5', direction: 'in', gate_number: 'canteen_entry', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), entry_method: 'biometric' }
          ],
          canteen_wallet_balance: 350,
          active_subscriptions: { transit: 'None', gym: 'None', library: '2 Books checked out' }
        });
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val) {
      setFilteredList(studentsList);
      return;
    }
    const filtered = studentsList.filter(s => {
      const name = s.users?.name?.toLowerCase() || '';
      const roll = s.roll_number?.toLowerCase() || '';
      const email = s.users?.email?.toLowerCase() || '';
      return name.includes(val.toLowerCase()) || roll.includes(val.toLowerCase()) || email.includes(val.toLowerCase());
    });
    setFilteredList(filtered);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    loadStudentProfile(id);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-3">
          <Link href="/director" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white flex items-center gap-2">
              <Search className="w-7 h-7 text-[#A78BFA]" /> Student Dossier Center
            </h1>
            <p className="text-sm text-[#C4B5FD]/70">Unified cross-module profile searches including transit, library logs, and gate logs</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Search input and student lists */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-white/30" />
            <input
              type="text"
              placeholder="Search by Name, Roll No..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-[#13102A]/60 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-white/20 focus:border-[#8B5CF6]/50 transition-all shadow-xl"
            />
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 shadow-xl max-h-[500px] overflow-y-auto space-y-2">
            {loadingList ? (
              <p className="text-center text-xs text-white/30 py-12">Loading campus registers...</p>
            ) : filteredList.length === 0 ? (
              <p className="text-center text-xs text-white/20 py-12">No student matches found.</p>
            ) : (
              filteredList.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id)}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex justify-between items-center gap-3 ${
                    selectedStudentId === student.id
                      ? 'bg-[#6C2BD9]/20 border-[#8B5CF6]/50 text-white'
                      : 'bg-black/20 border-white/5 text-white/60 hover:bg-black/30 hover:text-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block">{student.users?.name}</span>
                    <span className="text-[9px] font-mono opacity-50 block">{student.roll_number}</span>
                  </div>
                  <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50">
                    Sem {student.semester}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Complete Unified Student dossier file */}
        <div className="lg:col-span-2">
          {loadingProfile ? (
            <div className="bg-[#13102A]/60 p-12 rounded-3xl border border-white/5 shadow-xl text-center text-xs text-white/30 flex flex-col items-center justify-center min-h-[500px]">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#A78BFA]" />
              Fetching full student ledger profile records...
            </div>
          ) : !profile ? (
            <div className="bg-[#13102A]/60 p-12 rounded-3xl border border-white/5 shadow-xl text-center text-xs text-white/20 min-h-[500px] flex items-center justify-center">
              Select a student to inspect the institutional profile dossier.
            </div>
          ) : (
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-6 min-h-[500px]">
              
              {/* Dossier Top metadata */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#A78BFA] font-bold bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded">
                    Dossier Active File
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1.5">{profile.name}</h2>
                  <p className="text-xs text-[#C4B5FD]/70">{profile.department} Department · Semester {profile.semester}</p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-white/40 block">Roll Number</span>
                  <span className="text-sm font-bold text-white block">{profile.roll_number}</span>
                </div>
              </div>

              {/* Grid 1: Contacts and Core Subscriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-3.5 bg-black/25 p-5 rounded-2xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/50">Contact Coordinates</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#C4B5FD]">
                      <Mail className="w-4 h-4 text-white/35" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#C4B5FD]">
                      <Phone className="w-4 h-4 text-white/35" />
                      <span>{profile.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 bg-black/25 p-5 rounded-2xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/50">Linked Subscriptions</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-white/80">
                      <span>Transit Pass:</span>
                      <span className="font-semibold text-white">{profile.active_subscriptions.transit}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/80">
                      <span>Gym Slot:</span>
                      <span className="font-semibold text-white">{profile.active_subscriptions.gym}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/80">
                      <span>Library Circ:</span>
                      <span className="font-semibold text-white">{profile.active_subscriptions.library}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Grid 2: Core KPI summary metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="bg-[#0D0A1A] p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-[#C4B5FD]/60 font-bold block">Attendance Avg</span>
                  <span className={`text-xl font-extrabold block mt-1 ${
                    profile.attendance_rate >= 80 
                      ? 'text-emerald-400' 
                      : profile.attendance_rate >= 75 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {profile.attendance_rate}%
                  </span>
                </div>

                <div className="bg-[#0D0A1A] p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-[#C4B5FD]/60 font-bold block">Bursar Ledger</span>
                  <span className={`text-xs font-bold block mt-2.5 ${
                    profile.fee_status.includes('Paid') ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {profile.fee_status}
                  </span>
                </div>

                <div className="bg-[#0D0A1A] p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-[#C4B5FD]/60 font-bold block">Canteen Wallet</span>
                  <span className="text-xl font-extrabold text-white block mt-1">
                    ₹{profile.canteen_wallet_balance}
                  </span>
                </div>

              </div>

              {/* Timeline segment: gate security movement logs */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#A78BFA]" /> Live Gate Security Movements timeline
                </h3>

                <div className="bg-[#0D0A1A] p-4 rounded-2xl border border-white/5 space-y-3">
                  {profile.recent_movements.length === 0 ? (
                    <p className="text-center text-xs text-white/30 py-4">No recent security gate records logged.</p>
                  ) : (
                    profile.recent_movements.map((move, idx) => (
                      <div key={move.id || idx} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${
                            move.direction === 'in' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <span className="capitalize font-bold text-white">
                              Gate {move.direction} · {move.gate_number}
                            </span>
                            <span className="text-[8px] text-white/30 block mt-0.5">
                              Authorized via {move.entry_method.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] text-white/40 font-mono">
                          {new Date(move.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
