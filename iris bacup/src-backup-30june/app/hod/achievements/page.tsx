"use client";
import React, { useState, useEffect } from 'react';
import { Award, Plus, Trophy, Medal, Star, Filter, ChevronDown, Users, Calendar, Search } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Achievement {
  id: number;
  studentName: string;
  studentId: string;
  title: string;
  category: string;
  level: string;
  date: string;
  description: string;
  verified: boolean;
}

interface Stats {
  totalAchievements: number;
  thisMonth: number;
  topPerformers: number;
}

const categories = ['All', 'Academic', 'Sports', 'Cultural', 'Technical', 'Research', 'Community Service'];
const levels = ['All', 'College', 'University', 'National', 'International'];

const mockAchievements: Achievement[] = [
  { id: 1, studentName: 'Aarav Sharma', studentId: 'CS2021001', title: 'Hackathon Winner - Smart India Hackathon', category: 'Technical', level: 'National', date: '2026-05-15', description: 'Won first place in the Software Edition of Smart India Hackathon 2026 for developing an AI-powered healthcare solution.', verified: true },
  { id: 2, studentName: 'Priya Patel', studentId: 'CS2021045', title: 'Published Research Paper in IEEE', category: 'Research', level: 'International', date: '2026-04-20', description: 'Published a research paper on "Machine Learning Approaches for Predictive Analytics in Healthcare" in IEEE Transactions.', verified: true },
  { id: 3, studentName: 'Rohan Gupta', studentId: 'CS2021012', title: 'University Gold Medalist', category: 'Academic', level: 'University', date: '2026-03-10', description: 'Achieved the highest CGPA of 9.8 across the university and received the Gold Medal for Academic Excellence.', verified: true },
  { id: 4, studentName: 'Sneha Reddy', studentId: 'CS2021078', title: 'National Basketball Championship', category: 'Sports', level: 'National', date: '2026-02-28', description: 'Led the university basketball team to victory in the National Inter-University Basketball Championship 2026.', verified: true },
  { id: 5, studentName: 'Karthik Nair', studentId: 'CS2021033', title: 'Best Cultural Performer - Annual Fest', category: 'Cultural', level: 'College', date: '2026-01-25', description: 'Won the Best Performer award at the annual cultural fest for outstanding classical dance performance.', verified: true },
  { id: 6, studentName: 'Ananya Singh', studentId: 'CS2021091', title: 'Community Service Excellence Award', category: 'Community Service', level: 'College', date: '2026-05-02', description: 'Recognized for leading the rural digital literacy drive that impacted over 500 villagers in nearby districts.', verified: true },
  { id: 7, studentName: 'Vikram Das', studentId: 'CS2021056', title: 'Google Summer of Code Contributor', category: 'Technical', level: 'International', date: '2026-04-10', description: 'Successfully completed GSoC 2026 contributing to an open-source machine learning framework with 50+ merged PRs.', verified: true },
  { id: 8, studentName: 'Meera Joshi', studentId: 'CS2021022', title: 'Paper Presentation - ICCSE 2026', category: 'Research', level: 'International', date: '2026-03-18', description: 'Presented a paper on "Blockchain-based Secure Voting Systems" at the International Conference on Computer Science and Engineering.', verified: false },
  { id: 9, studentName: 'Arjun Mehta', studentId: 'CS2021067', title: 'Inter-University Cricket Tournament', category: 'Sports', level: 'University', date: '2026-02-15', description: 'Scored a century in the finals leading the team to win the Inter-University Cricket Tournament.', verified: true },
  { id: 10, studentName: 'Ishita Banerjee', studentId: 'CS2021089', title: 'Dean\'s List - Semester 6', category: 'Academic', level: 'College', date: '2026-05-20', description: 'Featured on the Dean\'s List for achieving a perfect score in all core computer science courses.', verified: true },
];

const mockStats: Stats = { totalAchievements: 247, thisMonth: 18, topPerformers: 34 };
const mockLeaderboard = [
  { name: 'Aarav Sharma', count: 8 },
  { name: 'Priya Patel', count: 7 },
  { name: 'Vikram Das', count: 6 },
  { name: 'Sneha Reddy', count: 5 },
  { name: 'Meera Joshi', count: 5 },
];

const getCategoryColor = (cat: string) => {
  const map: Record<string, string> = {
    Academic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Sports: 'bg-green-500/20 text-green-400 border-green-500/30',
    Cultural: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Technical: 'bg-teal-500/20 text-[#0891B2] border-teal-500/30',
    Research: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Community Service': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  return map[cat] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

const getLevelColor = (level: string) => {
  const map: Record<string, string> = {
    College: 'bg-slate-500/20 text-slate-400',
    University: 'bg-indigo-500/20 text-indigo-400',
    National: 'bg-orange-500/20 text-orange-400',
    International: 'bg-rose-500/20 text-rose-400',
  };
  return map[level] || 'bg-gray-500/20 text-gray-400';
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'International': return <Trophy className="w-4 h-4 text-rose-400" />;
    case 'National': return <Medal className="w-4 h-4 text-orange-400" />;
    case 'University': return <Award className="w-4 h-4 text-indigo-400" />;
    default: return <Star className="w-4 h-4 text-slate-400" />;
  }
};

export default function StudentAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);
  const [stats, setStats] = useState<Stats>(mockStats);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ studentName: '', studentId: '', title: '', category: 'Academic', level: 'College', date: '', description: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiGet('/obe/student-achievements/stats');
        if (response?.data) {
          setStats(response.data.stats || mockStats);
          setAchievements(response.data.achievements || mockAchievements);
          setLeaderboard(response.data.leaderboard || mockLeaderboard);
        }
      } catch {
        setStats(mockStats);
        setAchievements(mockAchievements);
        setLeaderboard(mockLeaderboard);
      }
    };
    fetchData();
  }, []);

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch = a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || a.level === selectedLevel;
    const matchesDateFrom = !dateFrom || a.date >= dateFrom;
    const matchesDateTo = !dateTo || a.date <= dateTo;
    return matchesSearch && matchesCategory && matchesLevel && matchesDateFrom && matchesDateTo;
  });

  const handleAddAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: Achievement = { ...newAchievement, id: achievements.length + 1, verified: false };
    setAchievements([newEntry, ...achievements]);
    setNewAchievement({ studentName: '', studentId: '', title: '', category: 'Academic', level: 'College', date: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="w-8 h-8 text-[#0891B2]" />
              Student Achievements
            </h1>
            <p className="text-gray-400 mt-1">Track and manage department student achievements</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0E7490] text-white px-5 py-2.5 rounded-lg transition-colors font-medium">
            <Plus className="w-5 h-5" />
            Add Achievement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-5 flex items-center gap-4">
            <div className="bg-[#0891B2]/20 p-3 rounded-lg"><Trophy className="w-6 h-6 text-[#0891B2]" /></div>
            <div><p className="text-2xl font-bold">{stats.totalAchievements}</p><p className="text-gray-400 text-sm">Total Achievements</p></div>
          </div>
          <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-5 flex items-center gap-4">
            <div className="bg-green-500/20 p-3 rounded-lg"><Calendar className="w-6 h-6 text-green-400" /></div>
            <div><p className="text-2xl font-bold">{stats.thisMonth}</p><p className="text-gray-400 text-sm">This Month</p></div>
          </div>
          <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-5 flex items-center gap-4">
            <div className="bg-purple-500/20 p-3 rounded-lg"><Users className="w-6 h-6 text-purple-400" /></div>
            <div><p className="text-2xl font-bold">{stats.topPerformers}</p><p className="text-gray-400 text-sm">Top Performers</p></div>
          </div>
        </div>

        {showForm && (
          <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-[#0891B2]" /> Add New Achievement</h2>
            <form onSubmit={handleAddAchievement} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Student Name" value={newAchievement.studentName} onChange={(e) => setNewAchievement({ ...newAchievement, studentName: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2]" required />
              <input type="text" placeholder="Student ID" value={newAchievement.studentId} onChange={(e) => setNewAchievement({ ...newAchievement, studentId: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2]" required />
              <input type="text" placeholder="Achievement Title" value={newAchievement.title} onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2] md:col-span-2" required />
              <select value={newAchievement.category} onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2]">
                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newAchievement.level} onChange={(e) => setNewAchievement({ ...newAchievement, level: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2]">
                {levels.filter(l => l !== 'All').map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input type="date" value={newAchievement.date} onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2]" required />
              <textarea placeholder="Description" value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} className="bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2] md:col-span-2" rows={3} required />
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-[#2A2545] text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0891B2] hover:bg-[#0E7490] text-white font-medium transition-colors">Save Achievement</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search students or achievements..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1A1530] border border-[#2A2545] rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#0891B2]" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 bg-[#1A1530] border border-[#2A2545] rounded-lg px-4 py-2.5 text-gray-300 hover:border-[#0891B2] transition-colors">
                <Filter className="w-4 h-4" /> Filters <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0891B2]">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Level</label>
                  <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0891B2]">
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">From Date</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0891B2]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">To Date</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-[#0D0A1A] border border-[#2A2545] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0891B2]" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {filteredAchievements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No achievements found matching your filters.</p>
                </div>
              )}
              {filteredAchievements.map((achievement) => (
                <div key={achievement.id} className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-5 hover:border-[#0891B2]/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getLevelIcon(achievement.level)}
                        <h3 className="font-semibold text-white">{achievement.title}</h3>
                        {achievement.verified && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Verified</span>}
                        {!achievement.verified && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">Pending</span>}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{achievement.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-300 font-medium">{achievement.studentName}</span>
                        <span className="text-xs text-gray-500">({achievement.studentId})</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(achievement.category)}`}>{achievement.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(achievement.level)}`}>{achievement.level}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{achievement.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-[#0891B2]" /> Leaderboard</h3>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : index === 1 ? 'bg-gray-400/20 text-gray-300' : index === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-[#0D0A1A] text-gray-500'}`}>{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{entry.name}</p>
                      <p className="text-xs text-gray-500">{entry.count} achievements</p>
                    </div>
                    <Award className="w-4 h-4 text-[#0891B2]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1530] border border-[#2A2545] rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-[#0891B2]" /> Quick Stats by Category</h3>
              <div className="space-y-2">
                {categories.filter(c => c !== 'All').map(cat => {
                  const count = achievements.filter(a => a.category === cat).length;
                  const pct = achievements.length > 0 ? Math.round((count / achievements.length) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{cat}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-[#0D0A1A] rounded-full h-1.5">
                        <div className="bg-[#0891B2] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
