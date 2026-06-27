"use client";
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Download, Filter, Calendar, ChevronDown, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import { exportToCSV, exportToPDF } from '../../../lib/exportUtils';

const mockStudents = [
  { id: 1, name: "Aarav Mehta", rollNo: "CS2024001", subjects: { Mathematics: 92, Physics: 88, Chemistry: 95 }, overall: 91.7 },
  { id: 2, name: "Priya Sharma", rollNo: "CS2024002", subjects: { Mathematics: 78, Physics: 72, Chemistry: 80 }, overall: 76.7 },
  { id: 3, name: "Rohan Patel", rollNo: "CS2024003", subjects: { Mathematics: 65, Physics: 60, Chemistry: 68 }, overall: 64.3 },
  { id: 4, name: "Sneha Gupta", rollNo: "CS2024004", subjects: { Mathematics: 98, Physics: 95, Chemistry: 97 }, overall: 96.7 },
  { id: 5, name: "Vikram Singh", rollNo: "CS2024005", subjects: { Mathematics: 55, Physics: 50, Chemistry: 58 }, overall: 54.3 },
  { id: 6, name: "Ananya Reddy", rollNo: "CS2024006", subjects: { Mathematics: 85, Physics: 82, Chemistry: 88 }, overall: 85.0 },
  { id: 7, name: "Karan Joshi", rollNo: "CS2024007", subjects: { Mathematics: 70, Physics: 68, Chemistry: 72 }, overall: 70.0 },
  { id: 8, name: "Divya Nair", rollNo: "CS2024008", subjects: { Mathematics: 90, Physics: 87, Chemistry: 91 }, overall: 89.3 },
  { id: 9, name: "Arjun Verma", rollNo: "CS2024009", subjects: { Mathematics: 45, Physics: 42, Chemistry: 48 }, overall: 45.0 },
  { id: 10, name: "Neha Kapoor", rollNo: "CS2024010", subjects: { Mathematics: 80, Physics: 76, Chemistry: 82 }, overall: 79.3 },
];

const mockSubjectStats = [
  { subject: "Mathematics", average: 75.8, totalClasses: 45, conducted: 42 },
  { subject: "Physics", average: 72.5, totalClasses: 40, conducted: 38 },
  { subject: "Chemistry", average: 78.6, totalClasses: 42, conducted: 40 },
];

const mockTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  percentage: 65 + Math.floor(Math.random() * 25),
}));

const getStatus = (pct: number) => {
  if (pct >= 85) return { label: "Good", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (pct >= 75) return { label: "At Risk", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
  return { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
};

export default function HodAttendancePage() {
  const [students, setStudents] = useState(mockStudents);
  const [subjectStats, setSubjectStats] = useState(mockSubjectStats);
  const [trendData, setTrendData] = useState(mockTrendData);
  const [semester, setSemester] = useState("All");
  const [batch, setBatch] = useState("All");
  const [dateRange, setDateRange] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGet("/campusCore/attendance/report");
        if (res?.students && Array.isArray(res.students)) setStudents(res.students);
        if (res?.subjects && Array.isArray(res.subjects)) setSubjectStats(res.subjects);
        if (res?.trend && Array.isArray(res.trend)) setTrendData(res.trend);
      } catch {
        // using mock data
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = Array.isArray(students) ? students.filter((s) => {
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) : [];

  const overallAvg = Array.isArray(students) && students.length ? (students.reduce((a, s) => a + s.overall, 0) / students.length).toFixed(1) : "0";
  const atRisk = Array.isArray(students) ? students.filter((s) => s.overall < 75) : [];
  const good = Array.isArray(students) ? students.filter((s) => s.overall >= 85) : [];
  const critical = Array.isArray(students) ? students.filter((s) => s.overall < 65) : [];

  const maxBar = Array.isArray(subjectStats) && subjectStats.length ? Math.max(...subjectStats.map((s) => s.average)) : 1;

  const exportReportCSV = () => {
    const headers = ["Name", "Roll No", "Mathematics", "Physics", "Chemistry", "Overall (%)", "Status"];
    const data = filtered.map(s => ({
      name: s.name,
      rollNo: s.rollNo,
      math: s.subjects.Mathematics,
      phys: s.subjects.Physics,
      chem: s.subjects.Chemistry,
      overall: `${s.overall.toFixed(1)}%`,
      status: getStatus(s.overall).label
    }));
    exportToCSV(data, `attendance_report_${new Date().toISOString().split("T")[0]}`, headers, ["name", "rollNo", "math", "phys", "chem", "overall", "status"]);
  };

  const exportReportPDF = () => {
    const headers = ["Name", "Roll No", "Mathematics", "Physics", "Chemistry", "Overall", "Status"];
    const data = filtered.map(s => ({
      name: s.name,
      rollNo: s.rollNo,
      math: `${s.subjects.Mathematics}%`,
      phys: `${s.subjects.Physics}%`,
      chem: `${s.subjects.Chemistry}%`,
      overall: `${s.overall.toFixed(1)}%`,
      status: getStatus(s.overall).label
    }));
    exportToPDF("Department Attendance Performance Report", data, `attendance_report_${new Date().toISOString().split("T")[0]}`, headers, ["name", "rollNo", "math", "phys", "chem", "overall", "status"]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0891B2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Department Attendance Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor and analyze attendance across all subjects and batches</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportReportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={exportReportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1A1530] border border-[#0891B2]/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#0891B2]/10 rounded-lg"><Users size={20} className="text-[#0891B2]" /></div>
            <span className="text-gray-400 text-sm">Total Students</span>
          </div>
          <p className="text-3xl font-bold">{students.length}</p>
        </div>
        <div className="bg-[#1A1530] border border-[#0891B2]/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#0891B2]/10 rounded-lg"><TrendingUp size={20} className="text-[#0891B2]" /></div>
            <span className="text-gray-400 text-sm">Dept Average</span>
          </div>
          <p className="text-3xl font-bold text-[#0891B2]">{overallAvg}%</p>
        </div>
        <div className="bg-[#1A1530] border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle size={20} className="text-emerald-400" /></div>
            <span className="text-gray-400 text-sm">Good (≥85%)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{good.length}</p>
        </div>
        <div className="bg-[#1A1530] border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle size={20} className="text-red-400" /></div>
            <span className="text-gray-400 text-sm">At Risk (&lt;75%)</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{atRisk.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-[#1A1530] border border-[#0891B2]/20 rounded-lg text-sm hover:border-[#0891B2]/50 transition-colors">
          <Filter size={14} /> Filters <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
        <input
          type="text"
          placeholder="Search by name or roll no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-[#1A1530] border border-[#0891B2]/20 rounded-lg text-sm focus:border-[#0891B2] outline-none flex-1 min-w-[200px]"
        />
      </div>

      {showFilters && (
        <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="bg-[#0D0A1A] border border-[#0891B2]/20 rounded-lg px-3 py-1.5 text-sm focus:border-[#0891B2] outline-none">
              <option value="All">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            <select value={batch} onChange={(e) => setBatch(e.target.value)} className="bg-[#0D0A1A] border border-[#0891B2]/20 rounded-lg px-3 py-1.5 text-sm focus:border-[#0891B2] outline-none">
              <option value="All">All Batches</option>
              <option value="A">Batch A</option>
              <option value="B">Batch B</option>
              <option value="C">Batch C</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-gray-400" />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-[#0D0A1A] border border-[#0891B2]/20 rounded-lg px-3 py-1.5 text-sm focus:border-[#0891B2] outline-none">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Attendance Trend (Last 30 Days)</h2>
        <div className="flex items-end gap-1 h-40 overflow-x-auto">
          {trendData.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-shrink-0 group">
              <div className="relative w-2 rounded-t" style={{ height: `${d.percentage * 1.4}px`, backgroundColor: d.percentage >= 85 ? "#10b981" : d.percentage >= 75 ? "#f59e0b" : "#ef4444" }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0D0A1A] border border-[#0891B2]/20 text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.percentage}%
                </div>
              </div>
              {i % 5 === 0 && <span className="text-[10px] text-gray-500 mt-1">{d.date}</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Good (≥85%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> At Risk (75-84%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical (&lt;75%)</span>
        </div>
      </div>

      <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>
        <div className="space-y-4">
          {subjectStats.map((s) => (
            <div key={s.subject}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{s.subject}</span>
                  <span className="text-xs text-gray-400">{s.conducted}/{s.totalClasses} classes conducted</span>
                </div>
                <span className={`text-sm font-bold ${s.average >= 85 ? "text-emerald-400" : s.average >= 75 ? "text-amber-400" : "text-red-400"}`}>
                  {s.average}%
                </span>
              </div>
              <div className="w-full bg-[#0D0A1A] rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${s.average >= 85 ? "bg-emerald-500" : s.average >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${(s.average / maxBar) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400" /> At-Risk Students (Below 75%)
        </h2>
        {atRisk.length === 0 ? (
          <p className="text-gray-400 text-sm">No at-risk students found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atRisk.map((s) => {
              const status = getStatus(s.overall);
              return (
                <div key={s.id} className={`p-4 rounded-lg border ${status.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.rollNo}</p>
                    </div>
                    <span className={`text-lg font-bold ${status.color}`}>{s.overall.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {Object.entries(s.subjects).map(([subj, pct]) => (
                      <span key={subj} className="text-[10px] bg-[#0D0A1A]/50 px-1.5 py-0.5 rounded">
                        {subj.slice(0, 3)}: {pct}%
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#0891B2]/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Student Attendance Details</h2>
          <span className="text-sm text-gray-400">{filtered.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0891B2]/10 text-gray-400 text-left">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Roll No</th>
                <th className="px-5 py-3 font-medium text-center">Mathematics</th>
                <th className="px-5 py-3 font-medium text-center">Physics</th>
                <th className="px-5 py-3 font-medium text-center">Chemistry</th>
                <th className="px-5 py-3 font-medium text-center">Overall</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const status = getStatus(s.overall);
                return (
                  <tr key={s.id} className="border-b border-[#0891B2]/5 hover:bg-[#0891B2]/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0891B2]/20 flex items-center justify-center text-xs font-bold text-[#0891B2]">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{s.rollNo}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={s.subjects.Mathematics >= 85 ? "text-emerald-400" : s.subjects.Mathematics >= 75 ? "text-amber-400" : "text-red-400"}>
                        {s.subjects.Mathematics}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={s.subjects.Physics >= 85 ? "text-emerald-400" : s.subjects.Physics >= 75 ? "text-amber-400" : "text-red-400"}>
                        {s.subjects.Physics}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={s.subjects.Chemistry >= 85 ? "text-emerald-400" : s.subjects.Chemistry >= 75 ? "text-amber-400" : "text-red-400"}>
                        {s.subjects.Chemistry}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-bold">{s.overall.toFixed(1)}%</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                        {status.label === "Good" ? <CheckCircle size={12} /> : status.label === "Critical" ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm">No students match your search criteria.</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Subject Comparison</h2>
          <div className="space-y-3">
            {subjectStats.map((s, i) => (
              <div key={s.subject} className="flex items-center gap-4">
                <span className="w-28 text-sm text-gray-300 truncate">{s.subject}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-[#0D0A1A] rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 text-[10px] font-bold text-white"
                      style={{
                        width: `${s.average}%`,
                        backgroundColor: i === 0 ? "#0891B2" : i === 1 ? "#8b5cf6" : "#f59e0b",
                      }}
                    >
                      {s.average}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Attendance Distribution</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-3xl font-bold text-emerald-400">{good.length}</p>
              <p className="text-xs text-gray-400 mt-1">Good (≥85%)</p>
              <div className="mt-2 w-full bg-[#0D0A1A] rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(good.length / students.length) * 100}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{((good.length / students.length) * 100).toFixed(0)}% of students</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-3xl font-bold text-amber-400">{students.length - good.length - critical.length}</p>
              <p className="text-xs text-gray-400 mt-1">At Risk (75-84%)</p>
              <div className="mt-2 w-full bg-[#0D0A1A] rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${((students.length - good.length - critical.length) / students.length) * 100}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{(((students.length - good.length - critical.length) / students.length) * 100).toFixed(0)}% of students</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-3xl font-bold text-red-400">{critical.length}</p>
              <p className="text-xs text-gray-400 mt-1">Critical (&lt;65%)</p>
              <div className="mt-2 w-full bg-[#0D0A1A] rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(critical.length / students.length) * 100}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{((critical.length / students.length) * 100).toFixed(0)}% of students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1530] border border-[#0891B2]/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Subject-wise Top & Bottom Performers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(mockStudents[0].subjects).map((subj) => {
            const sorted = [...students].sort((a, b) => b.subjects[subj as keyof typeof b.subjects] - a.subjects[subj as keyof typeof a.subjects]);
            const top = sorted[0];
            const bottom = sorted[sorted.length - 1];
            return (
              <div key={subj} className="bg-[#0D0A1A] rounded-lg p-4 border border-[#0891B2]/5">
                <h3 className="text-sm font-semibold text-[#0891B2] mb-3">{subj}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Top</span>
                    <span className="text-xs font-medium">{top.name}</span>
                    <span className="text-xs text-emerald-400 font-bold">{top.subjects[subj as keyof typeof top.subjects]}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Bottom</span>
                    <span className="text-xs font-medium">{bottom.name}</span>
                    <span className="text-xs text-red-400 font-bold">{bottom.subjects[subj as keyof typeof bottom.subjects]}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
