"use client";
import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Users, IndianRupee, Building, Download, Filter, ChevronDown, Award, Search } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface StudentPlacement {
  id: string;
  name: string;
  rollNumber: string;
  branch: string;
  status: 'placed' | 'unplaced' | 'pending';
  company?: string;
  package?: number;
  role?: string;
  offerDate?: string;
}

interface CompanyOffer {
  company: string;
  totalOffers: number;
  avgPackage: number;
  highestPackage: number;
  roles: string[];
  branches: string[];
}

interface PlacementStats {
  totalPlaced: number;
  totalUnplaced: number;
  totalPending: number;
  avgSalary: number;
  highestSalary: number;
  companiesVisited: number;
  placementRate: number;
}

interface YearTrend {
  year: string;
  placed: number;
  total: number;
  rate: number;
  avgSalary: number;
}

interface TopRecruiter {
  company: string;
  offers: number;
  avgPackage: number;
  logo: string;
}

const mockPlacementStats: PlacementStats = {
  totalPlaced: 312,
  totalUnplaced: 58,
  totalPending: 30,
  avgSalary: 680000,
  highestSalary: 2400000,
  companiesVisited: 28,
  placementRate: 78,
};

const mockStudents: StudentPlacement[] = [
  { id: '1', name: 'Aarav Mehta', rollNumber: 'CS21001', branch: 'Computer Science', status: 'placed', company: 'TCS', package: 720000, role: 'Software Engineer', offerDate: '2026-01-15' },
  { id: '2', name: 'Vidya Iyer', rollNumber: 'CS21002', branch: 'Computer Science', status: 'placed', company: 'Infosys', package: 650000, role: 'Systems Analyst', offerDate: '2026-01-20' },
  { id: '3', name: 'Rohan Gupta', rollNumber: 'EC21001', branch: 'Electronics', status: 'placed', company: 'Wipro', package: 600000, role: 'Embedded Developer', offerDate: '2026-02-05' },
  { id: '4', name: 'Sneha Reddy', rollNumber: 'CS21003', branch: 'Computer Science', status: 'placed', company: 'Google', package: 2400000, role: 'SDE-II', offerDate: '2026-02-12' },
  { id: '5', name: 'Karthik Nair', rollNumber: 'ME21001', branch: 'Mechanical', status: 'unplaced', company: undefined, role: undefined },
  { id: '6', name: 'Priya Das', rollNumber: 'CS21004', branch: 'Computer Science', status: 'placed', company: 'Amazon', package: 1800000, role: 'Applied Scientist', offerDate: '2026-02-18' },
  { id: '7', name: 'Arjun Patel', rollNumber: 'EC21002', branch: 'Electronics', status: 'pending', company: 'Samsung', role: 'Hardware Engineer' },
  { id: '8', name: 'Divya Sharma', rollNumber: 'CE21001', branch: 'Civil', status: 'unplaced' },
  { id: '9', name: 'Nikhil Bose', rollNumber: 'CS21005', branch: 'Computer Science', status: 'placed', company: 'Microsoft', package: 2100000, role: 'SDE-I', offerDate: '2026-03-01' },
  { id: '10', name: 'Ananya Joshi', rollNumber: 'CH21001', branch: 'Chemical', status: 'placed', company: 'Reliance', package: 550000, role: 'Process Engineer', offerDate: '2026-03-05' },
  { id: '11', name: 'Tarun Verma', rollNumber: 'ME21002', branch: 'Mechanical', status: 'placed', company: 'Tata Motors', package: 580000, role: 'Design Engineer', offerDate: '2026-03-10' },
  { id: '12', name: 'Meera Singh', rollNumber: 'EC21003', branch: 'Electronics', status: 'unplaced' },
  { id: '13', name: 'Aditya Kulkarni', rollNumber: 'CS21006', branch: 'Computer Science', status: 'placed', company: 'TCS', package: 720000, role: 'Developer', offerDate: '2026-03-12' },
  { id: '14', name: 'Lakshmi Rao', rollNumber: 'CE21002', branch: 'Civil', status: 'pending', company: 'L&T', role: 'Site Engineer' },
  { id: '15', name: 'Rahul Mishra', rollNumber: 'CH21002', branch: 'Chemical', status: 'placed', company: 'Infosys', package: 650000, role: 'Consultant', offerDate: '2026-03-15' },
  { id: '16', name: 'Neha Kapoor', rollNumber: 'CS21007', branch: 'Computer Science', status: 'placed', company: 'Wipro', package: 600000, role: 'Full Stack Dev', offerDate: '2026-03-18' },
  { id: '17', name: 'Siddharth Jain', rollNumber: 'ME21003', branch: 'Mechanical', status: 'pending', company: 'Mahindra', role: 'CAD Engineer' },
  { id: '18', name: 'Pooja Menon', rollNumber: 'EC21004', branch: 'Electronics', status: 'placed', company: 'Samsung', package: 800000, role: 'VLSI Engineer', offerDate: '2026-03-22' },
  { id: '19', name: 'Varun Agarwal', rollNumber: 'CS21008', branch: 'Computer Science', status: 'unplaced' },
  { id: '20', name: 'Ishita Banerjee', rollNumber: 'CE21003', branch: 'Civil', status: 'placed', company: 'L&T', package: 500000, role: 'Project Engineer', offerDate: '2026-03-25' },
];

const mockCompanyOffers: CompanyOffer[] = [
  { company: 'TCS', totalOffers: 65, avgPackage: 720000, highestPackage: 850000, roles: ['Software Engineer', 'Developer', 'Consultant'], branches: ['Computer Science', 'Electronics', 'Chemical'] },
  { company: 'Infosys', totalOffers: 52, avgPackage: 650000, highestPackage: 780000, roles: ['Systems Analyst', 'Developer', 'Consultant'], branches: ['Computer Science', 'Electronics'] },
  { company: 'Wipro', totalOffers: 40, avgPackage: 600000, highestPackage: 720000, roles: ['Full Stack Dev', 'Embedded Developer', 'Analyst'], branches: ['Computer Science', 'Electronics', 'Mechanical'] },
  { company: 'Google', totalOffers: 4, avgPackage: 2200000, highestPackage: 2400000, roles: ['SDE-II', 'Applied Scientist'], branches: ['Computer Science'] },
  { company: 'Amazon', totalOffers: 6, avgPackage: 1600000, highestPackage: 1800000, roles: ['Applied Scientist', 'SDE-I', 'SDE-II'], branches: ['Computer Science'] },
  { company: 'Microsoft', totalOffers: 5, avgPackage: 2000000, highestPackage: 2100000, roles: ['SDE-I', 'SDE-II'], branches: ['Computer Science', 'Electronics'] },
  { company: 'Tata Motors', totalOffers: 18, avgPackage: 580000, highestPackage: 680000, roles: ['Design Engineer', 'Production Engineer'], branches: ['Mechanical'] },
  { company: 'Samsung', totalOffers: 12, avgPackage: 800000, highestPackage: 950000, roles: ['Hardware Engineer', 'VLSI Engineer'], branches: ['Electronics'] },
  { company: 'L&T', totalOffers: 22, avgPackage: 500000, highestPackage: 600000, roles: ['Site Engineer', 'Project Engineer'], branches: ['Civil', 'Mechanical'] },
  { company: 'Reliance', totalOffers: 15, avgPackage: 550000, highestPackage: 650000, roles: ['Process Engineer', 'Operations'], branches: ['Chemical', 'Mechanical'] },
];

const mockYearTrend: YearTrend[] = [
  { year: '2022', placed: 265, total: 380, rate: 69.7, avgSalary: 520000 },
  { year: '2023', placed: 290, total: 395, rate: 73.4, avgSalary: 580000 },
  { year: '2024', placed: 305, total: 400, rate: 76.25, avgSalary: 630000 },
  { year: '2025', placed: 320, total: 410, rate: 78.05, avgSalary: 680000 },
  { year: '2026', placed: 312, total: 400, rate: 78.0, avgSalary: 680000 },
];

const mockTopRecruiters: TopRecruiter[] = [
  { company: 'TCS', offers: 65, avgPackage: 720000, logo: 'TC' },
  { company: 'Infosys', offers: 52, avgPackage: 650000, logo: 'IN' },
  { company: 'Wipro', offers: 40, avgPackage: 600000, logo: 'WI' },
  { company: 'L&T', offers: 22, avgPackage: 500000, logo: 'LT' },
  { company: 'Tata Motors', offers: 18, avgPackage: 580000, logo: 'TM' },
  { company: 'Reliance', offers: 15, avgPackage: 550000, logo: 'RL' },
  { company: 'Samsung', offers: 12, avgPackage: 800000, logo: 'SA' },
  { company: 'Amazon', offers: 6, avgPackage: 1600000, logo: 'AZ' },
];

export default function HodPlacementsPage() {
  const [stats, setStats] = useState<PlacementStats>(mockPlacementStats);
  const [students, setStudents] = useState<StudentPlacement[]>(mockStudents);
  const [companyOffers, setCompanyOffers] = useState<CompanyOffer[]>(mockCompanyOffers);
  const [yearTrend, setYearTrend] = useState<YearTrend[]>(mockYearTrend);
  const [topRecruiters, setTopRecruiters] = useState<TopRecruiter[]>(mockTopRecruiters);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'companies' | 'trend'>('students');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiGet('/placements/stats');
        if (res && res.data) {
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.students) setStudents(res.data.students);
          if (res.data.companyOffers) setCompanyOffers(res.data.companyOffers);
          if (res.data.yearTrend) setYearTrend(res.data.yearTrend);
          if (res.data.topRecruiters) setTopRecruiters(res.data.topRecruiters);
        }
      } catch {
        console.log('Using mock placement data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const filteredStudents = students.filter((s) => {
    if (filterBranch !== 'all' && s.branch !== filterBranch) return false;
    if (filterCompany !== 'all' && s.company !== filterCompany) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.company && s.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const branches = Array.from(new Set(students.map((s) => s.branch)));
  const companies = Array.from(new Set(students.filter((s) => s.company).map((s) => s.company!)));

  const maxOffers = Math.max(...yearTrend.map((y) => y.placed));

  const handleExport = () => {
    const headers = ['Name', 'Roll Number', 'Branch', 'Status', 'Company', 'Package (₹)', 'Role', 'Offer Date'];
    const rows = filteredStudents.map((s) => [
      s.name,
      s.rollNumber,
      s.branch,
      s.status,
      s.company || 'N/A',
      s.package ? s.package.toString() : 'N/A',
      s.role || 'N/A',
      s.offerDate || 'N/A',
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placement-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="text-teal-400 text-xl animate-pulse">Loading Placement Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Briefcase className="text-[#0891B2]" />
              Department Placements
            </h1>
            <p className="text-gray-400 mt-2">Placement overview and statistics for 2025-26</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-[#1A1528] border border-gray-700 hover:border-[#0891B2] px-4 py-2 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0E7490] px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Name, roll no, company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0891B2]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Branch</label>
                <div className="relative">
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Company</label>
                <div className="relative">
                  <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Companies</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Status</label>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="placed">Placed</option>
                    <option value="unplaced">Unplaced</option>
                    <option value="pending">Pending</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Placed', value: stats.totalPlaced, icon: Briefcase, color: 'text-[#0891B2]', bg: 'bg-[#0891B2]/10' },
            { label: 'Avg Salary', value: formatCurrency(stats.avgSalary), icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-900/20' },
            { label: 'Highest Package', value: formatCurrency(stats.highestSalary), icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
            { label: 'Companies Visited', value: stats.companiesVisited, icon: Building, color: 'text-purple-400', bg: 'bg-purple-900/20' },
            { label: 'Placement Rate', value: `${stats.placementRate}%`, icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-900/20' },
          ].map((metric, i) => (
            <div key={i} className="bg-[#1A1528] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${metric.bg} p-2 rounded-lg`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <span className="text-gray-400 text-sm">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex gap-1">
            {[
              { key: 'students' as const, label: 'Student Status' },
              { key: 'companies' as const, label: 'Company Offers' },
              { key: 'trend' as const, label: 'Year Trend' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#0891B2] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'students' && (
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0891B2]" />
                Student Placement Status
              </h3>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Placed ({students.filter((s) => s.status === 'placed').length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Pending ({students.filter((s) => s.status === 'pending').length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Unplaced ({students.filter((s) => s.status === 'unplaced').length})
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-3 text-gray-400">Student</th>
                    <th className="text-left p-3 text-gray-400">Roll No</th>
                    <th className="text-left p-3 text-gray-400">Branch</th>
                    <th className="text-center p-3 text-gray-400">Status</th>
                    <th className="text-left p-3 text-gray-400">Company</th>
                    <th className="text-left p-3 text-gray-400">Role</th>
                    <th className="text-right p-3 text-gray-400">Package</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 text-white font-medium">{student.name}</td>
                      <td className="p-3 text-gray-400">{student.rollNumber}</td>
                      <td className="p-3 text-gray-300">{student.branch}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'placed'
                              ? 'bg-green-900/50 text-green-400'
                              : student.status === 'pending'
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-red-900/50 text-red-400'
                          }`}
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">{student.company || '-'}</td>
                      <td className="p-3 text-gray-400">{student.role || '-'}</td>
                      <td className="p-3 text-right">
                        {student.package ? (
                          <span className="text-[#0891B2] font-semibold">{formatCurrency(student.package)}</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-gray-500 text-right">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              Company-wise Offers Breakdown
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-3 text-gray-400">Company</th>
                    <th className="text-center p-3 text-gray-400">Total Offers</th>
                    <th className="text-center p-3 text-gray-400">Avg Package</th>
                    <th className="text-center p-3 text-gray-400">Highest Package</th>
                    <th className="text-left p-3 text-gray-400">Roles</th>
                    <th className="text-left p-3 text-gray-400">Branches</th>
                  </tr>
                </thead>
                <tbody>
                  {companyOffers.map((co) => (
                    <tr key={co.company} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 text-white font-medium">{co.company}</td>
                      <td className="p-3 text-center">
                        <span className="bg-[#0891B2]/10 text-[#0891B2] px-3 py-1 rounded-full font-semibold">
                          {co.totalOffers}
                        </span>
                      </td>
                      <td className="p-3 text-center text-green-400">{formatCurrency(co.avgPackage)}</td>
                      <td className="p-3 text-center text-yellow-400">{formatCurrency(co.highestPackage)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {co.roles.map((role) => (
                            <span key={role} className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {co.branches.map((branch) => (
                            <span key={branch} className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs">
                              {branch}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0891B2]" />
                Year-over-Year Placement Trend
              </h3>
              <div className="h-64 flex items-end justify-between gap-4 px-4">
                {yearTrend.map((item, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-xs text-gray-400 mb-2">{item.rate}%</span>
                    <div
                      className="w-full bg-gradient-to-t from-[#0891B2] to-cyan-400 rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${(item.placed / maxOffers) * 200}px` }}
                    />
                    <span className="text-xs text-gray-400 mt-2">{item.year}</span>
                    <span className="text-[10px] text-gray-500">{item.placed}/{item.total}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-400" />
                Average Salary Trend
              </h3>
              <div className="h-64 flex items-end justify-between gap-4 px-4">
                {yearTrend.map((item, i) => {
                  const maxSalary = Math.max(...yearTrend.map((y) => y.avgSalary));
                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <span className="text-xs text-gray-400 mb-2">{formatCurrency(item.avgSalary)}</span>
                      <div
                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${(item.avgSalary / maxSalary) * 200}px` }}
                      />
                      <span className="text-xs text-gray-400 mt-2">{item.year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Top Recruiters
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {topRecruiters.map((recruiter, i) => (
              <div
                key={recruiter.company}
                className="bg-[#0D0A1A] border border-gray-700 rounded-xl p-4 hover:border-[#0891B2]/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0891B2]/20 flex items-center justify-center text-[#0891B2] font-bold text-sm">
                    {recruiter.logo}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{recruiter.company}</div>
                    <div className="text-gray-500 text-xs">#{i + 1} Recruiter</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Total Offers</span>
                    <span className="text-white font-semibold">{recruiter.offers}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0891B2] to-cyan-400 rounded-full"
                      style={{ width: `${(recruiter.offers / topRecruiters[0].offers) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg Package</span>
                    <span className="text-green-400 font-medium">{formatCurrency(recruiter.avgPackage)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0891B2]" />
              Status Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Placed', count: stats.totalPlaced, total: stats.totalPlaced + stats.totalUnplaced + stats.totalPending, color: 'from-green-500 to-green-400' },
                { label: 'Pending', count: stats.totalPending, total: stats.totalPlaced + stats.totalUnplaced + stats.totalPending, color: 'from-yellow-500 to-yellow-400' },
                { label: 'Unplaced', count: stats.totalUnplaced, total: stats.totalPlaced + stats.totalUnplaced + stats.totalPending, color: 'from-red-500 to-red-400' },
              ].map((item) => {
                const pct = Math.round((item.count / item.total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-white font-medium">{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              Branch-wise Placement
            </h3>
            <div className="space-y-3">
              {branches.map((branch) => {
                const branchStudents = students.filter((s) => s.branch === branch);
                const placed = branchStudents.filter((s) => s.status === 'placed').length;
                const pct = Math.round((placed / branchStudents.length) * 100);
                return (
                  <div key={branch}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{branch}</span>
                      <span className="text-white font-medium">{placed}/{branchStudents.length} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0891B2] to-cyan-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-400" />
              Package Distribution
            </h3>
            <div className="space-y-3">
              {[
                { range: '20L+', count: 5, color: 'from-yellow-500 to-yellow-400' },
                { range: '10L - 20L', count: 8, color: 'from-green-500 to-green-400' },
                { range: '5L - 10L', count: 85, color: 'from-[#0891B2] to-cyan-400' },
                { range: '3L - 5L', count: 145, color: 'from-blue-500 to-blue-400' },
                { range: 'Below 3L', count: 69, color: 'from-purple-500 to-purple-400' },
              ].map((item) => {
                const maxCount = 145;
                return (
                  <div key={item.range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.range}</span>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
