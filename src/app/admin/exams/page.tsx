"use client";

import React, { useState, useEffect } from 'react';
import { Award, Plus, Upload, Check, Loader2, Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeExamForGrades, setActiveExamForGrades] = useState<any | null>(null);

  // Scheduling Form
  const [formData, setFormData] = useState({
    name: '',
    department_id: 'a0000000-0000-0000-0000-000000000001', // CSE
    start_date: '2026-06-20',
    end_date: '2026-06-25',
    type: 'Finals'
  });

  // Grades entry spreadsheet state
  const [subjectInput, setSubjectInput] = useState('Compiler Design');
  const [gradesSheet, setGradesSheet] = useState<any[]>([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/exams');
      if (res.success) {
        setExams(res.exams || []);
      }
      
      const stdRes = await apiGet('/core/students');
      if (stdRes.success) {
        setStudents(stdRes.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/core/exams', formData);
      if (res.success) {
        setShowAddForm(false);
        fetchExams();
        alert('Exam schedule registered!');
      }
    } catch (err) {
      alert('Failed to schedule exam.');
    }
  };

  const openGradesEntry = (exam: any) => {
    setActiveExamForGrades(exam);
    // Initialize sheet with student rows
    setGradesSheet(students.map(s => ({
      student_id: s.id,
      name: s.name,
      roll_number: s.roll_number,
      marks_obtained: '',
      max_marks: '100',
      remarks: 'Good'
    })));
  };

  const handleGradeChange = (studentId: string, field: string, value: any) => {
    setGradesSheet(gradesSheet.map(g => 
      g.student_id === studentId ? { ...g, [field]: value } : g
    ));
  };

  const submitGrades = async () => {
    if (!activeExamForGrades) return;
    try {
      const payload = {
        exam_id: activeExamForGrades.id,
        subject: subjectInput,
        records: gradesSheet.map(g => ({
          student_id: g.student_id,
          marks_obtained: Number(g.marks_obtained) || 0,
          max_marks: Number(g.max_marks) || 100,
          remarks: g.remarks
        }))
      };

      const res = await apiPost(`/core/exams/${activeExamForGrades.id}/results`, payload);
      if (res.success) {
        alert(`Successfully entered grades for ${res.count} students!`);
        setActiveExamForGrades(null);
      }
    } catch (err) {
      alert('Failed to enter grades.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Exams & Grading Suite</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Schedule assessment dates, manage hall-tickets, and input course grades.</p>
            </div>
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Schedule Assessment
          </button>
        </div>

        {/* Exams schedule & Bulk Grades Spreadsheet */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Exam schedule list */}
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-bold text-lg text-white">Scheduled Assessments</h3>
            
            {isLoading ? (
              <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Loading exam lists...</div>
            ) : exams.length === 0 ? (
              <div className="text-center text-xs text-[#C4B5FD]/50 py-10">No exams scheduled.</div>
            ) : (
              <div className="space-y-4">
                {exams.map((ex) => (
                  <div key={ex.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-3 hover:border-[#6C2BD9]/40 transition-all">
                    <div>
                      <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded font-bold uppercase">{ex.type}</span>
                      <h4 className="font-heading font-bold text-base text-white mt-1.5">{ex.name}</h4>
                      <p className="text-[10px] text-[#C4B5FD]/70 mt-1">Timeline: {ex.start_date} to {ex.end_date}</p>
                    </div>

                    <button 
                      onClick={() => openGradesEntry(ex)}
                      className="w-full py-2.5 rounded-xl border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 hover:bg-[#6C2BD9]/20 text-[#A78BFA] text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Grade Students
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grades Spreadsheet input editor */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-lg text-white">Grading Spreadsheet Console</h3>
            
            {activeExamForGrades ? (
              <div className="glass-panel rounded-2xl p-6 border border-[#6C2BD9]/30 flex flex-col gap-5">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="font-bold text-white text-base">Grading: {activeExamForGrades.name}</h4>
                    <span className="text-[10px] text-[#C4B5FD]/70">Auto-calculates letter grades based on percentage weight.</span>
                  </div>
                  <input 
                    type="text" 
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="Subject Name"
                    className="bg-black/40 border border-[#6C2BD9]/30 px-3 py-2 text-xs rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[#C4B5FD] font-semibold border-b border-white/5">
                        <th className="p-3">Roll</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Marks Obtained</th>
                        <th className="p-3">Max Marks</th>
                        <th className="p-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {gradesSheet.map((row) => {
                        const score = Number(row.marks_obtained) || 0;
                        const max = Number(row.max_marks) || 100;
                        const gradePercent = max > 0 ? (score / max) * 100 : 0;
                        const letter = gradePercent >= 90 ? 'A+' : gradePercent >= 80 ? 'A' : gradePercent >= 70 ? 'B' : gradePercent >= 60 ? 'C' : gradePercent >= 50 ? 'D' : 'F';
                        
                        return (
                          <tr key={row.student_id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-white">{row.roll_number}</td>
                            <td className="p-3 font-semibold text-white">{row.name}</td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={row.marks_obtained}
                                onChange={(e) => handleGradeChange(row.student_id, 'marks_obtained', e.target.value)}
                                className="w-16 bg-black/40 border border-[#6C2BD9]/30 px-2 py-1.5 rounded-lg text-white text-center"
                                placeholder="85"
                              />
                            </td>
                            <td className="p-3 font-semibold text-[#C4B5FD]/70">{row.max_marks}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                letter === 'F' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>{letter}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setActiveExamForGrades(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitGrades}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold transition-all shadow-md shadow-[#6C2BD9]/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save Gradesheet
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 border border-white/5 text-center text-xs text-[#C4B5FD]/50 py-28 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-[#A78BFA]/20" />
                Select any exam on the left to activate bulk marks entry spreadsheet.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Schedule Assessment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-lg text-white mb-4">Schedule Exam Assessment</h3>
            
            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Assessment Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Odd Semester Mid-Term Exam"
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Start Date</label>
                  <input 
                    type="date" required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">End Date</label>
                  <input 
                    type="date" required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Assessment Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                >
                  <option value="Finals">Term Finals Examination</option>
                  <option value="Mid-Term">Mid-Term Assessment</option>
                  <option value="Practical">Lab & Practical</option>
                </select>
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
