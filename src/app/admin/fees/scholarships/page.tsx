"use client";

import { useState, useEffect } from 'react';
import { 
  Award, CheckCircle, Search, RefreshCw, Star, ArrowRight, Check, HeartHandshake, Plus, Pencil, Trash2, X
} from 'lucide-react';

interface EligibleStudent {
  student_id: string;
  name: string;
  roll_number: string;
  scholarship: string;
  discount: number;
  attendance: number;
  marks: number;
  applied?: boolean;
}

interface ScholarshipCriteria {
  id: string;
  name: string;
  discount: number;
  color: string;
  description: string;
  min_marks?: number;
  min_attendance?: number;
}

const defaultCriteria: ScholarshipCriteria[] = [
  {
    id: 'academic-merit',
    name: 'Academic Merit',
    discount: 25,
    color: 'yellow',
    description: 'Eligible for student groups achieving overall academic grading of 80% marks or above with a minimum class attendance threshold of 80%.',
    min_marks: 80,
    min_attendance: 80
  },
  {
    id: 'attendance-excellence',
    name: 'Attendance Excellence',
    discount: 15,
    color: 'sky',
    description: 'Awarded to students exhibiting exemplary discipline indices with overall attendance scores above 90% and marks above 70%.',
    min_marks: 70,
    min_attendance: 90
  },
  {
    id: 'need-based-support',
    name: 'Need-Based Support',
    discount: 40,
    color: 'emerald',
    description: 'Financial aid packages evaluated against household net income records for student families maintaining attendance above 75%.',
    min_attendance: 75
  }
];

export default function ScholarshipsPage() {
  const [eligibilityList, setEligibilityList] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'applied'>('all');
  const [criteria, setCriteria] = useState<ScholarshipCriteria[]>(defaultCriteria);
  const [showModal, setShowModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<ScholarshipCriteria | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    discount: '',
    color: 'yellow',
    description: '',
    min_marks: '',
    min_attendance: ''
  });

  useEffect(() => {
    fetchEligible();
  }, []);

  const fetchEligible = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch('/api/v1/core/fees/scholarship/eligible', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setEligibilityList(data.eligible);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyScholarship = (studentId: string, scholarshipName: string) => {
    setEligibilityList(prev => prev.map(s => {
      if (s.student_id === studentId && s.scholarship === scholarshipName) {
        return { ...s, applied: true };
      }
      return s;
    }));
    alert(`Scholarship discount successfully applied to student fee structure invoice.`);
  };

  const openAddModal = () => {
    setEditingCriteria(null);
    setFormData({
      name: '',
      discount: '',
      color: 'yellow',
      description: '',
      min_marks: '',
      min_attendance: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item: ScholarshipCriteria) => {
    setEditingCriteria(item);
    setFormData({
      name: item.name,
      discount: item.discount.toString(),
      color: item.color,
      description: item.description,
      min_marks: item.min_marks?.toString() || '',
      min_attendance: item.min_attendance?.toString() || ''
    });
    setShowModal(true);
  };

  const handleSaveCriteria = () => {
    if (!formData.name || !formData.discount) {
      alert('Please fill in the required fields.');
      return;
    }

    if (editingCriteria) {
      setCriteria(prev => prev.map(c => 
        c.id === editingCriteria.id 
          ? { ...c, ...formData, discount: Number(formData.discount), min_marks: formData.min_marks ? Number(formData.min_marks) : undefined, min_attendance: formData.min_attendance ? Number(formData.min_attendance) : undefined }
          : c
      ));
    } else {
      const newCriteria: ScholarshipCriteria = {
        id: `criteria-${Date.now()}`,
        name: formData.name,
        discount: Number(formData.discount),
        color: formData.color,
        description: formData.description,
        min_marks: formData.min_marks ? Number(formData.min_marks) : undefined,
        min_attendance: formData.min_attendance ? Number(formData.min_attendance) : undefined
      };
      setCriteria(prev => [...prev, newCriteria]);
    }
    setShowModal(false);
  };

  const handleDeleteCriteria = (id: string) => {
    if (confirm('Are you sure you want to delete this scholarship criteria?')) {
      setCriteria(prev => prev.filter(c => c.id !== id));
    }
  };

  const filteredList = eligibilityList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || s.applied;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-[#A78BFA]" />
            Merit Scholarship & Fee Planner
          </h1>
          <p className="text-[#A78BFA]/70 mt-1">
            Audit and check student merit parameters against active discount criteria. Trigger direct fee adjustments.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white px-4 py-2 rounded-xl transition-all font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            New Criteria
          </button>
          <button 
            onClick={fetchEligible}
            className="flex items-center gap-2 bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/40 border border-[#6C2BD9]/40 text-[#A78BFA] px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh List
          </button>
        </div>
      </div>

      {/* Grid: Criteria Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {criteria.map((item) => {
          const colorMap: Record<string, { star: string; badge: string }> = {
            yellow: { star: 'text-yellow-400 fill-yellow-400', badge: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' },
            sky: { star: 'text-sky-400 fill-sky-400', badge: 'bg-sky-400/15 text-sky-400 border-sky-400/30' },
            emerald: { star: 'text-emerald-400 fill-emerald-400', badge: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30' },
            violet: { star: 'text-violet-400 fill-violet-400', badge: 'bg-violet-400/15 text-violet-400 border-violet-400/30' },
            rose: { star: 'text-rose-400 fill-rose-400', badge: 'bg-rose-400/15 text-rose-400 border-rose-400/30' }
          };
          const colors = colorMap[item.color] || colorMap.yellow;

          return (
            <div key={item.id} className="bg-[#13102A]/80 backdrop-blur-md p-5 rounded-2xl border border-[#6C2BD9]/30">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-[#A78BFA] flex items-center gap-2">
                  <Star className={`w-4 h-4 ${colors.star}`} />
                  {item.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${colors.badge} border px-2 py-0.5 rounded-full font-bold`}>
                    {item.discount}% OFF
                  </span>
                  <button 
                    onClick={() => openEditModal(item)}
                    className="p-1 hover:bg-[#6C2BD9]/20 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#A78BFA]/70" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCriteria(item.id)}
                    className="p-1 hover:bg-rose-500/20 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400/70" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#A78BFA]/60 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Student Match Table */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Tabs */}
          <div className="flex border border-[#6C2BD9]/20 rounded-xl overflow-hidden bg-[#0D0A1A]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'all' ? 'bg-[#6C2BD9] text-white' : 'hover:bg-[#6C2BD9]/10 text-[#A78BFA]/70'}`}
            >
              Eligible Student Pool
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'applied' ? 'bg-[#6C2BD9] text-white' : 'hover:bg-[#6C2BD9]/10 text-[#A78BFA]/70'}`}
            >
              Discounts Applied
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A78BFA]/60 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0D0A1A]/80 border border-[#6C2BD9]/30 rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] text-white transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#A78BFA]/60">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#6C2BD9]" />
            Auditing Student Metric Tables...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-[#A78BFA]/40">
            No students meet eligibility parameters in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#6C2BD9]/20 text-[#A78BFA]/70 text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-4 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Roll Number</th>
                  <th className="pb-3 font-semibold">Attendance</th>
                  <th className="pb-3 font-semibold">Exam Average</th>
                  <th className="pb-3 font-semibold">Eligible Benefit</th>
                  <th className="pb-3 pr-4 font-semibold text-right">Invoice Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6C2BD9]/10 text-sm">
                {filteredList.map((student, idx) => (
                  <tr key={idx} className="hover:bg-[#6C2BD9]/5 transition-colors">
                    <td className="py-4 pl-4 font-semibold">{student.name}</td>
                    <td className="py-4 text-[#A78BFA]/70">{student.roll_number}</td>
                    <td className="py-4 font-bold text-sky-400">{student.attendance}%</td>
                    <td className="py-4 font-bold text-violet-400">{student.marks}%</td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-md font-semibold">
                          {student.scholarship}
                        </span>
                        <span className="text-xs text-[#A78BFA] font-bold">({student.discount}% discount)</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {student.applied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                          Applied Dues
                        </span>
                      ) : (
                        <button
                          onClick={() => applyScholarship(student.student_id, student.scholarship)}
                          className="inline-flex items-center gap-1 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Apply Discount
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Criteria Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-lg text-white">
                {editingCriteria ? 'Edit Scholarship Criteria' : 'Add New Scholarship Criteria'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Criteria Name *</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Sports Achievement"
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Discount (%) *</label>
                  <input 
                    type="number" required min="1" max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    placeholder="25"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Color Theme</label>
                  <select 
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="yellow">Yellow</option>
                    <option value="sky">Sky Blue</option>
                    <option value="emerald">Emerald</option>
                    <option value="violet">Violet</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Min Marks (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={formData.min_marks}
                    onChange={(e) => setFormData({...formData, min_marks: e.target.value})}
                    placeholder="80"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Min Attendance (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={formData.min_attendance}
                    onChange={(e) => setFormData({...formData, min_attendance: e.target.value})}
                    placeholder="80"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the eligibility criteria..."
                  rows={3}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCriteria}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold"
                >
                  {editingCriteria ? 'Update Criteria' : 'Add Criteria'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
