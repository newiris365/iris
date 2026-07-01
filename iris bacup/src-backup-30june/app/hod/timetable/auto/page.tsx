"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Plus,
  Trash2,
  Zap,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Settings,
  Wand2,
  Save,
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SUBJECT_COLORS = [
  'from-cyan-500/30 to-cyan-600/20 border-cyan-500/40 text-cyan-300',
  'from-violet-500/30 to-violet-600/20 border-violet-500/40 text-violet-300',
  'from-emerald-500/30 to-emerald-600/20 border-emerald-500/40 text-emerald-300',
  'from-amber-500/30 to-amber-600/20 border-amber-500/40 text-amber-300',
  'from-rose-500/30 to-rose-600/20 border-rose-500/40 text-rose-300',
  'from-blue-500/30 to-blue-600/20 border-blue-500/40 text-blue-300',
  'from-fuchsia-500/30 to-fuchsia-600/20 border-fuchsia-500/40 text-fuchsia-300',
  'from-teal-500/30 to-teal-600/20 border-teal-500/40 text-teal-300',
];

interface SubjectEntry {
  id: string;
  name: string;
  teacherName: string;
  classesPerWeek: number;
  periodsPerClass: number;
}

interface PeriodConfig {
  durationMinutes: number;
  periodsPerDay: number;
  startTime: string;
  breakAfterPeriod: number;
  breakDuration: number;
}

interface TeacherLoad {
  maxPeriodsPerDay: number;
}

interface TimetableCell {
  subject: string;
  teacher: string;
  room: string;
  colorIndex: number;
}

type TimetableGrid = (TimetableCell | null)[][];

interface ConflictInfo {
  type: string;
  message: string;
  day: string;
  period: number;
  severity: 'high' | 'medium' | 'low';
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getPeriodTimes(config: PeriodConfig): string[] {
  const times: string[] = [];
  const [startH, startM] = config.startTime.split(':').map(Number);
  let currentMinutes = startH * 60 + startM;

  for (let i = 0; i < config.periodsPerDay; i++) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += config.durationMinutes;
    if (i === config.breakAfterPeriod - 1 && config.breakDuration > 0) {
      currentMinutes += config.breakDuration;
    }
  }
  return times;
}

function distributeTimetable(
  subjects: SubjectEntry[],
  config: PeriodConfig,
  teacherLoad: TeacherLoad
): { grid: TimetableGrid; conflicts: ConflictInfo[] } {
  const grid: TimetableGrid = DAYS.map(() =>
    Array(config.periodsPerDay).fill(null)
  );
  const conflicts: ConflictInfo[] = [];

  const teacherDailyCount: Record<string, Record<string, number>> = {};
  DAYS.forEach(d => {
    teacherDailyCount[d] = {};
  });

  const totalSlots = DAYS.length * config.periodsPerDay;
  const assignments: { subject: SubjectEntry; slotsNeeded: number }[] = [];

  subjects.forEach(s => {
    if (s.name) {
      const slotsNeeded = s.classesPerWeek * s.periodsPerClass;
      assignments.push({ subject: s, slotsNeeded });
    }
  });

  assignments.sort((a, b) => b.slotsNeeded - a.slotsNeeded);

  const availableSlots: { day: number; period: number }[] = [];
  for (let d = 0; d < DAYS.length; d++) {
    for (let p = 0; p < config.periodsPerDay; p++) {
      availableSlots.push({ day: d, period: p });
    }
  }

  const shuffledSlots = [...availableSlots].sort(() => Math.random() - 0.5);

  for (const assignment of assignments) {
    let placed = 0;
    const { subject, slotsNeeded } = assignment;

    for (let attempt = 0; attempt < shuffledSlots.length && placed < slotsNeeded; attempt++) {
      const slot = shuffledSlots[attempt];
      if (!slot) continue;

      const { day, period } = slot;
      if (grid[day][period] !== null) continue;

      const teacher = subject.teacherName;
      if (teacher && (teacherDailyCount[DAYS[day]][teacher] || 0) >= teacherLoad.maxPeriodsPerDay) {
        continue;
      }

      grid[day][period] = {
        subject: subject.name,
        teacher: subject.teacherName,
        room: '',
        colorIndex: subjects.indexOf(subject) % SUBJECT_COLORS.length,
      };

      if (teacher) {
        teacherDailyCount[DAYS[day]][teacher] = (teacherDailyCount[DAYS[day]][teacher] || 0) + 1;
      }
      placed++;
    }

    if (placed < slotsNeeded) {
      conflicts.push({
        type: 'placement',
        message: `"${subject.name}" needs ${slotsNeeded} slots but only ${placed} could be placed (teacher load or no space)`,
        day: 'N/A',
        period: 0,
        severity: 'medium',
      });
    }
  }

  for (let d = 0; d < DAYS.length; d++) {
    const teacherSlots: Record<string, number[]> = {};
    for (let p = 0; p < config.periodsPerDay; p++) {
      const cell = grid[d][p];
      if (cell && cell.teacher) {
        if (!teacherSlots[cell.teacher]) teacherSlots[cell.teacher] = [];
        teacherSlots[cell.teacher].push(p);
      }
    }
    Object.entries(teacherSlots).forEach(([teacher, periods]) => {
      for (let i = 1; i < periods.length; i++) {
        if (periods[i] - periods[i - 1] === 1) {
          const nextCell = grid[d][periods[i]];
          const prevCell = grid[d][periods[i - 1]];
          if (nextCell && prevCell && nextCell.subject !== prevCell.subject) {
            conflicts.push({
              type: 'consecutive',
              message: `${teacher} has back-to-back different subjects on ${DAYS[d]}`,
              day: DAYS[d],
              period: periods[i],
              severity: 'low',
            });
          }
        }
      }
    });
  }

  return { grid, conflicts };
}

function loadDemoData(): SubjectEntry[] {
  return [
    { id: generateId(), name: 'Mathematics', teacherName: 'Prof. Raghav Sharma', classesPerWeek: 4, periodsPerClass: 1 },
    { id: generateId(), name: 'Physics', teacherName: 'Dr. Ananya Mehta', classesPerWeek: 3, periodsPerClass: 1 },
    { id: generateId(), name: 'Computer Science', teacherName: 'Prof. Satish Kumar', classesPerWeek: 3, periodsPerClass: 2 },
    { id: generateId(), name: 'English', teacherName: 'Dr. Priya Nair', classesPerWeek: 2, periodsPerClass: 1 },
    { id: generateId(), name: 'Chemistry', teacherName: 'Prof. Kiran Das', classesPerWeek: 3, periodsPerClass: 1 },
    { id: generateId(), name: 'Data Structures', teacherName: 'Dr. Amit Mehta', classesPerWeek: 2, periodsPerClass: 2 },
  ];
}

export default function HodAutoTimetablePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [subjects, setSubjects] = useState<SubjectEntry[]>(loadDemoData());
  const [periodConfig, setPeriodConfig] = useState<PeriodConfig>({
    durationMinutes: 45,
    periodsPerDay: 6,
    startTime: '09:00',
    breakAfterPeriod: 3,
    breakDuration: 15,
  });
  const [teacherLoad, setTeacherLoad] = useState<TeacherLoad>({
    maxPeriodsPerDay: 4,
  });
  const [timetable, setTimetable] = useState<TimetableGrid | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('subjects');
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await apiGet('staff');
        if (res.success && res.staff) setStaff(res.staff);
      } catch (err) {
        console.error(err);
      }
    };
    loadStaff();
  }, []);

  const addSubject = () => {
    setSubjects([
      ...subjects,
      { id: generateId(), name: '', teacherName: '', classesPerWeek: 3, periodsPerClass: 1 },
    ]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubject = (id: string, field: keyof SubjectEntry, value: any) => {
    setSubjects(subjects.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const totalWeeklyPeriods = useMemo(() => {
    const perDay = periodConfig.periodsPerDay;
    const breakReduction = periodConfig.breakAfterPeriod > 0 &&
      periodConfig.breakAfterPeriod <= perDay ? 1 : 0;
    const effective = perDay - breakReduction;
    return effective * DAYS.length;
  }, [periodConfig]);

  const subjectDemand = useMemo(() => {
    return subjects.reduce((sum, s) => sum + (s.classesPerWeek * s.periodsPerClass), 0);
  }, [subjects]);

  const handleAutoGenerate = useCallback(async () => {
    setIsGenerating(true);
    setConflicts([]);
    setShowResult(false);

    try {
      const payload = {
        subjects: subjects.map(s => ({
          name: s.name,
          teacher_name: s.teacherName,
          classes_per_week: s.classesPerWeek,
          periods_per_class: s.periodsPerClass,
        })),
        period_config: periodConfig,
        teacher_load: teacherLoad,
      };

      let res: any;
      try {
        res = await apiPost('campusCore/timetable/auto-generate', payload);
      } catch {
        res = null;
      }

      if (res && res.success && res.grid) {
        setTimetable(res.grid);
        setConflicts(res.conflicts || []);
      } else {
        const { grid, conflicts: genConflicts } = distributeTimetable(
          subjects,
          periodConfig,
          teacherLoad
        );
        setTimetable(grid);
        setConflicts(genConflicts);
      }

      setShowResult(true);
    } catch (err) {
      console.error(err);
      const { grid, conflicts: genConflicts } = distributeTimetable(
        subjects,
        periodConfig,
        teacherLoad
      );
      setTimetable(grid);
      setConflicts(genConflicts);
      setShowResult(true);
    } finally {
      setIsGenerating(false);
    }
  }, [subjects, periodConfig, teacherLoad]);

  const handleSaveTimetable = async () => {
    if (!timetable) return;
    try {
      await apiPost('campusCore/timetable/save', {
        grid: timetable,
        config: periodConfig,
        teacher_load: teacherLoad,
      });
    } catch {
      console.error('Save failed');
    }
  };

  const periodTimes = useMemo(() => getPeriodTimes(periodConfig), [periodConfig]);

  const getSubjectColorClass = (colorIndex: number): string => {
    return SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
  };

  const steps = [
    { label: 'Subjects', icon: BookOpen },
    { label: 'Periods', icon: Clock },
    { label: 'Teachers', icon: Users },
    { label: 'Generate', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-[#0891B2]/20 bg-gradient-to-r from-[#0D0A1A] via-[#0F1A2E] to-[#0D0A1A] p-6 md:p-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0891B2]/5 rounded-full blur-3xl -z-10" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/20">
                <Wand2 size={28} className="text-[#0891B2]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#67E8F9] to-[#0891B2] bg-clip-text text-transparent">
                  Auto Timetable Generator
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Configure subjects, periods and teacher loads then generate a conflict-free weekly timetable.
                </p>
              </div>
            </div>
            {showResult && (
              <button
                onClick={handleSaveTimetable}
                className="px-5 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0891B2]/80 text-white text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Save size={16} />
                Save Timetable
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeStep;
            const isDone = idx < activeStep;
            return (
              <button
                key={step.label}
                onClick={() => setActiveStep(idx)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#0891B2]/15 border border-[#0891B2]/30 text-[#0891B2]'
                    : isDone
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                <span className="hidden md:inline">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Step 0: Subjects */}
            {activeStep === 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-[#0891B2]" />
                    Subject Configuration
                  </h2>
                  <button
                    onClick={() => {
                      setSubjects(loadDemoData());
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-medium hover:bg-slate-600/50 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw size={12} />
                    Load Demo
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Add subjects with teacher assignment, weekly frequency and number of periods per class session.
                </p>

                <div className="space-y-3">
                  {subjects.map((subject, idx) => (
                    <div
                      key={subject.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 w-6">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <input
                          type="text"
                          value={subject.name}
                          onChange={e => updateSubject(subject.id, 'name', e.target.value)}
                          placeholder="Subject name (e.g. Mathematics)"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0891B2]/50"
                        />
                        <select
                          value={subject.teacherName}
                          onChange={e => updateSubject(subject.id, 'teacherName', e.target.value)}
                          className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0891B2]/50"
                        >
                          <option value="">Select teacher</option>
                          {staff.map((st: any) => (
                            <option key={st.id} value={st.users?.full_name || st.id}>
                              {st.users?.full_name || st.id}
                            </option>
                          ))}
                          <option value="Prof. Raghav Sharma">Prof. Raghav Sharma</option>
                          <option value="Dr. Ananya Mehta">Dr. Ananya Mehta</option>
                          <option value="Prof. Satish Kumar">Prof. Satish Kumar</option>
                          <option value="Dr. Priya Nair">Dr. Priya Nair</option>
                          <option value="Prof. Kiran Das">Prof. Kiran Das</option>
                          <option value="Dr. Amit Mehta">Dr. Amit Mehta</option>
                        </select>
                        {subjects.length > 1 && (
                          <button
                            onClick={() => removeSubject(subject.id)}
                            className="text-red-400/70 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Classes/Week</label>
                          <input
                            type="number"
                            value={subject.classesPerWeek}
                            onChange={e =>
                              updateSubject(subject.id, 'classesPerWeek', Math.max(1, parseInt(e.target.value) || 1))
                            }
                            min={1}
                            max={10}
                            className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-[#0891B2]/50"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Periods/Class</label>
                          <input
                            type="number"
                            value={subject.periodsPerClass}
                            onChange={e =>
                              updateSubject(subject.id, 'periodsPerClass', Math.max(1, parseInt(e.target.value) || 1))
                            }
                            min={1}
                            max={4}
                            className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-[#0891B2]/50"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 ml-auto">
                          Total: <span className="text-[#0891B2] font-bold">{subject.classesPerWeek * subject.periodsPerClass}</span> periods/week
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addSubject}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-[#0891B2]/30 hover:text-[#0891B2] text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={16} />
                  Add Subject
                </button>
              </div>
            )}

            {/* Step 1: Period Config */}
            {activeStep === 1 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock size={20} className="text-[#0891B2]" />
                  Period Configuration
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Duration (min)
                    </label>
                    <select
                      value={periodConfig.durationMinutes}
                      onChange={e =>
                        setPeriodConfig({ ...periodConfig, durationMinutes: parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0891B2]/50"
                    >
                      {[30, 35, 40, 45, 50, 55, 60].map(d => (
                        <option key={d} value={d}>
                          {d} min
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Periods / Day
                    </label>
                    <select
                      value={periodConfig.periodsPerDay}
                      onChange={e =>
                        setPeriodConfig({ ...periodConfig, periodsPerDay: parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0891B2]/50"
                    >
                      {[4, 5, 6, 7, 8].map(p => (
                        <option key={p} value={p}>
                          {p} periods
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={periodConfig.startTime}
                      onChange={e => setPeriodConfig({ ...periodConfig, startTime: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0891B2]/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Break After Period
                    </label>
                    <select
                      value={periodConfig.breakAfterPeriod}
                      onChange={e =>
                        setPeriodConfig({ ...periodConfig, breakAfterPeriod: parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0891B2]/50"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map(p => (
                        <option key={p} value={p}>
                          {p === 0 ? 'No break' : `After Period ${p}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {periodConfig.breakAfterPeriod > 0 && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <label className="text-xs text-amber-300 font-bold whitespace-nowrap">
                      Break Duration
                    </label>
                    <select
                      value={periodConfig.breakDuration}
                      onChange={e =>
                        setPeriodConfig({ ...periodConfig, breakDuration: parseInt(e.target.value) })
                      }
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    >
                      {[5, 10, 15, 20, 25, 30].map(d => (
                        <option key={d} value={d}>
                          {d} min
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Visual Preview */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Daily Schedule Preview
                  </h3>
                  <div className="space-y-1">
                    {periodTimes.map((time, idx) => {
                      const [h, m] = time.split(':').map(Number);
                      const endMinutes = h * 60 + m + periodConfig.durationMinutes;
                      const endH = Math.floor(endMinutes / 60);
                      const endM = endMinutes % 60;
                      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                      const isBreak = periodConfig.breakAfterPeriod > 0 && idx === periodConfig.breakAfterPeriod;

                      return (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                            <span className="text-xs font-mono text-[#0891B2] w-28">
                              {time} – {endTime}
                            </span>
                            <span className="text-xs text-slate-300 font-bold">
                              Period {idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {periodConfig.durationMinutes} min
                            </span>
                          </div>
                          {isBreak && idx < periodTimes.length - 1 && (
                            <div className="flex items-center gap-3 bg-amber-500/10 rounded-lg px-3 py-1.5 border border-amber-500/20">
                              <span className="text-[10px] font-mono text-amber-400">BREAK</span>
                              <span className="text-[10px] text-amber-400/60">{periodConfig.breakDuration} min</span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Teacher Load */}
            {activeStep === 2 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-[#0891B2]" />
                  Teacher Load Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Max Periods / Teacher / Day
                    </label>
                    <select
                      value={teacherLoad.maxPeriodsPerDay}
                      onChange={e =>
                        setTeacherLoad({ maxPeriodsPerDay: parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0891B2]/50"
                    >
                      {[2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>
                          {n} periods / day
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      A teacher cannot be assigned more than this many periods in a single day.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Days Active
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <span
                          key={day}
                          className="px-3 py-1.5 rounded-lg bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] text-xs font-bold"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Teacher Summary */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Teacher Workload Summary
                  </h3>
                  <div className="space-y-2">
                    {subjects
                      .filter(s => s.teacherName)
                      .reduce((acc: { teacher: string; totalPeriods: number; subjects: string[] }[], s) => {
                        const existing = acc.find(a => a.teacher === s.teacherName);
                        if (existing) {
                          existing.totalPeriods += s.classesPerWeek * s.periodsPerClass;
                          existing.subjects.push(s.name);
                        } else {
                          acc.push({
                            teacher: s.teacherName,
                            totalPeriods: s.classesPerWeek * s.periodsPerClass,
                            subjects: [s.name],
                          });
                        }
                        return acc;
                      }, [])
                      .map((t, idx) => {
                        const maxWeekly = teacherLoad.maxPeriodsPerDay * DAYS.length;
                        const loadPct = Math.round((t.totalPeriods / maxWeekly) * 100);
                        const isOverloaded = t.totalPeriods > maxWeekly;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                              isOverloaded
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-white/5 border-white/5'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#0891B2]/15 flex items-center justify-center text-[#0891B2] text-xs font-bold">
                              {t.teacher.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{t.teacher}</p>
                              <p className="text-[10px] text-slate-500 truncate">{t.subjects.join(', ')}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs font-bold ${isOverloaded ? 'text-red-400' : 'text-[#0891B2]'}`}>
                                {t.totalPeriods}/{maxWeekly}
                              </p>
                              <p className="text-[10px] text-slate-500">{loadPct}% load</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Generate & Result */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap size={20} className="text-[#0891B2]" />
                    Generate Timetable
                  </h2>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                      <p className="text-2xl font-extrabold text-[#0891B2]">{subjects.filter(s => s.name).length}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Subjects</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                      <p className="text-2xl font-extrabold text-[#0891B2]">{totalWeeklyPeriods}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Available Slots</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                      <p className={`text-2xl font-extrabold ${subjectDemand > totalWeeklyPeriods ? 'text-red-400' : 'text-emerald-400'}`}>
                        {subjectDemand}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Required Slots</p>
                    </div>
                  </div>

                  {subjectDemand > totalWeeklyPeriods && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <AlertTriangle size={16} className="text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">
                        Demand ({subjectDemand} slots) exceeds available slots ({totalWeeklyPeriods}).
                        Reduce classes/week or add more periods/day.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAutoGenerate}
                    disabled={
                      isGenerating ||
                      subjects.filter(s => s.name).length === 0 ||
                      subjectDemand > totalWeeklyPeriods
                    }
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0891B2] to-[#06B6D4] text-white font-extrabold text-sm flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all shadow-lg shadow-[#0891B2]/20"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        Generating Optimal Timetable...
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} />
                        Auto-Generate Timetable
                      </>
                    )}
                  </button>
                </div>

                {/* Result Grid */}
                {showResult && timetable && (
                  <>
                    {conflicts.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                        <h3 className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Conflicts Detected ({conflicts.length})
                        </h3>
                        <div className="space-y-2">
                          {conflicts.map((c, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                                c.severity === 'high'
                                  ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                  : c.severity === 'medium'
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                              }`}
                            >
                              <span className="font-bold uppercase">{c.type}</span>
                              <span>{c.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conflicts.length === 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle size={20} className="text-emerald-400" />
                        <p className="text-emerald-400 font-bold text-sm">
                          No conflicts found! Timetable generated successfully.
                        </p>
                      </div>
                    )}

                    {/* Timetable Grid */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 overflow-x-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Calendar size={20} className="text-[#0891B2]" />
                          Generated Timetable
                        </h2>
                        <button
                          onClick={handleAutoGenerate}
                          className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-bold hover:bg-slate-600/50 flex items-center gap-1.5 transition-all"
                        >
                          <RefreshCw size={12} />
                          Regenerate
                        </button>
                      </div>

                      <div className="min-w-[800px]">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${periodConfig.periodsPerDay}, 1fr)` }}>
                          {/* Header */}
                          <div className="p-2 text-center">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Day</span>
                          </div>
                          {periodTimes.map((time, pIdx) => (
                            <div key={`ph-${pIdx}`} className="p-2 text-center bg-white/5 rounded-t-xl">
                              <span className="text-[10px] font-bold text-[#0891B2] block">
                                P{pIdx + 1}
                              </span>
                              <span className="text-[9px] text-slate-500 block">{time}</span>
                            </div>
                          ))}

                          {/* Days */}
                          {DAYS.map((day, dIdx) => (
                            <React.Fragment key={day}>
                              <div className="p-2 flex items-center justify-center bg-[#0891B2]/5 rounded-l-xl border border-[#0891B2]/10">
                                <span className="text-xs font-bold text-[#0891B2]">{SHORT_DAYS[dIdx]}</span>
                              </div>
                              {Array.from({ length: periodConfig.periodsPerDay }).map((_, pIdx) => {
                                const cell = timetable[dIdx]?.[pIdx];
                                const isBreakPeriod =
                                  periodConfig.breakAfterPeriod > 0 &&
                                  pIdx === periodConfig.breakAfterPeriod - 1;

                                if (isBreakPeriod && !cell) {
                                  return (
                                    <div
                                      key={`${dIdx}-${pIdx}`}
                                      className="p-1.5 min-h-[70px] flex items-center justify-center bg-amber-500/5 border border-amber-500/10 rounded-xl"
                                    >
                                      <span className="text-[9px] text-amber-400/50 font-bold uppercase">Break</span>
                                    </div>
                                  );
                                }

                                if (!cell) {
                                  return (
                                    <div
                                      key={`${dIdx}-${pIdx}`}
                                      className="p-1.5 min-h-[70px] bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center"
                                    >
                                      <span className="text-[9px] text-slate-700">—</span>
                                    </div>
                                  );
                                }

                                const colorClass = getSubjectColorClass(cell.colorIndex);

                                return (
                                  <div
                                    key={`${dIdx}-${pIdx}`}
                                    className={`p-1.5 min-h-[70px] rounded-xl border bg-gradient-to-br ${colorClass} flex flex-col justify-center`}
                                  >
                                    <p className="text-[10px] font-extrabold leading-tight truncate">
                                      {cell.subject}
                                    </p>
                                    <p className="text-[8px] opacity-70 truncate mt-0.5">{cell.teacher}</p>
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Legend</p>
                        <div className="flex flex-wrap gap-2">
                          {subjects
                            .filter(s => s.name)
                            .map((s, idx) => (
                              <span
                                key={s.id}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold border bg-gradient-to-br ${getSubjectColorClass(idx)}`}
                              >
                                {s.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings size={16} className="text-[#0891B2]" />
                Configuration Summary
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Period Settings</p>
                  <p className="text-xs text-white font-bold">
                    {periodConfig.durationMinutes} min x {periodConfig.periodsPerDay} periods/day
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Starts at {periodConfig.startTime}
                    {periodConfig.breakAfterPeriod > 0 &&
                      ` • ${periodConfig.breakDuration}min break after P${periodConfig.breakAfterPeriod}`}
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Teacher Load</p>
                  <p className="text-xs text-white font-bold">
                    Max {teacherLoad.maxPeriodsPerDay} periods / teacher / day
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Max {teacherLoad.maxPeriodsPerDay * 6} periods / teacher / week
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-xs text-white font-bold">
                    {totalWeeklyPeriods} total slots / week
                  </p>
                  <p className={`text-[10px] ${subjectDemand > totalWeeklyPeriods ? 'text-red-400' : 'text-emerald-400'}`}>
                    {subjectDemand} required ({Math.round((subjectDemand / totalWeeklyPeriods) * 100)}% utilization)
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Subjects</p>
                  <p className="text-xs text-white font-bold">
                    {subjects.filter(s => s.name).length} configured
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Set(subjects.filter(s => s.name && s.teacherName).map(s => s.teacherName)).size} unique teachers
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Quick Actions</h3>
              <button
                onClick={() => {
                  setSubjects(loadDemoData());
                  setPeriodConfig({
                    durationMinutes: 45,
                    periodsPerDay: 6,
                    startTime: '09:00',
                    breakAfterPeriod: 3,
                    breakDuration: 15,
                  });
                  setTeacherLoad({ maxPeriodsPerDay: 4 });
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all"
              >
                Reset All Settings
              </button>
              <button
                onClick={() => setActiveStep(3)}
                disabled={subjects.filter(s => s.name).length === 0}
                className="w-full py-2.5 rounded-xl bg-[#0891B2]/15 border border-[#0891B2]/20 text-[#0891B2] text-xs font-bold hover:bg-[#0891B2]/25 transition-all disabled:opacity-40"
              >
                Jump to Generate
              </button>
            </div>

            {/* Tips */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                Tips
              </h3>
              <ul className="space-y-2">
                <li className="text-[10px] text-slate-400 leading-relaxed">
                  Ensure total subject demand does not exceed available slots. Adjust classes/week or periods/day accordingly.
                </li>
                <li className="text-[10px] text-slate-400 leading-relaxed">
                  Set a reasonable max periods per teacher to avoid overload. 4–5 per day is typical.
                </li>
                <li className="text-[10px] text-slate-400 leading-relaxed">
                  Use "Load Demo" to populate sample data and experiment with the generator.
                </li>
                <li className="text-[10px] text-slate-400 leading-relaxed">
                  Regenerate multiple times if needed — the round-robin algorithm randomizes placement for variety.
                </li>
              </ul>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Subject Breakdown</h3>
              <div className="space-y-2">
                {subjects
                  .filter(s => s.name)
                  .map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-br ${getSubjectColorClass(idx).split(' ')[0]}`}
                      />
                      <span className="text-[10px] text-slate-300 flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] text-[#0891B2] font-bold">
                        {s.classesPerWeek * s.periodsPerClass}p
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
