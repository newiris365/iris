"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardList, Users, Download, Loader2, Check, AlertCircle, Ticket, Search } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface Exam {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: string;
  departments?: { name: string };
}

interface Enrollment {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  enrolled_at: string;
  student_name: string;
  roll_number: string;
  student_email: string;
}

interface HallTicket {
  id: string;
  ticket_number: string;
  qr_token: string;
  room_number: string;
  seat_number: string;
  exam_date: string;
  exam_shift: string;
  issued_at: string;
  student_name?: string;
  roll_number?: string;
}

export default function AdminExamEnrollmentPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [hallTickets, setHallTickets] = useState<HallTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const res = await apiGet('campusCore/exams');
      if (res.success) setExams(res.exams || []);
      setLoading(false);
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setEnrollments([]);
      setHallTickets([]);
      return;
    }
    const fetchData = async () => {
      setEnrollmentsLoading(true);
      const [enrollRes, ticketsRes] = await Promise.all([
        apiGet(`campusCore/exams/${selectedExam}/enrollments`),
        apiGet('campusCore/hall-tickets/my'),
      ]);
      if (enrollRes.success) setEnrollments(enrollRes.enrollments || []);
      if (ticketsRes.success) setHallTickets(ticketsRes.tickets || []);
      setEnrollmentsLoading(false);
    };
    fetchData();
  }, [selectedExam]);

  const handleGenerateTickets = async () => {
    if (!selectedExam) return;
    setGenerating(true);
    const res = await apiPost('campusCore/hall-tickets/generate', { exam_id: selectedExam });
    if (res.success) {
      alert(res.message || 'Hall tickets generated successfully!');
      const ticketsRes = await apiGet('campusCore/hall-tickets/my');
      if (ticketsRes.success) setHallTickets(ticketsRes.tickets || []);
    } else {
      alert(res.error || 'Failed to generate hall tickets.');
    }
    setGenerating(false);
  };

  const filteredEnrollments = enrollments.filter(e =>
    e.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedExamData = exams.find(e => e.id === selectedExam);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Exam Enrollment</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Manage student enrollments and generate hall tickets</p>
            </div>
          </div>
        </div>

        {/* Exam Selector */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-heading font-bold text-sm text-white mb-4">Select Exam</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-[#C4B5FD]/70 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading exams...
            </div>
          ) : (
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
            >
              <option value="">-- Choose an exam --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.type}) — {new Date(ex.start_date).toLocaleDateString('en-IN')}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedExam && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-bold">Total Enrolled</p>
                <p className="font-heading font-extrabold text-3xl text-white mt-2">{enrollments.length}</p>
                <p className="text-[10px] text-[#C4B5FD]/40 mt-1">{selectedExamData?.name}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-bold">Active Enrollments</p>
                <p className="font-heading font-extrabold text-3xl text-emerald-400 mt-2">
                  {enrollments.filter(e => e.status === 'enrolled').length}
                </p>
                <p className="text-[10px] text-[#C4B5FD]/40 mt-1">Currently enrolled students</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-bold">Hall Tickets</p>
                <p className="font-heading font-extrabold text-3xl text-[#A78BFA] mt-2">
                  {hallTickets.length}
                </p>
                <p className="text-[10px] text-[#C4B5FD]/40 mt-1">Tickets generated</p>
              </div>
            </div>

            {/* Generate Hall Tickets */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-sm text-white">Hall Ticket Generation</h3>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                  Generate hall tickets for all enrolled students. Seating will be auto-assigned from exam seating data.
                </p>
              </div>
              <button
                onClick={handleGenerateTickets}
                disabled={generating || enrollments.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Generate Hall Tickets'}
              </button>
            </div>

            {/* Enrollments Table */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <h3 className="font-heading font-bold text-sm text-white">
                  Enrolled Students ({filteredEnrollments.length})
                </h3>
                <div className="flex items-center gap-2 bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-[#C4B5FD]/50" />
                  <input
                    type="text"
                    placeholder="Search by name or roll..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-48 placeholder:text-[#C4B5FD]/30"
                  />
                </div>
              </div>

              {enrollmentsLoading ? (
                <div className="flex items-center gap-2 text-[#C4B5FD]/70 text-xs py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading enrollments...
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-[#C4B5FD]/20 mx-auto mb-3" />
                  <p className="text-xs text-[#C4B5FD]/40">
                    {enrollments.length === 0 ? 'No enrollments yet for this exam.' : 'No matching students found.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[#C4B5FD] font-semibold border-b border-white/5">
                        <th className="p-3">Roll Number</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Enrolled At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredEnrollments.map((enr) => (
                        <tr key={enr.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono font-bold text-white">{enr.roll_number}</td>
                          <td className="p-3 text-white">{enr.student_name}</td>
                          <td className="p-3 text-[#C4B5FD]/60">{enr.student_email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              enr.status === 'enrolled'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {enr.status}
                            </span>
                          </td>
                          <td className="p-3 text-[#C4B5FD]/50">
                            {new Date(enr.enrolled_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Hall Tickets List */}
            {hallTickets.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h3 className="font-heading font-bold text-sm text-white mb-5">
                  Generated Hall Tickets ({hallTickets.length})
                </h3>
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[#C4B5FD] font-semibold border-b border-white/5">
                        <th className="p-3">Ticket No</th>
                        <th className="p-3">Student</th>
                        <th className="p-3">Room</th>
                        <th className="p-3">Seat</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Shift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {hallTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono font-bold text-[#A78BFA]">{ticket.ticket_number}</td>
                          <td className="p-3 text-white">{ticket.student_name || 'N/A'}</td>
                          <td className="p-3 text-white">{ticket.room_number}</td>
                          <td className="p-3 text-white">{ticket.seat_number}</td>
                          <td className="p-3 text-[#C4B5FD]/50">
                            {ticket.exam_date ? new Date(ticket.exam_date).toLocaleDateString('en-IN') : 'TBD'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 text-[#A78BFA] text-[10px] font-bold">
                              {ticket.exam_shift}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
