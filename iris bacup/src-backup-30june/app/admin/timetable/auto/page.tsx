"use client";

import React, { useState, useEffect } from 'react';
import {
  Wand2, AlertTriangle, CheckCircle2, Clock, Plus, Trash2, ArrowLeft, Zap
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

interface SubjectInput {
  name: string;
  hours_per_week: number;
  teacher_id: string;
  room: string;
}

interface Conflict {
  type: string;
  slot: any;
  conflict_with: any;
}

export default function TimetableAutoPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [semester, setSemester] = useState('1');
  const [batchYear, setBatchYear] = useState(new Date().getFullYear().toString());

  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { name: '', hours_per_week: 3, teacher_id: '', room: '' },
  ]);

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [result, setResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Constraints
  const [constraints, setConstraints] = useState<any[]>([]);
  const [showConstraintForm, setShowConstraintForm] = useState(false);
  const [constraintForm, setConstraintForm] = useState({
    constraint_type: 'teacher_unavailable',
    teacher_id: '', room: '', day_of_week: '', time_slot: '', max_hours_per_day: '6', notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [deptRes, staffRes] = await Promise.all([
          apiGet('campusCore/users/departments', { 
            institution_id: JSON.parse(localStorage.getItem('iris_user_profile') || '{}').institution_id 
          }),
          apiGet('staff'),
        ]);
        setDepartments(deptRes.departments || []);
        if (staffRes.success) setStaff(staffRes.staff || []);
      } catch (err) {
        console.error(err);
        setDepartments([]);
      }
    };
    load();
    loadConstraints();
  }, []);

  const loadConstraints = async () => {
    const res = await apiGet('campusCore/timetable/constraints');
    if (res.success) setConstraints(res.constraints || []);
  };

  const addSubject = () => {
    setSubjects([...subjects, { name: '', hours_per_week: 3, teacher_id: '', room: '' }]);
  };

  const removeSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const updateSubject = (idx: number, field: string, value: any) => {
    const updated = [...subjects];
    (updated[idx] as any)[field] = value;
    setSubjects(updated);
  };

  // Detect conflicts
  const handleDetectConflicts = async () => {
    setIsChecking(true);
    setConflicts([]);
    try {
      // Build virtual slots from subjects
      const slots = subjects.flatMap((s, si) =>
        Array.from({ length: s.hours_per_week }, (_, i) => ({
          teacher_id: s.teacher_id || null,
          room: s.room,
          day_of_week: DAYS[i % DAYS.length],
          time_slot: SLOTS[(si + i) % SLOTS.length],
          subject: s.name,
        }))
      );
      const res = await apiPost('campusCore/timetable/detect-conflicts', { slots });
      if (res.success) {
        setConflicts(res.conflicts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-generate
  const handleAutoGenerate = async () => {
    if (!selectedDept || subjects.every(s => !s.name)) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await apiPost('campusCore/timetable/auto-generate', {
        department_id: selectedDept,
        semester: parseInt(semester),
        batch_year: batchYear,
        subjects,
      });
      if (res.success) {
        setResult(res);
        setConflicts(res.conflicts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddConstraint = async () => {
    const res = await apiPost('campusCore/timetable/constraints', constraintForm);
    if (res.success) {
      setShowConstraintForm(false);
      loadConstraints();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/timetable" className="text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 size={24} className="text-violet-400" />
            Timetable Auto-Generator
          </h1>
        </div>
        <button onClick={() => setShowConstraintForm(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Add Constraint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Subjects & Teachers</h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={semester} onChange={e => setSemester(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                {Array.from({length:8},(_,i)=>(
                  <option key={i+1} value={i+1}>Semester {i+1}</option>
                ))}
              </select>
              <input type="text" value={batchYear} onChange={e => setBatchYear(e.target.value)}
                placeholder="Batch Year"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>

            <div className="space-y-3">
              {subjects.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/5">
                  <input type="text" value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)}
                    placeholder="Subject name" className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm" />
                  <input type="number" value={s.hours_per_week} onChange={e => updateSubject(i, 'hours_per_week', parseInt(e.target.value) || 1)}
                    min="1" max="10" className="w-20 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm text-center" />
                  <select value={s.teacher_id} onChange={e => updateSubject(i, 'teacher_id', e.target.value)}
                    className="w-48 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm">
                    <option value="">No teacher</option>
                    {staff.map(st => <option key={st.id} value={st.id}>{st.users?.full_name || st.id}</option>)}
                  </select>
                  <input type="text" value={s.room} onChange={e => updateSubject(i, 'room', e.target.value)}
                    placeholder="Room" className="w-24 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm" />
                  {subjects.length > 1 && (
                    <button onClick={() => removeSubject(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addSubject}
              className="mt-3 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm flex items-center gap-2">
              <Plus size={16} /> Add Subject
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={handleDetectConflicts} disabled={isChecking || subjects.every(s => !s.name)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 flex items-center gap-2 disabled:opacity-50">
              <AlertTriangle size={18} /> {isChecking ? 'Checking...' : 'Detect Conflicts'}
            </button>
            <button onClick={handleAutoGenerate} disabled={isGenerating || !selectedDept || subjects.every(s => !s.name)}
              className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 flex items-center gap-2 disabled:opacity-50">
              <Zap size={18} /> {isGenerating ? 'Generating...' : 'Auto-Generate Timetable'}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} /> Generated {result.slots_inserted} timetable slots
              </p>
              {result.conflict_count > 0 && (
                <p className="text-amber-400 text-sm mt-1">{result.conflict_count} conflicts detected</p>
              )}
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> Conflicts Found ({conflicts.length})
              </h3>
              <div className="space-y-2">
                {conflicts.map((c, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2 text-sm">
                    <span className="text-red-400 font-medium capitalize">{c.type} conflict</span>
                    <span className="text-slate-400"> — {c.slot?.day_of_week} {c.slot?.time_slot}</span>
                    <span className="text-slate-300"> ({c.slot?.subject})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Constraints Sidebar */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            Constraints
          </h2>
          {constraints.length === 0 ? (
            <p className="text-slate-400 text-sm">No constraints defined.</p>
          ) : (
            <div className="space-y-2">
              {constraints.map((c) => (
                <div key={c.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-sm font-medium text-white capitalize">{c.constraint_type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400">
                    {c.day_of_week || 'Any day'} {c.time_slot || 'Any time'}
                    {c.max_hours_per_day ? ` (max ${c.max_hours_per_day}h/day)` : ''}
                  </p>
                  {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Constraint Form Modal */}
      {showConstraintForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add Timetable Constraint</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Constraint Type</label>
                <select value={constraintForm.constraint_type}
                  onChange={e => setConstraintForm({...constraintForm, constraint_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  {['teacher_unavailable', 'room_unavailable', 'batch_unavailable', 'max_daily_hours', 'no_back_to_back_lab', 'preferred_slot'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Teacher</label>
                <select value={constraintForm.teacher_id}
                  onChange={e => setConstraintForm({...constraintForm, teacher_id: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Any teacher</option>
                  {staff.map(st => <option key={st.id} value={st.id}>{st.users?.full_name || st.id}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Day</label>
                  <select value={constraintForm.day_of_week}
                    onChange={e => setConstraintForm({...constraintForm, day_of_week: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Any day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Time Slot</label>
                  <select value={constraintForm.time_slot}
                    onChange={e => setConstraintForm({...constraintForm, time_slot: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Any time</option>
                    {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Room</label>
                <input type="text" value={constraintForm.room}
                  onChange={e => setConstraintForm({...constraintForm, room: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Notes</label>
                <input type="text" value={constraintForm.notes}
                  onChange={e => setConstraintForm({...constraintForm, notes: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAddConstraint}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm">Add</button>
                <button onClick={() => setShowConstraintForm(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
