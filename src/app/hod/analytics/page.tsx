"use client";
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, GraduationCap, Target, Calendar, ChevronDown, Download } from 'lucide-react';
import { apiGet } from '../../../lib/api';

const emptyData = {
  keyMetrics: {
    totalStudents: 0,
    avgAttendance: 0,
    passRate: 0,
    placementRate: 0,
    avgCGPA: 0,
  },
  attendanceTrend: [] as {month:string;rate:number}[],
  resultTrend: [] as {semester:string;passRate:number}[],
  subjectPerformance: [] as {subject:string;avgScore:number;passRate:number}[],
  departmentComparison: [] as {name:string;avgCGPA:number;placementRate:number}[],
  yearOverYear: { studentGrowth: 0, attendanceGrowth: 0, passRateGrowth: 0, placementGrowth: 0 },
  quickInsights: [] as {title:string;value:string;trend:string}[],
  topPerformers: [] as {name:string;cgpa:number;dept:string}[],
  bottomPerformers: [] as {name:string;cgpa:number;dept:string;attendance:number}[],
};

export default function HodAnalyticsPage() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedDept, setSelectedDept] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiGet('/director/campus-pulse');
        if (res && res.data) setData(res.data);
      } catch {
        console.log('Using mock data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const maxAttendance = Math.max(...data.attendanceTrend.map(d => d.rate));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="text-teal-400 text-xl animate-pulse">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="text-teal-400" />
              Department Analytics
            </h1>
            <p className="text-gray-400 mt-2">Comprehensive performance overview</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-[#1A1528] border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white appearance-none cursor-pointer"
              >
                <option value="current">Current Semester</option>
                <option value="last">Last Semester</option>
                <option value="yearly">Yearly</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Students', value: data.keyMetrics.totalStudents, icon: Users, color: 'text-blue-400' },
            { label: 'Avg Attendance', value: `${data.keyMetrics.avgAttendance}%`, icon: Calendar, color: 'text-green-400' },
            { label: 'Pass Rate', value: `${data.keyMetrics.passRate}%`, icon: GraduationCap, color: 'text-purple-400' },
            { label: 'Placement Rate', value: `${data.keyMetrics.placementRate}%`, icon: Target, color: 'text-orange-400' },
            { label: 'Avg CGPA', value: data.keyMetrics.avgCGPA, icon: BarChart3, color: 'text-teal-400' },
          ].map((metric, i) => (
            <div key={i} className="bg-[#1A1528] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                <span className="text-gray-400 text-sm">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Attendance Trend (Last 6 Months)
            </h3>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {data.attendanceTrend.map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-400 mb-2">{item.rate}%</span>
                  <div
                    className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(item.rate / maxAttendance) * 200}px` }}
                  />
                  <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Result Trend (Last 4 Semesters)
            </h3>
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {data.resultTrend.map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-400 mb-2">{item.passRate}%</span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(item.passRate / 100) * 200}px` }}
                  />
                  <span className="text-xs text-gray-400 mt-2">{item.semester}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
            <div className="space-y-4">
              {data.subjectPerformance.map((subject, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{subject.subject}</span>
                    <span className="text-teal-400">{subject.avgScore}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                      style={{ width: `${subject.avgScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pass Rate: {subject.passRate}%</span>
                    <span>Students: {Math.floor(Math.random() * 200 + 100)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Department Comparison</h3>
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-3 text-gray-400">Department</th>
                    <th className="text-center p-3 text-gray-400">Avg CGPA</th>
                    <th className="text-center p-3 text-gray-400">Placement</th>
                  </tr>
                </thead>
                <tbody>
                  {data.departmentComparison.map((dept, i) => (
                    <tr key={i} className="border-t border-gray-700 hover:bg-gray-800/50">
                      <td className="p-3 text-white">{dept.name}</td>
                      <td className="p-3 text-center">
                        <span className="text-teal-400 font-semibold">{dept.avgCGPA}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          dept.placementRate >= 85 ? 'bg-green-900/50 text-green-400' :
                          dept.placementRate >= 75 ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {dept.placementRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Year-over-Year Growth
          </h3>
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Student Growth', value: data.yearOverYear.studentGrowth, color: 'from-blue-500 to-blue-400' },
              { label: 'Attendance Growth', value: data.yearOverYear.attendanceGrowth, color: 'from-green-500 to-green-400' },
              { label: 'Pass Rate Growth', value: data.yearOverYear.passRateGrowth, color: 'from-purple-500 to-purple-400' },
              { label: 'Placement Growth', value: data.yearOverYear.placementGrowth, color: 'from-orange-500 to-orange-400' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="#374151" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="35" fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="6"
                      strokeDasharray={`${(item.value / 20) * 220} 220`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className={`text-teal-500`} stopColor="currentColor" />
                        <stop offset="100%" className={`text-cyan-400`} stopColor="currentColor" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">+{item.value}%</span>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              CGPA Distribution
            </h3>
            <div className="space-y-3">
              {[
                { range: '9.0 - 10.0', count: 42, percent: 5 },
                { range: '8.0 - 8.9', count: 168, percent: 20 },
                { range: '7.0 - 7.9', count: 294, percent: 35 },
                { range: '6.0 - 6.9', count: 210, percent: 25 },
                { range: 'Below 6.0', count: 128, percent: 15 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-24">{item.range}</span>
                  <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${item.percent * 2.5}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{item.percent}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-sm">
              <span className="text-gray-400">Total Graded:</span>
              <span className="text-white font-semibold">842 students</span>
            </div>
          </div>

          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Weekly Attendance Heatmap
            </h3>
            <div className="grid grid-cols-6 gap-1">
              <div className="text-[10px] text-gray-500 text-center pb-1"></div>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] text-gray-500 text-center pb-1">{d}</div>
              ))}
              {['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'].map((time, ti) => (
                <React.Fragment key={time}>
                  <div className="text-[10px] text-gray-500 text-right pr-2">{time}</div>
                  {[92, 88, 85, 78, 90, 82, 75, 68, 60].map((val, di) => {
                    const intensity = val / 100;
                    return (
                      <div
                        key={di}
                        className="aspect-square rounded-sm transition-colors cursor-pointer"
                        title={`${time} - ${val}% attendance`}
                        style={{
                          backgroundColor: `rgba(8, 145, 178, ${intensity})`,
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] text-gray-500">Low</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((v, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(8, 145, 178, ${v})` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500">High</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            Top & Bottom Performers
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-3 uppercase tracking-wide">Top 5 Students</h4>
              <div className="space-y-2">
                {(data.topPerformers || []).length === 0 ? (
                  <div className="text-xs text-gray-500 py-4 text-center">No data available</div>
                ) : (data.topPerformers || []).map((student, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0D0A1A] rounded-lg px-4 py-3 border border-gray-700 hover:border-green-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center text-green-400 text-sm font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.dept}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">{student.cgpa}</div>
                      <div className="text-[10px] text-gray-500">CGPA</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-3 uppercase tracking-wide">Students Need Attention</h4>
              <div className="space-y-2">
                {(data.bottomPerformers || []).length === 0 ? (
                  <div className="text-xs text-gray-500 py-4 text-center">No data available</div>
                ) : (data.bottomPerformers || []).map((student, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0D0A1A] rounded-lg px-4 py-3 border border-gray-700 hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center text-red-400 text-sm font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.dept}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-400">{student.cgpa}</div>
                      <div className="text-[10px] text-gray-500">CGPA ({student.attendance}% Att.)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-400" />
            Semester-wise Enrollment Breakdown
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { semester: 'Semester 1', male: 180, female: 120, total: 300, color: 'from-blue-500 to-blue-400' },
              { semester: 'Semester 2', male: 165, female: 115, total: 280, color: 'from-purple-500 to-purple-400' },
              { semester: 'Semester 3', male: 105, female: 85, total: 190, color: 'from-teal-500 to-teal-400' },
              { semester: 'Semester 4', male: 42, female: 30, total: 72, color: 'from-orange-500 to-orange-400' },
            ].map((sem, i) => (
              <div key={i} className="bg-[#0D0A1A] border border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">{sem.semester}</div>
                <div className="text-3xl font-bold text-white mb-3">{sem.total}</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-400">Male</span>
                      <span className="text-gray-400">{sem.male}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${(sem.male / sem.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-pink-400">Female</span>
                      <span className="text-gray-400">{sem.female}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-pink-400 rounded-full"
                        style={{ width: `${(sem.female / sem.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                  Gender Ratio: {(sem.male / sem.female).toFixed(1)}:1
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              Faculty-Student Ratio by Dept
            </h3>
            <div className="space-y-4">
              {[
                { dept: 'Computer Science', ratio: '1:18', faculty: 12, students: 216 },
                { dept: 'Electronics', ratio: '1:20', faculty: 10, students: 200 },
                { dept: 'Mechanical', ratio: '1:22', faculty: 8, students: 176 },
                { dept: 'Civil', ratio: '1:25', faculty: 7, students: 175 },
                { dept: 'Chemical', ratio: '1:19', faculty: 5, students: 95 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">{item.dept}</span>
                      <span className="text-sm text-teal-400 font-medium">{item.ratio}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
                        style={{ width: `${(item.students / 220) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>{item.faculty} Faculty</span>
                      <span>{item.students} Students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-400" />
              Recent Activity Log
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                { time: '2 min ago', event: 'Mid-term results uploaded for CS Sem 3', type: 'results' },
                { time: '15 min ago', event: 'Attendance threshold alert: Chemical Dept below 70%', type: 'alert' },
                { time: '1 hour ago', event: 'New faculty added to Electronics department', type: 'update' },
                { time: '2 hours ago', event: 'Placement drive scheduled for CS & Electronics', type: 'placement' },
                { time: '3 hours ago', event: 'Lab results uploaded for Physics Sem 1', type: 'results' },
                { time: '5 hours ago', event: 'Department meeting notes updated', type: 'update' },
                { time: '6 hours ago', event: 'Student transfer request approved: Mech to CS', type: 'update' },
                { time: '1 day ago', event: 'Semester 4 results declared - 94% pass rate', type: 'results' },
                { time: '1 day ago', event: 'Placement statistics updated for Q4', type: 'placement' },
                { time: '2 days ago', event: 'Annual accreditation report submitted', type: 'update' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    item.type === 'alert' ? 'bg-red-400' :
                    item.type === 'results' ? 'bg-green-400' :
                    item.type === 'placement' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{item.event}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1A1528] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            Quick Insights
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {data.quickInsights.map((insight, i) => (
              <div key={i} className="bg-[#0D0A1A] border border-gray-700 rounded-lg p-4 hover:border-teal-500/50 transition-colors">
                <div className="text-sm text-gray-400 mb-1">{insight.title}</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{insight.value}</span>
                  {insight.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
