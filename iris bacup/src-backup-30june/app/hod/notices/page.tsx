"use client";
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Search, Filter, ChevronDown, AlertTriangle, Info, CheckCircle, Clock, Send, X } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Admin' | 'Event' | 'Emergency' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  postedDate: string;
  author: string;
  targetAudience: string[];
  read: boolean;
}

const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'Mid-Term Examination Schedule Released',
    content: 'The mid-term examination schedule for all departments has been finalized. Please check the academic portal for detailed timetable and room assignments.',
    category: 'Academic',
    priority: 'High',
    postedDate: '2026-06-10T09:00:00',
    author: 'Dr. Rajesh Kumar',
    targetAudience: ['Faculty', 'Students'],
    read: false,
  },
  {
    id: '2',
    title: 'Annual Sports Day - Registration Open',
    content: 'Annual sports day will be held on June 25, 2026. All departments are requested to register their teams by June 18. Events include cricket, badminton, relay, and more.',
    category: 'Event',
    priority: 'Medium',
    postedDate: '2026-06-08T14:30:00',
    author: 'Sports Committee',
    targetAudience: ['Students', 'Staff'],
    read: true,
  },
  {
    id: '3',
    title: 'Power Shutdown Notice - Block B',
    content: 'Scheduled power maintenance will be carried out in Block B on June 14, 2026 from 10:00 AM to 4:00 PM. Please plan your work accordingly.',
    category: 'Emergency',
    priority: 'High',
    postedDate: '2026-06-09T08:15:00',
    author: 'Admin Office',
    targetAudience: ['All'],
    read: false,
  },
  {
    id: '4',
    title: 'Faculty Meeting - Curriculum Revision',
    content: 'A department-wide faculty meeting is scheduled for June 15 at 2:00 PM in Conference Room 3 to discuss curriculum revisions for the upcoming semester.',
    category: 'Academic',
    priority: 'Medium',
    postedDate: '2026-06-07T11:00:00',
    author: 'HOD Office',
    targetAudience: ['Faculty'],
    read: true,
  },
  {
    id: '5',
    title: 'New Leave Application Portal Live',
    content: 'The new online leave application portal is now live. All staff members are requested to submit leave requests through the new system starting June 12.',
    category: 'Admin',
    priority: 'Low',
    postedDate: '2026-06-06T16:00:00',
    author: 'HR Department',
    targetAudience: ['Faculty', 'Staff'],
    read: false,
  },
  {
    id: '6',
    title: 'Workshop on AI in Education',
    content: 'A one-day workshop on "Integrating AI Tools in Modern Education" will be conducted on June 20. Registration is open for all faculty members.',
    category: 'Event',
    priority: 'Low',
    postedDate: '2026-06-05T10:30:00',
    author: 'Training Cell',
    targetAudience: ['Faculty'],
    read: true,
  },
  {
    id: '7',
    title: 'Emergency Fire Drill - Mandatory',
    content: 'An emergency fire drill will be conducted on June 16 at 11:00 AM. All students and staff must participate. Evacuation routes are posted on notice boards.',
    category: 'Emergency',
    priority: 'High',
    postedDate: '2026-06-11T07:00:00',
    author: 'Safety Committee',
    targetAudience: ['All'],
    read: false,
  },
];

const categories = ['All', 'Academic', 'Admin', 'Event', 'Emergency', 'General'];
const priorities = ['All', 'High', 'Medium', 'Low'];
const audiences = ['All', 'Faculty', 'Students', 'Staff', 'All'];

export default function HODNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'General' as Notice['category'],
    priority: 'Medium' as Notice['priority'],
    targetAudience: ['All'],
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/core/notices');
      if (data && Array.isArray(data)) {
        setNotices(data);
      }
    } catch {
      setNotices(mockNotices);
    } finally {
      setLoading(false);
    }
  };

  const handlePostNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    try {
      const posted = await apiPost('/core/notices', newNotice);
      if (posted && posted.success) {
        setNotices(prev => [posted as any, ...prev]);
      } else {
        const local: Notice = {
          id: Date.now().toString(),
          ...newNotice,
          postedDate: new Date().toISOString(),
          author: 'HOD Office',
          read: false,
        };
        setNotices(prev => [local, ...prev]);
      }
    } catch {
      const local: Notice = {
        id: Date.now().toString(),
        ...newNotice,
        postedDate: new Date().toISOString(),
        author: 'HOD Office',
        read: false,
      };
      setNotices(prev => [local, ...prev]);
    }
    setNewNotice({ title: '', content: '', category: 'General', priority: 'Medium', targetAudience: ['All'] });
    setShowPostForm(false);
  };

  const toggleRead = (id: string) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || n.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || n.priority === priorityFilter;
    const matchesDate = !dateFilter || n.postedDate.startsWith(dateFilter);
    return matchesSearch && matchesCategory && matchesPriority && matchesDate;
  });

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (p === 'Medium') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  const getCategoryIcon = (c: string) => {
    if (c === 'Academic') return <Info size={14} />;
    if (c === 'Emergency') return <AlertTriangle size={14} />;
    if (c === 'Event') return <Bell size={14} />;
    if (c === 'Admin') return <CheckCircle size={14} />;
    return <Info size={14} />;
  };

  const getCategoryColor = (c: string) => {
    if (c === 'Academic') return 'text-blue-400 bg-blue-500/20';
    if (c === 'Emergency') return 'text-red-400 bg-red-500/20';
    if (c === 'Event') return 'text-purple-400 bg-purple-500/20';
    if (c === 'Admin') return 'text-teal-400 bg-teal-500/20';
    return 'text-gray-400 bg-gray-500/20';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleAudience = (aud: string) => {
    setNewNotice(prev => {
      if (aud === 'All') return { ...prev, targetAudience: ['All'] };
      const current = prev.targetAudience.filter(a => a !== 'All');
      if (current.includes(aud)) {
        const updated = current.filter(a => a !== aud);
        return { ...prev, targetAudience: updated.length === 0 ? ['All'] : updated };
      }
      return { ...prev, targetAudience: [...current, aud] };
    });
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-[#0891B2]" />
            <h1 className="text-2xl font-bold text-white">Department Notices</h1>
            <span className="ml-2 text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
              {notices.filter(n => !n.read).length} unread
            </span>
          </div>
          <button
            onClick={() => setShowPostForm(true)}
            className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0E7490] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Post Notice
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search notices by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1530] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-[#0891B2] focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1530] border border-gray-700 rounded-lg hover:border-[#0891B2] transition-colors"
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-[#1A1530] border border-gray-700 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 focus:border-[#0891B2] focus:outline-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 focus:border-[#0891B2] focus:outline-none"
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 focus:border-[#0891B2] focus:outline-none"
              />
            </div>
          </div>
        )}

        {showPostForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1530] border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Post New Notice</h2>
                <button onClick={() => setShowPostForm(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice(p => ({ ...p, title: e.target.value }))}
                    placeholder="Enter notice title"
                    className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-[#0891B2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Content *</label>
                  <textarea
                    value={newNotice.content}
                    onChange={(e) => setNewNotice(p => ({ ...p, content: e.target.value }))}
                    placeholder="Write your notice content here..."
                    rows={5}
                    className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-[#0891B2] focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <select
                      value={newNotice.category}
                      onChange={(e) => setNewNotice(p => ({ ...p, category: e.target.value as Notice['category'] }))}
                      className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 focus:border-[#0891B2] focus:outline-none"
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Priority</label>
                    <select
                      value={newNotice.priority}
                      onChange={(e) => setNewNotice(p => ({ ...p, priority: e.target.value as Notice['priority'] }))}
                      className="w-full px-3 py-2 bg-[#0D0A1A] border border-gray-700 rounded-lg text-gray-200 focus:border-[#0891B2] focus:outline-none"
                    >
                      {priorities.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Target Audience</label>
                  <div className="flex flex-wrap gap-2">
                    {audiences.map(aud => (
                      <button
                        key={aud}
                        onClick={() => toggleAudience(aud)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          newNotice.targetAudience.includes(aud)
                            ? 'bg-[#0891B2] border-[#0891B2] text-white'
                            : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
                <button
                  onClick={() => setShowPostForm(false)}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostNotice}
                  disabled={!newNotice.title.trim() || !newNotice.content.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Post Notice
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading notices...</div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No notices found matching your filters.</div>
          ) : (
            filteredNotices.map(notice => (
              <div
                key={notice.id}
                onClick={() => toggleRead(notice.id)}
                className={`bg-[#1A1530] border rounded-xl p-5 cursor-pointer transition-all hover:border-[#0891B2]/50 ${
                  notice.read ? 'border-gray-700/50 opacity-75' : 'border-[#0891B2]/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!notice.read && <span className="w-2 h-2 bg-[#0891B2] rounded-full" />}
                    <h3 className={`font-semibold ${notice.read ? 'text-gray-300' : 'text-white'}`}>{notice.title}</h3>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(notice.category)}`}>
                      {getCategoryIcon(notice.category)}
                      {notice.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <Clock size={12} />
                    {formatDate(notice.postedDate)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3 leading-relaxed">{notice.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By {notice.author}</span>
                  <div className="flex gap-1.5">
                    {notice.targetAudience.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-gray-800 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          Showing {filteredNotices.length} of {notices.length} notices
        </div>
      </div>
    </div>
  );
}
