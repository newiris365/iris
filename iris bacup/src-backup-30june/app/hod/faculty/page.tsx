"use client";

import React, { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, BookOpen, Award, Briefcase, Star, Filter, ChevronDown, BarChart3 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Faculty {
  id: string;
  name: string;
  designation: string;
  specialization: string;
  email: string;
  phone: string;
  qualifications: string[];
  yearsOfExperience: number;
  publicationsCount: number;
  currentCourseLoad: number;
  studentsHandled: number;
  rating: number;
  status: string;
}

const MOCK_FACULTY: Faculty[] = [
  {
    id: 'F001',
    name: 'Dr. Rajesh Kumar',
    designation: 'Professor',
    specialization: 'Artificial Intelligence & Machine Learning',
    email: 'rajesh.kumar@iris.edu',
    phone: '+91 98765 43210',
    qualifications: ['Ph.D. Computer Science (IIT Delhi)', 'M.Tech AI (IIT Bombay)'],
    yearsOfExperience: 18,
    publicationsCount: 45,
    currentCourseLoad: 3,
    studentsHandled: 120,
    rating: 4.8,
    status: 'Active',
  },
  {
    id: 'F002',
    name: 'Dr. Sneha Patel',
    designation: 'Associate Professor',
    specialization: 'Data Science & Analytics',
    email: 'sneha.patel@iris.edu',
    phone: '+91 98765 43211',
    qualifications: ['Ph.D. Data Science (NIT Trichy)', 'MCA (BITS Pilani)'],
    yearsOfExperience: 12,
    publicationsCount: 28,
    currentCourseLoad: 4,
    studentsHandled: 150,
    rating: 4.6,
    status: 'Active',
  },
  {
    id: 'F003',
    name: 'Prof. Amit Sharma',
    designation: 'Professor',
    specialization: 'Computer Networks & Security',
    email: 'amit.sharma@iris.edu',
    phone: '+91 98765 43212',
    qualifications: ['Ph.D. Network Security (IISc Bangalore)', 'M.Tech CSE (IIIT Hyderabad)'],
    yearsOfExperience: 22,
    publicationsCount: 62,
    currentCourseLoad: 2,
    studentsHandled: 80,
    rating: 4.9,
    status: 'Active',
  },
  {
    id: 'F004',
    name: 'Dr. Priya Nair',
    designation: 'Assistant Professor',
    specialization: 'Cloud Computing & DevOps',
    email: 'priya.nair@iris.edu',
    phone: '+91 98765 43213',
    qualifications: ['Ph.D. Cloud Architecture (VIT)', 'AWS Solutions Architect Certified'],
    yearsOfExperience: 7,
    publicationsCount: 15,
    currentCourseLoad: 5,
    studentsHandled: 180,
    rating: 4.4,
    status: 'Active',
  },
  {
    id: 'F005',
    name: 'Dr. Vikram Singh',
    designation: 'Associate Professor',
    specialization: 'Software Engineering & Full Stack Development',
    email: 'vikram.singh@iris.edu',
    phone: '+91 98765 43214',
    qualifications: ['Ph.D. Software Engineering (NIT Warangal)', 'M.Tech SE (DTU)'],
    yearsOfExperience: 14,
    publicationsCount: 32,
    currentCourseLoad: 3,
    studentsHandled: 110,
    rating: 4.7,
    status: 'Active',
  },
  {
    id: 'F006',
    name: 'Ms. Kavitha Reddy',
    designation: 'Lecturer',
    specialization: 'Web Technologies & UI/UX Design',
    email: 'kavitha.reddy@iris.edu',
    phone: '+91 98765 43215',
    qualifications: ['M.Tech CSE (Manipal)', 'Google UX Design Certified'],
    yearsOfExperience: 4,
    publicationsCount: 8,
    currentCourseLoad: 5,
    studentsHandled: 200,
    rating: 4.3,
    status: 'Active',
  },
  {
    id: 'F007',
    name: 'Dr. Arun Mehta',
    designation: 'Assistant Professor',
    specialization: 'Internet of Things & Embedded Systems',
    email: 'arun.mehta@iris.edu',
    phone: '+91 98765 43216',
    qualifications: ['Ph.D. IoT (IIT Kanpur)', 'M.Tech Embedded Systems (NIT Calicut)'],
    yearsOfExperience: 6,
    publicationsCount: 12,
    currentCourseLoad: 4,
    studentsHandled: 140,
    rating: 4.5,
    status: 'Active',
  },
  {
    id: 'F008',
    name: 'Ms. Deepa Iyer',
    designation: 'Lecturer',
    specialization: 'Database Management & Big Data',
    email: 'deepa.iyer@iris.edu',
    phone: '+91 98765 43217',
    qualifications: ['M.Tech Data Engineering (SRM)', 'Oracle Certified Professional'],
    yearsOfExperience: 3,
    publicationsCount: 5,
    currentCourseLoad: 6,
    studentsHandled: 220,
    rating: 4.2,
    status: 'On Leave',
  },
];

const DESIGNATIONS = ['All', 'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('/hr/employees');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: Faculty[] = res.data.map((emp: any, i: number) => ({
            id: emp.id || `F${String(i + 1).padStart(3, '0')}`,
            name: emp.name || emp.full_name || 'Unknown',
            designation: emp.designation || emp.job_title || 'Faculty',
            specialization: emp.specialization || emp.department || 'General',
            email: emp.email || '',
            phone: emp.phone || emp.contact || '',
            qualifications: emp.qualifications || [],
            yearsOfExperience: emp.years_of_experience || emp.experience || 0,
            publicationsCount: emp.publications_count || emp.publications || 0,
            currentCourseLoad: emp.current_course_load || emp.course_load || 0,
            studentsHandled: emp.students_handled || 0,
            rating: emp.rating || 4.0,
            status: emp.status || 'Active',
          }));
          setFaculty(mapped);
        } else {
          setFaculty(MOCK_FACULTY);
        }
      } catch {
        setFaculty(MOCK_FACULTY);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesignation =
      designationFilter === 'All' || f.designation === designationFilter;
    return matchesSearch && matchesDesignation;
  });

  const totalCourses = faculty.reduce((sum, f) => sum + f.currentCourseLoad, 0);
  const totalStudents = faculty.reduce((sum, f) => sum + f.studentsHandled, 0);
  const avgWorkload = faculty.length > 0 ? (totalCourses / faculty.length).toFixed(1) : '0';
  const avgRating = faculty.length > 0 ? (faculty.reduce((sum, f) => sum + f.rating, 0) / faculty.length).toFixed(1) : '0';
  const totalPublications = faculty.reduce((sum, f) => sum + f.publicationsCount, 0);

  const getDesignationColor = (designation: string) => {
    switch (designation) {
      case 'Professor': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Associate Professor': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Assistant Professor': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Lecturer': return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-emerald-400 bg-emerald-400/10';
      case 'On Leave': return 'text-amber-400 bg-amber-400/10';
      case 'Inactive': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-teal-400 animate-pulse">Loading faculty data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-[#0891B2]" />
          Faculty Management
        </h1>
        <div className="text-sm text-slate-400">
          {faculty.length} members &middot; {faculty.filter(f => f.status === 'Active').length} active
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Faculty', value: faculty.length, icon: Users, color: 'text-[#0891B2]' },
          { label: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'text-blue-400' },
          { label: 'Students Handled', value: totalStudents, icon: Briefcase, color: 'text-emerald-400' },
          { label: 'Avg Workload', value: avgWorkload, icon: BarChart3, color: 'text-amber-400' },
          { label: 'Total Publications', value: totalPublications, icon: Award, color: 'text-violet-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0D0A1A] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <stat.icon size={20} className={stat.color} />
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D0A1A] rounded-xl p-4 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Designations</p>
          <div className="space-y-2">
            {['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'].map(d => {
              const count = faculty.filter(f => f.designation === d).length;
              const pct = faculty.length > 0 ? ((count / faculty.length) * 100).toFixed(0) : 0;
              return (
                <div key={d} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{d}</span>
                  <span className="text-white font-medium">{count} <span className="text-slate-500">({pct}%)</span></span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-[#0D0A1A] rounded-xl p-4 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Performance Overview</p>
          <div className="flex items-center gap-2 mb-3">
            <Star size={20} className="text-amber-400 fill-amber-400" />
            <span className="text-2xl font-bold text-white">{avgRating}</span>
            <span className="text-xs text-slate-400">avg rating</span>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = faculty.filter(f => Math.round(f.rating) === star).length;
              const pct = faculty.length > 0 ? (count / faculty.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-3">{star}</span>
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-[#0D0A1A] rounded-xl p-4 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Workload Distribution</p>
          <div className="space-y-3">
            {faculty.filter(f => f.status === 'Active').slice(0, 5).map(f => (
              <div key={f.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 truncate max-w-[100px]">{f.name.split(' ').pop()}</span>
                  <span className="text-slate-400">{f.currentCourseLoad} courses</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0891B2] rounded-full transition-all"
                    style={{ width: `${(f.currentCourseLoad / 6) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0D0A1A] rounded-xl p-4 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Top Specializations</p>
          <div className="space-y-2">
            {Array.from(new Set(faculty.map(f => f.specialization)))
              .slice(0, 5)
              .map(spec => {
                const count = faculty.filter(f => f.specialization === spec).length;
                return (
                  <div key={spec} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[120px]">{spec}</span>
                    <span className="text-[#0891B2] font-medium">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, specialization, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2]/50 transition-colors"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-sm text-slate-300 hover:border-[#0891B2]/50 transition-colors"
          >
            <Filter size={16} className="text-[#0891B2]" />
            {designationFilter}
            <ChevronDown size={14} />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-[#0D0A1A] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              {DESIGNATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDesignationFilter(d); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                    designationFilter === d ? 'text-[#0891B2] bg-[#0891B2]/5' : 'text-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFaculty && (
        <div className="bg-[#0D0A1A] rounded-xl border border-[#0891B2]/30 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedFaculty.name}</h2>
              <p className="text-sm text-[#0891B2]">{selectedFaculty.specialization}</p>
            </div>
            <button
              onClick={() => setSelectedFaculty(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm text-white flex items-center gap-1.5">
                <Mail size={14} className="text-[#0891B2]" /> {selectedFaculty.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Phone</p>
              <p className="text-sm text-white flex items-center gap-1.5">
                <Phone size={14} className="text-[#0891B2]" /> {selectedFaculty.phone}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Experience</p>
              <p className="text-sm text-white">{selectedFaculty.yearsOfExperience} years</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Publications</p>
              <p className="text-sm text-white">{selectedFaculty.publicationsCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-2">Qualifications</p>
            <div className="flex flex-wrap gap-2">
              {selectedFaculty.qualifications.map((q, i) => (
                <span key={i} className="px-3 py-1 bg-[#0891B2]/10 text-[#0891B2] text-xs rounded-full border border-[#0891B2]/20">
                  {q}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{selectedFaculty.currentCourseLoad}</p>
              <p className="text-xs text-slate-400">Courses</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{selectedFaculty.studentsHandled}</p>
              <p className="text-xs text-slate-400">Students</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-0.5">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-lg font-bold text-white">{selectedFaculty.rating}</span>
              </div>
              <p className="text-xs text-slate-400">Rating</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0D0A1A] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Faculty</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Designation</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Specialization</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Experience</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Courses</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredFaculty.map(f => (
                <tr
                  key={f.id}
                  onClick={() => setSelectedFaculty(selectedFaculty?.id === f.id ? null : f)}
                  className={`cursor-pointer transition-colors hover:bg-white/5 ${
                    selectedFaculty?.id === f.id ? 'bg-[#0891B2]/5' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{f.name}</p>
                      <p className="text-xs text-slate-500">{f.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getDesignationColor(f.designation)}`}>
                      {f.designation}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300 max-w-[180px] truncate">{f.specialization}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-500" />
                      <span className="text-xs text-slate-400">{f.phone}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-white font-medium">{f.yearsOfExperience} yrs</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-[#0891B2]" />
                      <span className="text-sm text-white font-medium">{f.currentCourseLoad}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {getRatingStars(f.rating)}
                      <span className="text-xs text-slate-400 ml-1">{f.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredFaculty.length === 0 && (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No faculty found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
