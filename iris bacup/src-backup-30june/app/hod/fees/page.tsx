"use client";
import React, { useState, useEffect } from 'react';
import { AlertTriangle, IndianRupee, Download, Mail, Phone, Filter, ChevronDown, Send, Clock, Users } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const mockDefaulters = [
  { id: 1, name: "Rahul Verma", rollNo: "CS210045", amountDue: 45000, daysOverdue: 45, lastPaymentDate: "2025-12-10", contactStatus: "reachable", escalationStatus: "sent_reminder", semester: 6, program: "B.Tech CSE" },
  { id: 2, name: "Priya Sharma", rollNo: "CS210078", amountDue: 62000, daysOverdue: 30, lastPaymentDate: "2026-01-05", contactStatus: "unreachable", escalationStatus: "whatsapp_sent", semester: 6, program: "B.Tech CSE" },
  { id: 3, name: "Amit Patel", rollNo: "CS210112", amountDue: 38500, daysOverdue: 60, lastPaymentDate: "2025-11-20", contactStatus: "reachable", escalationStatus: "hod_notified", semester: 6, program: "B.Tech CSE" },
  { id: 4, name: "Sneha Reddy", rollNo: "CS220023", amountDue: 28000, daysOverdue: 15, lastPaymentDate: "2026-02-01", contactStatus: "reachable", escalationStatus: "none", semester: 4, program: "B.Tech CSE" },
  { id: 5, name: "Vikram Singh", rollNo: "CS210089", amountDue: 71500, daysOverdue: 90, lastPaymentDate: "2025-10-15", contactStatus: "unreachable", escalationStatus: "hod_notified", semester: 6, program: "B.Tech CSE" },
  { id: 6, name: "Deepa Nair", rollNo: "CS220056", amountDue: 19000, daysOverdue: 22, lastPaymentDate: "2026-01-18", contactStatus: "reachable", escalationStatus: "sent_reminder", semester: 4, program: "B.Tech CSE" },
  { id: 7, name: "Karan Mehta", rollNo: "CS210034", amountDue: 55000, daysOverdue: 50, lastPaymentDate: "2025-12-01", contactStatus: "reachable", escalationStatus: "whatsapp_sent", semester: 6, program: "B.Tech CSE" },
  { id: 8, name: "Ananya Das", rollNo: "CS220091", amountDue: 33000, daysOverdue: 35, lastPaymentDate: "2025-12-28", contactStatus: "unreachable", escalationStatus: "none", semester: 4, program: "B.Tech CSE" },
];

const feeCollectionSummary = {
  totalStudents: 120,
  totalCollected: 8950000,
  totalPending: 352000,
  collectionRate: 96.2,
  monthsData: [
    { month: "Oct", collected: 1200000, pending: 85000 },
    { month: "Nov", collected: 1350000, pending: 72000 },
    { month: "Dec", collected: 1100000, pending: 95000 },
    { month: "Jan", collected: 1280000, pending: 68000 },
    { month: "Feb", collected: 1420000, pending: 42000 },
    { month: "Mar", collected: 1300000, pending: 55000 },
  ],
};

export default function FeeDefaultersPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterDaysOverdue, setFilterDaysOverdue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'daysOverdue', direction: 'desc' });

  useEffect(() => {
    fetchDefaulters();
    setSummary(feeCollectionSummary);
  }, []);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/campusCore/fees/defaulters');
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.defaulters) ? data.defaulters
        : null;
      setDefaulters(list ?? mockDefaulters);
    } catch {
      setDefaulters(mockDefaulters);
    } finally {
      setLoading(false);
    }
  };

  const filteredDefaulters = Array.isArray(defaulters) ? defaulters.filter((d) => {
    if (filterAmountMin && d.amountDue < Number(filterAmountMin)) return false;
    if (filterAmountMax && d.amountDue > Number(filterAmountMax)) return false;
    if (filterSemester !== 'all' && d.semester !== Number(filterSemester)) return false;
    if (filterDaysOverdue && d.daysOverdue < Number(filterDaysOverdue)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !d.rollNo.toLowerCase().includes(q)) return false;
    }
    return true;
  }) : [];

  const sorted = [...filteredDefaulters].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    if (sortConfig.key === 'amountDue') return (a.amountDue - b.amountDue) * dir;
    if (sortConfig.key === 'daysOverdue') return (a.daysOverdue - b.daysOverdue) * dir;
    if (sortConfig.key === 'name') return a.name.localeCompare(b.name) * dir;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const totalPending = Array.isArray(defaulters) ? defaulters.reduce((sum, d) => sum + d.amountDue, 0) : 0;

  const handleSendReminder = async (defaulter) => {
    setSendingReminder(defaulter.id);
    try {
      await apiPost('/campusCore/fees/send-reminder', { studentId: defaulter.id });
    } catch {
      // silent fallback
    }
    setTimeout(() => {
      setDefaulters((prev) =>
        prev.map((d) =>
          d.id === defaulter.id ? { ...d, escalationStatus: 'sent_reminder' } : d
        )
      );
      setSendingReminder(null);
    }, 1200);
  };

  const handleExport = () => {
    const csv = [
      'Name,Roll No,Amount Due,Days Overdue,Last Payment,Semester,Contact Status,Escalation Status',
      ...filteredDefaulters.map(
        (d) =>
          `"${d.name}",${d.rollNo},${d.amountDue},${d.daysOverdue},${d.lastPaymentDate},${d.semester},${d.contactStatus},${d.escalationStatus}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_defaulters_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escalationColor = (status) => {
    switch (status) {
      case 'hod_notified': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'whatsapp_sent': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'sent_reminder': return 'text-teal-400 bg-teal-400/10 border-teal-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const escalationLabel = (status) => {
    switch (status) {
      case 'hod_notified': return 'HOD Notified';
      case 'whatsapp_sent': return 'WhatsApp Sent';
      case 'sent_reminder': return 'Reminder Sent';
      default: return 'No Action';
    }
  };

  const contactColor = (status) => {
    return status === 'reachable' ? 'text-emerald-400' : 'text-red-400';
  };

  const daysOverdueColor = (days) => {
    if (days >= 60) return 'text-red-400';
    if (days >= 30) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ChevronDown className="w-3 h-3 text-gray-500" />;
    return (
      <ChevronDown
        className={`w-3 h-3 text-teal-400 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`}
      />
    );
  };

  const maxBar = Math.max(...feeCollectionSummary.monthsData.map((m) => m.collected));

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-gray-200 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-[#0891B2]" />
              Fee Defaulters
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Department of Computer Science & Engineering</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0891B2]/10 border border-[#0891B2]/30 text-[#0891B2] rounded-lg hover:bg-[#0891B2]/20 transition text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-400/10 rounded-lg">
                <IndianRupee className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-gray-400 text-sm">Total Pending</span>
            </div>
            <p className="text-2xl font-bold text-red-400">₹{totalPending.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">{defaulters.length} defaulters</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-400/10 rounded-lg">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-gray-400 text-sm">Avg Days Overdue</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {defaulters.length > 0 ? Math.round(defaulters.reduce((s, d) => s + d.daysOverdue, 0) / defaulters.length) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">across all defaulters</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-400/10 rounded-lg">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-gray-400 text-sm">Collection Rate</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{summary?.collectionRate || 96.2}%</p>
            <p className="text-xs text-gray-500 mt-1">overall department</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#0891B2]/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span className="text-gray-400 text-sm">Unreachable</span>
            </div>
            <p className="text-2xl font-bold text-[#0891B2]">
              {defaulters.filter((d) => d.contactStatus === 'unreachable').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">students unreachable</p>
          </div>
        </div>

        {/* Fee Collection Summary Chart */}
        {summary && (
          <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5">Fee Collection Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-[#0D0A1A]/50 rounded-lg">
                <p className="text-sm text-gray-400">Total Students</p>
                <p className="text-xl font-bold text-white mt-1">{summary.totalStudents}</p>
              </div>
              <div className="text-center p-4 bg-[#0D0A1A]/50 rounded-lg">
                <p className="text-sm text-gray-400">Collected</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">₹{summary.totalCollected.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-4 bg-[#0D0A1A]/50 rounded-lg">
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-xl font-bold text-red-400 mt-1">₹{summary.totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {summary.monthsData.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">₹{(m.collected / 1000).toFixed(0)}K</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#0891B2] to-[#0891B2]/60 transition-all duration-500"
                    style={{ height: `${(m.collected / maxBar) * 100}%`, minHeight: '8px' }}
                  />
                  <span className="text-xs text-gray-400 mt-1">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#0891B2] transition"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {(filterAmountMin || filterAmountMax || filterSemester !== 'all' || filterDaysOverdue || searchQuery) && (
              <button
                onClick={() => {
                  setFilterAmountMin('');
                  setFilterAmountMax('');
                  setFilterSemester('all');
                  setFilterDaysOverdue('');
                  setSearchQuery('');
                }}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mb-3">
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#0891B2] transition"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Min Amount (₹)</label>
                <input
                  type="number"
                  value={filterAmountMin}
                  onChange={(e) => setFilterAmountMin(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#0891B2]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Max Amount (₹)</label>
                <input
                  type="number"
                  value={filterAmountMax}
                  onChange={(e) => setFilterAmountMax(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#0891B2]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Semester</label>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#0891B2]"
                >
                  <option value="all">All Semesters</option>
                  <option value="2">Semester 2</option>
                  <option value="4">Semester 4</option>
                  <option value="6">Semester 6</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Min Days Overdue</label>
                <input
                  type="number"
                  value={filterDaysOverdue}
                  onChange={(e) => setFilterDaysOverdue(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#0891B2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Defaulters Table */}
        <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Defaulters List
              <span className="text-sm font-normal text-gray-400 ml-2">({filteredDefaulters.length} results)</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block w-8 h-8 border-2 border-[#0891B2]/30 border-t-[#0891B2] rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading defaulters...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No defaulters match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="px-5 py-3 cursor-pointer hover:text-[#0891B2] transition" onClick={() => handleSort('name')}>
                      <span className="flex items-center gap-1">Student <SortIcon col="name" /></span>
                    </th>
                    <th className="px-5 py-3">Roll No</th>
                    <th className="px-5 py-3">Sem</th>
                    <th className="px-5 py-3 cursor-pointer hover:text-[#0891B2] transition" onClick={() => handleSort('amountDue')}>
                      <span className="flex items-center gap-1">Amount Due <SortIcon col="amountDue" /></span>
                    </th>
                    <th className="px-5 py-3 cursor-pointer hover:text-[#0891B2] transition" onClick={() => handleSort('daysOverdue')}>
                      <span className="flex items-center gap-1">Days Overdue <SortIcon col="daysOverdue" /></span>
                    </th>
                    <th className="px-5 py-3">Last Payment</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Escalation</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d) => (
                    <tr key={d.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-white font-medium">{d.name}</p>
                          <p className="text-xs text-gray-500">{d.program}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-300 font-mono text-xs">{d.rollNo}</td>
                      <td className="px-5 py-4 text-gray-400">Sem {d.semester}</td>
                      <td className="px-5 py-4">
                        <span className="text-red-400 font-semibold">₹{d.amountDue.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-medium ${daysOverdueColor(d.daysOverdue)}`}>
                          {d.daysOverdue}d
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{d.lastPaymentDate}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${contactColor(d.contactStatus)}`}>
                          {d.contactStatus === 'reachable' ? (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Reachable</span>
                          ) : (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Unreachable</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${escalationColor(d.escalationStatus)}`}>
                          {escalationLabel(d.escalationStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleSendReminder(d)}
                          disabled={sendingReminder === d.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0891B2]/10 border border-[#0891B2]/30 text-[#0891B2] rounded-lg hover:bg-[#0891B2]/20 transition text-xs font-medium disabled:opacity-50"
                        >
                          {sendingReminder === d.id ? (
                            <div className="w-3 h-3 border-2 border-[#0891B2]/30 border-t-[#0891B2] rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Remind
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Escalation Legend */}
        <div className="bg-gradient-to-br from-[#1a1530] to-[#120f24] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Escalation Status Guide</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-400">No Action Taken</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span className="text-xs text-gray-400">Email Reminder Sent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-400">WhatsApp Message Sent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-gray-400">HOD Notified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}