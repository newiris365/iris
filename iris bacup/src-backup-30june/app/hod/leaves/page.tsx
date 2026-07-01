"use client";
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Filter, Calendar, User, FileText, AlertTriangle, ChevronDown, MessageSquare } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface LeaveApplication {
  id: string;
  applicantName: string;
  applicantRole: 'faculty' | 'student';
  department: string;
  leaveType: 'Medical' | 'OD' | 'Personal' | 'Emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks: string;
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
}

const mockLeaves: LeaveApplication[] = [
  {
    id: 'LV-001',
    applicantName: 'Dr. Ananya Sharma',
    applicantRole: 'faculty',
    department: 'Computer Science',
    leaveType: 'Medical',
    startDate: '2026-06-14',
    endDate: '2026-06-16',
    reason: 'Scheduled surgery and recovery period. Medical certificate attached.',
    status: 'Pending',
    remarks: '',
    appliedOn: '2026-06-12',
  },
  {
    id: 'LV-002',
    applicantName: 'Rohan Mehta',
    applicantRole: 'student',
    department: 'Computer Science',
    leaveType: 'OD',
    startDate: '2026-06-15',
    endDate: '2026-06-15',
    reason: 'Attending national-level hackathon at IIT Bombay as part of college team.',
    status: 'Pending',
    remarks: '',
    appliedOn: '2026-06-11',
  },
  {
    id: 'LV-003',
    applicantName: 'Prof. Suresh Iyer',
    applicantRole: 'faculty',
    department: 'Computer Science',
    leaveType: 'Personal',
    startDate: '2026-06-18',
    endDate: '2026-06-20',
    reason: 'Family function out of state. Prior workload adjustments planned.',
    status: 'Pending',
    remarks: '',
    appliedOn: '2026-06-10',
  },
  {
    id: 'LV-004',
    applicantName: 'Priya Nair',
    applicantRole: 'student',
    department: 'Computer Science',
    leaveType: 'Emergency',
    startDate: '2026-06-13',
    endDate: '2026-06-14',
    reason: 'Family medical emergency. Need to travel home immediately.',
    status: 'Pending',
    remarks: '',
    appliedOn: '2026-06-13',
  },
  {
    id: 'LV-005',
    applicantName: 'Dr. Kavitha Reddy',
    applicantRole: 'faculty',
    department: 'Computer Science',
    leaveType: 'Medical',
    startDate: '2026-06-05',
    endDate: '2026-06-07',
    reason: 'Severe flu and high fever. Doctor prescribed rest for 3 days.',
    status: 'Approved',
    remarks: 'Approved. Take care and recover well.',
    appliedOn: '2026-06-04',
    reviewedBy: 'HOD',
    reviewedOn: '2026-06-04',
  },
  {
    id: 'LV-006',
    applicantName: 'Arjun Verma',
    applicantRole: 'student',
    department: 'Computer Science',
    leaveType: 'OD',
    startDate: '2026-06-02',
    endDate: '2026-06-03',
    reason: 'Industry visit to Infosys campus for project research.',
    status: 'Approved',
    remarks: 'Approved. Submit visit report upon return.',
    appliedOn: '2026-06-01',
    reviewedBy: 'HOD',
    reviewedOn: '2026-06-01',
  },
  {
    id: 'LV-007',
    applicantName: 'Deepak Joshi',
    applicantRole: 'student',
    department: 'Computer Science',
    leaveType: 'Personal',
    startDate: '2026-05-28',
    endDate: '2026-05-30',
    reason: 'Personal vacation with family.',
    status: 'Rejected',
    remarks: 'Rejected. Semester exams start next week. Plan leave post-exams.',
    appliedOn: '2026-05-25',
    reviewedBy: 'HOD',
    reviewedOn: '2026-05-26',
  },
];

export default function LeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>(mockLeaves);
  const [activeTab, setActiveTab] = useState<'faculty' | 'student'>('faculty');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/core/leaves/department');
      if (response && Array.isArray(response)) {
        setLeaves(response);
      }
    } catch {
      setLeaves(mockLeaves);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    const remark = remarkInputs[leaveId] || 'Approved by HOD';
    try {
      await apiPost(`/core/leaves/${leaveId}/approve`, { remarks: remark });
    } catch {
      // fallback to local state
    }
    setLeaves(prev =>
      prev.map(l =>
        l.id === leaveId
          ? { ...l, status: 'Approved' as const, remarks: remark, reviewedBy: 'HOD', reviewedOn: new Date().toISOString().split('T')[0] }
          : l
      )
    );
    setRemarkInputs(prev => ({ ...prev, [leaveId]: '' }));
  };

  const handleReject = async (leaveId: string) => {
    const remark = remarkInputs[leaveId] || 'Rejected by HOD';
    try {
      await apiPost(`/core/leaves/${leaveId}/reject`, { remarks: remark });
    } catch {
      // fallback to local state
    }
    setLeaves(prev =>
      prev.map(l =>
        l.id === leaveId
          ? { ...l, status: 'Rejected' as const, remarks: remark, reviewedBy: 'HOD', reviewedOn: new Date().toISOString().split('T')[0] }
          : l
      )
    );
    setRemarkInputs(prev => ({ ...prev, [leaveId]: '' }));
  };

  const filteredLeaves = leaves.filter(leave => {
    if (leave.applicantRole !== activeTab) return false;
    if (statusFilter !== 'All' && leave.status !== statusFilter) return false;
    if (typeFilter !== 'All' && leave.leaveType !== typeFilter) return false;
    if (dateFrom && leave.startDate < dateFrom) return false;
    if (dateTo && leave.endDate > dateTo) return false;
    return true;
  });

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'Approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Medical': return 'text-sky-400 bg-sky-400/10';
      case 'OD': return 'text-violet-400 bg-violet-400/10';
      case 'Personal': return 'text-rose-400 bg-rose-400/10';
      case 'Emergency': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Medical': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'OD': return <FileText className="w-3.5 h-3.5" />;
      case 'Personal': return <User className="w-3.5 h-3.5" />;
      case 'Emergency': return <AlertTriangle className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leave Approvals</h1>
          <p className="text-gray-400">Review and manage leave applications from faculty and students</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1530] border border-[#2A2345] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#0891B2]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span className="text-gray-400 text-sm">Pending</span>
            </div>
            <p className="text-3xl font-bold text-[#0891B2]">{pendingCount}</p>
          </div>
          <div className="bg-[#1A1530] border border-[#2A2345] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-gray-400 text-sm">Approved</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{approvedCount}</p>
          </div>
          <div className="bg-[#1A1530] border border-[#2A2345] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-gray-400 text-sm">Rejected</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{rejectedCount}</p>
          </div>
          <div className="bg-[#1A1530] border border-[#2A2345] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#0891B2]/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span className="text-gray-400 text-sm">Total Applications</span>
            </div>
            <p className="text-3xl font-bold text-white">{leaves.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1530] border border-[#2A2345] rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'faculty'
                ? 'bg-[#0891B2] text-white shadow-lg shadow-[#0891B2]/20'
                : 'text-gray-400 hover:text-white hover:bg-[#2A2345]'
            }`}
          >
            Faculty Leaves
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'student'
                ? 'bg-[#0891B2] text-white shadow-lg shadow-[#0891B2]/20'
                : 'text-gray-400 hover:text-white hover:bg-[#2A2345]'
            }`}
          >
            Student Leaves
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1A1530] border border-[#2A2345] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-[#0891B2]" />
              <span className="text-sm text-gray-400">Filters</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-sm text-[#0891B2] hover:text-[#06b6d4] transition-colors"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#2A2345] grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-[#2A2345] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0891B2]"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Leave Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-[#2A2345] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0891B2]"
                >
                  <option value="All">All Types</option>
                  <option value="Medical">Medical</option>
                  <option value="OD">OD</option>
                  <option value="Personal">Personal</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-[#2A2345] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0891B2]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-[#2A2345] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0891B2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Leave Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-[#0891B2] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">Loading leave applications...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1530] border border-[#2A2345] rounded-xl">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No leave applications found matching your filters.</p>
            </div>
          ) : (
            filteredLeaves.map(leave => (
              <div
                key={leave.id}
                className="bg-[#1A1530] border border-[#2A2345] rounded-xl overflow-hidden hover:border-[#0891B2]/30 transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#0891B2]/20 flex items-center justify-center text-[#0891B2] font-semibold text-sm">
                          {leave.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{leave.applicantName}</h3>
                          <p className="text-gray-500 text-xs">{leave.id} &middot; Applied on {leave.appliedOn}</p>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-medium capitalize ${leave.applicantRole === 'faculty' ? 'bg-[#0891B2]/10 text-[#0891B2]' : 'bg-violet-500/10 text-violet-400'}`}>
                          {leave.applicantRole}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeColor(leave.leaveType)}`}>
                          {getTypeIcon(leave.leaveType)}
                          {leave.leaveType}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(leave.status)}`}>
                          {leave.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                          {leave.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5" />}
                          {leave.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {leave.status}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {leave.startDate} to {leave.endDate}
                          <span className="text-[#0891B2] font-medium">({calculateDays(leave.startDate, leave.endDate)} day{calculateDays(leave.startDate, leave.endDate) > 1 ? 's' : ''})</span>
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm leading-relaxed">{leave.reason}</p>

                      {leave.remarks && (
                        <div className="mt-3 bg-[#0D0A1A] border border-[#2A2345] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-[#0891B2]" />
                            <span className="text-xs text-gray-500">Remarks</span>
                          </div>
                          <p className="text-gray-300 text-sm">{leave.remarks}</p>
                        </div>
                      )}
                    </div>

                    {leave.status === 'Pending' && (
                      <div className="flex flex-col gap-2 md:w-64">
                        <input
                          type="text"
                          placeholder="Add remarks (optional)..."
                          value={remarkInputs[leave.id] || ''}
                          onChange={(e) => setRemarkInputs(prev => ({ ...prev, [leave.id]: e.target.value }))}
                          className="w-full bg-[#0D0A1A] border border-[#2A2345] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0891B2]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leave History Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Leave History</h2>
          <div className="bg-[#1A1530] border border-[#2A2345] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2345]">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Applicant</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Dates</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Days</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Reviewed On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves
                    .filter(l => l.status !== 'Pending')
                    .map(leave => (
                      <tr key={leave.id} className="border-b border-[#2A2345]/50 hover:bg-[#0D0A1A]/50 transition-colors">
                        <td className="px-5 py-3 text-[#0891B2] font-mono text-xs">{leave.id}</td>
                        <td className="px-5 py-3 text-white">{leave.applicantName}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getTypeColor(leave.leaveType)}`}>
                            {getTypeIcon(leave.leaveType)}
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-300 text-xs">{leave.startDate} &rarr; {leave.endDate}</td>
                        <td className="px-5 py-3 text-gray-300">{calculateDays(leave.startDate, leave.endDate)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{leave.reviewedOn || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
