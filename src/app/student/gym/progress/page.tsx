"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Download, Dumbbell, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { apiGet, apiFetchBlob } from '../../../../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentGymProgress() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      // Load metrics
      const metrRes = await apiGet(`/fitzone/gym/metrics/${studentId}`);
      // Load workouts
      const workRes = await apiGet(`/fitzone/gym/workouts/${studentId}`);

      if (metrRes.success) setMetrics(metrRes.metrics || []);
      if (workRes.success) setWorkouts(workRes.workouts || []);
    } catch (err) {
      console.log('Error loading progress data, using fallback mocks');
      // Fallback mocks
      setMetrics([
        { date: '2026-03-01', weight_kg: 78.5, bmi: 24.5, body_fat_percent: 21.0, chest_cm: 98, waist_cm: 86, hips_cm: 94 },
        { date: '2026-04-01', weight_kg: 77.2, bmi: 24.1, body_fat_percent: 19.8, chest_cm: 98, waist_cm: 84, hips_cm: 93 },
        { date: '2026-05-01', weight_kg: 76.0, bmi: 23.7, body_fat_percent: 18.5, chest_cm: 99, waist_cm: 82, hips_cm: 92 },
        { date: '2026-06-01', weight_kg: 75.1, bmi: 23.4, body_fat_percent: 17.6, chest_cm: 100, waist_cm: 80, hips_cm: 91 }
      ]);
      setWorkouts([
        { date: '2026-06-08', duration_minutes: 45, calories_burned: 315 },
        { date: '2026-06-06', duration_minutes: 60, calories_burned: 420 },
        { date: '2026-06-05', duration_minutes: 50, calories_burned: 350 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const blob = await apiFetchBlob(`/fitzone/gym/report/${studentId}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FitZone_Progress_Report_${studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download report PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const latestMetric = metrics[metrics.length - 1];
  const chartData = metrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
    weight: parseFloat(m.weight_kg),
    bodyFat: m.body_fat_percent ? parseFloat(m.body_fat_percent) : null,
    bmi: parseFloat(m.bmi)
  }));

  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-[#A78BFA]" />
              <div>
                <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Fitness Progress</h1>
                <p className="text-xs text-[#C4B5FD]/70">Analyze body dimensions, BMI levels, and monthly calorie burn.</p>
              </div>
            </div>

            <button
              onClick={downloadReport}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> {downloading ? 'Compiling PDF...' : 'Download Progress Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">

        {/* 1. Metric KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Latest Weight</span>
            <span className="text-2xl font-extrabold text-white">{latestMetric ? `${latestMetric.weight_kg} kg` : 'N/A'}</span>
            <span className="text-[9px] text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Tracked Monthly</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Body Mass Index</span>
            <span className="text-2xl font-extrabold text-white">{latestMetric ? latestMetric.bmi : 'N/A'}</span>
            <span className="text-[9px] text-[#C4B5FD]/40 mt-1">Ideal: 18.5 - 24.9</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Body Fat</span>
            <span className="text-2xl font-extrabold text-white">{latestMetric?.body_fat_percent ? `${latestMetric.body_fat_percent}%` : 'N/A'}</span>
            <span className="text-[9px] text-[#C4B5FD]/40 mt-1">Target: 14% - 18%</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Sessions Logged</span>
            <span className="text-2xl font-extrabold text-white">{workouts.length}</span>
            <span className="text-[9px] text-emerald-400 mt-1">Total: {totalCalories} kcal burned</span>
          </div>
        </div>

        {/* 2. Chart Section */}
        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weight Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40">
              <h3 className="text-sm font-bold text-white mb-6">Weight Trend (kg)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#C4B5FD" style={{ fontSize: 10 }} />
                    <YAxis stroke="#C4B5FD" style={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="weight" stroke="#6C2BD9" strokeWidth={3} dot={{ fill: '#A78BFA' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Body Fat Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40">
              <h3 className="text-sm font-bold text-white mb-6">Body Fat Trend (%)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#C4B5FD" style={{ fontSize: 10 }} />
                    <YAxis stroke="#C4B5FD" style={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="bodyFat" stroke="#EC4899" strokeWidth={3} dot={{ fill: '#F472B6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-20 text-center text-xs text-[#C4B5FD]/30">No metrics data logged yet. Ask your gym trainer to record your metrics!</div>
        )}

        {/* 3. Measurements History Details */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/20">
          <h3 className="text-sm font-bold text-white mb-4">Body Measurements History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD]/50">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Weight</th>
                  <th className="py-3 px-2">BMI</th>
                  <th className="py-3 px-2">Chest</th>
                  <th className="py-3 px-2">Waist</th>
                  <th className="py-3 px-2">Hips</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i} className="border-b border-white/5 text-white/80 hover:bg-white/5">
                    <td className="py-3 px-2 font-semibold">{m.date}</td>
                    <td className="py-3 px-2">{m.weight_kg} kg</td>
                    <td className="py-3 px-2">{m.bmi}</td>
                    <td className="py-3 px-2">{m.chest_cm ? `${m.chest_cm} cm` : 'N/A'}</td>
                    <td className="py-3 px-2">{m.waist_cm ? `${m.waist_cm} cm` : 'N/A'}</td>
                    <td className="py-3 px-2">{m.hips_cm ? `${m.hips_cm} cm` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
