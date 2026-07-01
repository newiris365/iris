"use client";
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar, Users, Award, DollarSign, TrendingUp, Filter, ChevronDown, FileText } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface FDPEntry {
  id: string;
  title: string;
  type: 'FDP' | 'Workshop' | 'Seminar' | 'Conference' | 'Webinar';
  organizer: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'completed' | 'planned';
  participants: string[];
  budget: number;
  budgetUtilized: number;
  mode: 'online' | 'offline' | 'hybrid';
}

interface PublicationStat {
  facultyName: string;
  papersPublished: number;
  citations: number;
  hIndex: number;
  journalPapers: number;
  conferencePapers: number;
}

interface FacultyTrainingHours {
  facultyName: string;
  totalHours: number;
  fdpHours: number;
  workshopHours: number;
  seminarHours: number;
  otherHours: number;
}

const mockFDPData: FDPEntry[] = [
  {
    id: 'fdp-001',
    title: 'Advanced Machine Learning Techniques',
    type: 'FDP',
    organizer: 'IIT Bombay',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    status: 'upcoming',
    participants: ['Dr. Sharma', 'Prof. Verma', 'Dr. Patel'],
    budget: 150000,
    budgetUtilized: 0,
    mode: 'hybrid'
  },
  {
    id: 'fdp-002',
    title: 'Web Development Workshop with React',
    type: 'Workshop',
    organizer: 'Tech Academy',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    status: 'completed',
    participants: ['Prof. Singh', 'Dr. Gupta', 'Mr. Kumar'],
    budget: 50000,
    budgetUtilized: 45000,
    mode: 'offline'
  },
  {
    id: 'fdp-003',
    title: 'International Conference on AI & Data Science',
    type: 'Conference',
    organizer: 'IEEE',
    startDate: '2026-07-20',
    endDate: '2026-07-22',
    status: 'planned',
    participants: ['Dr. Sharma', 'Dr. Nair'],
    budget: 200000,
    budgetUtilized: 50000,
    mode: 'online'
  },
  {
    id: 'fdp-004',
    title: 'Research Methodology Seminar',
    type: 'Seminar',
    organizer: 'University Grants Commission',
    startDate: '2026-04-05',
    endDate: '2026-04-05',
    status: 'completed',
    participants: ['Prof. Verma', 'Dr. Patel', 'Prof. Singh', 'Dr. Gupta'],
    budget: 25000,
    budgetUtilized: 22000,
    mode: 'offline'
  },
  {
    id: 'fdp-005',
    title: 'Cloud Computing and DevOps Webinar',
    type: 'Webinar',
    organizer: 'AWS Academy',
    startDate: '2026-06-01',
    endDate: '2026-06-01',
    status: 'completed',
    participants: ['Mr. Kumar', 'Dr. Nair', 'Prof. Singh'],
    budget: 10000,
    budgetUtilized: 8000,
    mode: 'online'
  },
  {
    id: 'fdp-006',
    title: 'Cybersecurity Best Practices Workshop',
    type: 'Workshop',
    organizer: 'NASSCOM',
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    status: 'planned',
    participants: ['Dr. Sharma', 'Prof. Verma'],
    budget: 75000,
    budgetUtilized: 0,
    mode: 'hybrid'
  },
  {
    id: 'fdp-007',
    title: 'Data Structures and Algorithms FDP',
    type: 'FDP',
    organizer: 'NPTEL',
    startDate: '2026-03-01',
    endDate: '2026-03-14',
    status: 'completed',
    participants: ['Prof. Singh', 'Dr. Gupta', 'Mr. Kumar', 'Dr. Nair'],
    budget: 120000,
    budgetUtilized: 115000,
    mode: 'online'
  }
];

const mockPublicationStats: PublicationStat[] = [
  { facultyName: 'Dr. Sharma', papersPublished: 18, citations: 245, hIndex: 8, journalPapers: 12, conferencePapers: 6 },
  { facultyName: 'Prof. Verma', papersPublished: 24, citations: 389, hIndex: 10, journalPapers: 18, conferencePapers: 6 },
  { facultyName: 'Dr. Patel', papersPublished: 12, citations: 156, hIndex: 6, journalPapers: 8, conferencePapers: 4 },
  { facultyName: 'Prof. Singh', papersPublished: 30, citations: 520, hIndex: 12, journalPapers: 22, conferencePapers: 8 },
  { facultyName: 'Dr. Gupta', papersPublished: 15, citations: 198, hIndex: 7, journalPapers: 10, conferencePapers: 5 },
  { facultyName: 'Mr. Kumar', papersPublished: 8, citations: 67, hIndex: 4, journalPapers: 5, conferencePapers: 3 },
  { facultyName: 'Dr. Nair', papersPublished: 20, citations: 312, hIndex: 9, journalPapers: 15, conferencePapers: 5 }
];

const mockTrainingHours: FacultyTrainingHours[] = [
  { facultyName: 'Dr. Sharma', totalHours: 120, fdpHours: 60, workshopHours: 30, seminarHours: 20, otherHours: 10 },
  { facultyName: 'Prof. Verma', totalHours: 145, fdpHours: 70, workshopHours: 40, seminarHours: 25, otherHours: 10 },
  { facultyName: 'Dr. Patel', totalHours: 95, fdpHours: 50, workshopHours: 25, seminarHours: 15, otherHours: 5 },
  { facultyName: 'Prof. Singh', totalHours: 160, fdpHours: 80, workshopHours: 45, seminarHours: 25, otherHours: 10 },
  { facultyName: 'Dr. Gupta', totalHours: 110, fdpHours: 55, workshopHours: 30, seminarHours: 20, otherHours: 5 },
  { facultyName: 'Mr. Kumar', totalHours: 75, fdpHours: 40, workshopHours: 20, seminarHours: 10, otherHours: 5 },
  { facultyName: 'Dr. Nair', totalHours: 130, fdpHours: 65, workshopHours: 35, seminarHours: 20, otherHours: 10 }
];

export default function FacultyDevelopmentPage() {
  const [fdpEntries, setFdpEntries] = useState<FDPEntry[]>([]);
  const [publicationStats, setPublicationStats] = useState<PublicationStat[]>([]);
  const [trainingHours, setTrainingHours] = useState<FacultyTrainingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'programs' | 'publications' | 'training' | 'budget'>('programs');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [newFDP, setNewFDP] = useState({
    title: '',
    type: 'FDP' as FDPEntry['type'],
    organizer: '',
    startDate: '',
    endDate: '',
    budget: 0,
    mode: 'offline' as FDPEntry['mode']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/obe/faculty-development');
      if (response.data) {
        setFdpEntries(response.data.programs || mockFDPData);
        setPublicationStats(response.data.publications || mockPublicationStats);
        setTrainingHours(response.data.trainingHours || mockTrainingHours);
      } else {
        setFdpEntries(mockFDPData);
        setPublicationStats(mockPublicationStats);
        setTrainingHours(mockTrainingHours);
      }
    } catch (error) {
      console.error('Error fetching faculty development data:', error);
      setFdpEntries(mockFDPData);
      setPublicationStats(mockPublicationStats);
      setTrainingHours(mockTrainingHours);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFDP = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: FDPEntry = {
      id: `fdp-${Date.now()}`,
      ...newFDP,
      status: 'planned',
      participants: [],
      budgetUtilized: 0
    };
    setFdpEntries([...fdpEntries, entry]);
    setShowAddForm(false);
    setNewFDP({ title: '', type: 'FDP', organizer: '', startDate: '', endDate: '', budget: 0, mode: 'offline' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'planned': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FDP': return 'bg-purple-500/20 text-purple-400';
      case 'Workshop': return 'bg-orange-500/20 text-orange-400';
      case 'Seminar': return 'bg-teal-500/20 text-teal-400';
      case 'Conference': return 'bg-red-500/20 text-red-400';
      case 'Webinar': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredEntries = fdpEntries.filter(entry => {
    if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
    if (filterType !== 'all' && entry.type !== filterType) return false;
    return true;
  });

  const totalBudget = fdpEntries.reduce((sum, e) => sum + e.budget, 0);
  const utilizedBudget = fdpEntries.reduce((sum, e) => sum + e.budgetUtilized, 0);
  const totalPapers = publicationStats.reduce((sum, p) => sum + p.papersPublished, 0);
  const totalCitations = publicationStats.reduce((sum, p) => sum + p.citations, 0);
  const avgHIndex = publicationStats.length > 0
    ? (publicationStats.reduce((sum, p) => sum + p.hIndex, 0) / publicationStats.length).toFixed(1)
    : '0';
  const totalTrainingHours = trainingHours.reduce((sum, t) => sum + t.totalHours, 0);

  const completedCount = fdpEntries.filter(e => e.status === 'completed').length;
  const upcomingCount = fdpEntries.filter(e => e.status === 'upcoming').length;
  const plannedCount = fdpEntries.filter(e => e.status === 'planned').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="text-white text-xl">Loading faculty development data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-[#0891B2]" size={32} />
            Faculty Development
          </h1>
          <p className="text-gray-400 mt-2">Track department faculty training programs, publications, and development activities</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Programs</p>
                <p className="text-2xl font-bold text-white mt-1">{fdpEntries.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-400">{completedCount} completed</span> | 
                  <span className="text-blue-400"> {upcomingCount} upcoming</span> | 
                  <span className="text-yellow-400"> {plannedCount} planned</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-[#0891B2]/20 rounded-lg flex items-center justify-center">
                <BookOpen className="text-[#0891B2]" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Publications</p>
                <p className="text-2xl font-bold text-white mt-1">{totalPapers}</p>
                <p className="text-xs text-gray-500 mt-1">{totalCitations} citations | Avg H-Index: {avgHIndex}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FileText className="text-purple-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Training Hours</p>
                <p className="text-2xl font-bold text-white mt-1">{totalTrainingHours.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Across {trainingHours.length} faculty members</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-orange-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Budget Utilization</p>
                <p className="text-2xl font-bold text-white mt-1">{((utilizedBudget / totalBudget) * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">₹{utilizedBudget.toLocaleString()} / ₹{totalBudget.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1A1528] p-1 rounded-xl w-fit">
          {[
            { key: 'programs', label: 'Programs', icon: BookOpen },
            { key: 'publications', label: 'Publications', icon: FileText },
            { key: 'training', label: 'Training Hours', icon: TrendingUp },
            { key: 'budget', label: 'Budget', icon: DollarSign }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-[#0891B2] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <div>
            {/* Filters and Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#1A1528] border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-white appearance-none cursor-pointer text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="planned">Planned</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-[#1A1528] border border-gray-700 rounded-lg pl-4 pr-8 py-2 text-white appearance-none cursor-pointer text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="FDP">FDP</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Conference">Conference</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0891B2]/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Add Program
              </button>
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-[#1A1528] border border-gray-700 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Add New Program</h3>
                  <form onSubmit={handleAddFDP} className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">Title</label>
                      <input
                        type="text"
                        required
                        value={newFDP.title}
                        onChange={(e) => setNewFDP({ ...newFDP, title: e.target.value })}
                        className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        placeholder="Enter program title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm">Type</label>
                        <select
                          value={newFDP.type}
                          onChange={(e) => setNewFDP({ ...newFDP, type: e.target.value as FDPEntry['type'] })}
                          className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        >
                          <option value="FDP">FDP</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Conference">Conference</option>
                          <option value="Webinar">Webinar</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">Mode</label>
                        <select
                          value={newFDP.mode}
                          onChange={(e) => setNewFDP({ ...newFDP, mode: e.target.value as FDPEntry['mode'] })}
                          className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        >
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm">Organizer</label>
                      <input
                        type="text"
                        required
                        value={newFDP.organizer}
                        onChange={(e) => setNewFDP({ ...newFDP, organizer: e.target.value })}
                        className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        placeholder="Enter organizer name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm">Start Date</label>
                        <input
                          type="date"
                          required
                          value={newFDP.startDate}
                          onChange={(e) => setNewFDP({ ...newFDP, startDate: e.target.value })}
                          className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">End Date</label>
                        <input
                          type="date"
                          required
                          value={newFDP.endDate}
                          onChange={(e) => setNewFDP({ ...newFDP, endDate: e.target.value })}
                          className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm">Budget (₹)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={newFDP.budget}
                        onChange={(e) => setNewFDP({ ...newFDP, budget: Number(e.target.value) })}
                        className="w-full bg-[#0D0A1A] border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                        placeholder="Enter budget amount"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#0891B2] hover:bg-[#0891B2]/80 text-white py-2 rounded-lg transition-colors"
                      >
                        Add Program
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Programs List */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="bg-[#1A1528] rounded-xl p-8 border border-gray-800 text-center">
                  <BookOpen className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No programs found matching the filters.</p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-[#1A1528] rounded-xl p-5 border border-gray-800 hover:border-[#0891B2]/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(entry.status)}`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">Organized by: {entry.organizer}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(entry.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {entry.startDate !== entry.endDate && (
                              <> - {new Date(entry.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {entry.participants.length} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <Award size={14} />
                            {entry.mode.charAt(0).toUpperCase() + entry.mode.slice(1)}
                          </span>
                        </div>
                        {entry.participants.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {entry.participants.map((participant, idx) => (
                              <span key={idx} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                                {participant}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Budget</p>
                        <p className="text-white font-semibold">₹{entry.budget.toLocaleString()}</p>
                        {entry.budgetUtilized > 0 && (
                          <>
                            <div className="w-32 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-[#0891B2] rounded-full"
                                style={{ width: `${(entry.budgetUtilized / entry.budget) * 100}%` }}
                              />
                            </div>
                            <p className="text-gray-500 text-xs mt-1">₹{entry.budgetUtilized.toLocaleString()} utilized</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Publications Tab */}
        {activeTab === 'publications' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Total Papers Published</p>
                <p className="text-3xl font-bold text-white mt-1">{totalPapers}</p>
              </div>
              <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Total Citations</p>
                <p className="text-3xl font-bold text-white mt-1">{totalCitations.toLocaleString()}</p>
              </div>
              <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800">
                <p className="text-gray-400 text-sm">Average H-Index</p>
                <p className="text-3xl font-bold text-white mt-1">{avgHIndex}</p>
              </div>
            </div>

            <div className="bg-[#1A1528] rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0D0A1A]">
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Faculty</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-4">Papers</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-4">Citations</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-4">H-Index</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-4">Journal Papers</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-4">Conference Papers</th>
                  </tr>
                </thead>
                <tbody>
                  {publicationStats.map((stat, idx) => (
                    <tr key={idx} className="border-t border-gray-800 hover:bg-[#0D0A1A]/50">
                      <td className="px-6 py-4 text-white font-medium">{stat.facultyName}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-[#0891B2]/20 text-[#0891B2] px-3 py-1 rounded-full text-sm">
                          {stat.papersPublished}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-300">{stat.citations}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                          {stat.hIndex}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-300">{stat.journalPapers}</td>
                      <td className="px-4 py-4 text-center text-gray-300">{stat.conferencePapers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Training Hours Tab */}
        {activeTab === 'training' && (
          <div>
            <div className="bg-[#1A1528] rounded-xl p-5 border border-gray-800 mb-6">
              <p className="text-gray-400 text-sm">Total Training Hours (All Faculty)</p>
              <p className="text-3xl font-bold text-white mt-1">{totalTrainingHours.toLocaleString()} hours</p>
            </div>

            <div className="space-y-4">
              {trainingHours.map((faculty, idx) => (
                <div
                  key={idx}
                  className="bg-[#1A1528] rounded-xl p-5 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">{faculty.facultyName}</h3>
                    <span className="text-[#0891B2] font-semibold">{faculty.totalHours} hours</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#0891B2]"
                      style={{ width: `${(faculty.fdpHours / faculty.totalHours) * 100}%` }}
                      title={`FDP: ${faculty.fdpHours}h`}
                    />
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${(faculty.workshopHours / faculty.totalHours) * 100}%` }}
                      title={`Workshop: ${faculty.workshopHours}h`}
                    />
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${(faculty.seminarHours / faculty.totalHours) * 100}%` }}
                      title={`Seminar: ${faculty.seminarHours}h`}
                    />
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${(faculty.otherHours / faculty.totalHours) * 100}%` }}
                      title={`Other: ${faculty.otherHours}h`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#0891B2] rounded-full" />
                      FDP: {faculty.fdpHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full" />
                      Workshop: {faculty.workshopHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      Seminar: {faculty.seminarHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                      Other: {faculty.otherHours}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#1A1528] rounded-xl p-6 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">Budget Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Total Budget</span>
                      <span className="text-white">₹{totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0891B2] rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Utilized</span>
                      <span className="text-white">₹{utilizedBudget.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(utilizedBudget / totalBudget) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-white">₹{(totalBudget - utilizedBudget).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${((totalBudget - utilizedBudget) / totalBudget) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-[#0D0A1A] rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-gray-400 text-xs">Utilization Rate</p>
                      <p className="text-2xl font-bold text-[#0891B2]">
                        {((utilizedBudget / totalBudget) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Avg per Program</p>
                      <p className="text-2xl font-bold text-purple-400">
                        ₹{(totalBudget / fdpEntries.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1528] rounded-xl p-6 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">Budget by Type</h3>
                <div className="space-y-4">
                  {(['FDP', 'Workshop', 'Seminar', 'Conference', 'Webinar'] as const).map((type) => {
                    const typeEntries = fdpEntries.filter(e => e.type === type);
                    const typeBudget = typeEntries.reduce((sum, e) => sum + e.budget, 0);
                    const typeUtilized = typeEntries.reduce((sum, e) => sum + e.budgetUtilized, 0);
                    if (typeBudget === 0) return null;
                    return (
                      <div key={type} className="p-3 bg-[#0D0A1A] rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white text-sm font-medium">{type}</span>
                          <span className="text-gray-400 text-sm">₹{typeBudget.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0891B2] rounded-full"
                            style={{ width: `${totalBudget > 0 ? (typeBudget / totalBudget) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {typeEntries.length} programs | ₹{typeUtilized.toLocaleString()} utilized
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-[#1A1528] rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-white font-semibold">Program-wise Budget</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0D0A1A]">
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Program</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Type</th>
                    <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Budget</th>
                    <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Utilized</th>
                    <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {fdpEntries.map((entry, idx) => (
                    <tr key={idx} className="border-t border-gray-800 hover:bg-[#0D0A1A]/50">
                      <td className="px-6 py-3 text-white text-sm">{entry.title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300 text-sm">₹{entry.budget.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-300 text-sm">₹{entry.budgetUtilized.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0891B2] rounded-full"
                              style={{ width: `${(entry.budgetUtilized / entry.budget) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-xs w-10 text-right">
                            {((entry.budgetUtilized / entry.budget) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}