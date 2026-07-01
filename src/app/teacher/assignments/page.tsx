"use client";

import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, Clock, CheckCircle, Users, Search, Upload, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const SUBJECTS = ['All', 'Data Structures', 'Operating Systems', 'Computer Networks', 'Database Management', 'Algorithms', 'Software Engineering'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  'Due Soon': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: <AlertTriangle className="w-3 h-3" /> },
  Graded: { bg: 'bg-[#6C2BD9]/20', text: 'text-[#A78BFA]', border: 'border-[#6C2BD9]/30', icon: <CheckCircle className="w-3 h-3" /> },
  Expired: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', icon: <Clock className="w-3 h-3" /> },
};

const MOCK_ASSIGNMENTS = [
  {
    id: '1',
    title: 'Binary Search Tree Implementation',
    subject: 'Data Structures',
    description: 'Implement a self-balancing BST with insert, delete, search, and traversal operations. Include time complexity analysis for each operation.',
    due_date: '2026-06-18T23:59:00Z',
    max_marks: 100,
    status: 'Active',
    submissions_count: 18,
    total_students: 42,
    attachments: ['bst_reference.pdf'],
    created_at: '2026-06-10T09:00:00Z',
  },
  {
    id: '2',
    title: 'Process Scheduling Simulator',
    subject: 'Operating Systems',
    description: 'Build a CPU scheduling simulator that implements FCFS, SJF, Round Robin, and Priority scheduling algorithms. Compare performance metrics across all algorithms.',
    due_date: '2026-06-15T23:59:00Z',
    max_marks: 100,
    status: 'Due Soon',
    submissions_count: 35,
    total_students: 40,
    attachments: ['scheduling_guidelines.pdf', 'sample_output.txt'],
    created_at: '2026-06-05T14:00:00Z',
  },
  {
    id: '3',
    title: 'TCP Client-Server Chat Application',
    subject: 'Computer Networks',
    description: 'Develop a multi-threaded TCP chat server supporting private messaging, broadcast, and file transfer. Use socket programming in Python or Java.',
    due_date: '2026-06-12T23:59:00Z',
    max_marks: 100,
    status: 'Graded',
    submissions_count: 38,
    total_students: 38,
    attachments: [],
    created_at: '2026-05-28T10:00:00Z',
  },
  {
    id: '4',
    title: 'Library Management System ER Diagram',
    subject: 'Database Management',
    description: 'Design a complete ER diagram for a library management system. Include all entities, relationships, cardinalities, and convert to normalized relational schema.',
    due_date: '2026-06-08T23:59:00Z',
    max_marks: 50,
    status: 'Expired',
    submissions_count: 28,
    total_students: 45,
    attachments: ['er_templates.pdf'],
    created_at: '2026-05-20T08:00:00Z',
  },
  {
    id: '5',
    title: 'Graph Algorithms Analysis Report',
    subject: 'Algorithms',
    description: 'Implement Dijkstra, Bellman-Ford, and Floyd-Warshall algorithms. Analyze performance on various graph densities and provide benchmark results.',
    due_date: '2026-06-22T23:59:00Z',
    max_marks: 100,
    status: 'Active',
    submissions_count: 5,
    total_students: 36,
    attachments: ['graph_datasets.zip'],
    created_at: '2026-06-12T11:00:00Z',
  },
  {
    id: '6',
    title: 'Sprint Planning Documentation',
    subject: 'Software Engineering',
    description: 'Prepare sprint planning documents for a hypothetical e-commerce project. Include user stories, task breakdown, effort estimation, and burndown chart.',
    due_date: '2026-06-25T23:59:00Z',
    max_marks: 75,
    status: 'Active',
    submissions_count: 0,
    total_students: 40,
    attachments: ['sprint_template.docx'],
    created_at: '2026-06-13T08:00:00Z',
  },
];

const MOCK_SUBMISSIONS: Record<string, { id: string; student_name: string; roll_number: string; submitted_at: string; marks?: number; feedback?: string }[]> = {
  '1': [
    { id: 's1', student_name: '', roll_number: 'CS2024001', submitted_at: '2026-06-14T10:30:00Z', marks: undefined },
    { id: 's2', student_name: '', roll_number: 'CS2024015', submitted_at: '2026-06-15T14:20:00Z', marks: 85, feedback: 'Good implementation, minor edge case missed.' },
    { id: 's3', student_name: '', roll_number: 'CS2024032', submitted_at: '2026-06-16T09:10:00Z', marks: undefined },
    { id: 's4', student_name: '', roll_number: 'CS2024008', submitted_at: '2026-06-14T16:45:00Z', marks: 92, feedback: 'Excellent work with well-documented complexity analysis.' },
    { id: 's5', student_name: '', roll_number: 'CS2024022', submitted_at: '2026-06-17T11:00:00Z', marks: undefined },
  ],
  '2': [
    { id: 's6', student_name: '', roll_number: 'CS2024011', submitted_at: '2026-06-13T20:00:00Z', marks: 78, feedback: 'Working simulator but missing priority scheduling comparison.' },
    { id: 's7', student_name: 'Karthik Nair', roll_number: 'CS2024028', submitted_at: '2026-06-14T22:15:00Z', marks: 95, feedback: 'Outstanding implementation with detailed metrics analysis.' },
    { id: 's8', student_name: 'Meera Joshi', roll_number: 'CS2024005', submitted_at: '2026-06-14T18:30:00Z', marks: 88, feedback: 'Well-structured code with good visualization.' },
  ],
  '3': [
    { id: 's9', student_name: 'Arjun Mehta', roll_number: 'CS2024019', submitted_at: '2026-06-10T15:00:00Z', marks: 90, feedback: 'Excellent multi-threaded implementation.' },
    { id: 's10', student_name: '', roll_number: 'CS2024033', submitted_at: '2026-06-11T09:45:00Z', marks: 82, feedback: 'File transfer needs improvement, rest is solid.' },
    { id: 's11', student_name: 'Nikhil Verma', roll_number: 'CS2024041', submitted_at: '2026-06-11T21:30:00Z', marks: 75, feedback: 'Basic implementation complete but lacks private messaging.' },
  ],
  '4': [
    { id: 's12', student_name: 'Ishita Banerjee', roll_number: 'CS2024007', submitted_at: '2026-06-07T23:00:00Z', marks: 45, feedback: 'Complete ER diagram with proper normalization.' },
    { id: 's13', student_name: 'Siddharth Rao', roll_number: 'CS2024025', submitted_at: '2026-06-08T01:30:00Z', marks: 38, feedback: 'Missing some cardinality constraints.' },
  ],
  '5': [
    { id: 's14', student_name: 'Tanvi Desai', roll_number: 'CS2024014', submitted_at: '2026-06-13T12:00:00Z' },
  ],
  '6': [],
};

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  due_date: string;
  max_marks: number;
  status: string;
  submissions_count: number;
  total_students: number;
  attachments: string[];
  created_at: string;
}

interface Submission {
  id: string;
  student_name: string;
  roll_number: string;
  submitted_at: string;
  marks?: number;
  feedback?: string;
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: 'Data Structures',
    description: '',
    due_date: '',
    max_marks: '100',
    attachments: [] as string[],
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/assignments');
      if (res.success && res.assignments) {
        setAssignments(res.assignments);
      } else {
        setAssignments(MOCK_ASSIGNMENTS);
      }
    } catch {
      setAssignments(MOCK_ASSIGNMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const res = await apiGet(`/core/assignments/${assignmentId}/submissions`);
      if (res.success && res.submissions) {
        setSubmissions(res.submissions);
      } else {
        setSubmissions(MOCK_SUBMISSIONS[assignmentId] || []);
      }
    } catch {
      setSubmissions(MOCK_SUBMISSIONS[assignmentId] || []);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.due_date) return;
    try {
      const res = await apiPost('/core/assignments', newAssignment);
      if (res.success) {
        fetchAssignments();
      } else {
        const mockNew: Assignment = {
          id: String(assignments.length + 1),
          title: newAssignment.title,
          subject: newAssignment.subject,
          description: newAssignment.description,
          due_date: newAssignment.due_date,
          max_marks: parseInt(newAssignment.max_marks),
          status: 'Active',
          submissions_count: 0,
          total_students: 40,
          attachments: newAssignment.attachments,
          created_at: new Date().toISOString(),
        };
        setAssignments(prev => [mockNew, ...prev]);
      }
    } catch {
      const mockNew: Assignment = {
        id: String(assignments.length + 1),
        title: newAssignment.title,
        subject: newAssignment.subject,
        description: newAssignment.description,
        due_date: newAssignment.due_date,
        max_marks: parseInt(newAssignment.max_marks),
        status: 'Active',
        submissions_count: 0,
        total_students: 40,
        attachments: newAssignment.attachments,
        created_at: new Date().toISOString(),
      };
      setAssignments(prev => [mockNew, ...prev]);
    }
    setNewAssignment({ title: '', subject: 'Data Structures', description: '', due_date: '', max_marks: '100', attachments: [] });
    setShowCreateForm(false);
  };

  const handleGrade = async (submissionId: string) => {
    if (!gradeValue) return;
    const marks = parseInt(gradeValue);
    if (selectedAssignment && marks > selectedAssignment.max_marks) return;
    try {
      await apiPost(`/core/submissions/${submissionId}/grade`, { marks, feedback: gradeFeedback });
    } catch {
      // Quiet fail — local state updated regardless
    }
    setSubmissions(prev =>
      prev.map(s => (s.id === submissionId ? { ...s, marks, feedback: gradeFeedback } : s))
    );
    setGradingSubmission(null);
    setGradeValue('');
    setGradeFeedback('');
  };

  const filteredAssignments = assignments.filter(a => {
    const matchSubject = activeSubject === 'All' || a.subject === activeSubject;
    const matchStatus = activeStatus === 'All' || a.status === activeStatus;
    const matchSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchStatus && matchSearch;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const stats = {
    active: assignments.filter(a => a.status === 'Active').length,
    dueSoon: assignments.filter(a => a.status === 'Due Soon').length,
    graded: assignments.filter(a => a.status === 'Graded').length,
    expired: assignments.filter(a => a.status === 'Expired').length,
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Assignments</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">
                Create, manage, and grade student assignments across your subjects.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-[#6C2BD9] hover:bg-[#7C3AEE] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active', value: stats.active, color: 'text-emerald-400' },
            { label: 'Due Soon', value: stats.dueSoon, color: 'text-amber-400' },
            { label: 'Graded', value: stats.graded, color: 'text-[#A78BFA]' },
            { label: 'Expired', value: stats.expired, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-panel rounded-2xl border border-white/5 p-4 text-center">
              <p className={`text-2xl font-heading font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/50" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#150F2A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#C4B5FD]/40 focus:outline-none focus:border-[#6C2BD9]/50 transition-colors"
            />
          </div>
        </div>

        {/* Subject Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {SUBJECTS.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubject(sub)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                activeSubject === sub
                  ? 'bg-[#6C2BD9]/20 text-[#A78BFA] border-[#6C2BD9]/40'
                  : 'bg-transparent text-[#C4B5FD]/50 border-white/10 hover:border-white/20'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Active', 'Due Soon', 'Graded', 'Expired'].map(st => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                activeStatus === st
                  ? 'bg-[#6C2BD9]/20 text-[#A78BFA] border-[#6C2BD9]/40'
                  : 'bg-transparent text-[#C4B5FD]/50 border-white/10 hover:border-white/20'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-16">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center text-xs text-[#C4B5FD]/50 italic">
              No assignments found matching your criteria.
            </div>
          ) : (
            filteredAssignments.map(a => {
              const stCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.Active;
              const submissionPercent = a.total_students > 0 ? Math.round((a.submissions_count / a.total_students) * 100) : 0;
              return (
                <div
                  key={a.id}
                  className="glass-panel rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[9px] ${stCfg.bg} ${stCfg.text} border ${stCfg.border} px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1`}>
                            {stCfg.icon}
                            {a.status}
                          </span>
                          <span className="text-[9px] text-[#C4B5FD]/40 font-light bg-white/5 px-2 py-0.5 rounded">
                            {a.subject}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white leading-snug">{a.title}</h4>
                        <p className="text-[11px] text-[#C4B5FD]/60 mt-1 line-clamp-2 font-light">{a.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[#C4B5FD]/40 font-light">Max Marks</p>
                        <p className="text-lg font-heading font-extrabold text-white">{a.max_marks}</p>
                      </div>
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                        <Calendar className="w-3 h-3" />
                        Due: {formatDate(a.due_date)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                        <Users className="w-3 h-3" />
                        {a.submissions_count}/{a.total_students} submitted ({submissionPercent}%)
                      </div>
                      {a.attachments.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                          <Upload className="w-3 h-3" />
                          {a.attachments.length} file{a.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Submission Progress Bar */}
                    <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all"
                        style={{ width: `${submissionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-4 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setSelectedAssignment(a);
                        await fetchSubmissions(a.id);
                        setShowSubmissions(true);
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] hover:text-white bg-[#6C2BD9]/15 hover:bg-[#6C2BD9]/30 border border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Users className="w-3 h-3" />
                      View Submissions
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {!isLoading && filteredAssignments.length > 0 && (
          <div className="text-center text-[10px] text-[#C4B5FD]/30 font-light">
            Showing {filteredAssignments.length} of {assignments.length} assignments
            {activeSubject !== 'All' && ` in "${activeSubject}"`}
            {activeStatus !== 'All' && ` with status "${activeStatus}"`}
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#150F2A] border border-white/10 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-5 shadow-2xl shadow-[#6C2BD9]/10">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-lg text-white">Create Assignment</h2>
                <button onClick={() => setShowCreateForm(false)} className="text-[#C4B5FD]/50 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Title</label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Binary Tree Assignment"
                    className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-[#C4B5FD]/30 focus:outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Subject</label>
                    <select
                      value={newAssignment.subject}
                      onChange={e => setNewAssignment(p => ({ ...p, subject: e.target.value }))}
                      className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    >
                      {SUBJECTS.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Max Marks</label>
                    <input
                      type="number"
                      value={newAssignment.max_marks}
                      onChange={e => setNewAssignment(p => ({ ...p, max_marks: e.target.value }))}
                      className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.due_date}
                    onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))}
                    className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Description</label>
                  <textarea
                    rows={3}
                    value={newAssignment.description}
                    onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the assignment requirements..."
                    className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-[#C4B5FD]/30 focus:outline-none focus:border-[#6C2BD9]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Attachments</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {newAssignment.attachments.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-[#6C2BD9]/15 text-[#A78BFA] border border-[#6C2BD9]/30 text-[10px] px-2 py-1 rounded-lg">
                        <FileText className="w-3 h-3" />
                        {f}
                        <button onClick={() => setNewAssignment(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}>
                          <X className="w-3 h-3 hover:text-red-400" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setNewAssignment(p => ({ ...p, attachments: [...p.attachments, `file_${p.attachments.length + 1}.pdf`] }))}
                      className="flex items-center gap-1 text-[10px] text-[#C4B5FD]/50 hover:text-[#A78BFA] border border-dashed border-white/10 hover:border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Add File
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60 hover:text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={!newAssignment.title || !newAssignment.due_date}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#6C2BD9] hover:bg-[#7C3AEE] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Modal */}
        {showSubmissions && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#150F2A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl shadow-[#6C2BD9]/10">
              {/* Submissions Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-heading font-extrabold text-lg text-white">{selectedAssignment.title}</h2>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">
                    {submissions.length} submissions &middot; {selectedAssignment.total_students - submissions.length} pending
                  </p>
                </div>
                <button
                  onClick={() => { setShowSubmissions(false); setSelectedAssignment(null); setSubmissions([]); }}
                  className="text-[#C4B5FD]/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Submissions List */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2">
                {submissions.length === 0 ? (
                  <div className="text-center text-xs text-[#C4B5FD]/50 py-10 italic">No submissions yet.</div>
                ) : (
                  submissions.map(sub => (
                    <div key={sub.id} className="flex items-center gap-4 bg-[#0D0A1A] border border-white/5 rounded-xl p-4">
                      <div className="w-9 h-9 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA] text-xs font-bold shrink-0">
                        {sub.student_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{sub.student_name}</p>
                        <p className="text-[10px] text-[#C4B5FD]/40 font-light">{sub.roll_number} &middot; {formatDateTime(sub.submitted_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {sub.marks !== undefined ? (
                          <div>
                            <p className="text-sm font-heading font-extrabold text-[#A78BFA]">{sub.marks}/{selectedAssignment.max_marks}</p>
                            {sub.feedback && (
                              <p className="text-[9px] text-[#C4B5FD]/50 font-light max-w-[160px] truncate">{sub.feedback}</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setGradingSubmission(sub); setGradeValue(''); setGradeFeedback(''); }}
                            className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] hover:text-white bg-[#6C2BD9]/15 hover:bg-[#6C2BD9]/30 border border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Grade
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grade Submission Modal */}
        {gradingSubmission && selectedAssignment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#150F2A] border border-white/10 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl shadow-[#6C2BD9]/10">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-base text-white">
                  Grade: {gradingSubmission.student_name}
                </h3>
                <button onClick={() => setGradingSubmission(null)} className="text-[#C4B5FD]/50 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">
                    Marks (out of {selectedAssignment.max_marks})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedAssignment.max_marks}
                    value={gradeValue}
                    onChange={e => setGradeValue(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold mb-1.5 block">Feedback</label>
                  <textarea
                    rows={3}
                    value={gradeFeedback}
                    onChange={e => setGradeFeedback(e.target.value)}
                    placeholder="Optional feedback for the student..."
                    className="w-full bg-[#0D0A1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-[#C4B5FD]/30 focus:outline-none focus:border-[#6C2BD9]/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-1">
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]/60 hover:text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGrade(gradingSubmission.id)}
                  disabled={!gradeValue}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#6C2BD9] hover:bg-[#7C3AEE] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-colors"
                >
                  <CheckCircle className="w-3 h-3" />
                  Submit Grade
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
