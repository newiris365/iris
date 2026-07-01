"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Building2, TrendingUp, Users, Globe, Mail, Search } from "lucide-react"
import Link from "next/link"

import { apiGet } from "../../../../lib/api"
import Skeleton from "../../../../components/Skeleton"

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from '../../../../lib/charts'

interface Company {
  id: string
  name: string
  industry: string
  type: string
  tier: string
  total_offers: number
  avg_ctc: number
  last_visited: string
  website: string
}

const defaultCompanies: Company[] = [
  { id: "1", name: "Tata Consultancy Services", industry: "IT Services", type: "service", tier: "mass", total_offers: 89, avg_ctc: 4.2, last_visited: "2026-03-15", website: "https://tcs.com" },
  { id: "2", name: "Infosys", industry: "IT Services", type: "service", tier: "mass", total_offers: 76, avg_ctc: 3.8, last_visited: "2026-03-10", website: "https://infosys.com" },
  { id: "3", name: "Wipro", industry: "IT Services", type: "service", tier: "mass", total_offers: 64, avg_ctc: 4.0, last_visited: "2026-03-12", website: "https://wipro.com" },
  { id: "4", name: "Amazon", industry: "E-commerce", type: "product", tier: "dream", total_offers: 23, avg_ctc: 26.5, last_visited: "2026-04-01", website: "https://amazon.com" },
  { id: "5", name: "Microsoft", industry: "Technology", type: "product", tier: "dream", total_offers: 18, avg_ctc: 32.0, last_visited: "2026-03-28", website: "https://microsoft.com" },
  { id: "6", name: "Google", industry: "Technology", type: "product", tier: "dream", total_offers: 12, avg_ctc: 45.0, last_visited: "2026-03-25", website: "https://google.com" },
  { id: "7", name: "Flipkart", industry: "E-commerce", type: "product", tier: "dream", total_offers: 15, avg_ctc: 18.5, last_visited: "2026-03-20", website: "https://flipkart.com" },
  { id: "8", name: "Accenture", industry: "IT Services", type: "mnc", tier: "core", total_offers: 45, avg_ctc: 6.5, last_visited: "2026-02-15", website: "https://accenture.com" },
  { id: "9", name: "Cognizant", industry: "IT Services", type: "service", tier: "mass", total_offers: 52, avg_ctc: 4.1, last_visited: "2026-02-20", website: "https://cognizant.com" },
  { id: "10", name: "HCL Technologies", industry: "IT Services", type: "service", tier: "mass", total_offers: 38, avg_ctc: 3.9, last_visited: "2026-02-10", website: "https://hcltech.com" },
  { id: "11", name: "Goldman Sachs", industry: "Banking", type: "mnc", tier: "dream", total_offers: 8, avg_ctc: 22.0, last_visited: "2026-01-15", website: "https://goldmansachs.com" },
  { id: "12", name: "Razorpay", industry: "Fintech", type: "startup", tier: "core", total_offers: 14, avg_ctc: 12.0, last_visited: "2026-01-20", website: "https://razorpay.com" },
  { id: "13", name: "Atlassian", industry: "Technology", type: "product", tier: "dream", total_offers: 10, avg_ctc: 28.0, last_visited: "2026-01-10", website: "https://atlassian.com" },
  { id: "14", name: "Zomato", industry: "E-commerce", type: "startup", tier: "core", total_offers: 16, avg_ctc: 11.0, last_visited: "2025-12-15", website: "https://zomato.com" },
  { id: "15", name: "SAP", industry: "Technology", type: "mnc", tier: "core", total_offers: 20, avg_ctc: 9.5, last_visited: "2025-12-10", website: "https://sap.com" },
  { id: "16", name: "BYJU'S", industry: "EdTech", type: "startup", tier: "core", total_offers: 12, avg_ctc: 8.0, last_visited: "2025-11-20", website: "https://byjus.com" },
  { id: "17", name: "Qualcomm", industry: "Semiconductor", type: "product", tier: "dream", total_offers: 9, avg_ctc: 20.0, last_visited: "2025-11-15", website: "https://qualcomm.com" }
]

const tierColors: Record<string, string> = {
  dream: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  core: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  mass: "bg-gray-500/20 text-gray-300 border-gray-500/30"
}

const typeColors: Record<string, string> = {
  product: "bg-green-500/20 text-green-300",
  service: "bg-yellow-500/20 text-yellow-300",
  mnc: "bg-blue-500/20 text-blue-300",
  startup: "bg-orange-500/20 text-orange-300"
}

const pieColors = ["#6C2BD9", "#A78BFA", "#C4B5FD"]
const barColors = ["#6C2BD9", "#A78BFA", "#C4B5FD", "#8B5CF6", "#7C3AED", "#5B21B6", "#4C1D95"]

export default function CompanyAnalytics() {
  const [companies, setCompanies] = useState<Company[]>(defaultCompanies)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<keyof Company>("total_offers")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")




  useEffect(() => {
    setLoading(true)
    apiGet("/api/v1/placements/companies")
      .then((res: any) => {
        if (Array.isArray(res) && res.length > 0) setCompanies(res)
      })
      .catch(() => {})
      .finally(() => setTimeout(() => setLoading(false), 600))
  }, [])

  const filtered = useMemo(() => {
    let list = companies.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase())
    )
    list.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
    return list
  }, [companies, search, sortKey, sortDir])

  const stats = useMemo(() => {
    const total = companies.length
    const product = companies.filter(c => c.type === "product").length
    const service = companies.filter(c => c.type === "service").length
    const mnc = companies.filter(c => c.type === "mnc").length
    const startup = companies.filter(c => c.type === "startup").length
    return { total, product, service, mnc, startup }
  }, [companies])

  const tierData = useMemo(() => {
    const dream = companies.filter(c => c.tier === "dream").length
    const core = companies.filter(c => c.tier === "core").length
    const mass = companies.filter(c => c.tier === "mass").length
    return [
      { name: "Dream (>15L)", value: dream },
      { name: "Core (6-15L)", value: core },
      { name: "Mass (<6L)", value: mass }
    ]
  }, [companies])

  const topHiring = useMemo(() => {
    return [...companies].sort((a, b) => b.total_offers - a.total_offers).slice(0, 10)
  }, [companies])

  const industryData = useMemo(() => {
    const map: Record<string, number> = {}
    companies.forEach(c => { map[c.industry] = (map[c.industry] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [companies])

  const handleSort = (key: keyof Company) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/placements" className="p-2 rounded-xl bg-[#13102A]/60 border border-white/5 text-[#C4B5FD] hover:bg-[#6C2BD9]/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Company Analytics</h1>
            <p className="text-sm text-[#C4B5FD]/60">Detailed insights about visiting companies</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Companies", value: stats.total, icon: Building2 },
              { label: "Product Companies", value: stats.product, icon: TrendingUp },
              { label: "Service Companies", value: stats.service, icon: Users },
              { label: "MNCs", value: stats.mnc, icon: Globe },
              { label: "Startups", value: stats.startup, icon: Mail }
            ].map((card, i) => (
              <div key={i} className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-4">
                <card.icon className="w-4 h-4 text-[#C4B5FD]/60 mb-2" />
                <p className="text-xs text-[#C4B5FD]/60">{card.label}</p>
                <p className="text-xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#13102A]/60 border border-white/5 text-white text-sm placeholder:text-[#C4B5FD]/30 focus:outline-none focus:border-[#6C2BD9]"
            />
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-96 rounded-3xl" />
        ) : (
          <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[#C4B5FD]/60 border-b border-white/5">
                    {[
                      { key: "name", label: "Company" },
                      { key: "industry", label: "Industry" },
                      { key: "type", label: "Type" },
                      { key: "tier", label: "Tier" },
                      { key: "total_offers", label: "Offers" },
                      { key: "avg_ctc", label: "Avg CTC" },
                      { key: "last_visited", label: "Last Visited" }
                    ].map(col => (
                      <th
                        key={col.key}
                        className="pb-3 px-4 font-medium cursor-pointer hover:text-[#C4B5FD] transition-colors"
                        onClick={() => handleSort(col.key as keyof Company)}
                      >
                        {col.label} {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-white text-sm font-medium">{c.name}</div>
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[#C4B5FD]/40 text-xs hover:text-[#C4B5FD]">{c.website.replace("https://", "")}</a>
                      </td>
                      <td className="py-3 px-4 text-[#C4B5FD]/70 text-sm">{c.industry}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[c.type] || ""}`}>{c.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${tierColors[c.tier] || ""}`}>{c.tier}</span>
                      </td>
                      <td className="py-3 px-4 text-white text-sm font-medium">{c.total_offers}</td>
                      <td className="py-3 px-4 text-green-400 text-sm">₹{c.avg_ctc}L</td>
                      <td className="py-3 px-4 text-[#C4B5FD]/50 text-sm">{c.last_visited}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company Tier Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tierData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Hiring Companies</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topHiring}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "#C4B5FD", fontSize: 9 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis tick={{ fill: "#C4B5FD", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="total_offers" radius={[6, 6, 0, 0]}>
                    {topHiring.map((_, index) => (
                      <Cell key={index} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Industry Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={industryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "#C4B5FD", fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#C4B5FD", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1535", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Bar dataKey="count" fill="#6C2BD9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
