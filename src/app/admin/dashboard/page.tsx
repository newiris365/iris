"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, Building2, CheckCircle, IndianRupee, AlertTriangle,
  CalendarDays, DoorOpen, Activity, TrendingUp, FileText, LogOut,
  Dumbbell, Bus, ShoppingBag, BookOpen, Shield
} from 'lucide-react';

// ========== TYPE DEFINITIONS ==========
interface OverviewData {
  total_students: number;
  total_staff: number;
  total_departments: number;
  attendance_today: number;
  attendance_rate: number;
  total_fee_collected: number;
  pending_complaints: number;
  active_events: number;
  hostel_occupancy_rate: number;
  total_hostel_capacity: number;
  total_hostel_occupied: number;
  gate_entries_today: number;
}

interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  total: number;
}

interface FeeMonth {
  month: string;
  amount: number;
}

interface Alert {
  type: string;
  severity: string;
  title: string;
  detail: string;
  created_at: string;
}

interface ModuleUsage {
  canteen: { orders_today: number };
  fitzone: { bookings_this_week: number };
  gate: { entries_today: number };
  library: { issues_this_week: number };
  events: { registrations_this_week: number };
  transit: { active_subscriptions: number };
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'alerts' | 'modules'>('overview');

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);
  const [feeByMonth, setFeeByMonth] = useState<FeeMonth[]>([]);
  const [canteenRevenue, setCanteenRevenue] = useState<number>(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [modules, setModules] = useState<ModuleUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    loadDashboardData();
  }, []);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [overviewRes, analyticsRes, alertsRes, modulesRes] = await Promise.all([
        fetch('/api/v1/director/overview', { headers: getAuthHeaders() }),
        fetch('/api/v1/director/analytics', { headers: getAuthHeaders() }),
        fetch('/api/v1/director/alerts', { headers: getAuthHeaders() }),
        fetch('/api/v1/director/modules', { headers: getAuthHeaders() })
      ]);

      const overviewData = await overviewRes.json();
      const analyticsData = await analyticsRes.json();
      const alertsData = await alertsRes.json();
      const modulesData = await modulesRes.json();

      if (overviewData.success) setOverview(overviewData.overview);
      if (analyticsData.success) {
        setAttendanceTrend(analyticsData.analytics.attendance_trend);
        setFeeByMonth(analyticsData.analytics.fee_collection_by_month);
        setCanteenRevenue(analyticsData.analytics.canteen_revenue_this_month);
      }
      if (alertsData.success) setAlerts(alertsData.alerts);
      if (modulesData.success) setModules(modulesData.modules);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/v1/director/report/pdf', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        alert(`Report Generated:\n\n${result.report.title}\nInstitution: ${result.report.institution}\nGenerated: ${result.report.generated_at}\n\nStudents: ${result.report.summary.total_students}\nStaff: ${result.report.summary.total_staff}\nFees Collected: ${result.report.summary.fee_collected}\nPending Complaints: ${result.report.summary.pending_complaints}`);
      }
    } catch (err) {
      alert('Failed to generate report.');
    }
  };

  // Mock data for chart rendering (visual representation without Recharts library)
  const maxFee = Math.max(...feeByMonth.map(f => f.amount), 1);

  if (!profile) return <div className="p-8 text-center text-xs text-[#C4B5FD]">Loading session...</div>;

  return (
    <div className="max-w-7xl mx-auto py-2 w-full">
      {/* Section Tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
          { key: 'modules', label: 'Module Usage', icon: Building2 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${
              activeSection === tab.key
                ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                : 'bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'alerts' && alerts.length > 0 && (
              <span className="ml-1 bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{alerts.length}</span>
            )}
          </button>
        ))}

        <button
          onClick={handleDownloadReport}
          className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Download Report
        </button>
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[#C4B5FD]">Loading dashboard data...</p>
        </div>
      )}

      {/* ===== OVERVIEW SECTION ===== */}
      {!loading && activeSection === 'overview' && overview && (
        <div className="flex flex-col gap-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: overview.total_students, icon: GraduationCap, color: '#6C2BD9' },
              { label: 'Total Staff', value: overview.total_staff, icon: Users, color: '#8B5CF6' },
              { label: 'Attendance Rate', value: `${overview.attendance_rate}%`, icon: CheckCircle, color: overview.attendance_rate >= 75 ? '#10B981' : '#EF4444' },
              { label: 'Fee Collected', value: `₹${overview.total_fee_collected.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#F59E0B' },
              { label: 'Pending Complaints', value: overview.pending_complaints, icon: AlertTriangle, color: overview.pending_complaints > 0 ? '#EF4444' : '#10B981' },
              { label: 'Active Events', value: overview.active_events, icon: CalendarDays, color: '#8B5CF6' },
              { label: 'Hostel Occupancy', value: `${overview.hostel_occupancy_rate}%`, icon: DoorOpen, color: '#06B6D4' },
              { label: 'Gate Entries Today', value: overview.gate_entries_today, icon: Shield, color: '#A78BFA' }
            ].map((kpi, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-[#6C2BD9]/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">{kpi.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <h3 className="font-extrabold text-2xl text-white">{kpi.value}</h3>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-4">Campus Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex flex-col gap-2">
                <span className="text-[#C4B5FD] text-xs">Departments</span>
                <span className="font-bold text-white text-xl">{overview.total_departments}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[#C4B5FD] text-xs">Present Today</span>
                <span className="font-bold text-white text-xl">{overview.attendance_today} / {overview.total_students}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[#C4B5FD] text-xs">Hostel Beds</span>
                <span className="font-bold text-white text-xl">{overview.total_hostel_occupied} / {overview.total_hostel_capacity}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ANALYTICS SECTION ===== */}
      {!loading && activeSection === 'analytics' && (
        <div className="flex flex-col gap-8">
          {/* Attendance Trend (Bar Chart Visualization) */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-1">Attendance Trend — Last 30 Days</h3>
            <p className="text-xs text-[#C4B5FD] mb-6">Daily present vs absent student count</p>

            {attendanceTrend.length > 0 ? (
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                {attendanceTrend.map((day, idx) => {
                  const maxVal = Math.max(...attendanceTrend.map(d => d.total), 1);
                  const presentHeight = (day.present / maxVal) * 100;
                  const absentHeight = (day.absent / maxVal) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-0.5 min-w-[18px] group relative">
                      <div className="flex flex-col-reverse gap-0.5 w-3">
                        <div className="bg-[#6C2BD9] rounded-t" style={{ height: `${presentHeight}%`, minHeight: day.present > 0 ? '2px' : '0' }}></div>
                        <div className="bg-red-500/50 rounded-t" style={{ height: `${absentHeight}%`, minHeight: day.absent > 0 ? '2px' : '0' }}></div>
                      </div>
                      <span className="text-[7px] text-[#C4B5FD]/50 rotate-45 origin-left mt-1">{day.date.slice(5)}</span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#13102A] border border-[#6C2BD9]/30 rounded-lg p-2 text-[9px] z-10 whitespace-nowrap">
                        <div className="text-white font-bold">{day.date}</div>
                        <div className="text-emerald-400">Present: {day.present}</div>
                        <div className="text-red-400">Absent: {day.absent}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#C4B5FD]/50 text-center py-10">No attendance data available yet.</p>
            )}

            <div className="flex gap-4 mt-4 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#6C2BD9]"></span> Present</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/50"></span> Absent</span>
            </div>
          </div>

          {/* Fee Collection by Month */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-1">Fee Collection — {new Date().getFullYear()}</h3>
            <p className="text-xs text-[#C4B5FD] mb-6">Monthly collection in Indian Rupees</p>

            <div className="flex items-end gap-3 h-44">
              {feeByMonth.map((month, idx) => {
                const barHeight = maxFee > 0 ? (month.amount / maxFee) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#6C2BD9] to-[#8B5CF6] transition-all hover:brightness-125 min-h-[2px]"
                      style={{ height: `${barHeight}%` }}
                    ></div>
                    <span className="text-[9px] text-[#C4B5FD] font-semibold">{month.month}</span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#13102A] border border-[#6C2BD9]/30 rounded-lg p-2 text-[9px] z-10 whitespace-nowrap">
                      <div className="text-white font-bold">{month.month} {new Date().getFullYear()}</div>
                      <div className="text-[#A78BFA]">₹{month.amount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canteen Revenue */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-2">Canteen Revenue — This Month</h3>
            <h2 className="font-extrabold text-3xl text-white">₹{canteenRevenue.toLocaleString('en-IN')}</h2>
          </div>
        </div>
      )}

      {/* ===== ALERTS SECTION ===== */}
      {!loading && activeSection === 'alerts' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">Action Required — {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</h3>
          </div>

          {alerts.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-white font-semibold">All Clear</p>
              <p className="text-xs text-[#C4B5FD] mt-1">No urgent actions needed right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`glass-panel rounded-2xl p-5 flex items-start gap-4 border-l-4 ${
                  alert.severity === 'high' ? 'border-l-red-500' :
                  alert.severity === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-500/15 text-red-400' :
                    alert.severity === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-white">{alert.title}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>{alert.severity}</span>
                    </div>
                    <p className="text-xs text-[#C4B5FD]/80">{alert.detail}</p>
                  </div>
                  <span className="text-[10px] text-[#C4B5FD]/50 flex-shrink-0">{alert.type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== MODULES SECTION ===== */}
      {!loading && activeSection === 'modules' && modules && (
        <div className="flex flex-col gap-6">
          <h3 className="font-bold text-lg text-white">Module Adoption Metrics</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Canteen Orders', sublabel: 'Today', value: modules.canteen.orders_today, icon: ShoppingBag, color: '#F59E0B' },
              { label: 'FitZone Bookings', sublabel: 'This Week', value: modules.fitzone.bookings_this_week, icon: Dumbbell, color: '#EF4444' },
              { label: 'Gate Entries', sublabel: 'Today', value: modules.gate.entries_today, icon: Shield, color: '#6C2BD9' },
              { label: 'Library Issues', sublabel: 'This Week', value: modules.library.issues_this_week, icon: BookOpen, color: '#8B5CF6' },
              { label: 'Event Registrations', sublabel: 'This Week', value: modules.events.registrations_this_week, icon: CalendarDays, color: '#06B6D4' },
              { label: 'Transit Subscriptions', sublabel: 'Active', value: modules.transit.active_subscriptions, icon: Bus, color: '#10B981' }
            ].map((mod, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-[#6C2BD9]/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${mod.color}15`, border: `1px solid ${mod.color}30` }}>
                    <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{mod.label}</h4>
                    <span className="text-[9px] text-[#C4B5FD]/60 uppercase tracking-wider">{mod.sublabel}</span>
                  </div>
                </div>
                <h3 className="font-extrabold text-3xl text-white">{mod.value}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
