"use client";

import { useState, useEffect } from 'react';
import { 
  Activity, TrendingDown, ShieldAlert, UserCheck, RefreshCw, 
  Search, AlertTriangle, AlertCircle, CheckCircle, ChevronRight, UserMinus,
  BrainCircuit
} from 'lucide-react';

interface HealthReport {
  id: string;
  student_id: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  attendance_score: number;
  fee_score: number;
  academic_score: number;
  engagement_score: number;
  factors: {
    low_attendance?: boolean;
    outstanding_fees?: boolean;
    low_grades?: boolean;
    non_payment?: boolean;
    partial_payment?: boolean;
    low_events?: boolean;
  };
  recommendation: string;
  students: {
    name: string;
    roll_number: string;
    departments?: {
      name: string;
    };
  };
  calculated_at: string;
  counselor_assigned?: string;
}

export default function HealthScoresPage() {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [counselorName, setCounselorName] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Call parent endpoint we added, otherwise it will return sandbox fallback
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch('/api/v1/core/students/health-scores/report', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Error fetching health scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch('/api/v1/core/students/health-scores/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Health scores recalculated successfully for all students.');
        fetchReports();
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering health calculation.');
    } finally {
      setRecalculating(false);
    }
  };

  const assignCounselor = (reportId: string) => {
    if (!counselorName) return;
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, counselor_assigned: counselorName };
      }
      return r;
    }));
    setCounselorName('');
    setAssigningId(null);
  };

  // Get department counts for heatmap
  const getDepartmentStats = () => {
    const stats: Record<string, Record<string, number>> = {
      'Computer Science': { low: 0, medium: 0, high: 0, critical: 0 },
      'Electronics': { low: 0, medium: 0, high: 0, critical: 0 },
      'Mechanical': { low: 0, medium: 0, high: 0, critical: 0 }
    };

    reports.forEach(r => {
      const dept = r.students?.departments?.name || 'Computer Science';
      const risk = r.risk_level;
      if (stats[dept]) {
        stats[dept][risk] = (stats[dept][risk] || 0) + 1;
      }
    });

    return stats;
  };

  const deptStats = getDepartmentStats();

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.students?.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = selectedRisk === 'all' || r.risk_level === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-500';
    if (score < 60) return 'text-orange-500';
    if (score < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-[#A78BFA]" />
            Predictive Dropout & Risk Engine
          </h1>
          <p className="text-[#A78BFA]/70 mt-1">
            Analyze campus parameters, identify critical student drop-out factors, and schedule intervention counselor assignments.
          </p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-[#6C2BD9]/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Analyzing Metrics...' : 'Run Analysis Sync'}
        </button>
      </div>

      {/* Grid: Heatmap + Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Grid */}
        <div className="lg:col-span-2 bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8B5CF6]" />
            Department Risk Heatmap (Grid Matrix)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#6C2BD9]/20 text-[#A78BFA]/70 text-xs tracking-wider">
                  <th className="pb-3 font-semibold">DEPARTMENT</th>
                  <th className="pb-3 text-center font-semibold">CRITICAL (&lt;40)</th>
                  <th className="pb-3 text-center font-semibold">HIGH (40-60)</th>
                  <th className="pb-3 text-center font-semibold">MEDIUM (60-80)</th>
                  <th className="pb-3 text-center font-semibold">LOW (80+)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6C2BD9]/10 text-sm">
                {Object.entries(deptStats).map(([dept, risks]) => (
                  <tr key={dept} className="hover:bg-[#6C2BD9]/5 transition-colors">
                    <td className="py-4 font-medium">{dept}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${risks.critical > 0 ? 'bg-red-500/25 text-red-400 border border-red-500/40' : 'bg-white/5 text-white/40'}`}>
                        {risks.critical}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${risks.high > 0 ? 'bg-orange-500/25 text-orange-400 border border-orange-500/40' : 'bg-white/5 text-white/40'}`}>
                        {risks.high}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${risks.medium > 0 ? 'bg-yellow-500/25 text-yellow-400 border border-yellow-500/40' : 'bg-white/5 text-white/40'}`}>
                        {risks.medium}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${risks.low > 0 ? 'bg-green-500/25 text-green-400 border border-green-500/40' : 'bg-white/5 text-white/40'}`}>
                        {risks.low}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Risk Distribution Index
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#0D0A1A]/60 p-3.5 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-400 w-5 h-5" />
                  <span className="text-sm font-semibold">Critical Interventions</span>
                </div>
                <span className="text-lg font-bold text-red-400">
                  {reports.filter(r => r.risk_level === 'critical').length}
                </span>
              </div>

              <div className="flex justify-between items-center bg-[#0D0A1A]/60 p-3.5 rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-orange-400 w-5 h-5" />
                  <span className="text-sm font-semibold">High Priority Risks</span>
                </div>
                <span className="text-lg font-bold text-orange-400">
                  {reports.filter(r => r.risk_level === 'high').length}
                </span>
              </div>

              <div className="flex justify-between items-center bg-[#0D0A1A]/60 p-3.5 rounded-xl border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <Activity className="text-yellow-400 w-5 h-5" />
                  <span className="text-sm font-semibold">Medium Watchlists</span>
                </div>
                <span className="text-lg font-bold text-yellow-400">
                  {reports.filter(r => r.risk_level === 'medium').length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#6C2BD9]/20 text-xs text-[#A78BFA]/50 leading-relaxed mt-4">
            Analysis updates auto-compile daily at 11 PM using historical class attendance rates, payment dues ratios, and canteen & library events indices.
          </div>
        </div>
      </div>

      {/* Main Student Analysis Grid */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Detailed Analysis Database
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A78BFA]/60 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0D0A1A]/80 border border-[#6C2BD9]/30 rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] transition-all"
              />
            </div>
            {/* Risk Selection */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-[#0D0A1A]/80 border border-[#6C2BD9]/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#8B5CF6] text-white/80"
            >
              <option value="all">All Risk Classes</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Monitor</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Student Records List */}
        {loading ? (
          <div className="py-12 text-center text-[#A78BFA]/60">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#6C2BD9]" />
            Loading AI Dropout Indicators...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-[#A78BFA]/40">
            No student match parameters found in query filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => (
              <div 
                key={report.id}
                className="bg-[#0D0A1A]/60 rounded-xl p-5 border border-[#6C2BD9]/20 hover:border-[#8B5CF6]/40 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Left Column: Info & Scores */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-lg">{report.students?.name}</h3>
                      <span className="text-[#A78BFA]/60 text-xs px-2 py-0.5 rounded bg-[#13102A] border border-[#6C2BD9]/20">
                        {report.students?.roll_number}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getRiskBadgeColor(report.risk_level)}`}>
                        {report.risk_level.toUpperCase()}
                      </span>
                      {report.counselor_assigned && (
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Counselor: {report.counselor_assigned}
                        </span>
                      )}
                    </div>

                    {/* Score Bar Indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                      <div className="bg-[#13102A]/50 p-2.5 rounded-lg border border-[#6C2BD9]/10">
                        <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-wider">Health Score</div>
                        <div className={`text-lg font-bold ${getScoreColor(report.score)}`}>{report.score}%</div>
                      </div>
                      <div className="bg-[#13102A]/50 p-2.5 rounded-lg border border-[#6C2BD9]/10">
                        <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-wider">Attendance</div>
                        <div className="text-lg font-bold text-blue-400">{report.attendance_score}%</div>
                      </div>
                      <div className="bg-[#13102A]/50 p-2.5 rounded-lg border border-[#6C2BD9]/10">
                        <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-wider">Academics</div>
                        <div className="text-lg font-bold text-violet-400">{report.academic_score}%</div>
                      </div>
                      <div className="bg-[#13102A]/50 p-2.5 rounded-lg border border-[#6C2BD9]/10">
                        <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-wider">Fee Standing</div>
                        <div className="text-lg font-bold text-yellow-400">{report.fee_score}%</div>
                      </div>
                    </div>

                    {/* Recommendation Message */}
                    <p className="text-sm text-[#A78BFA]/80 italic mt-2.5 border-l-2 border-[#6C2BD9] pl-3 py-0.5">
                      &ldquo;{report.recommendation}&rdquo;
                    </p>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch lg:items-center">
                    {assigningId === report.id ? (
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Counselor Name..."
                          value={counselorName}
                          onChange={(e) => setCounselorName(e.target.value)}
                          className="px-3 py-1.5 bg-[#0D0A1A]/90 border border-[#6C2BD9]/30 rounded-lg text-xs focus:outline-none text-white w-full sm:w-40"
                        />
                        <button
                          onClick={() => assignCounselor(report.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setAssigningId(null)}
                          className="bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssigningId(report.id);
                          setCounselorName('');
                        }}
                        className="flex items-center justify-center gap-1.5 bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/40 border border-[#6C2BD9]/40 text-[#A78BFA] text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {report.counselor_assigned ? 'Reassign Counselor' : 'Assign Intervention'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
