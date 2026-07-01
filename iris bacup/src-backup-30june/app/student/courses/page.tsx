"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, XCircle, Clock, Filter, Search, AlertTriangle, GraduationCap, ArrowRight } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  course_type: string;
  semester: number;
  department_name: string;
  is_registered: boolean;
  registration?: { id: string; status: string } | null;
}

interface MyRegistration {
  id: string;
  status: string;
  registered_at: string;
  dropped_at: string | null;
  course: {
    id: string;
    course_code: string;
    course_name: string;
    credits: number;
    course_type: string;
  };
}

const COURSE_TYPE_COLORS: Record<string, string> = {
  core: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  elective: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  lab: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  project: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  audit: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function CourseRegistrationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'registered'>('available');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [semester, setSemester] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, myRes] = await Promise.all([
        apiGet('/core/courses/available'),
        apiGet('/core/courses/my'),
      ]);

      if (coursesRes.success) {
        setCourses(coursesRes.courses || []);
        setSemester(coursesRes.semester || 1);
      }
      if (myRes.success) {
        setMyRegistrations(myRes.registrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (courseId: string) => {
    setRegisteringId(courseId);
    try {
      const res = await apiPost('/core/courses/register', { course_id: courseId });
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Registration failed');
      }
    } catch (err) {
      alert('Registration failed. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleDrop = async (registrationId: string) => {
    if (!confirm('Are you sure you want to drop this course?')) return;
    setRegisteringId(registrationId);
    try {
      const res = await apiPost('/core/courses/drop', { registration_id: registrationId });
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Failed to drop course');
      }
    } catch (err) {
      alert('Failed to drop course. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = !search ||
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.course_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || c.course_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const registeredCourses = myRegistrations.filter(r => r.status === 'active');
  const totalCredits = registeredCourses.reduce((sum, r) => sum + (r.course?.credits || 0), 0);
  const maxCredits = 24;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Course Registration</h1>
            <p className="text-white/50 text-sm">Semester {semester} | Academic Year {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Credit Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Registered Courses</div>
            <div className="text-2xl font-bold text-[#06B6D4]">{registeredCourses.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Total Credits</div>
            <div className="text-2xl font-bold text-[#A78BFA]">{totalCredits} / {maxCredits}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Credits Remaining</div>
            <div className={`text-2xl font-bold ${maxCredits - totalCredits < 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {maxCredits - totalCredits}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Available Courses ({filteredCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'registered'
                ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            My Courses ({registeredCourses.length})
          </button>
        </div>

        {activeTab === 'available' && (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by course code or name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#06B6D4]/50"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'core', 'elective', 'lab', 'project', 'audit'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      typeFilter === type
                        ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Warning */}
            {totalCredits >= maxCredits && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-amber-200 text-sm">You have reached the maximum credit limit ({maxCredits} credits). Drop a course to register for a new one.</p>
              </div>
            )}

            {/* Course Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                    <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No courses found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourses.map(course => (
                  <div
                    key={course.id}
                    className={`bg-white/5 border rounded-xl p-5 transition-all hover:bg-white/[0.07] ${
                      course.is_registered ? 'border-emerald-500/30' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-mono text-white/40">{course.course_code}</span>
                        <h3 className="text-sm font-semibold text-white mt-0.5">{course.course_name}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${COURSE_TYPE_COLORS[course.course_type] || COURSE_TYPE_COLORS.core}`}>
                        {course.course_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {course.credits} credits
                      </span>
                      {course.department_name && <span>{course.department_name}</span>}
                      {course.semester && <span>Sem {course.semester}</span>}
                    </div>

                    {course.is_registered ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                        </span>
                        <button
                          onClick={() => course.registration && handleDrop(course.registration.id)}
                          disabled={registeringId === course.registration?.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          {registeringId === course.registration?.id ? 'Dropping...' : 'Drop'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(course.id)}
                        disabled={registeringId === course.id || totalCredits >= maxCredits}
                        className="w-full py-2 rounded-lg text-xs font-medium bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 hover:bg-[#06B6D4]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {registeringId === course.id ? (
                          'Registering...'
                        ) : (
                          <>Register <ArrowRight className="w-3 h-3" /></>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'registered' && (
          <>
            {registeredCourses.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>You have not registered for any courses yet.</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 hover:bg-[#06B6D4]/25 transition-all"
                >
                  Browse Available Courses
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {registeredCourses.map(reg => (
                  <div
                    key={reg.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-[#06B6D4] text-sm font-bold">
                        {reg.course.credits}
                      </div>
                      <div>
                        <span className="text-xs font-mono text-white/40">{reg.course.course_code}</span>
                        <h3 className="text-sm font-semibold">{reg.course.course_name}</h3>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${COURSE_TYPE_COLORS[reg.course.course_type] || COURSE_TYPE_COLORS.core}`}>
                            {reg.course.course_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(reg.registered_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDrop(reg.id)}
                      disabled={registeringId === reg.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {registeringId === reg.id ? 'Dropping...' : 'Drop Course'}
                    </button>
                  </div>
                ))}

                <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Total Credits Registered</span>
                    <span className="font-bold text-[#06B6D4]">{totalCredits} / {maxCredits}</span>
                  </div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#06B6D4] to-[#A78BFA] rounded-full transition-all"
                      style={{ width: `${Math.min((totalCredits / maxCredits) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
