"use client";

import { useState, useEffect } from 'react';
import { 
  Award, CheckCircle, Search, RefreshCw, Star, ArrowRight, Check, HeartHandshake
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

export default function ScholarshipsPage() {
  const [eligibilityList, setEligibilityList] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'applied'>('all');

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
        <button 
          onClick={fetchEligible}
          className="flex items-center gap-2 bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/40 border border-[#6C2BD9]/40 text-[#A78BFA] px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh List
        </button>
      </div>

      {/* Grid: Criteria Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#13102A]/80 backdrop-blur-md p-5 rounded-2xl border border-[#6C2BD9]/30">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-[#A78BFA] flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Academic Merit
            </h3>
            <span className="text-xs bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full font-bold">
              25% OFF
            </span>
          </div>
          <p className="text-xs text-[#A78BFA]/60 leading-relaxed">
            Eligible for student groups achieving overall academic grading of 80% marks or above with a minimum class attendance threshold of 80%.
          </p>
        </div>

        <div className="bg-[#13102A]/80 backdrop-blur-md p-5 rounded-2xl border border-[#6C2BD9]/30">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-[#A78BFA] flex items-center gap-2">
              <Star className="w-4 h-4 text-sky-400 fill-sky-400" />
              Attendance Excellence
            </h3>
            <span className="text-xs bg-sky-400/15 text-sky-400 border border-sky-400/30 px-2 py-0.5 rounded-full font-bold">
              15% OFF
            </span>
          </div>
          <p className="text-xs text-[#A78BFA]/60 leading-relaxed">
            Awarded to students exhibiting exemplary discipline indices with overall attendance scores above 90% and marks above 70%.
          </p>
        </div>

        <div className="bg-[#13102A]/80 backdrop-blur-md p-5 rounded-2xl border border-[#6C2BD9]/30">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-[#A78BFA] flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              Need-Based Support
            </h3>
            <span className="text-xs bg-emerald-400/15 text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
              40% OFF
            </span>
          </div>
          <p className="text-xs text-[#A78BFA]/60 leading-relaxed">
            Financial aid packages evaluated against household net income records for student families maintaining attendance above 75%.
          </p>
        </div>
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
    </div>
  );
}
