"use client";
import React, { useState, useEffect } from 'react';
import { Search, Users, Download, Mail, Phone, GraduationCap, AlertTriangle, Filter, ChevronDown, Eye } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  semester: number;
  batch: string;
  attendance: number;
  cgpa: number;
  status: 'active' | 'inactive';
}

const mockStudents: Student[] = [
  { id: 1, name: 'Aarav Mehta', rollNumber: 'CS2022001', email: 'aarav.mehta@university.edu', phone: '+91 9876543210', semester: 5, batch: '2022', attendance: 92, cgpa: 8.5, status: 'active' },
  { id: 2, name: 'Priya Sharma', rollNumber: 'CS2022002', email: 'priya.sharma@university.edu', phone: '+91 9876543211', semester: 5, batch: '2022', attendance: 78, cgpa: 7.2, status: 'active' },
  { id: 3, name: 'Rohan Patel', rollNumber: 'CS2022003', email: 'rohan.patel@university.edu', phone: '+91 9876543212', semester: 5, batch: '2022', attendance: 45, cgpa: 5.1, status: 'active' },
  { id: 4, name: 'Ananya Gupta', rollNumber: 'CS2023001', email: 'ananya.gupta@university.edu', phone: '+91 9876543213', semester: 3, batch: '2023', attendance: 95, cgpa: 9.1, status: 'active' },
  { id: 5, name: 'Vikram Singh', rollNumber: 'CS2023002', email: 'vikram.singh@university.edu', phone: '+91 9876543214', semester: 3, batch: '2023', attendance: 68, cgpa: 6.8, status: 'active' },
  { id: 6, name: 'Nisha Reddy', rollNumber: 'CS2021001', email: 'nisha.reddy@university.edu', phone: '+91 9876543215', semester: 7, batch: '2021', attendance: 88, cgpa: 8.9, status: 'active' },
  { id: 7, name: 'Karthik Nair', rollNumber: 'CS2021002', email: 'karthik.nair@university.edu', phone: '+91 9876543216', semester: 7, batch: '2021', attendance: 42, cgpa: 4.8, status: 'inactive' },
  { id: 8, name: 'Deepa Iyer', rollNumber: 'CS2024001', email: 'deepa.iyer@university.edu', phone: '+91 9876543217', semester: 1, batch: '2024', attendance: 97, cgpa: 9.4, status: 'active' },
  { id: 9, name: 'Rahul Verma', rollNumber: 'CS2022004', email: 'rahul.verma@university.edu', phone: '+91 9876543218', semester: 5, batch: '2022', attendance: 55, cgpa: 5.9, status: 'active' },
  { id: 10, name: 'Sneha Joshi', rollNumber: 'CS2023003', email: 'sneha.joshi@university.edu', phone: '+91 9876543219', semester: 3, batch: '2023', attendance: 82, cgpa: 7.8, status: 'active' },
  { id: 11, name: 'Arjun Das', rollNumber: 'CS2021003', email: 'arjun.das@university.edu', phone: '+91 9876543220', semester: 7, batch: '2021', attendance: 38, cgpa: 4.2, status: 'inactive' },
  { id: 12, name: 'Meera Pillai', rollNumber: 'CS2024002', email: 'meera.pillai@university.edu', phone: '+91 9876543221', semester: 1, batch: '2024', attendance: 91, cgpa: 8.7, status: 'active' },
];

const HODStudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<number | ''>('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, semesterFilter, batchFilter, statusFilter]);

  const fetchStudents = async () => {
    try {
      const data = await apiGet('/campusCore/faculty/students');
      // Guard: API may return {data: [...]} or a non-array on error
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.students) ? data.students
        : null;
      setStudents(list ?? mockStudents);
    } catch {
      setStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = Array.isArray(students) ? [...students] : [];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }
    if (semesterFilter !== '') {
      result = result.filter(s => s.semester === semesterFilter);
    }
    if (batchFilter) {
      result = result.filter(s => s.batch === batchFilter);
    }
    if (statusFilter) {
      result = result.filter(s => s.status === statusFilter);
    }
    setFilteredStudents(result);
  };

  const stats = {
    total: filteredStudents.length,
    avgAttendance: filteredStudents.length
      ? Math.round(filteredStudents.reduce((acc, s) => acc + s.attendance, 0) / filteredStudents.length)
      : 0,
    avgCgpa: filteredStudents.length
      ? (filteredStudents.reduce((acc, s) => acc + s.cgpa, 0) / filteredStudents.length).toFixed(1)
      : '0.0',
    atRisk: filteredStudents.filter(s => s.attendance < 60 || s.cgpa < 5.0).length,
  };

  const uniqueBatches = Array.isArray(students) ? Array.from(new Set(students.map(s => s.batch))).sort() : [];

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 85) return 'text-emerald-400';
    if (attendance >= 65) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCgpaColor = (cgpa: number) => {
    if (cgpa >= 8.0) return 'text-emerald-400';
    if (cgpa >= 6.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-[#0891B2]" />
          <h1 className="text-3xl font-bold">Department Students</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#13102B] rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Students</p>
            <p className="text-3xl font-bold text-[#0891B2]">{stats.total}</p>
          </div>
          <div className="bg-[#13102B] rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Avg Attendance</p>
            <p className={`text-3xl font-bold ${stats.avgAttendance >= 75 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {stats.avgAttendance}%
            </p>
          </div>
          <div className="bg-[#13102B] rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Avg CGPA</p>
            <p className={`text-3xl font-bold ${parseFloat(stats.avgCgpa) >= 7.0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {stats.avgCgpa}
            </p>
          </div>
          <div className="bg-[#13102B] rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">At-Risk Students</p>
            <p className="text-3xl font-bold text-red-400">{stats.atRisk}</p>
          </div>
        </div>

        <div className="bg-[#13102B] rounded-2xl p-4 mb-6 border border-gray-800 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D0A1A] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#0891B2]"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition ${
                showFilters ? 'bg-[#0891B2]/20 border-[#0891B2] text-[#0891B2]' : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 transition">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 transition">
              <Mail className="w-4 h-4" />
              Send Notice
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-[#13102B] rounded-2xl p-4 mb-6 border border-gray-800 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Semester</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value ? Number(e.target.value) : '')}
                className="bg-[#0D0A1A] border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#0891B2]"
              >
                <option value="">All</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Sem {sem}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Batch</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-[#0D0A1A] border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#0891B2]"
              >
                <option value="">All</option>
                {uniqueBatches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
                className="bg-[#0D0A1A] border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#0891B2]"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#0891B2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No students found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-[#13102B] rounded-2xl p-5 border border-gray-800 hover:border-[#0891B2]/50 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#0891B2] transition">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono">{student.rollNumber}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{student.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0D0A1A] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Semester</p>
                    <p className="text-sm font-semibold text-white flex items-center justify-center gap-1">
                      <GraduationCap className="w-4 h-4 text-[#0891B2]" />
                      {student.semester}
                    </p>
                  </div>
                  <div className="bg-[#0D0A1A] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Batch</p>
                    <p className="text-sm font-semibold text-white">{student.batch}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0D0A1A] rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Attendance</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.attendance >= 85 ? 'bg-emerald-400' : student.attendance >= 65 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getAttendanceColor(student.attendance)}`}>
                        {student.attendance}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#0D0A1A] rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">CGPA</p>
                    <p className={`text-sm font-semibold ${getCgpaColor(student.cgpa)}`}>{student.cgpa}</p>
                  </div>
                </div>

                {(student.attendance < 60 || student.cgpa < 5.0) && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-400">
                      {student.attendance < 60 && student.cgpa < 5.0
                        ? 'Low attendance & CGPA'
                        : student.attendance < 60
                        ? 'Low attendance'
                        : 'Low CGPA'}
                    </span>
                  </div>
                )}

                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/30 text-[#0891B2] hover:bg-[#0891B2]/20 transition text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HODStudentsPage;