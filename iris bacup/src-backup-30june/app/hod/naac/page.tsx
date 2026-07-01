"use client";

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, AlertTriangle, FileText, TrendingUp, Upload, ChevronDown, Star, Target } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface SubCriterion {
  id: string;
  label: string;
  status: 'Met' | 'Partially Met' | 'Not Met';
  score: number;
  maxScore: number;
}

interface NaaCCriterion {
  code: string;
  title: string;
  weightage: number;
  score: number;
  maxScore: number;
  status: 'Met' | 'Partially Met' | 'Not Met';
  evidenceCount: number;
  documentsUploaded: number;
  totalDocuments: number;
  subCriteria: SubCriterion[];
}

interface NaaCDashboard {
  criteria: NaaCCriterion[];
  overallScore: number;
  overallMaxScore: number;
  estimatedGrade: string;
  lastUpdated: string;
  totalEvidence: number;
  totalDocumentsUploaded: number;
  totalDocumentsRequired: number;
}

const MOCK_NAAC_DATA: NaaCDashboard = {
  criteria: [
    {
      code: 'Criterion 1',
      title: 'Curricular Aspects',
      weightage: 15,
      score: 13,
      maxScore: 15,
      status: 'Met',
      evidenceCount: 8,
      documentsUploaded: 6,
      totalDocuments: 8,
      subCriteria: [
        { id: '1.1', label: 'Curriculum Design & Development', status: 'Met', score: 4, maxScore: 4 },
        { id: '1.2', label: 'Academic Flexibility', status: 'Met', score: 3, maxScore: 4 },
        { id: '1.3', label: 'Curriculum Enrichment', status: 'Partially Met', score: 3, maxScore: 4 },
        { id: '1.4', label: 'Feedback System', status: 'Met', score: 3, maxScore: 3 },
      ],
    },
    {
      code: 'Criterion 2',
      title: 'Teaching-Learning and Evaluation',
      weightage: 25,
      score: 21,
      maxScore: 25,
      status: 'Partially Met',
      evidenceCount: 12,
      documentsUploaded: 10,
      totalDocuments: 14,
      subCriteria: [
        { id: '2.1', label: 'Student Centric Learning', status: 'Met', score: 5, maxScore: 5 },
        { id: '2.2', label: 'Teaching-Learning Process', status: 'Partially Met', score: 4, maxScore: 5 },
        { id: '2.3', label: 'Evaluation Reforms', status: 'Met', score: 4, maxScore: 5 },
        { id: '2.4', label: 'Teacher Quality', status: 'Met', score: 4, maxScore: 5 },
        { id: '2.5', label: 'Student Performance', status: 'Partially Met', score: 4, maxScore: 5 },
      ],
    },
    {
      code: 'Criterion 3',
      title: 'Research, Innovations and Extension',
      weightage: 15,
      score: 11,
      maxScore: 15,
      status: 'Partially Met',
      evidenceCount: 10,
      documentsUploaded: 7,
      totalDocuments: 10,
      subCriteria: [
        { id: '3.1', label: 'Promotion of Research', status: 'Met', score: 3, maxScore: 4 },
        { id: '3.2', label: 'Research Infrastructure', status: 'Partially Met', score: 2, maxScore: 4 },
        { id: '3.3', label: 'Innovation Ecosystem', status: 'Partially Met', score: 3, maxScore: 4 },
        { id: '3.4', label: 'Extension Activities', status: 'Met', score: 3, maxScore: 3 },
      ],
    },
    {
      code: 'Criterion 4',
      title: 'Infrastructure and Learning Resources',
      weightage: 10,
      score: 9,
      maxScore: 10,
      status: 'Met',
      evidenceCount: 6,
      documentsUploaded: 5,
      totalDocuments: 6,
      subCriteria: [
        { id: '4.1', label: 'Physical Infrastructure', status: 'Met', score: 3, maxScore: 3 },
        { id: '4.2', label: 'Library Resources', status: 'Met', score: 3, maxScore: 4 },
        { id: '4.3', label: 'IT Infrastructure', status: 'Partially Met', score: 3, maxScore: 3 },
      ],
    },
    {
      code: 'Criterion 5',
      title: 'Student Support and Progression',
      weightage: 10,
      score: 8,
      maxScore: 10,
      status: 'Partially Met',
      evidenceCount: 7,
      documentsUploaded: 5,
      totalDocuments: 8,
      subCriteria: [
        { id: '5.1', label: 'Student Mentoring', status: 'Met', score: 3, maxScore: 3 },
        { id: '5.2', label: 'Student Support Mechanisms', status: 'Partially Met', score: 2, maxScore: 4 },
        { id: '5.3', label: 'Progression to Higher Education', status: 'Met', score: 3, maxScore: 3 },
      ],
    },
    {
      code: 'Criterion 6',
      title: 'Governance, Leadership and Management',
      weightage: 15,
      score: 13,
      maxScore: 15,
      status: 'Met',
      evidenceCount: 9,
      documentsUploaded: 8,
      totalDocuments: 10,
      subCriteria: [
        { id: '6.1', label: 'Vision and Leadership', status: 'Met', score: 4, maxScore: 4 },
        { id: '6.2', label: 'Governance Structure', status: 'Met', score: 3, maxScore: 4 },
        { id: '6.3', label: 'Management Quality', status: 'Partially Met', score: 3, maxScore: 4 },
        { id: '6.4', label: 'Strategy Development', status: 'Met', score: 3, maxScore: 3 },
      ],
    },
    {
      code: 'Criterion 7',
      title: 'Best Practices and Distinctiveness',
      weightage: 10,
      score: 9,
      maxScore: 10,
      status: 'Met',
      evidenceCount: 5,
      documentsUploaded: 4,
      totalDocuments: 5,
      subCriteria: [
        { id: '7.1', label: 'Best Practices', status: 'Met', score: 4, maxScore: 5 },
        { id: '7.2', label: 'Distinctiveness', status: 'Met', score: 5, maxScore: 5 },
      ],
    },
  ],
  overallScore: 84,
  overallMaxScore: 100,
  estimatedGrade: 'A',
  lastUpdated: '2026-06-10T08:30:00Z',
  totalEvidence: 57,
  totalDocumentsUploaded: 45,
  totalDocumentsRequired: 61,
};

function getStatusColor(status: string) {
  if (status === 'Met') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (status === 'Partially Met') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-red-400 bg-red-500/10 border-red-500/30';
}

function getStatusIcon(status: string) {
  if (status === 'Met') return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === 'Partially Met') return <AlertTriangle className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

function getGradeColor(grade: string) {
  if (grade.startsWith('A+')) return 'text-emerald-400';
  if (grade.startsWith('A')) return 'text-teal-400';
  if (grade.startsWith('B+')) return 'text-cyan-400';
  if (grade.startsWith('B')) return 'text-blue-400';
  return 'text-amber-400';
}

function getImprovementRecommendations(criteria: NaaCCriterion[]): string[] {
  const recommendations: string[] = [];
  criteria.forEach(c => {
    if (c.status === 'Not Met') {
      recommendations.push(`Critical: ${c.title} requires immediate attention. Current score: ${c.score}/${c.maxScore}`);
    } else if (c.status === 'Partially Met') {
      recommendations.push(`Improve: ${c.title} needs additional documentation. Gap: ${c.maxScore - c.score} points.`);
    }
    c.subCriteria.forEach(sub => {
      if (sub.status === 'Not Met') {
        recommendations.push(`  → ${sub.id}: ${sub.label} is below threshold.`);
      } else if (sub.status === 'Partially Met') {
        recommendations.push(`  → ${sub.id}: ${sub.label} needs supplementary evidence.`);
      }
    });
  });
  if (recommendations.length === 0) {
    recommendations.push('All criteria are met. Focus on maintaining current standards.');
  }
  return recommendations;
}

export default function HodNaacPage() {
  const [dashboard, setDashboard] = useState<NaaCDashboard>(MOCK_NAAC_DATA);
  const [loading, setLoading] = useState(true);
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await apiGet('/naac/dashboard');
        if (res.success && res.criteria) {
          setDashboard(res as any);
        } else {
          setDashboard(MOCK_NAAC_DATA);
        }
      } catch (err) {
        console.error(err);
        setDashboard(MOCK_NAAC_DATA);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleCriterion = (code: string) => {
    setExpandedCriterion(prev => (prev === code ? null : code));
  };

  const recommendations = getImprovementRecommendations(dashboard.criteria);
  const metCount = dashboard.criteria.filter(c => c.status === 'Met').length;
  const partiallyMetCount = dashboard.criteria.filter(c => c.status === 'Partially Met').length;
  const notMetCount = dashboard.criteria.filter(c => c.status === 'Not Met').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-teal-400 animate-pulse">Loading NAAC data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-[#0D0A1A] to-[#0F172A] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono">NAAC Accreditation Tracker</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">NAAC Compliance Dashboard</h1>
          <p className="text-xs text-slate-400">
            Track department&apos;s NAAC accreditation criteria compliance and readiness status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-[#0891B2]/10 border border-[#0891B2]/30">
            <span className="text-3xl font-extrabold text-teal-400">{dashboard.overallScore}</span>
            <span className="text-[10px] text-slate-400 font-bold">/{dashboard.overallMaxScore}</span>
          </div>
          <div className="flex flex-col items-center px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
            <span className={`text-2xl font-extrabold ${getGradeColor(dashboard.estimatedGrade)}`}>
              {dashboard.estimatedGrade}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">Est. Grade</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Score', value: `${dashboard.overallScore}/${dashboard.overallMaxScore}`, icon: Award, color: 'text-teal-400' },
          { label: 'Criteria Met', value: `${metCount}/${dashboard.criteria.length}`, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Partially Met', value: partiallyMetCount, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Evidence Collected', value: `${dashboard.totalEvidence}`, icon: FileText, color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0D0A1A]/60 backdrop-blur-sm rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Upload Progress */}
      <div className="bg-[#0D0A1A]/60 backdrop-blur-sm rounded-xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-400" /> Document Upload Progress
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            {dashboard.totalDocumentsUploaded}/{dashboard.totalDocumentsRequired} uploaded
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#0891B2] to-teal-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${(dashboard.totalDocumentsUploaded / dashboard.totalDocumentsRequired) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-bold">
          {Math.round((dashboard.totalDocumentsUploaded / dashboard.totalDocumentsRequired) * 100)}% documents uploaded
        </p>
      </div>

      {/* Criteria Breakdown */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-400" /> Criteria-wise Breakdown
        </h3>

        {dashboard.criteria.map(criterion => {
          const isExpanded = expandedCriterion === criterion.code;
          const progressPct = Math.round((criterion.score / criterion.maxScore) * 100);

          return (
            <div
              key={criterion.code}
              className="bg-[#0D0A1A]/60 backdrop-blur-sm rounded-xl border border-white/5 hover:border-teal-500/20 transition-all"
            >
              {/* Criterion Header */}
              <button
                onClick={() => toggleCriterion(criterion.code)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-teal-400 font-bold font-mono uppercase">{criterion.code}</span>
                    <span className="text-sm text-white font-extrabold">{criterion.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Weightage: {criterion.weightage}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-extrabold text-white">
                      {criterion.score}/{criterion.maxScore}
                    </span>
                    <div className="w-24 bg-white/5 rounded-full h-1.5">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded text-[9px] uppercase font-extrabold border ${getStatusColor(criterion.status)}`}>
                    {getStatusIcon(criterion.status)} {criterion.status}
                  </span>

                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded Sub-criteria */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <div className="mt-4 flex flex-col gap-2">
                    {criterion.subCriteria.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-teal-500/15 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-teal-400 font-mono w-8">{sub.id}</span>
                          <span className="text-xs text-white font-bold">{sub.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-300">
                            {sub.score}/{sub.maxScore}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold border ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Document upload status for this criterion */}
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-300 font-bold">
                      Documents: {criterion.documentsUploaded}/{criterion.totalDocuments} uploaded
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-1.5">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all"
                        style={{ width: `${(criterion.documentsUploaded / criterion.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Improvement Recommendations */}
      <div className="bg-[#0D0A1A]/60 backdrop-blur-sm rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-400" /> Improvement Recommendations
        </h3>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                rec.startsWith('Critical')
                  ? 'bg-red-500/5 border-red-500/20 text-red-300'
                  : rec.startsWith('  →')
                  ? 'bg-white/[0.02] border-white/5 text-slate-400'
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
              }`}
            >
              {rec.startsWith('Critical') ? (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              ) : rec.startsWith('  →') ? (
                <Star className="w-3 h-3 mt-0.5 shrink-0 text-slate-500" />
              ) : (
                <TrendingUp className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              )}
              <span className="text-xs font-bold">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-[10px] text-slate-600 font-bold">
          Last updated: {new Date(dashboard.lastUpdated).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
