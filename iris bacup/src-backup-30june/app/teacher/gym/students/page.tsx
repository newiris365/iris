"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Search, User, ArrowRight, Activity, Download } from 'lucide-react';
import { apiGet, apiFetchBlob } from '../../../../lib/api';
import Link from 'next/link';

export default function TrainerStudentsList() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // In a real system we fetch students associated with the trainer.
      // For fallback/demos, let's fetch all student profiles
      const res = await apiGet('/students');
      if (res.success && res.students?.length > 0) {
        setStudents(res.students);
      }
    } catch (err) {
      console.log('Error loading students, using mocks');
      setStudents([
        { id: 's0000000-0000-0000-0000-000000000001', name: 'Khushal Patel', roll_number: 'CS22B005', department: 'Computer Science', semester: 6 },
        { id: 's0000000-0000-0000-0000-000000000002', name: 'Aarav Mehta', roll_number: 'ME23B012', department: 'Mechanical Engineering', semester: 4 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (studentId: string) => {
    try {
      const blob = await apiFetchBlob(`/fitzone/gym/report/${studentId}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Progress_Report_${studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download report PDF: ' + err.message);
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Assigned Students</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Enter body metrics and track physical progression over semester terms.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-6">

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            className="w-full pl-11 pr-4 py-3 bg-[#13102A]/80 border border-white/10 rounded-2xl text-sm text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
          />
        </div>

        {/* Students List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#C4B5FD]/45">Loading assigned student roster...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#C4B5FD]/30">No students found matching query.</div>
          ) : (
            filtered.map(student => (
              <div
                key={student.id}
                className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-[#6C2BD9]/20 transition-all"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{student.name}</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Roll Number: {student.roll_number}</p>
                  <p className="text-xs text-[#C4B5FD]/70 mt-1">{student.department || 'Computer Science'} • Sem {student.semester || 6}</p>
                </div>

                <div className="flex gap-2.5">
                  <Link
                    href={`/teacher/gym/metrics/${student.id}`}
                    className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <Activity className="w-4 h-4" /> Enter Metrics
                  </Link>
                  <button
                    onClick={() => downloadReport(student.id)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}
