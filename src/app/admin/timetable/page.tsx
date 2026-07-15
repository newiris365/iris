"use client";

import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Cpu, Settings } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';

interface ClassSection {
  id: string;
  grade: number;
  section: string;
}

function generateSlots(count: number, startHour: number, startMin: number, durationMin: number, breakMin: number, lunchAfterPeriod: number, lunchDuration: number): (string | { type: 'lunch'; label: string })[] {
  const slots: (string | { type: 'lunch'; label: string })[] = [];
  let min = startHour * 60 + startMin;
  for (let i = 0; i < count; i++) {
    const sH = Math.floor(min / 60);
    const sM = min % 60;
    min += durationMin;
    const eH = Math.floor(min / 60);
    const eM = min % 60;
    const fmt = (h: number, m: number) => {
      const ap = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
    };
    slots.push(`${fmt(sH, sM)} - ${fmt(eH, eM)}`);
    min += breakMin;

    if (lunchAfterPeriod > 0 && i + 1 === lunchAfterPeriod) {
      const lH1 = Math.floor(min / 60);
      const lM1 = min % 60;
      min += lunchDuration;
      const lH2 = Math.floor(min / 60);
      const lM2 = min % 60;
      slots.push({ type: 'lunch', label: `Lunch Break (${fmt(lH1, lM1)} - ${fmt(lH2, lM2)})` });
      min += breakMin;
    }
  }
  return slots;
}

export default function AdminTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('a0000000-0000-0000-0000-000000000001');
  const [selectedClassSection, setSelectedClassSection] = useState('');
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [instituteType, setInstituteType] = useState<string>('college');
  const isSchool = instituteType === 'school';

  const [periodCount, setPeriodCount] = useState(6);
  const [startHour, setStartHour] = useState(9);
  const [startMin, setStartMin] = useState(0);
  const [durationMin, setDurationMin] = useState(45);
  const [breakMin, setBreakMin] = useState(10);
  const [lunchAfterPeriod, setLunchAfterPeriod] = useState(4);
  const [lunchDuration, setLunchDuration] = useState(60);

  const [showSettings, setShowSettings] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const slots = generateSlots(periodCount, startHour, startMin, durationMin, breakMin, lunchAfterPeriod, lunchDuration);
  const timeSlots = slots.filter(s => typeof s === 'string') as string[];
  const lunchIdx = slots.findIndex(s => typeof s === 'object' && s.type === 'lunch');

  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    time_slot: '',
    subject: '',
    teacher_id: '',
    room: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('iris_user_profile');
      if (saved) {
        const p = JSON.parse(saved);
        setInstituteType(p.institute_type || 'college');
      }
      const savedConfig = localStorage.getItem('iris_timetable_config');
      if (savedConfig) {
        const c = JSON.parse(savedConfig);
        if (c.periodCount) setPeriodCount(c.periodCount);
        if (c.startHour !== undefined) setStartHour(c.startHour);
        if (c.startMin !== undefined) setStartMin(c.startMin);
        if (c.durationMin) setDurationMin(c.durationMin);
        if (c.breakMin !== undefined) setBreakMin(c.breakMin);
        if (c.lunchAfterPeriod !== undefined) setLunchAfterPeriod(c.lunchAfterPeriod);
        if (c.lunchDuration !== undefined) setLunchDuration(c.lunchDuration);
      }
    }
  }, []);

  useEffect(() => {
    if (isSchool) {
      fetchClassSections();
      fetchTeachers();
    }
  }, [isSchool]);

  useEffect(() => {
    fetchTimetable();
  }, [selectedDept, selectedClassSection]);

  const saveConfig = () => {
    localStorage.setItem('iris_timetable_config', JSON.stringify({ periodCount, startHour, startMin, durationMin, breakMin, lunchAfterPeriod, lunchDuration }));
    setShowSettings(false);
  };

  const fetchClassSections = async () => {
    try {
      const res = await apiGet('school/classes');
      if (res.success) {
        setClassSections(res.classes || []);
        if (res.classes?.length > 0 && !selectedClassSection) {
          setSelectedClassSection(res.classes[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await apiGet('school/teachers');
      if (res.success) {
        setTeachers(res.teachers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const target = isSchool ? selectedClassSection : selectedDept;
      if (!target) { setIsLoading(false); return; }
      const res = await apiGet(`/core/timetable/${target}`);
      if (res.success) {
        setTimetable(res.timetable || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        day_of_week: formData.day_of_week,
        time_slot: formData.time_slot,
        subject: formData.subject,
        teacher_id: formData.teacher_id,
        room: formData.room,
      };
      if (!isSchool) {
        payload.department_id = selectedDept;
      }
      const res = await apiPost('/core/timetable', payload);
      if (res.success) {
        setShowAddForm(false);
        setFormData({ day_of_week: 'Monday', time_slot: timeSlots[0] || '', subject: '', teacher_id: '', room: '' });
        fetchTimetable();
        alert(isSchool ? 'Class block scheduled!' : 'Lecture block scheduled!');
      } else {
        alert(res.error || 'Clash detected: Schedule overlaps.');
      }
    } catch (err: any) {
      alert('Error scheduling class: ' + (err?.message || 'Hard conflict constraints violated.'));
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Remove this timetable slot?')) return;
    try {
      const res = await apiDelete(`/core/timetable/${id}`);
      if (res.success) {
        fetchTimetable();
        alert('Timetable block deleted.');
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleAutoSchedule = async () => {
    if (!confirm('Run auto-scheduler? This will auto-populate free slots.')) return;
    try {
      const schoolSubjects = [
        'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science',
        'Physical Education', 'Art & Craft', 'General Knowledge', 'Moral Science'
      ];

      const subjects = isSchool
        ? schoolSubjects.map((name, i) => ({
            name,
            hours_per_week: 5,
            teacher_id: teachers[i % teachers.length]?.id || undefined,
            room: `Room ${i + 1}`,
          }))
        : ['Compiler Design', 'Data Networks', 'AI Ethics', 'Cloud Systems'].map(name => ({
            name,
            hours_per_week: 3,
            room: 'Block B R204',
          }));

      const payload: any = {
        subjects,
        time_slots: timeSlots,
        days,
      };
      if (!isSchool) {
        payload.department_id = selectedDept;
      }

      const res = await apiPost('/core/timetable/auto-generate', payload);
      if (res.success) {
        fetchTimetable();
        alert(`Scheduler finished: Scheduled ${res.count} blocks. ${res.conflict_count > 0 ? `${res.conflict_count} conflicts.` : 'No conflicts!'}`);
      } else {
        alert(res.error || 'Scheduler failed.');
      }
    } catch (err: any) {
      alert('Scheduler failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const getBlock = (day: string, slot: string) => {
    return timetable.find(b => b.day_of_week === day && b.time_slot === slot);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">{isSchool ? 'Class Timetable' : 'Academic Timetable Builder'}</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">
                {isSchool
                  ? 'Design weekly class grids, configure periods, and auto-generate rosters.'
                  : 'Design weekly lecture grids, resolve scheduler overlaps, and auto-generate rosters.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {isSchool ? (
              <select 
                value={selectedClassSection}
                onChange={(e) => setSelectedClassSection(e.target.value)}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
              >
                {classSections.map(cs => (
                  <option key={cs.id} value={cs.id}>Grade {cs.grade} - {cs.section}</option>
                ))}
              </select>
            ) : (
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
              >
                <option value="a0000000-0000-0000-0000-000000000001">Computer Science (CSE)</option>
              </select>
            )}
            <button 
              onClick={() => setShowSettings(true)}
              className="px-4 py-2.5 rounded-xl border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 text-[#A78BFA] hover:bg-[#6C2BD9]/20 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Settings className="w-4 h-4" /> Period Settings
            </button>
            <button 
              onClick={handleAutoSchedule}
              className="px-4 py-2.5 rounded-xl border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 text-[#A78BFA] hover:bg-[#6C2BD9]/20 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Cpu className="w-4 h-4" /> Auto-Schedule
            </button>
            <button 
              onClick={() => { setFormData({ day_of_week: 'Monday', time_slot: timeSlots[0] || '', subject: '', teacher_id: '', room: '' }); setShowAddForm(true); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule Block
            </button>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#C4B5FD]">Loading timetable matrix...</div>
          ) : (
            <div className="min-w-[900px] grid gap-4 text-xs" style={{ gridTemplateColumns: `140px repeat(${days.length}, 1fr)` }}>
              
              <div className="p-3 text-transparent">Slot</div>
              {days.map(day => (
                <div key={day} className="p-3 font-heading font-bold text-white text-center border-b border-[#6C2BD9]/30">
                  {day}
                </div>
              ))}

              {slots.map((slot, idx) => {
                if (typeof slot === 'object' && slot.type === 'lunch') {
                  return (
                    <React.Fragment key={`lunch-${idx}`}>
                      <div className="p-3 flex flex-col justify-center">
                        <span className="text-[10px] text-amber-400/70 font-bold">Lunch</span>
                        <span className="text-[9px] text-amber-400/50 font-mono">{slot.label}</span>
                      </div>
                      {days.map(day => (
                        <div key={`${day}-lunch-${idx}`} className="p-3 rounded-xl min-h-[60px] border flex items-center justify-center bg-amber-500/5 border-amber-500/10">
                          <span className="text-[10px] text-amber-400/40 font-bold">🍽 Lunch Break</span>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                }
                const timeSlot = slot as string;
                const periodNum = slots.slice(0, idx + 1).filter(s => typeof s === 'string').length;
                return (
                  <React.Fragment key={timeSlot}>
                    <div className="p-3 font-mono font-bold text-[#C4B5FD] flex flex-col justify-center">
                      <span className="text-[10px] text-[#C4B5FD]/50">Period {periodNum}</span>
                      <span>{timeSlot}</span>
                    </div>
                    
                    {days.map(day => {
                      const block = getBlock(day, timeSlot);
                      return (
                        <div key={`${day}-${timeSlot}`} className="p-3 rounded-xl min-h-[80px] border flex flex-col justify-between transition-all bg-white/5 border-white/5 hover:border-[#6C2BD9]/40 relative group">
                          {block ? (
                            <>
                              <div>
                                <h4 className="font-bold text-white text-[11px]">{block.subject}</h4>
                                <p className="text-[9px] text-[#C4B5FD]/70 mt-0.5">Rm: {block.room}</p>
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-white/5 text-[8px] text-[#C4B5FD]/50">
                                <span>{isSchool ? 'Teacher' : 'Lecturer'}</span>
                                <button 
                                  onClick={() => handleDeleteBlock(block.id)}
                                  className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-[#C4B5FD]/20 italic text-[10px]">
                              Empty
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

            </div>
          )}
        </div>

      </div>

      {/* Period Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-lg text-white mb-4">Period Settings</h3>
            <div className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Number of Periods per Day</label>
                <input type="number" min={1} max={12} value={periodCount}
                  onChange={(e) => setPeriodCount(Number(e.target.value))}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Start Hour (24h)</label>
                  <input type="number" min={0} max={23} value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Start Minute</label>
                  <input type="number" min={0} max={59} value={startMin}
                    onChange={(e) => setStartMin(Number(e.target.value))}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Period Duration (min)</label>
                  <input type="number" min={10} max={120} value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Break Between (min)</label>
                  <input type="number" min={0} max={60} value={breakMin}
                    onChange={(e) => setBreakMin(Number(e.target.value))}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Lunch After Period</label>
                  <input type="number" min={0} max={periodCount} value={lunchAfterPeriod}
                    onChange={(e) => setLunchAfterPeriod(Number(e.target.value))}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Lunch Duration (min)</label>
                  <input type="number" min={0} max={120} value={lunchDuration}
                    onChange={(e) => setLunchDuration(Number(e.target.value))}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]" />
                </div>
              </div>
              <p className="text-[9px] text-[#C4B5FD]/40">Set Lunch After Period to 0 to disable lunch break.</p>
              <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] text-[#C4B5FD]/60 mb-1">Preview:</p>
                {generateSlots(periodCount, startHour, startMin, durationMin, breakMin).map((s, i) => (
                  <p key={i} className="text-[10px] text-white/70">
                  {typeof s === 'string' ? `Period ${i + 1}: ${s}` : <span className="text-amber-400/70">{s.label}</span>}
                </p>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                <button onClick={saveConfig} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Block Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-lg text-white mb-4">{isSchool ? 'Schedule Class Block' : 'Schedule Timetable Block'}</h3>
            
            <form onSubmit={handleAddBlock} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Subject Title</label>
                <input 
                  type="text" required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder={isSchool ? 'Mathematics' : 'Compiler Design'}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {isSchool && (
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Class / Section</label>
                  <select 
                    value={selectedClassSection}
                    onChange={(e) => setSelectedClassSection(e.target.value)}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  >
                    {classSections.map(cs => (
                      <option key={cs.id} value={cs.id}>Grade {cs.grade} - {cs.section}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Teacher</label>
                <select 
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Day of Week</label>
                  <select 
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Time Slot</label>
                  <select 
                    value={formData.time_slot}
                    onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  >
                    {timeSlots.map((s, i) => <option key={s} value={s}>Period {i + 1}: {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Room Number</label>
                <input 
                  type="text" required
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                  placeholder={isSchool ? 'Room 1' : 'Block B, Room 204'}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
