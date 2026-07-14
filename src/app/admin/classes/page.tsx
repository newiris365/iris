"use client";

import React, { useState, useEffect } from 'react';
import {
  School, Plus, Users, Search, Edit2, Trash2, ChevronDown, ChevronRight,
  BookOpen, UserCheck, X
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api';

interface ClassSection {
  id: string;
  grade: number;
  section: string;
  class_teacher_id: string | null;
  class_teacher_name: string | null;
  room_number: string | null;
  student_count: number;
  capacity: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGrade, setExpandedGrade] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSection | null>(null);
  const [form, setForm] = useState({
    grade: 1,
    section: 'A',
    class_teacher_id: '',
    room_number: '',
    capacity: 40,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        apiGet('school/classes'),
        apiGet('school/teachers'),
      ]);
      if (classesRes.success) setClasses(classesRes.classes || []);
      if (teachersRes.success) setTeachers(teachersRes.teachers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await apiPost('school/classes', form);
      if (res.success) {
        setShowForm(false);
        setForm({ grade: 1, section: 'A', class_teacher_id: '', room_number: '', capacity: 40 });
        fetchData();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdate = async () => {
    if (!editingClass) return;
    try {
      const res = await apiPut(`school/classes/${editingClass.id}`, form);
      if (res.success) {
        setEditingClass(null);
        setShowForm(false);
        fetchData();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class section?')) return;
    const res = await apiDelete(`school/classes/${id}`);
    if (res.success) fetchData();
  };

  const openEdit = (cls: ClassSection) => {
    setEditingClass(cls);
    setForm({
      grade: cls.grade,
      section: cls.section,
      class_teacher_id: cls.class_teacher_id || '',
      room_number: cls.room_number || '',
      capacity: cls.capacity || 40,
    });
    setShowForm(true);
  };

  // Group by grade
  const gradeMap: Record<number, ClassSection[]> = {};
  classes.forEach(c => {
    if (!gradeMap[c.grade]) gradeMap[c.grade] = [];
    gradeMap[c.grade].push(c);
  });

  const grades = Object.keys(gradeMap).map(Number).sort((a, b) => a - b);

  const filtered = classes.filter(c =>
    !searchQuery ||
    `${c.grade}-${c.section}`.includes(searchQuery) ||
    c.class_teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = classes.reduce((acc, c) => acc + (c.student_count || 0), 0);
  const totalSections = classes.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <School size={24} className="text-violet-400" /> Classes & Sections
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage class sections, assign teachers, and track capacity</p>
        </div>
        <button onClick={() => { setEditingClass(null); setForm({ grade: 1, section: 'A', class_teacher_id: '', room_number: '', capacity: 40 }); setShowForm(true); }}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Add Section
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{grades.length}</p>
          <p className="text-xs text-slate-400">Grades (1-12)</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-violet-400">{totalSections}</p>
          <p className="text-xs text-slate-400">Total Sections</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{totalStudents}</p>
          <p className="text-xs text-slate-400">Total Students</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by class or teacher..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500" />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white/5 rounded-xl border border-violet-500/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">{editingClass ? 'Edit Class Section' : 'New Class Section'}</h3>
            <button onClick={() => { setShowForm(false); setEditingClass(null); }} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Grade *</label>
              <select value={form.grade} onChange={e => setForm({...form, grade: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Section *</label>
              <select value={form.section} onChange={e => setForm({...form, section: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                {['A','B','C','D','E','F'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Class Teacher</label>
              <select value={form.class_teacher_id} onChange={e => setForm({...form, class_teacher_id: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">None</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Room</label>
              <input type="text" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})}
                placeholder="e.g. 101" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 40})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={editingClass ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500">
              {editingClass ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingClass(null); }}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {/* Classes by Grade */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <School size={40} className="mx-auto mb-3 opacity-50" />
          <p>No classes configured. Add sections to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(searchQuery ? grades.filter(g => filtered.some(c => c.grade === g)) : grades).map(grade => {
            const gradeClasses = searchQuery
              ? filtered.filter(c => c.grade === grade)
              : gradeMap[grade];
            const isExpanded = expandedGrade === grade || searchQuery;
            const gradeStudents = gradeClasses.reduce((acc, c) => acc + (c.student_count || 0), 0);

            return (
              <div key={grade} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <button onClick={() => setExpandedGrade(isExpanded && !searchQuery ? null : grade)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-violet-400">{grade}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Grade {grade}</p>
                      <p className="text-[10px] text-slate-400">{gradeClasses.length} sections · {gradeStudents} students</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {gradeClasses.map(cls => (
                        <div key={cls.id} className="bg-white/[0.03] rounded-lg border border-white/5 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-bold text-white">{grade}-{cls.section}</p>
                              <p className="text-[10px] text-slate-400">
                                Room {cls.room_number || '—'} · {cls.student_count || 0}/{cls.capacity || 40} students
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(cls)} className="p-1 text-slate-400 hover:text-violet-400">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDelete(cls.id)} className="p-1 text-slate-400 hover:text-red-400">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          {/* Capacity bar */}
                          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                            <div className={`h-1.5 rounded-full transition-all ${
                              (cls.student_count || 0) >= (cls.capacity || 40) ? 'bg-red-500' :
                              (cls.student_count || 0) >= (cls.capacity || 40) * 0.8 ? 'bg-amber-500' : 'bg-violet-500'
                            }`} style={{ width: `${Math.min(((cls.student_count || 0) / (cls.capacity || 40)) * 100, 100)}%` }} />
                          </div>
                          {cls.class_teacher_name && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <UserCheck size={9} /> {cls.class_teacher_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
