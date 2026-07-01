"use client";

import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, ShieldAlert, Cpu } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';

export default function AdminTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('a0000000-0000-0000-0000-000000000001'); // CSE
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    department_id: 'a0000000-0000-0000-0000-000000000001',
    day_of_week: 'Monday',
    time_slot: '09:00 - 10:00 AM',
    subject: '',
    teacher_id: 'b0000000-0000-0000-0000-000000000002', // Dr. K. R. Sharma Mock
    room: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = ['09:00 - 10:00 AM', '10:15 - 11:15 AM', '11:30 - 12:30 PM', '02:00 - 03:00 PM'];

  useEffect(() => {
    fetchTimetable();
  }, [selectedDept]);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet(`/core/timetable/${selectedDept}`);
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
      const res = await apiPost('/core/timetable', { ...formData, department_id: selectedDept });
      if (res.success) {
        setShowAddForm(false);
        fetchTimetable();
        alert('Lecture block scheduled!');
      } else {
        alert(res.error || 'Clash detected: Schedule overlaps.');
      }
    } catch (err: any) {
      alert('Error scheduling class: Hard conflict constraints violated.');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Remove this lecture slot?')) return;
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
    if (!confirm('Run backtracking scheduler? This will auto-populate free slots.')) return;
    try {
      const res = await apiPost('/core/timetable/auto-generate', {
        department_id: selectedDept,
        subjects: ['Compiler Design', 'Data Networks', 'AI Ethics', 'Cloud Systems'],
        teachers: ['b0000000-0000-0000-0000-000000000002'],
        rooms: ['Block B R204', 'Block B R205', 'Seminar Hall']
      });
      if (res.success) {
        fetchTimetable();
        alert(`Backtracking Solver finished: Scheduled ${res.count} clash-free lectures!`);
      }
    } catch (err) {
      alert('Solver failed.');
    }
  };

  // Helper to find block by day and slot
  const getBlock = (day: string, slot: string) => {
    return timetable.find(b => b.day_of_week === day && b.time_slot === slot);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Academic Timetable Builder</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Design weekly lecture grids, resolve scheduler overlaps, and auto-generate rosters.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleAutoSchedule}
              className="px-4 py-2.5 rounded-xl border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 text-[#A78BFA] hover:bg-[#6C2BD9]/20 font-bold text-xs flex items-center gap-1.5 transition-all animate-pulse"
            >
              <Cpu className="w-4 h-4" /> AI Auto-Schedule
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule Block
            </button>
          </div>
        </div>

        {/* Timetable Grid Map */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#C4B5FD]">Loading timetable matrix...</div>
          ) : (
            <div className="min-w-[800px] grid grid-cols-6 gap-4 text-xs">
              
              {/* Grid Header */}
              <div className="p-3 text-transparent">Slot</div>
              {days.map(day => (
                <div key={day} className="p-3 font-heading font-bold text-white text-center border-b border-[#6C2BD9]/30">
                  {day}
                </div>
              ))}

              {/* Grid Rows */}
              {slots.map(slot => (
                <React.Fragment key={slot}>
                  <div className="p-3 font-mono font-bold text-[#C4B5FD] flex items-center">{slot}</div>
                  
                  {days.map(day => {
                    const block = getBlock(day, slot);
                    return (
                      <div key={`${day}-${slot}`} className="p-4 rounded-xl min-h-[100px] border flex flex-col justify-between transition-all bg-white/5 border-white/5 hover:border-[#6C2BD9]/40 relative group">
                        {block ? (
                          <>
                            <div>
                              <h4 className="font-bold text-white">{block.subject}</h4>
                              <p className="text-[10px] text-[#C4B5FD]/70 mt-1">Room: {block.room}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5 text-[9px] text-[#C4B5FD]/50">
                              <span>Lecturer Assigned</span>
                              <button 
                                onClick={() => handleDeleteBlock(block.id)}
                                className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-[#C4B5FD]/20 italic">
                            Empty Slot
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

            </div>
          )}
        </div>

      </div>

      {/* Add Block Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-lg text-white mb-4">Schedule Timetable Block</h3>
            
            <form onSubmit={handleAddBlock} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Subject Title</label>
                <input 
                  type="text" required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Compiler Design"
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
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
                    {slots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Room Number / Hall</label>
                <input 
                  type="text" required
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                  placeholder="Block B, Room 204"
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
