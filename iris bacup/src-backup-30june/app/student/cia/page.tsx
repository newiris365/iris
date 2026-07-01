"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, TrendingUp, Award, BarChart3, Calendar, Filter
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface CiaMark {
  assessment_id: string;
  assessment_name: string;
  assessment_type: string;
  subject: string;
  max_marks: number;
  weightage_pct: number;
  date: string;
  semester: number;
  marks_obtained: number | null;
  percentage: string | null;
  remarks: string | null;
  entered_at: string | null;
}

interface CiaSummary {
  total_assessments: number;
  graded_assessments: number;
  total_marks_obtained: number;
  total_max_marks: number;
  overall_percentage: string;
}

export default function StudentCiaPage() {
  const [marks, setMarks] = useState<CiaMark[]>([]);
  const [summary, setSummary] = useState<CiaSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchMarks = async () => {
      setIsLoading(true);
      try {
        const res = await apiGet('campusCore/student/cia/marks');
        if (res.success) {
          setMarks(res.marks || []);
          setSummary(res.summary || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarks();
  }, []);

  const subjects = Array.from(new Set(marks.map(m => m.subject).filter(Boolean)));
  const types = Array.from(new Set(marks.map(m => m.assessment_type)));

  const filtered = marks.filter(m => {
    if (filterSubject !== 'all' && m.subject !== filterSubject) return false;
    if (filterType !== 'all' && m.assessment_type !== filterType) return false;
    return true;
  });

  const graded = filtered.filter(m => m.marks_obtained !== null);
  const ungraded = filtered.filter(m => m.marks_obtained === null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <FileText size={24} className="text-violet-400" />
        CIA & Internal Marks
      </h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-violet-400" />
              <span className="text-xs text-slate-400">Total Assessments</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.total_assessments}</p>
            <p className="text-xs text-slate-500">{summary.graded_assessments} graded</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-emerald-400" />
              <span className="text-xs text-slate-400">Marks Obtained</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.total_marks_obtained}</p>
            <p className="text-xs text-slate-500">out of {summary.total_max_marks}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-amber-400" />
              <span className="text-xs text-slate-400">Overall %</span>
            </div>
            <p className={`text-2xl font-bold ${
              parseFloat(summary.overall_percentage) >= 60 ? 'text-emerald-400' :
              parseFloat(summary.overall_percentage) >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {summary.overall_percentage}%
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-blue-400" />
              <span className="text-xs text-slate-400">Subjects</span>
            </div>
            <p className="text-2xl font-bold text-white">{subjects.length}</p>
            <p className="text-xs text-slate-500">with assessments</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm">
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} assessments</span>
      </div>

      {/* Marks Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3 text-slate-500 opacity-50" />
            <p className="text-slate-400">No CIA assessments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="pb-2 pr-4">Assessment</th>
                  <th className="pb-2 pr-4">Subject</th>
                  <th className="pb-2 pr-4 text-center">Type</th>
                  <th className="pb-2 pr-4 text-center">Max Marks</th>
                  <th className="pb-2 pr-4 text-center">Marks Obtained</th>
                  <th className="pb-2 pr-4 text-center">%</th>
                  <th className="pb-2 pr-4">Remarks</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const pct = m.percentage ? parseFloat(m.percentage) : null;
                  return (
                    <tr key={m.assessment_id} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 text-white font-medium">{m.assessment_name}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{m.subject || '-'}</td>
                      <td className="py-2.5 pr-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300">
                          {m.assessment_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-center text-slate-300">{m.max_marks}</td>
                      <td className="py-2.5 pr-4 text-center font-mono text-white">
                        {m.marks_obtained !== null ? m.marks_obtained : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>
                      <td className={`py-2.5 pr-4 text-center font-medium ${
                        pct === null ? 'text-slate-500' :
                        pct < 40 ? 'text-red-400' :
                        pct < 60 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {pct !== null ? `${pct}%` : '--'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400 text-xs">{m.remarks || '-'}</td>
                      <td className="py-2.5 text-slate-400 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {m.date}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
