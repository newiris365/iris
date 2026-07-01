"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardList, Check, X, Download, Loader2, Ticket, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';

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
  status: string;
  enrolled_at: string;
  exams: { name: string; start_date: string; end_date: string; type: string };
}

interface HallTicket {
  id: string;
  exam_id: string;
  ticket_number: string;
  room_number: string;
  seat_number: string;
  exam_date: string;
  exam_shift: string;
  qr_token: string;
  issued_at: string;
  exams: { name: string; start_date: string; end_date: string; type: string };
}

export default function StudentExamEnrollmentPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [hallTickets, setHallTickets] = useState<HallTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('available');
  const [selectedTicket, setSelectedTicket] = useState<HallTicket | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [examsRes, enrollmentsRes, ticketsRes] = await Promise.all([
      apiGet('campusCore/exams'),
      apiGet('campusCore/exams/my-enrollments'),
      apiGet('campusCore/hall-tickets/my'),
    ]);
    if (examsRes.success) setExams(examsRes.exams || []);
    if (enrollmentsRes.success) setEnrollments(enrollmentsRes.enrollments || []);
    if (ticketsRes.success) setHallTickets(ticketsRes.tickets || []);
    setLoading(false);
  };

  const handleEnroll = async (examId: string) => {
    setEnrollingId(examId);
    const res = await apiPost(`campusCore/exams/${examId}/enroll`, { exam_id: examId });
    if (res.success) {
      await fetchData();
    } else {
      alert(res.error || 'Failed to enroll.');
    }
    setEnrollingId(null);
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to cancel this enrollment?')) return;
    const res = await apiDelete(`campusCore/exams/enrollment/${enrollmentId}`);
    if (res.success) {
      await fetchData();
    } else {
      alert(res.error || 'Failed to cancel enrollment.');
    }
  };

  const handleDownloadTicket = (ticketId: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    const token = localStorage.getItem('iris_jwt_token');
    window.open(`${API_BASE}/campusCore/hall-tickets/${ticketId}/pdf?token=${token}`, '_blank');
  };

  const enrolledExamIds = new Set(enrollments.filter(e => e.status === 'enrolled').map(e => e.exam_id));
  const availableExams = exams.filter(e => !enrolledExamIds.has(e.id));
  const enrolledExams = enrollments.filter(e => e.status === 'enrolled');

  const getTicketForExam = (examId: string) => hallTickets.find(t => t.exam_id === examId);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Exam Enrollment</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Enroll in examinations and download your hall tickets</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white'
                : 'bg-white/5 border border-white/10 text-[#C4B5FD]/70 hover:bg-white/10'
            }`}
          >
            Available Exams ({availableExams.length})
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'enrolled'
                ? 'bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white'
                : 'bg-white/5 border border-white/10 text-[#C4B5FD]/70 hover:bg-white/10'
            }`}
          >
            My Enrollments ({enrolledExams.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#C4B5FD]/70 text-xs py-16 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading exams...
          </div>
        ) : activeTab === 'available' ? (
          /* Available Exams */
          availableExams.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 border border-white/5 text-center">
              <ClipboardList className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
              <p className="text-sm text-[#C4B5FD]/50">No new exams available for enrollment.</p>
              <p className="text-[10px] text-[#C4B5FD]/30 mt-1">You are enrolled in all available exams.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableExams.map(exam => (
                <div key={exam.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-3 hover:border-[#6C2BD9]/40 transition-all">
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded font-bold uppercase">
                      {exam.type}
                    </span>
                    {exam.departments?.name && (
                      <span className="text-[9px] text-[#C4B5FD]/40">{exam.departments.name}</span>
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-base text-white">{exam.name}</h4>
                  <div className="flex items-center gap-4 text-[10px] text-[#C4B5FD]/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(exam.start_date).toLocaleDateString('en-IN')} — {new Date(exam.end_date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEnroll(exam.id)}
                    disabled={enrollingId === exam.id}
                    className="w-full mt-auto py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {enrollingId === exam.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {enrollingId === exam.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Enrolled Exams */
          enrolledExams.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 border border-white/5 text-center">
              <ClipboardList className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
              <p className="text-sm text-[#C4B5FD]/50">You have not enrolled in any exams yet.</p>
              <button
                onClick={() => setActiveTab('available')}
                className="mt-3 text-xs text-[#A78BFA] hover:text-white underline underline-offset-2"
              >
                Browse available exams
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {enrolledExams.map(enr => {
                const ticket = getTicketForExam(enr.exam_id);
                return (
                  <div key={enr.id} className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-[#6C2BD9]/40 transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded font-bold uppercase">
                            {enr.exams?.type}
                          </span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/30">
                            Enrolled
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-base text-white">{enr.exams?.name}</h4>
                        <div className="flex items-center gap-4 text-[10px] text-[#C4B5FD]/50 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(enr.exams?.start_date).toLocaleDateString('en-IN')} — {new Date(enr.exams?.end_date).toLocaleDateString('en-IN')}
                          </span>
                          <span>Enrolled: {new Date(enr.enrolled_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket ? (
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-4 py-2 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-xs font-bold flex items-center gap-1.5 hover:bg-[#6C2BD9]/30 transition-all"
                          >
                            <Ticket className="w-3.5 h-3.5" /> Hall Ticket
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#C4B5FD]/40 italic">Ticket not yet generated</span>
                        )}
                        <button
                          onClick={() => handleCancelEnrollment(enr.id)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-all"
                          title="Cancel enrollment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Hall Ticket Preview Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-0 shadow-2xl relative overflow-hidden">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] p-6 text-center">
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Institution of Higher Education</p>
                <h2 className="font-heading font-extrabold text-xl text-white mt-1">HALL TICKET / ADMIT CARD</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Ticket Number */}
                <div className="text-center">
                  <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-bold">Ticket No</span>
                  <p className="font-mono font-bold text-[#A78BFA] text-lg">{selectedTicket.ticket_number}</p>
                </div>

                {/* Exam Details */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Examination</p>
                  <p className="text-sm font-bold text-white">{selectedTicket.exams?.name}</p>
                  <div className="flex gap-4 text-[10px] text-[#C4B5FD]/50">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedTicket.exam_date ? new Date(selectedTicket.exam_date).toLocaleDateString('en-IN') : 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedTicket.exam_shift}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedTicket.room_number}, Seat {selectedTicket.seat_number}</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold mb-2">Instructions</p>
                  <ul className="text-[10px] text-[#C4B5FD]/50 space-y-1">
                    <li>• Carry a valid photo ID along with this ticket</li>
                    <li>• Arrive 30 minutes before the scheduled time</li>
                    <li>• Electronic devices are strictly prohibited</li>
                    <li>• Follow all invigilator instructions</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD]/70 text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownloadTicket(selectedTicket.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
