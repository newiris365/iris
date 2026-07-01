"use client";

import React, { useState, useEffect } from 'react';
import {
  CalendarDays, AlertTriangle, Users, Search, CheckCircle2,
  XCircle, Clock, Filter, Download, ChevronDown
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

interface AttendanceStudent {
  student_id: string;
  student_name: string;
  roll_number: string;
  total_classes: number;
  attended_classes: number;
  attendance_pct: number;
  status: string;
}

interface Session {
  id: string;
  subject: string;
  time_slot: string;
  department_id: string;
  is_active: boolean;
}

export default function FacultyAttendancePage() {
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Session start form
  const [showStartSession, setShowStartSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    department_id: '',
    subject: '',
    time_slot: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
  });
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Bulk mark
  const [showBulkMark, setShowBulkMark] = useState(false);
  const [bulkStudents, setBulkStudents] = useState<any[]>([]);
  const [bulkStatus, setBulkStatus] = useState('present');

  // Load profile
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) { try { setProfile(JSON.parse(saved)); } catch {} }
  }, []);

  // Fetch departments
  useEffect(() => {
    const loadDepts = async () => {
      const res = await apiGet('departments');
      if (res.success) setDepartments(res.departments || []);
    };
    loadDepts();
  }, []);

  // Fetch shortage report
  const fetchShortageReport = async () => {
    if (!selectedDept) return;
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/faculty/attendance/shortage', {
        departmentId: selectedDept,
        subject: selectedSubject || undefined,
      });
      if (res.success) setStudents(res.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDept) fetchShortageReport();
  }, [selectedDept, selectedSubject]);

  // Start attendance session
  const handleStartSession = async () => {
    if (!sessionForm.department_id || !sessionForm.subject) return;
    setIsStarting(true);
    try {
      const res = await apiPost('campusCore/attendance/session/start', {
        department_id: sessionForm.department_id,
        subject: sessionForm.subject,
        time_slot: sessionForm.time_slot,
      });
      if (res.success && res.session) {
        setActiveSession(res.session);
        setQrCode(res.qr_data_url || '');
        setShowStartSession(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  // Close session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    const res = await apiPut(`campusCore/attendance/session/${activeSession.id}/close`, {});
    if (res.success) {
      setActiveSession(null);
      setQrCode('');
    }
  };

  // Bulk mark attendance
  const handleBulkMark = async () => {
    if (!activeSession || bulkStudents.length === 0) return;
    const res = await apiPost('campusCore/attendance/mark/bulk', {
      session_id: activeSession.id,
      marks: bulkStudents.map((s) => ({
        student_id: s.id,
        status: s._mark || bulkStatus,
      })),
    });
    if (res.success) {
      setShowBulkMark(false);
      setBulkStudents([]);
    }
  };

  // Load students for bulk mark
  const loadBulkStudents = async () => {
    if (!activeSession) return;
    const res = await apiGet('students', { departmentId: activeSession.department_id });
    if (res.success) {
      setBulkStudents((res.students || []).map((s: any) => ({ ...s, _mark: 'present' })));
      setShowBulkMark(true);
    }
  };

  const filteredStudents = students.filter((s) =>
    statusFilter === 'all' || s.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarDays size={24} className="text-blue-400" />
          Attendance Management
        </h1>
        <div className="flex gap-2">
          {!activeSession ? (
            <button
              onClick={() => setShowStartSession(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> Start Session
            </button>
          ) : (
            <>
              <button
                onClick={loadBulkStudents}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm"
              >
                Bulk Mark
              </button>
              <button
                onClick={handleCloseSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm"
              >
                Close Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Session */}
      {activeSession && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-semibold">Active Session: {activeSession.subject}</p>
              <p className="text-sm text-slate-400">Time Slot: {activeSession.time_slot}</p>
            </div>
            {qrCode && (
              <div className="bg-white p-2 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartSession && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Start Attendance Session</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Department *</label>
                <select
                  value={sessionForm.department_id}
                  onChange={(e) => setSessionForm({ ...sessionForm, department_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Subject *</label>
                <input
                  type="text"
                  value={sessionForm.subject}
                  onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Time Slot</label>
                <input
                  type="text"
                  value={sessionForm.time_slot}
                  onChange={(e) => setSessionForm({ ...sessionForm, time_slot: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="HH:MM"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleStartSession}
                  disabled={isStarting || !sessionForm.department_id || !sessionForm.subject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm disabled:opacity-50"
                >
                  {isStarting ? 'Starting...' : 'Start Session'}
                </button>
                <button
                  onClick={() => setShowStartSession(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Mark Modal */}
      {showBulkMark && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-white/10 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Bulk Mark Attendance</h3>
            <div className="flex gap-2 mb-4">
              {['present', 'absent', 'late'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setBulkStatus(s);
                    setBulkStudents(bulkStudents.map((bs) => ({ ...bs, _mark: s })));
                  }}
                  className={`px-3 py-1 rounded text-xs capitalize ${
                    bulkStatus === s ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bulkStudents.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                  <span className="text-sm text-slate-300 flex-1">{s.roll_number} — {s.full_name}</span>
                  <div className="flex gap-1">
                    {['present', 'absent', 'late'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          const updated = [...bulkStudents];
                          updated[i]._mark = st;
                          setBulkStudents(updated);
                        }}
                        className={`w-8 h-8 rounded text-xs ${
                          s._mark === st
                            ? st === 'present' ? 'bg-emerald-600 text-white'
                              : st === 'absent' ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {st === 'present' ? 'P' : st === 'absent' ? 'A' : 'L'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleBulkMark} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm">
                Save Marks
              </button>
              <button onClick={() => setShowBulkMark(false)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortage Report */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            Attendance Shortage Report
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm min-w-[180px]"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            placeholder="Filter by subject"
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="CRITICAL">Critical (&lt;60%)</option>
            <option value="AT RISK">At Risk (&lt;75%)</option>
            <option value="SAFE">Safe</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {selectedDept ? 'No students found for this department.' : 'Select a department to view shortage report.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="pb-2 pr-4">Roll No</th>
                  <th className="pb-2 pr-4">Student Name</th>
                  <th className="pb-2 pr-4 text-center">Total</th>
                  <th className="pb-2 pr-4 text-center">Attended</th>
                  <th className="pb-2 pr-4 text-center">%</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.student_id} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-mono text-slate-300">{s.roll_number}</td>
                    <td className="py-2 pr-4 text-white">{s.student_name}</td>
                    <td className="py-2 pr-4 text-center text-slate-300">{s.total_classes}</td>
                    <td className="py-2 pr-4 text-center text-slate-300">{s.attended_classes}</td>
                    <td className="py-2 pr-4 text-center">
                      <span className={`font-semibold ${
                        s.attendance_pct < 60 ? 'text-red-400' :
                        s.attendance_pct < 75 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {s.attendance_pct}%
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        s.status === 'AT RISK' ? 'bg-amber-500/20 text-amber-400' :
                        s.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
