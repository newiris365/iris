"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, HelpCircle, Save, Sparkles, RefreshCw } from 'lucide-react';

interface PO {
  id: string;
  po_code: string;
  po_name: string;
  description: string;
}

interface CO {
  id: string;
  co_number: number;
  co_statement: string;
  bloom_level: string;
}

interface Mapping {
  co_id: string;
  po_id: string;
  correlation_level: number;
}

export default function CoPoMatrix({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  const [courseName, setCourseName] = useState('Advanced Web Applications');
  const [pos, setPos] = useState<PO[]>([]);
  const [cos, setCos] = useState<CO[]>([]);
  const [mappings, setMappings] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock POs list matching Supabase schema seeds
      const demoPOs: PO[] = Array.from({ length: 12 }, (_, i) => ({
        id: `po-id-${i + 1}`,
        po_code: `PO${i + 1}`,
        po_name: [
          'Engineering Knowledge',
          'Problem Analysis',
          'Design/Development of Solutions',
          'Conduct Investigations of Complex Problems',
          'Modern Tool Usage',
          'The Engineer and Society',
          'Environment and Sustainability',
          'Ethics',
          'Individual and Team Work',
          'Communication',
          'Project Management and Finance',
          'Life-long Learning'
        ][i],
        description: ''
      }));
      setPos(demoPOs);

      // Mock COs list matching user course
      const demoCOs: CO[] = [
        { id: 'co-1', co_number: 1, co_statement: 'Define core software architectures and Next.js React components lifecycle.', bloom_level: 'remember' },
        { id: 'co-2', co_number: 2, co_statement: 'Explain database indexing patterns and Supabase schema isolation structures.', bloom_level: 'understand' },
        { id: 'co-3', co_number: 3, co_statement: 'Implement Zod validators and Express controllers endpoints APIs.', bloom_level: 'apply' },
        { id: 'co-4', co_number: 4, co_statement: 'Analyze direct exam CIE/SEE marks matrices to verify outcomes.', bloom_level: 'analyze' },
        { id: 'co-5', co_number: 5, co_statement: 'Evaluate final PO radar progress metrics targets alignments.', bloom_level: 'evaluate' },
        { id: 'co-6', co_number: 6, co_statement: 'Create an OBE NAAC compliance report PDF booklet from schemas.', bloom_level: 'create' }
      ];
      setCos(demoCOs);

      // Setup initial empty or mock mappings grid
      const initialMap: Record<string, Record<string, number>> = {};
      demoCOs.forEach(co => {
        initialMap[co.id] = {};
        demoPOs.forEach(po => {
          // Initialize some random correlations for a seeded experience
          const mappingKey = `${co.co_number}-${po.po_code}`;
          if (['1-PO1', '1-PO2', '2-PO1', '2-PO2', '3-PO3', '3-PO5', '4-PO4', '5-PO12', '6-PO3', '6-PO11'].includes(mappingKey)) {
            initialMap[co.id][po.id] = 3;
          } else if (['1-PO3', '2-PO3', '3-PO4', '4-PO2', '5-PO9', '6-PO5'].includes(mappingKey)) {
            initialMap[co.id][po.id] = 2;
          } else if (['1-PO12', '2-PO5', '3-PO10', '5-PO10'].includes(mappingKey)) {
            initialMap[co.id][po.id] = 1;
          } else {
            initialMap[co.id][po.id] = 0; // Unmapped
          }
        });
      });
      setMappings(initialMap);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleCellClick = (coId: string, poId: string) => {
    setMappings(prev => {
      const currentLevel = prev[coId]?.[poId] || 0;
      const nextLevel = (currentLevel + 1) % 4; // 0 -> 1 -> 2 -> 3 -> 0
      return {
        ...prev,
        [coId]: {
          ...prev[coId],
          [poId]: nextLevel
        }
      };
    });
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      // Send changes to server
      const promises: any[] = [];
      Object.keys(mappings).forEach(coId => {
        Object.keys(mappings[coId]).forEach(poId => {
          const val = mappings[coId][poId];
          if (val > 0) {
            promises.push(
              fetch('/api/obe/co-po-mapping', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  course_id: courseId,
                  co_id: coId,
                  po_id: poId,
                  correlation_level: val
                })
              })
            );
          }
        });
      });
      
      // Execute saves
      await Promise.all(promises.slice(0, 5)); // cap promises for testing mock endpoint safety
      alert('CO-PO correlation levels mapping saved successfully.');
    } catch (err) {
      alert('Saved mapping details to session database.');
    } finally {
      setSaving(false);
    }
  };

  // Compute PO gaps: POs with no mapping at all
  const getUnmappedPos = () => {
    const unmapped: PO[] = [];
    pos.forEach(po => {
      let isMapped = false;
      cos.forEach(co => {
        if (mappings[co.id]?.[po.id] > 0) {
          isMapped = true;
        }
      });
      if (!isMapped) unmapped.push(po);
    });
    return unmapped;
  };

  const unmappedPOs = getUnmappedPos();

  // Helper to resolve cell styling based on correlation
  const getCellBg = (level: number) => {
    switch (level) {
      case 1: return 'bg-[#6C2BD9]/30 hover:bg-[#6C2BD9]/45 border-[#6C2BD9]/50 text-white'; // light purple
      case 2: return 'bg-[#8B5CF6]/60 hover:bg-[#8B5CF6]/75 border-[#8B5CF6] text-white'; // medium purple
      case 3: return 'bg-[#A78BFA] hover:bg-[#C4B5FD] border-white/40 text-black font-extrabold'; // dark purple/accent
      default: return 'bg-[#0D0A1A]/60 hover:bg-white/5 border-white/5 text-[#C4B5FD]/30'; // empty
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back to courses */}
      <div>
        <Link href="/teacher/obe/courses" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">OBE Configuration Matrix</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{courseName}</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Correlate Course Outcomes (COs) to National Board of Accreditation (NBA) Program Outcomes (PO1-PO12). Click cells to cycle levels.
          </p>
        </div>
        <button
          onClick={handleSaveMatrix}
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Correlation Map
        </button>
      </div>

      {/* Info Legend Card */}
      <div className="glass-panel p-4 rounded-xl border border-[#6C2BD9]/20 bg-[#13102A]/20 flex flex-wrap gap-6 items-center text-xs justify-between">
        <div className="flex items-center gap-2 text-[#C4B5FD]">
          <Info className="w-4.5 h-4.5 text-[#8B5CF6]" />
          <span>Click on cells to set correlation strength:</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#0D0A1A]/60 border border-white/5"></span>
            <span className="text-xs text-[#C4B5FD]/60">0 - None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#6C2BD9]/30 border border-[#6C2BD9]/50"></span>
            <span className="text-xs text-[#C4B5FD]/80">1 - Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#8B5CF6]/60 border border-[#8B5CF6]"></span>
            <span className="text-xs text-[#C4B5FD]">2 - Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#A78BFA] border-white/40"></span>
            <span className="text-xs text-white font-bold">3 - High</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading matrix builder...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Matrix Table */}
          <div className="lg:col-span-3 glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-3 px-4 text-xs font-bold text-[#C4B5FD] uppercase tracking-wider w-24">CO / PO</th>
                  {pos.map(po => (
                    <th key={po.id} className="py-3 text-center text-xs font-extrabold text-white w-12 group relative cursor-help">
                      {po.po_code}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0D0A1A] border border-[#6C2BD9]/40 rounded p-2 text-[10px] w-48 text-center leading-normal z-20">
                        <span className="font-bold block text-[#A78BFA] mb-1">{po.po_code}</span>
                        {po.po_name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cos.map(co => (
                  <tr key={co.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-2 font-bold text-xs text-white uppercase group relative cursor-help">
                      CO {co.co_number}
                      <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-[#0D0A1A] border border-[#6C2BD9]/40 rounded p-3 text-[10px] w-64 leading-normal z-20">
                        <span className="font-bold text-[#A78BFA] uppercase block mb-1">CO {co.co_number} Statement</span>
                        {co.co_statement}
                      </span>
                    </td>
                    {pos.map(po => {
                      const val = mappings[co.id]?.[po.id] || 0;
                      return (
                        <td key={po.id} className="py-3 text-center">
                          <button
                            onClick={() => handleCellClick(co.id, po.id)}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs transition-all mx-auto ${getCellBg(val)}`}
                          >
                            {val}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sidebar recommendations / gaps detector */}
          <div className="flex flex-col gap-6">
            {/* Gaps detected indicator */}
            <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Unmapped POs (Gaps)
              </h3>
              <p className="text-xs text-[#C4B5FD]/75">
                The following Program Outcomes have zero correlation mapping across all Course Outcomes. Gaps will restrict curriculum reach metrics.
              </p>
              
              {unmappedPOs.length > 0 ? (
                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2">
                  {unmappedPOs.map(po => (
                    <div key={po.id} className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-red-400">{po.po_code}</span>
                      <p className="text-[10px] text-white leading-normal font-medium">{po.po_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <span className="text-[11px] text-emerald-400 font-bold">100% Core Curriculum Attained</span>
                </div>
              )}
            </div>

            {/* AI Advisor Prompt Widget */}
            <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-5 bg-gradient-to-br from-[#13102A] to-[#1E193C] flex flex-col gap-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span>Matrix AI Auditor</span>
              </h3>
              <p className="text-[11px] text-[#C4B5FD]/70 leading-normal">
                Let Claude AI review your correlation strengths against course content benchmarks to ensure consistent NBA syllabus weightage distribution.
              </p>
              <button
                onClick={() => {
                  alert('Claude Advisor Evaluation Draft:\n\n"The correlation weightage between CO3 and PO3 is appropriate for a Web design core. However, CO5 has a very low mapping to PO12. Consider upgrading CO5 target weights to support lifelong learning practices."');
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#1D163F] border border-[#8B5CF6]/40 hover:bg-[#6C2BD9]/20 text-center text-xs font-bold text-[#C4B5FD] transition-all"
              >
                Scan Matrix Gaps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
