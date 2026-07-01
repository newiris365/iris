"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, Users, Award, Building2, Target, FileText, Mic, Eye } from "lucide-react"
import Link from "next/link"

import { apiGet } from "../../../../lib/api"
import Skeleton from "../../../../components/Skeleton"

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from '../../../../lib/charts'

interface StudentStats {
  total_placed: number
  avg_ctc: number
  highest_ctc: number
  your_ranking: number | null
  branch: string
  branch_rank: number | null
  applications_sent: number
  shortlisted: number
  offers_received: number
  offers_accepted: number
}

const defaultStats: StudentStats = {
  total_placed: 489,
  avg_ctc: 8.4,
  highest_ctc: 45.0,
  your_ranking: 23,
  branch: "CSE",
  branch_rank: 5,
  applications_sent: 12,
  shortlisted: 6,
  offers_received: 2,
  offers_accepted: 1
}

const radarData = [
  { branch: "CSE", rate: 92, fullMark: 100 },
  { branch: "ECE", rate: 78, fullMark: 100 },
  { branch: "IT", rate: 88, fullMark: 100 },
  { branch: "CE", rate: 71, fullMark: 100 },
  { branch: "EE", rate: 69, fullMark: 100 },
  { branch: "ME", rate: 65, fullMark: 100 },
  { branch: "CH", rate: 58, fullMark: 100 }
]

const segmentData = [
  { segment: "Dream (>15L)", count: 78, fill: "#6C2BD9" },
  { segment: "Core (6-15L)", count: 245, fill: "#A78BFA" },
  { segment: "Mass (<6L)", count: 166, fill: "#C4B5FD" }
]

const recentActivity = [
  { company: "Amazon", action: "Results declared", time: "2 hours ago", type: "result" },
  { company: "TCS", action: "Interview scheduled for 15 Apr", time: "5 hours ago", type: "interview" },
  { company: "Flipkart", action: "Drive registration open", time: "1 day ago", type: "drive" },
  { company: "Microsoft", action: "Shortlist announced", time: "1 day ago", type: "result" },
  { company: "Google", action: "Offer letter sent", time: "2 days ago", type: "offer" }
]

const activityColors: Record<string, string> = {
  result: "bg-green-500/20 text-green-300",
  interview: "bg-yellow-500/20 text-yellow-300",
  drive: "bg-blue-500/20 text-blue-300",
  offer: "bg-purple-500/20 text-purple-300"
}

export default function StudentPlacementStats() {
  const [stats, setStats] = useState<StudentStats>(defaultStats)
  const [loading, setLoading] = useState(true)




  useEffect(() => {
    setLoading(true)
    let studentId = ""
    try {
      const profile = JSON.parse(localStorage.getItem("iris_user_profile") || "{}")
      studentId = profile.id || profile.student_id || ""
    } catch {}

    const fetchStats = async () => {
      try {
        if (studentId) {
          const [dashboard, offers, apps] = await Promise.all([
            apiGet("/api/v1/placements/analytics/dashboard"),
            apiGet(`/api/v1/placements/offers/student/${studentId}`).catch(() => []),
            apiGet(`/api/v1/placements/applications/student/${studentId}`).catch(() => [])
          ])
          setStats({
            total_placed: dashboard?.total_placed || 489,
            avg_ctc: dashboard?.avg_ctc || 8.4,
            highest_ctc: dashboard?.highest_ctc || 45.0,
            your_ranking: null,
            branch: "CSE",
            branch_rank: null,
            applications_sent: Array.isArray(apps) ? apps.length : 12,
            shortlisted: Array.isArray(apps) ? apps.filter((a: any) => a.status === "shortlisted").length : 6,
            offers_received: Array.isArray(offers) ? offers.length : 2,
            offers_accepted: Array.isArray(offers) ? offers.filter((o: any) => o.status === "accepted").length : 1
          })
        }
      } catch {}
    }
    fetchStats().finally(() => setTimeout(() => setLoading(false), 600))
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0A1A] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/student/placements" className="p-2 rounded-xl bg-[#13102A]/60 border border-white/5 text-[#C4B5FD] hover:bg-[#6C2BD9]/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Placement Statistics</h1>
            <p className="text-sm text-[#C4B5FD]/60">Institute-wide placement insights</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Total Placed", value: stats.total_placed, color: "text-green-400" },
              { icon: TrendingUp, label: "Average CTC", value: `₹${stats.avg_ctc}L`, color: "text-yellow-400" },
              { icon: Award, label: "Highest CTC", value: `₹${stats.highest_ctc}L`, color: "text-orange-400" },
              { icon: Target, label: "Your Ranking", value: stats.your_ranking ? `#${stats.your_ranking}` : "N/A", color: "text-[#C4B5FD]" }
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
            <Skeleton className="h-80 rounded-3xl" />
            <Skeleton className="h-80 rounded-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Branch-wise Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="branch" tick={{ fill: "#C4B5FD", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#C4B5FD", fontSize: 10 }} />
                  <Radar name="Placement %" dataKey="rate" stroke="#6C2BD9" fill="#6C2BD9" fillOpacity={0.4} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">CTC Segment Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="segment" tick={{ fill: "#C4B5FD", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#C4B5FD", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {segmentData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Applications Sent", value: stats.applications_sent, total: 20, color: "bg-[#6C2BD9]" },
                  { label: "Shortlisted", value: stats.shortlisted, total: stats.applications_sent, color: "bg-blue-500" },
                  { label: "Offers Received", value: stats.offers_received, total: stats.shortlisted || 1, color: "bg-green-500" },
                  { label: "Offers Accepted", value: stats.offers_accepted, total: stats.offers_received || 1, color: "bg-yellow-500" }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#C4B5FD]/70">{item.label}</span>
                      <span className="text-sm font-medium text-white">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                        style={{ width: `${Math.min((item.value / Math.max(item.total, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${item.type === "offer" ? "bg-green-400" : item.type === "result" ? "bg-blue-400" : item.type === "interview" ? "bg-yellow-400" : "bg-purple-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.company}</p>
                      <p className="text-xs text-[#C4B5FD]/50 truncate">{item.action}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${activityColors[item.type]}`}>{item.type}</span>
                    <span className="text-xs text-[#C4B5FD]/30 whitespace-nowrap">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: FileText, title: "Analyze Your Resume", description: "Get AI-powered feedback on your resume", href: "/student/placements/resume-analyzer", color: "from-[#6C2BD9]/20 to-[#6C2BD9]/5" },
            { icon: Mic, title: "Practice Mock Interview", description: "Prepare with AI mock interviews", href: "/student/placements/mock-interview", color: "from-blue-500/20 to-blue-500/5" },
            { icon: Eye, title: "View All Drives", description: "Browse upcoming placement drives", href: "/student/placements", color: "from-green-500/20 to-green-500/5" }
          ].map((card, i) => (
            <Link key={i} href={card.href}>
              <div className={`bg-gradient-to-br ${card.color} border border-white/5 rounded-3xl p-6 hover:border-[#6C2BD9]/30 transition-all cursor-pointer group`}>
                <card.icon className="w-8 h-8 text-[#C4B5FD] mb-3 group-hover:text-white transition-colors" />
                <h4 className="text-white font-semibold mb-1">{card.title}</h4>
                <p className="text-sm text-[#C4B5FD]/60">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
