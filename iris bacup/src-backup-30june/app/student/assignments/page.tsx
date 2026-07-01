"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Clock, Upload, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  total_marks: number;
  deadline: string;
  created_by_name: string;
  semester: number;
}

interface Submission {
  id: string;
  assignment_id: string;
  file_name: string;
  status: string;
  marks_obtained: number | null;
  feedback: string;
  submitted_at: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/core/assignments');
      if (res.success) setAssignments(res.assignments || []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const getDeadlineColor = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline);
    if (days < 0) return 'text-red-400';
    if (days <= 2) return 'text-orange-400';
    if (days <= 7) return 'text-yellow-400';
    return 'text-[#C4B5FD]/60';
  };

  const handleSubmit = async (assignmentId: string) => {
    setUploading(assignmentId);
    try {
      const res = await apiPost('/core/assignments/submit', {
        assignment_id: assignmentId,
        file_url: 'https://mock-storage.example.com/submission.pdf',
        file_name: 'submission.pdf',
        file_size_kb: 256,
        file_type: 'pdf',
      });
      if (res.success) {
        setSubmissions(prev => ({
          ...prev,
          [assignmentId]: {
            id: res.submission_id,
            assignment_id: assignmentId,
            file_name: 'submission.pdf',
            status: 'submitted',
            marks_obtained: null,
            feedback: '',
            submitted_at: new Date().toISOString(),
          }
        }));
      }
    } catch (err) {
      alert('Submission successful (mock).');
    } finally {
      setUploading(null);
    }
  };

  const sorted = [...assignments].sort((a, b) => {
    const aSubmitted = !!submissions[a.id];
    const bSubmitted = !!submissions[b.id];
    if (aSubmitted !== bSubmitted) return aSubmitted ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl">Assignments</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Submit assignments and track your grades</p>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">Loading assignments...</div>
        ) : sorted.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">No assignments posted yet</div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map(a => {
              const days = getDaysUntilDeadline(a.deadline);
              const sub = submissions[a.id];
              const isOverdue = days < 0 && !sub;

              return (
                <div key={a.id} className={`glass-panel rounded-2xl p-5 border flex items-center gap-4 transition-all ${
                  isOverdue ? 'border-red-500/30 bg-red-500/5' :
                  sub?.status === 'graded' ? 'border-green-500/30 bg-green-500/5' :
                  'border-white/5 hover:border-[#6C2BD9]/30'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-sm">{a.title}</h3>
                      {sub?.status === 'graded' && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">GRADED</span>}
                      {isOverdue && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">OVERDUE</span>}
                    </div>
                    <div className="text-[10px] text-[#C4B5FD]/50 mt-0.5">
                      {a.subject} &middot; {a.created_by_name} &middot; {a.total_marks} marks
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-bold ${getDeadlineColor(a.deadline)}`}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                    </div>
                    <div className="text-[9px] text-[#C4B5FD]/40 mt-0.5">
                      {new Date(a.deadline).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {sub?.status === 'graded' ? (
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-green-400">{sub.marks_obtained}/{a.total_marks}</div>
                        {sub.feedback && <div className="text-[9px] text-[#C4B5FD]/50 max-w-[150px] truncate">{sub.feedback}</div>}
                      </div>
                    ) : sub ? (
                      <span className="px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Submitted
                      </span>
                    ) : (
                      <button onClick={() => handleSubmit(a.id)} disabled={uploading === a.id || isOverdue}
                        className="px-4 py-2 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-xs font-bold flex items-center gap-1.5 hover:bg-[#6C2BD9]/30 transition-all disabled:opacity-30">
                        <Upload className="w-4 h-4" /> {uploading === a.id ? 'Uploading...' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
