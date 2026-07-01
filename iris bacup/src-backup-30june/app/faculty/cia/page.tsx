"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, Save, Download, ChevronDown
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Assessment {
  id: string;
  name: string;
  assessment_type: string;
  subject: string;
  max_marks: number;
  weightage_pct: number;
  semester: number;
  batch_year: string;
  date: string;
  created_by_name: string;
}

interface StudentMark {
  student_id: string;
  student_name: string;
  roll_number: string;
  marks_obtained: number;
  remarks: string;
  _newMarks?: string;
}

export default function FacultyCiaPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    assessment_type: 'CIA_1',
    subject: '',
    department_id: '',
    max_marks: '30',
    weightage_pct: '0',
    semester: '',
    batch_year: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) { try { setProfile(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    const loadDepts = async () => {
      const res = await apiGet('departments');
      if (res.success) setDepartments(res.departments || []);
    };
    loadDepts();
  }, []);

  // Fetch assessments
  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedDept) params.departmentId = selectedDept;
      const res = await apiGet('campusCore/faculty/cia/assessments', params);
      if (res.success) setAssessments(res.assessments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAssessments(); }, [selectedDept]);

  // Fetch marks for assessment
  const fetchMarks = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsLoading(true);
    try {
      const res = await apiGet(`campusCore/faculty/cia/marks/${assessment.id}`);
      if (res.success) {
        setMarks((res.marks || []).map((m: any) => ({
          ...m,
          _newMarks: String(m.marks_obtained || ''),
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    if (!selectedAssessment) return;
    setIsSaving(true);
    setSaveMsg('');
    try {
      const marksPayload = marks.map((m) => ({
        student_id: m.student_id,
        marks_obtained: parseFloat(m._newMarks || '0') || 0,
        remarks: m.remarks || '',
      }));
      const res = await apiPost('campusCore/faculty/cia/marks', {
        assessment_id: selectedAssessment.id,
        marks: marksPayload,
      });
      if (res.success) {
        setSaveMsg('Marks saved successfully!');
        fetchMarks(selectedAssessment);
      } else {
        setSaveMsg(res.error || 'Failed to save marks');
      }
    } catch (err) {
      setSaveMsg('Error saving marks');
    } finally {
      setIsSaving(false);
    }
  };

  // Create assessment
  const handleCreate = async () => {
    if (!createForm.name || !createForm.department_id) return;
    try {
      const res = await apiPost('campusCore/faculty/cia/assessments', {
        ...createForm,
        max_marks: parseInt(createForm.max_marks) || 30,
        weightage_pct: parseFloat(createForm.weightage_pct) || 0,
        semester: createForm.semester ? parseInt(createForm.semester) : null,
      });
      if (res.success) {
        setShowCreate(false);
        setCreateForm({
          name: '', assessment_type: 'CIA_1', subject: '', department_id: '',
          max_marks: '30', weightage_pct: '0', semester: '', batch_year: '',
          date: new Date().toISOString().split('T')[0],
        });
        fetchAssessments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-violet-400" />
          CIA & Internal Marks
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm flex items-center gap-2"
        >
          <Plus size={16} /> New Assessment
        </button>
      </div>

      {/* Create Assessment Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Create Assessment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-slate-300 mb-1 block">Assessment Name *</label>
                <input type="text" value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="e.g. CIA-1 Data Structures"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Type</label>
                <select value={createForm.assessment_type}
                  onChange={(e) => setCreateForm({ ...createForm, assessment_type: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {['CIA_1','CIA_2','CIA_3','Assignment','Quiz','Presentation','Lab','Attendance_Marks','Other'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Subject</label>
                <input type="text" value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Department *</label>
                <select value={createForm.department_id}
                  onChange={(e) => setCreateForm({ ...createForm, department_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Select</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Max Marks</label>
                <input type="number" value={createForm.max_marks}
                  onChange={(e) => setCreateForm({ ...createForm, max_marks: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Weightage %</label>
                <input type="number" value={createForm.weightage_pct}
                  onChange={(e) => setCreateForm({ ...createForm, weightage_pct: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Semester</label>
                <input type="number" value={createForm.semester}
                  onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  min="1" max="8"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Batch Year</label>
                <input type="text" value={createForm.batch_year}
                  onChange={(e) => setCreateForm({ ...createForm, batch_year: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="e.g. 2023"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Date</label>
                <input type="date" value={createForm.date}
                  onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm"
              >Create Assessment</button>
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessments List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Assessments</h2>
          <div className="mb-3">
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {isLoading ? (
            <div className="text-center py-4 text-slate-400 text-sm">Loading...</div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">No assessments found.</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {assessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => fetchMarks(a)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAssessment?.id === a.id
                      ? 'bg-violet-500/20 border-violet-500/40'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{a.name}</p>
                  <p className="text-xs text-slate-400">
                    {a.assessment_type.replace('_', ' ')} — {a.subject || 'General'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Max: {a.max_marks} | {a.date}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Marks Entry */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          {!selectedAssessment ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>Select an assessment to view/enter marks</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedAssessment.name}</h2>
                  <p className="text-sm text-slate-400">
                    {selectedAssessment.assessment_type.replace('_', ' ')} — Max Marks: {selectedAssessment.max_marks}
                  </p>
                </div>
                <button onClick={handleSaveMarks} disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Marks'}
                </button>
              </div>
              {saveMsg && (
                <p className={`text-sm mb-3 ${saveMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {saveMsg}
                </p>
              )}
              {marks.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No students found for this assessment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-white/10">
                        <th className="pb-2 pr-4">Roll No</th>
                        <th className="pb-2 pr-4">Student Name</th>
                        <th className="pb-2 pr-4 text-center">Marks Obtained</th>
                        <th className="pb-2 pr-4 text-center">%</th>
                        <th className="pb-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((m, i) => {
                        const pct = selectedAssessment.max_marks > 0
                          ? ((parseFloat(m._newMarks || '0') / selectedAssessment.max_marks) * 100).toFixed(1)
                          : '0';
                        return (
                          <tr key={m.student_id} className="border-b border-white/5">
                            <td className="py-2 pr-4 font-mono text-slate-300">{m.roll_number}</td>
                            <td className="py-2 pr-4 text-white">{m.student_name}</td>
                            <td className="py-2 pr-4 text-center">
                              <input
                                type="number"
                                value={m._newMarks || ''}
                                onChange={(e) => {
                                  const updated = [...marks];
                                  updated[i]._newMarks = e.target.value;
                                  setMarks(updated);
                                }}
                                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center"
                                min="0"
                                max={selectedAssessment.max_marks}
                              />
                            </td>
                            <td className={`py-2 pr-4 text-center font-medium ${
                              parseFloat(pct) < 40 ? 'text-red-400' :
                              parseFloat(pct) < 60 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {pct}%
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={m.remarks || ''}
                                onChange={(e) => {
                                  const updated = [...marks];
                                  updated[i].remarks = e.target.value;
                                  setMarks(updated);
                                }}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                placeholder="Optional"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
