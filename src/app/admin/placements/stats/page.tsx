"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, TrendingUp, DollarSign, Building2, Award, BarChart3, Download, RefreshCw } from "lucide-react"
import Link from "next/link"

import { apiGet, apiFetchBlob } from "../../../../lib/api"
import Skeleton from "../../../../components/Skeleton"

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from '../../../../lib/charts'

interface DashboardData {
  total_eligible: number
  total_placed: number
  total_companies: number
  avg_ctc: number
  median_ctc: number
  highest_ctc: number
  lowest_ctc: number
  branch_placement_rates: Record<string, number>
  ctc_segments: Record<string, number>
}

const defaultData: DashboardData = {
  total_eligible: 645,
  total_placed: 489,
  total_companies: 87,
  avg_ctc: 8.4,
  median_ctc: 6.2,
  highest_ctc: 45.0,
  lowest_ctc: 3.5,
  branch_placement_rates: { CSE: 92, ECE: 78, ME: 65, CE: 71, EE: 69, IT: 88, CH: 58 },
  ctc_segments: { Dream: 78, Core: 245, Mass: 166 }
}

const monthlyOffers = [
  { month: "Aug", offers: 12 }, { month: "Sep", offers: 34 }, { month: "Oct", offers: 56 },
  { month: "Nov", offers: 78 }, { month: "Dec", offers: 45 }, { month: "Jan", offers: 89 },
  { month: "Feb", offers: 67 }, { month: "Mar", offers: 56 }, { month: "Apr", offers: 34 },
  { month: "May", offers: 18 }
]

const companyOffers = [
  { company: "TCS", offers: 89 }, { company: "Infosys", offers: 76 }, { company: "Wipro", offers: 64 },
  { company: "Amazon", offers: 23 }, { company: "Microsoft", offers: 18 }, { company: "Google", offers: 12 },
  { company: "Flipkart", offers: 15 }, { company: "Accenture", offers: 45 }, { company: "Cognizant", offers: 52 },
  { company: "HCL", offers: 38 }
]

const recentPlacements = [
  { name: "Aarav Sharma", company: "Amazon", ctc: 26.5, branch: "CSE", date: "2026-04-15" },
  { name: "Priya Patel", company: "Microsoft", ctc: 32.0, branch: "CSE", date: "2026-04-14" },
  { name: "Rohan Gupta", company: "Google", ctc: 45.0, branch: "CSE", date: "2026-04-13" },
  { name: "Sneha Reddy", company: "Flipkart", ctc: 18.5, branch: "ECE", date: "2026-04-12" },
  { name: "Vikram Singh", company: "TCS", ctc: 4.2, branch: "ME", date: "2026-04-11" },
  { name: "Ananya Nair", company: "Infosys", ctc: 3.8, branch: "CE", date: "2026-04-10" }
]

const segmentColors = ["#6C2BD9", "#A78BFA", "#C4B5FD"]

export default function AdminPlacementStats() {
  const [data, setData] = useState<DashboardData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState("2026")




  const [downloadingReport, setDownloadingReport] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiGet("/placements/analytics/dashboard")
      .then((res: any) => {
        if (res && res.total_eligible) setData(res)
      })
      .catch(() => {})
      .finally(() => setTimeout(() => setLoading(false), 600))
  }, [year])

  const handleDownloadAnnualReport = async (e: React.MouseEvent) => {
    e.preventDefault()
    setDownloadingReport(true)
    try {
      const blob = await apiFetchBlob("/placements/reports/annual")
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'SIET_Placement_Brochure_2026.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Failed to download placement annual report.')
    } finally {
      setDownloadingReport(false)
    }
  }

  const placedPercent = Math.round((data.total_placed / data.total_eligible) * 100)

  const branchData = Object.entries(data.branch_placement_rates).map(([branch, rate]) => ({
    branch,
    rate
  }))

  const pieData = Object.entries(data.ctc_segments).map(([name, value]) => ({ name, value }))

  return (
    <div className="min-h-screen bg-[#0D0A1A] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/placements" className="p-2 rounded-xl bg-[#13102A]/60 border border-white/5 text-[#C4B5FD] hover:bg-[#6C2BD9]/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Placement Analytics & Statistics</h1>
              <p className="text-sm text-[#C4B5FD]/60">Comprehensive placement data and insights</p>
            </div>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[#13102A]/60 border border-white/5 text-[#C4B5FD] text-sm focus:outline-none focus:border-[#6C2BD9]"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: "Total Eligible", value: data.total_eligible, color: "text-[#C4B5FD]" },
              { icon: TrendingUp, label: "Total Placed", value: `${data.total_placed} (${placedPercent}%)`, color: "text-green-400" },
              { icon: Building2, label: "Companies", value: data.total_companies, color: "text-blue-400" },
              { icon: DollarSign, label: "Avg CTC", value: `₹${data.avg_ctc}L`, color: "text-yellow-400" },
              { icon: Award, label: "Highest CTC", value: `₹${data.highest_ctc}L`, color: "text-orange-400" },
              { icon: BarChart3, label: "Median CTC", value: `₹${data.median_ctc}L`, color: "text-pink-400" }
            ].map((card, i) => (
              <div key={i} className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-5">
                <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
                <p className="text-xs text-[#C4B5FD]/60 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Branch-wise Placement Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#C4B5FD", fontSize: 12 }} />
                  <YAxis dataKey="branch" type="category" tick={{ fill: "#C4B5FD", fontSize: 12 }} width={40} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="rate" fill="#6C2BD9" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">CTC Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={segmentColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Monthly Offers Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyOffers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#C4B5FD", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#C4B5FD", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="offers" stroke="#A78BFA" strokeWidth={2} dot={{ fill: "#6C2BD9" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company-wise Offers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyOffers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="company" tick={{ fill: "#C4B5FD", fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#C4B5FD", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="offers" fill="#A78BFA" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Placements</h3>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadAnnualReport}
                disabled={downloadingReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C2BD9] text-white text-sm font-medium hover:bg-[#7d3eea] transition-colors disabled:opacity-50"
              >
                {downloadingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloadingReport ? "Downloading..." : "Download Annual Report"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[#C4B5FD] text-sm font-medium hover:bg-white/5 transition-colors">
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[#C4B5FD]/60 border-b border-white/5">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">CTC (₹L)</th>
                  <th className="pb-3 font-medium">Branch</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPlacements.map((p, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-white text-sm">{p.name}</td>
                    <td className="py-3 text-[#C4B5FD] text-sm">{p.company}</td>
                    <td className="py-3 text-green-400 text-sm font-medium">₹{p.ctc}L</td>
                    <td className="py-3 text-[#C4B5FD]/70 text-sm">{p.branch}</td>
                    <td className="py-3 text-[#C4B5FD]/50 text-sm">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
