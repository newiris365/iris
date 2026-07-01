"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen, Calendar, ChevronDown, ChevronRight, CheckCircle2,
  XCircle, Clock, AlertTriangle, TrendingUp, BarChart3,
  GraduationCap, User, Hash, Filter, ArrowLeft
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
type AttendanceStatus = 'P' | 'A' | 'L';
type LectureType = 'Theory' | 'Lab' | 'Tutorial';

interface AttendanceRecord {
  date: string;
  day: string;
  lectureType: LectureType;
  status: AttendanceStatus;
  subjectCode: string;
}

interface Subject {
  code: string;
  name: string;
  lectureType: LectureType;
}

interface Semester {
  number: number;
  subjects: Subject[];
  isActive: boolean;
  isLocked: boolean;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
  classesToReach75: number;
  status: 'safe' | 'at_risk' | 'critical';
}

// ============================================================
// STUDENT DATA
// ============================================================
const STUDENT = {
  name: 'Rahul Sharma',
  rollNo: '21CS001',
  course: 'B.Tech CSE',
  currentSem: 4,
};

// ============================================================
// SEMESTER & SUBJECT DATA
// ============================================================
const SEMESTERS: Semester[] = [
  {
    number: 1,
    isActive: false,
    isLocked: true,
    subjects: [
      { code: 'MA101', name: 'Engineering Maths I', lectureType: 'Theory' },
      { code: 'PH101', name: 'Engineering Physics', lectureType: 'Theory' },
      { code: 'CH101', name: 'Engineering Chemistry', lectureType: 'Theory' },
      { code: 'CS101', name: 'Intro to Programming', lectureType: 'Lab' },
      { code: 'ME101', name: 'Engineering Drawing', lectureType: 'Lab' },
    ],
  },
  {
    number: 2,
    isActive: false,
    isLocked: true,
    subjects: [
      { code: 'MA201', name: 'Engineering Maths II', lectureType: 'Theory' },
      { code: 'PH201', name: 'Applied Physics', lectureType: 'Theory' },
      { code: 'EE201', name: 'Basic Electrical', lectureType: 'Theory' },
      { code: 'CS201', name: 'Data Structures', lectureType: 'Lab' },
      { code: 'ME201', name: 'Workshop Practice', lectureType: 'Lab' },
    ],
  },
  {
    number: 3,
    isActive: true,
    isLocked: false,
    subjects: [
      { code: 'CS301', name: 'OOP with Java', lectureType: 'Lab' },
      { code: 'CS302', name: 'Digital Electronics', lectureType: 'Theory' },
      { code: 'CS303', name: 'Discrete Mathematics', lectureType: 'Theory' },
      { code: 'CS304', name: 'Data Communication', lectureType: 'Theory' },
      { code: 'MA301', name: 'Probability & Statistics', lectureType: 'Tutorial' },
    ],
  },
  {
    number: 4,
    isActive: true,
    isLocked: false,
    subjects: [
      { code: 'CS401', name: 'Data Structures & Algorithms', lectureType: 'Theory' },
      { code: 'CS402', name: 'Operating Systems', lectureType: 'Theory' },
      { code: 'CS403', name: 'DBMS', lectureType: 'Lab' },
      { code: 'CS404', name: 'Computer Networks', lectureType: 'Theory' },
      { code: 'MA401', name: 'Engineering Maths IV', lectureType: 'Tutorial' },
    ],
  },
  {
    number: 5,
    isActive: false,
    isLocked: true,
    subjects: [
      { code: 'CS501', name: 'Compiler Design', lectureType: 'Theory' },
      { code: 'CS502', name: 'Software Engineering', lectureType: 'Theory' },
      { code: 'CS503', name: 'AI & ML', lectureType: 'Theory' },
      { code: 'CS504', name: 'Web Technologies', lectureType: 'Lab' },
      { code: 'CS505', name: 'Professional Ethics', lectureType: 'Tutorial' },
    ],
  },
  {
    number: 6,
    isActive: false,
    isLocked: true,
    subjects: [
      { code: 'CS601', name: 'Cloud Computing', lectureType: 'Theory' },
      { code: 'CS602', name: 'Cyber Security', lectureType: 'Theory' },
      { code: 'CS603', name: 'Blockchain', lectureType: 'Theory' },
      { code: 'CS604', name: 'DevOps', lectureType: 'Lab' },
      { code: 'CS605', name: 'Technical Writing', lectureType: 'Tutorial' },
    ],
  },
  {
    number: 7,
    isActive: false,
    isLocked: true,
    subjects: [
      { code: 'CS701', name: 'Machine Learning', lectureType: 'Theory' },
      { code: 'CS702', name: 'Deep Learning', lectureType: 'Theory' },
      { code: 'CS703', name: 'NLP', lectureType: 'Theory' },
      { code: 'CS704', name: 'Computer Vision', lectureType: 'Lab' },
      { code: 'CS705', name: 'Seminar', lectureType: 'Tutorial' },
    ],
  },
  {
    number: 8,
    isActive: false,
    isLocked: true,
    subjects: [
      { code: 'CS801', name: 'Project Work', lectureType: 'Lab' },
      { code: 'CS802', name: 'Industrial Training', lectureType: 'Lab' },
      { code: 'CS803', name: 'Ethics in AI', lectureType: 'Theory' },
      { code: 'CS804', name: 'Entrepreneurship', lectureType: 'Theory' },
      { code: 'CS805', name: 'Comprehensive Viva', lectureType: 'Tutorial' },
    ],
  },
];

// ============================================================
// ATTENDANCE DATA GENERATOR (Sem 3 & Sem 4 only)
// ============================================================
function generateAttendanceData(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Target percentages per subject (some below 75%)
  const targetPercentages: Record<string, number> = {
    // Sem 3
    CS301: 68, CS302: 82, CS303: 80, CS304: 72, MA301: 78,
    // Sem 4
    CS401: 79, CS402: 65, CS403: 84, CS404: 70, MA401: 76,
  };

  // Generate for Sem 3: Jan 15 - Apr 20, 2024
  const sem3Subjects = SEMESTERS[2].subjects;
  const sem3Start = new Date('2024-01-15');
  const sem3End = new Date('2024-04-20');

  sem3Subjects.forEach(subject => {
    const target = targetPercentages[subject.code] || 75;
    const allDates = generateClassDates(sem3Start, sem3End, days);
    const classesPerWeek = subject.lectureType === 'Lab' ? 2 : subject.lectureType === 'Tutorial' ? 1 : 3;
    const selectedDates = selectDatesFromClassPool(allDates, classesPerWeek, 14);
    const attendancePattern = generateAttendancePattern(selectedDates.length, target);

    selectedDates.forEach((date, idx) => {
      records.push({
        date: formatDate(date),
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        lectureType: subject.lectureType,
        status: attendancePattern[idx],
        subjectCode: subject.code,
      });
    });
  });

  // Generate for Sem 4: Jan 15 - May 10, 2024
  const sem4Subjects = SEMESTERS[3].subjects;
  const sem4Start = new Date('2024-01-15');
  const sem4End = new Date('2024-05-10');

  sem4Subjects.forEach(subject => {
    const target = targetPercentages[subject.code] || 75;
    const allDates = generateClassDates(sem4Start, sem4End, days);
    const classesPerWeek = subject.lectureType === 'Lab' ? 2 : subject.lectureType === 'Tutorial' ? 1 : 3;
    const selectedDates = selectDatesFromClassPool(allDates, classesPerWeek, 16);
    const attendancePattern = generateAttendancePattern(selectedDates.length, target);

    selectedDates.forEach((date, idx) => {
      records.push({
        date: formatDate(date),
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        lectureType: subject.lectureType,
        status: attendancePattern[idx],
        subjectCode: subject.code,
      });
    });
  });

  return records;
}

function generateClassDates(start: Date, end: Date, days: string[]): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][current.getDay()];
    if (days.includes(dayName)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function selectDatesFromClassPool(allDates: Date[], classesPerWeek: number, weeks: number): Date[] {
  const selected: Date[] = [];
  const weekGroups: Map<number, Date[]> = new Map();

  allDates.forEach(date => {
    const weekNum = Math.floor((date.getTime() - allDates[0].getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (!weekGroups.has(weekNum)) weekGroups.set(weekNum, []);
    weekGroups.get(weekNum)!.push(date);
  });

  weekGroups.forEach((weekDates, weekNum) => {
    if (weekNum >= weeks) return;
    const shuffled = [...weekDates].sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, Math.min(classesPerWeek, shuffled.length)));
  });

  return selected.sort((a, b) => a.getTime() - b.getTime());
}

function generateAttendancePattern(totalClasses: number, targetPct: number): AttendanceStatus[] {
  const targetPresent = Math.round((targetPct / 100) * totalClasses);
  const pattern: AttendanceStatus[] = [];

  let presentCount = 0;
  for (let i = 0; i < totalClasses; i++) {
    const remaining = totalClasses - i;
    const needed = targetPresent - presentCount;

    if (needed >= remaining) {
      pattern.push('P');
      presentCount++;
    } else if (needed <= 0) {
      const rand = Math.random();
      pattern.push(rand < 0.6 ? 'A' : 'L');
    } else {
      const rand = Math.random();
      const pChance = needed / remaining;
      if (rand < pChance) {
        pattern.push('P');
        presentCount++;
      } else {
        pattern.push(Math.random() < 0.7 ? 'A' : 'L');
      }
    }
  }

  // Shuffle to make it look natural
  for (let i = pattern.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
  }

  return pattern;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ============================================================
// ATTENDANCE SUMMARY CALCULATOR
// ============================================================
function calculateSummary(records: AttendanceRecord[]): AttendanceSummary {
  const total = records.length;
  const present = records.filter(r => r.status === 'P').length;
  const absent = records.filter(r => r.status === 'A').length;
  const leave = records.filter(r => r.status === 'L').length;
  const percentage = total > 0 ? (present / total) * 100 : 0;

  // Classes needed to reach 75% (if below)
  let classesToReach75 = 0;
  if (percentage < 75) {
    // Formula: (present + x) / (total + x) >= 0.75
    // x >= (0.75 * total - present) / (1 - 0.75)
    classesToReach75 = Math.ceil((0.75 * total - present) / 0.25);
  }

  let status: 'safe' | 'at_risk' | 'critical' = 'safe';
  if (percentage < 60) status = 'critical';
  else if (percentage < 75) status = 'at_risk';

  return { total, present, absent, leave, percentage, classesToReach75, status };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function StudentAttendancePage() {
  const [selectedSem, setSelectedSem] = useState(4);
  const [selectedSubject, setSelectedSubject] = useState('CS401');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [attendanceData] = useState<AttendanceRecord[]>(() => generateAttendanceData());

  const currentSemester = SEMESTERS.find(s => s.number === selectedSem)!;

  const subjectRecords = useMemo(() => {
    return attendanceData.filter(r => r.subjectCode === selectedSubject);
  }, [attendanceData, selectedSubject]);

  const summary = useMemo(() => calculateSummary(subjectRecords), [subjectRecords]);

  const monthGroups = useMemo(() => {
    const groups: Record<string, AttendanceRecord[]> = {};
    subjectRecords.forEach(r => {
      const key = getMonthKey(r.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [subjectRecords]);

  const monthKeys = useMemo(() => Object.keys(monthGroups).sort(), [monthGroups]);

  const filteredMonthKeys = useMemo(() => {
    if (selectedMonth === 'all') return monthKeys;
    return monthKeys.filter(k => k === selectedMonth);
  }, [monthKeys, selectedMonth]);

  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedMonths(new Set(filteredMonthKeys));
  }, [filteredMonthKeys]);

  const collapseAll = useCallback(() => {
    setExpandedMonths(new Set());
  }, []);

  const handleSemChange = (semNumber: number) => {
    const sem = SEMESTERS.find(s => s.number === semNumber);
    if (sem && !sem.isLocked) {
      setSelectedSem(semNumber);
      setSelectedSubject(sem.subjects[0].code);
      setSelectedMonth('all');
      setExpandedMonths(new Set());
    }
  };

  const handleSubjectChange = (code: string) => {
    setSelectedSubject(code);
    setSelectedMonth('all');
    setExpandedMonths(new Set());
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white pb-12">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg">Student Attendance Management</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Complete attendance tracking across all semesters</p>
            </div>
          </div>

          {/* Student Info Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <User className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[#C4B5FD]/70">Name:</span>
              <span className="font-bold text-white">{STUDENT.name}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <Hash className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[#C4B5FD]/70">Roll No:</span>
              <span className="font-mono font-bold text-white">{STUDENT.rollNo}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <GraduationCap className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[#C4B5FD]/70">Course:</span>
              <span className="font-bold text-white">{STUDENT.course}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/30">
              <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[#A78BFA]">Current Sem:</span>
              <span className="font-black text-white">{STUDENT.currentSem}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── LEFT SIDEBAR: Semester & Subject Navigation ─── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Semester Selector */}
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-4">
            <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Semesters
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {SEMESTERS.map(sem => {
                const isSelected = sem.number === selectedSem;
                const isDisabled = sem.isLocked;
                return (
                  <button
                    key={sem.number}
                    onClick={() => handleSemChange(sem.number)}
                    disabled={isDisabled}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                        : isDisabled
                        ? 'bg-white/3 text-white/20 cursor-not-allowed'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {sem.number}
                    {sem.number === STUDENT.currentSem && (
                      <span className="block text-[8px] text-[#A78BFA]">Current</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject List */}
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-4">
            <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Subjects — Sem {selectedSem}
            </h3>
            {currentSemester.isLocked ? (
              <div className="py-8 text-center">
                <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">No attendance data available</p>
                <p className="text-[10px] text-white/20 mt-1">Semester {selectedSem} is upcoming</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {currentSemester.subjects.map(subj => {
                  const subjRecords = attendanceData.filter(r => r.subjectCode === subj.code);
                  const pct = subjRecords.length > 0
                    ? (subjRecords.filter(r => r.status === 'P').length / subjRecords.length * 100)
                    : 0;
                  const isSelected = subj.code === selectedSubject;
                  const isBelow75 = pct < 75 && pct > 0;

                  return (
                    <button
                      key={subj.code}
                      onClick={() => handleSubjectChange(subj.code)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#6C2BD9] bg-[#6C2BD9]/10 shadow-md'
                          : 'border-white/5 bg-white/3 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-[#A78BFA]">{subj.code}</span>
                          <p className="text-xs font-bold text-white mt-0.5 leading-tight">{subj.name}</p>
                          <span className="text-[9px] text-[#C4B5FD]/40">{subj.lectureType}</span>
                        </div>
                        <div className="text-right">
                          {subjRecords.length > 0 ? (
                            <>
                              <span className={`text-sm font-black ${
                                pct >= 75 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {pct.toFixed(1)}%
                              </span>
                              {isBelow75 && (
                                <AlertTriangle className="w-3 h-3 text-red-400 ml-auto mt-0.5" />
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-white/20">--</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── MAIN CONTENT: Attendance Details ─── */}
        <div className="lg:col-span-9 space-y-5">
          {/* Summary Cards */}
          {!currentSemester.isLocked && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <SummaryCard
                label="Total Classes"
                value={summary.total}
                icon={<BarChart3 className="w-4 h-4 text-[#A78BFA]" />}
              />
              <SummaryCard
                label="Present"
                value={summary.present}
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-400]" />}
                valueClass="text-emerald-400"
              />
              <SummaryCard
                label="Absent"
                value={summary.absent}
                icon={<XCircle className="w-4 h-4 text-red-400" />}
                valueClass="text-red-400"
              />
              <SummaryCard
                label="Leave"
                value={summary.leave}
                icon={<Clock className="w-4 h-4 text-amber-400" />}
                valueClass="text-amber-400"
              />
              <SummaryCard
                label="Attendance"
                value={`${summary.percentage.toFixed(1)}%`}
                icon={<TrendingUp className={`w-4 h-4 ${summary.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`} />}
                valueClass={summary.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
          )}

          {/* Shortage Warning */}
          {!currentSemester.isLocked && summary.status !== 'safe' && (
            <div className={`rounded-2xl border p-4 ${
              summary.status === 'critical'
                ? 'border-red-500/30 bg-red-500/10'
                : 'border-amber-500/30 bg-amber-500/10'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  summary.status === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`} />
                <div>
                  <h4 className={`text-sm font-bold ${
                    summary.status === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {summary.status === 'critical' ? 'CRITICAL: Attendance Below 60%' : 'WARNING: Attendance Below 75%'}
                  </h4>
                  <p className="text-xs text-white/70 mt-1">
                    Current attendance: <strong>{summary.percentage.toFixed(1)}%</strong>
                    {summary.classesToReach75 > 0 && (
                      <> — You must attend <strong className="text-white">{summary.classesToReach75} consecutive class(es)</strong> to reach the 75% threshold.</>
                    )}
                  </p>
                  {summary.classesToReach75 > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[10px] text-[#C4B5FD]/60">
                        Formula: ({summary.present} + {summary.classesToReach75}) / ({summary.total} + {summary.classesToReach75}) × 100 ≥ 75%
                        = {((summary.present + summary.classesToReach75) / (summary.total + summary.classesToReach75) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Safe Buffer */}
          {!currentSemester.isLocked && summary.status === 'safe' && summary.percentage >= 75 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Safe Zone</h4>
                  <p className="text-xs text-white/70 mt-1">
                    You can miss up to <strong className="text-white">{Math.floor((summary.present - 0.75 * summary.total) / 0.75)}</strong> consecutive class(es) and still maintain 75% attendance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Month Filter & Controls */}
          {!currentSemester.isLocked && subjectRecords.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#C4B5FD]/50" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#13102A] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#6C2BD9]"
                >
                  <option value="all">All Months</option>
                  {monthKeys.map(key => (
                    <option key={key} value={key}>{getMonthLabel(key)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={expandAll} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-[#C4B5FD]/70 hover:bg-white/10 transition-all">
                  Expand All
                </button>
                <button onClick={collapseAll} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-[#C4B5FD]/70 hover:bg-white/10 transition-all">
                  Collapse All
                </button>
              </div>
            </div>
          )}

          {/* Attendance Records - Month-wise Collapsible */}
          {!currentSemester.isLocked && (
            <div className="space-y-3">
              {filteredMonthKeys.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/40 p-12 text-center">
                  <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/30">No attendance records for this selection</p>
                </div>
              ) : (
                filteredMonthKeys.map(monthKey => {
                  const monthRecords = monthGroups[monthKey];
                  const monthSummary = calculateSummary(monthRecords);
                  const isExpanded = expandedMonths.has(monthKey);

                  return (
                    <div key={monthKey} className="rounded-2xl border border-white/5 bg-[#13102A]/40 overflow-hidden">
                      {/* Month Header */}
                      <button
                        onClick={() => toggleMonth(monthKey)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#A78BFA]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#A78BFA]" />
                          )}
                          <span className="text-sm font-bold text-white">{getMonthLabel(monthKey)}</span>
                          <span className="text-[10px] text-[#C4B5FD]/40">{monthRecords.length} classes</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-emerald-400 font-bold">{monthSummary.present}P</span>
                          <span className="text-red-400 font-bold">{monthSummary.absent}A</span>
                          <span className="text-amber-400 font-bold">{monthSummary.leave}L</span>
                          <span className={`font-black ${
                            monthSummary.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {monthSummary.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </button>

                      {/* Month Records */}
                      {isExpanded && (
                        <div className="border-t border-white/5">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[#C4B5FD]/40 border-b border-white/5">
                                <th className="px-4 py-2 font-bold">Date</th>
                                <th className="px-4 py-2 font-bold">Day</th>
                                <th className="px-4 py-2 font-bold">Type</th>
                                <th className="px-4 py-2 font-bold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthRecords.map((record, idx) => (
                                <tr key={idx} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                                  <td className="px-4 py-2.5 font-mono text-white">{record.date}</td>
                                  <td className="px-4 py-2.5 text-[#C4B5FD]/70">{record.day}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      record.lectureType === 'Theory'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : record.lectureType === 'Lab'
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}>
                                      {record.lectureType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                                      record.status === 'P'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                        : record.status === 'A'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                    }`}>
                                      {record.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Locked Semester Placeholder */}
          {currentSemester.isLocked && (
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/40 p-12 text-center">
              <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white/30">Semester {selectedSem} — Upcoming</h3>
              <p className="text-xs text-white/20 mt-2 max-w-md mx-auto">
                Attendance data will be available once classes begin. This semester is currently locked and view-only.
              </p>
              <div className="mt-6 grid grid-cols-5 gap-2 max-w-lg mx-auto">
                {currentSemester.subjects.map(subj => (
                  <div key={subj.code} className="p-2 rounded-lg bg-white/3 border border-white/5">
                    <span className="text-[9px] font-mono text-white/20">{subj.code}</span>
                    <p className="text-[9px] text-white/15 mt-0.5 truncate">{subj.name}</p>
                    <span className="text-[10px] font-black text-white/10 mt-1 block">0%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD SUB-COMPONENT
// ============================================================
function SummaryCard({
  label,
  value,
  icon,
  valueClass = 'text-white',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[9px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className={`text-xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}
