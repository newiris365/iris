"use client";
import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, Award, AlertTriangle, Download, Filter, ChevronDown, BarChart3, Users, GraduationCap } from 'lucide-react';
import { apiGet } from '../../../lib/api';

type ExamType = 'CIE 1' | 'CIE 2' | 'SEE' | 'Mid-term';

interface SubjectPerformance {
  id: string;
  name: string;
  code: string;
  avgMarks: number;
  passRate: number;
  highest: number;
  lowest: number;
  totalStudents: number;
  passedStudents: number;
}

interface StudentPerformance {
  id: string;
  name: string;
  rollNumber: string;
  totalMarks: number;
  avgMarks: number;
  subjectsPassed: number;
  subjectsFailed: number;
  grades: Record<string, string>;
}

interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}



export default function DepartmentExamResults() {
  const [selectedExam, setSelectedExam] = useState<ExamType>('CIE 1');
  const [selectedSemester, setSelectedSemester] = useState<string>('odd');
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);

  const examOptions: ExamType[] = ['CIE 1', 'CIE 2', 'SEE', 'Mid-term'];
  const semesterOptions = [
    { value: 'odd', label: 'Odd Semester (1,3,5)' },
    { value: 'even', label: 'Even Semester (2,4,6)' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiGet('/obe/courses');
        if (response && Array.isArray(response)) {
          const mapped: SubjectPerformance[] = response.map((course: any, idx: number) => ({
            id: String(idx + 1),
            name: course.courseName || course.name || `Subject ${idx + 1}`,
            code: course.courseCode || course.code || `SUB${100 + idx}`,
            avgMarks: course.avgMarks ?? 0,
            passRate: course.passRate ?? 0,
            highest: course.highest ?? 0,
            lowest: course.lowest ?? 0,
            totalStudents: course.totalStudents ?? 0,
            passedStudents: course.passedStudents ?? 0,
          }));
          setSubjects(mapped);
        } else {
          setSubjects([]);
        }
      } catch {
        setSubjects([]);
      }
      setStudents([]);
      setGradeDistribution([]);
      setLoading(false);
    };
    fetchData();
  }, [selectedExam, selectedSemester]);

  const overallPassRate = subjects.length
    ? Math.round(subjects.reduce((sum, s) => sum + s.passRate, 0) / subjects.length)
    : 0;
  const overallAvgScore = subjects.length
    ? Math.round(subjects.reduce((sum, s) => sum + s.avgMarks, 0) / subjects.length)
    : 0;
  const topPerformers = students.filter(s => s.subjectsFailed === 0).slice(0, 5);
  const atRiskStudents = students.filter(s => s.subjectsFailed >= 2);
  const maxGradeCount = Math.max(...gradeDistribution.map(g => g.count));

  const handleExport = () => {
    const csvContent = [
      ['Subject', 'Avg Marks', 'Pass Rate', 'Highest', 'Lowest'].join(','),
      ...subjects.map(s => [s.name, s.avgMarks, `${s.passRate}%`, s.highest, s.lowest].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-results-${selectedExam.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return '#10B981';
      case 'A': return '#059669';
      case 'B+': return '#0891B2';
      case 'B': return '#0E7490';
      case 'C': return '#F59E0B';
      case 'F': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 85) return 'text-emerald-400';
    if (rate >= 70) return 'text-teal-400';
    if (rate >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0891B2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading exam results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-[#0891B2]" />
              Department Exam Results
            </h1>
            <p className="text-gray-400 mt-1">View and analyze department-wide exam performance</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Results
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <button
              onClick={() => { setExamDropdownOpen(!examDropdownOpen); setSemesterDropdownOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1530] border border-gray-700 rounded-lg text-white hover:border-[#0891B2] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#0891B2]" />
              <span>{selectedExam}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${examDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {examDropdownOpen && (
              <div className="absolute z-10 mt-2 w-48 bg-[#1A1530] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                {examOptions.map(exam => (
                  <button
                    key={exam}
                    onClick={() => { setSelectedExam(exam); setExamDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-[#0891B2]/20 transition-colors ${
                      selectedExam === exam ? 'text-[#0891B2] bg-[#0891B2]/10' : 'text-gray-300'
                    }`}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setSemesterDropdownOpen(!semesterDropdownOpen); setExamDropdownOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1530] border border-gray-700 rounded-lg text-white hover:border-[#0891B2] transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-[#0891B2]" />
              <span>{semesterOptions.find(s => s.value === selectedSemester)?.label}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${semesterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {semesterDropdownOpen && (
              <div className="absolute z-10 mt-2 w-56 bg-[#1A1530] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                {semesterOptions.map(sem => (
                  <button
                    key={sem.value}
                    onClick={() => { setSelectedSemester(sem.value); setSemesterDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-[#0891B2]/20 transition-colors ${
                      selectedSemester === sem.value ? 'text-[#0891B2] bg-[#0891B2]/10' : 'text-gray-300'
                    }`}
                  >
                    {sem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1530] border border-gray-700 rounded-xl p-5 hover:border-[#0891B2]/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#0891B2]/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span className="text-gray-400 text-sm">Overall Pass Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">{overallPassRate}%</div>
            <div className="text-emerald-400 text-sm mt-1">+2.3% from last exam</div>
          </div>

          <div className="bg-[#1A1530] border border-gray-700 rounded-xl p-5 hover:border-[#0891B2]/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#0891B2]/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span className="text-gray-400 text-sm">Average Score</span>
            </div>
            <div className="text-3xl font-bold text-white">{overallAvgScore}</div>
            <div className="text-emerald-400 text-sm mt-1">+1.5 from last exam</div>
          </div>

          <div className="bg-[#1A1530] border border-gray-700 rounded-xl p-5 hover:border-[#0891B2]/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#0891B2]/20 rounded-lg">
                <Award className="w-5 h-5 text-[#0891B2]" />
              </div>
              <span className="text-gray-400 text-sm">Top Performers</span>
            </div>
            <div className="text-3xl font-bold text-white">{topPerformers.length}</div>
            <div className="text-[#0891B2] text-sm mt-1">Students with 100% pass</div>
          </div>

          <div className="bg-[#1A1530] border border-gray-700 rounded-xl p-5 hover:border-[#0891B2]/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-gray-400 text-sm">At-Risk Students</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{atRiskStudents.length}</div>
            <div className="text-amber-400 text-sm mt-1">Failed in 2+ subjects</div>
          </div>
        </div>

        {/* Subject Performance Table */}
        <div className="bg-[#1A1530] border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0891B2]" />
              Subject Performance - {selectedExam}
            </h2>
            <span className="text-sm text-gray-400">{subjects.length} subjects</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0D0A1A]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Pass Rate</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Highest</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Lowest</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-[#0891B2]/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{subject.name}</td>
                    <td className="px-6 py-4 text-gray-400">{subject.code}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-semibold">{subject.avgMarks}</span>
                      <span className="text-gray-500 text-sm">/100</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[#0891B2] h-2 rounded-full"
                            style={{ width: `${subject.passRate}%` }}
                          ></div>
                        </div>
                        <span className={`font-semibold ${getPassRateColor(subject.passRate)}`}>{subject.passRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-emerald-400 font-semibold">{subject.highest}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-red-400 font-semibold">{subject.lowest}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-400">
                        <span className="text-emerald-400">{subject.passedStudents}</span>
                        <span className="mx-1">/</span>
                        <span>{subject.totalStudents}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Row: Top Performers, At-Risk, Grade Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performers */}
          <div className="bg-[#1A1530] border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0891B2]" />
                Top Performers
              </h2>
            </div>
            <div className="divide-y divide-gray-700/50">
              {topPerformers.map((student, idx) => (
                <div key={student.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#0891B2]/5 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                    idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-[#0891B2]/20 text-[#0891B2]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{student.name}</p>
                    <p className="text-gray-400 text-xs">{student.rollNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#0891B2] font-semibold text-sm">{student.avgMarks}%</p>
                    <p className="text-emerald-400 text-xs">{student.subjectsPassed}/{student.subjectsPassed + student.subjectsFailed} passed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* At-Risk Students */}
          <div className="bg-[#1A1530] border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                At-Risk Students
              </h2>
              <p className="text-gray-400 text-xs mt-1">Failed in 2+ subjects</p>
            </div>
            <div className="divide-y divide-gray-700/50">
              {atRiskStudents.map((student) => (
                <div key={student.id} className="px-5 py-3 hover:bg-red-500/5 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">{student.name}</p>
                      <p className="text-gray-400 text-xs">{student.rollNumber}</p>
                    </div>
                    <span className="text-red-400 font-semibold text-sm">{student.subjectsFailed} failed</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(student.grades).map(([code, grade]) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 text-xs rounded font-medium"
                        style={{
                          backgroundColor: `${getGradeColor(grade)}20`,
                          color: getGradeColor(grade),
                        }}
                      >
                        {code}: {grade}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-[#1A1530] border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0891B2]" />
                Grade Distribution
              </h2>
              <p className="text-gray-400 text-xs mt-1">Across all subjects</p>
            </div>
            <div className="p-5 space-y-4">
              {gradeDistribution.map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-8 text-center font-bold text-sm"
                        style={{ color: getGradeColor(item.grade) }}
                      >
                        {item.grade}
                      </span>
                      <span className="text-gray-400 text-xs">{item.count} students</span>
                    </div>
                    <span className="text-white text-sm font-medium">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / maxGradeCount) * 100}%`,
                        backgroundColor: getGradeColor(item.grade),
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="bg-[#0D0A1A] rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Students</span>
                  <span className="text-white font-semibold">
                    {gradeDistribution.reduce((sum, g) => sum + g.count, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Pass Rate</span>
                  <span className="text-emerald-400 font-semibold">
                    {Math.round(gradeDistribution.filter(g => g.grade !== 'F').reduce((sum, g) => sum + g.percentage, 0))}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Fail Rate</span>
                  <span className="text-red-400 font-semibold">
                    {gradeDistribution.find(g => g.grade === 'F')?.percentage || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Overview Table */}
        <div className="bg-[#1A1530] border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0891B2]" />
              All Students Overview
            </h2>
            <span className="text-sm text-gray-400">{students.length} students</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0D0A1A]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Roll No.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Passed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-[#0891B2]/5 transition-colors">
                    <td className="px-6 py-4 text-[#0891B2] font-mono text-sm">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-white font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-center text-white">{student.totalMarks}/600</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${
                        student.avgMarks >= 80 ? 'text-emerald-400' :
                        student.avgMarks >= 60 ? 'text-[#0891B2]' :
                        student.avgMarks >= 40 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {student.avgMarks}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-emerald-400 font-semibold">{student.subjectsPassed}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${student.subjectsFailed > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {student.subjectsFailed}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.subjectsFailed === 0 ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">Excellent</span>
                      ) : student.subjectsFailed === 1 ? (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">Warning</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">At Risk</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
