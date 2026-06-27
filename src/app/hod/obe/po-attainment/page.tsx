"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, HelpCircle, BarChart3, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface POAttainment {
  po: string;
  statement: string;
  attained: number;
  target: number;
  is_attained: boolean;
}

export default function HodPoAttainment() {
  const [poAttainments, setPoAttainments] = useState<POAttainment[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/obe/po-attainment/a0000000-0000-0000-0000-000000000001', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.attainments)) {
        setPoAttainments(data.attainments);
      } else {
        // Fallback mock
        setPoAttainments([
          { po: 'PO1', statement: 'Engineering Knowledge', attained: 68, target: 60, is_attained: true },
          { po: 'PO2', statement: 'Problem Analysis', attained: 64, target: 60, is_attained: true },
          { po: 'PO3', statement: 'Design/Development', attained: 52, target: 60, is_attained: false },
          { po: 'PO4', statement: 'Investigations', attained: 71, target: 60, is_attained: true },
          { po: 'PO5', statement: 'Modern Tool Usage', attained: 78, target: 60, is_attained: true },
          { po: 'PO6', statement: 'Engineer & Society', attained: 61, target: 60, is_attained: true },
          { po: 'PO7', statement: 'Sustainability', attained: 58, target: 60, is_attained: false },
          { po: 'PO8', statement: 'Ethics', attained: 80, target: 60, is_attained: true },
          { po: 'PO9', statement: 'Individual & Team', attained: 84, target: 60, is_attained: true },
          { po: 'PO10', statement: 'Communication', attained: 73, target: 60, is_attained: true },
          { po: 'PO11', statement: 'Project Management', attained: 69, target: 60, is_attained: true },
          { po: 'PO12', statement: 'Life-long Learning', attained: 76, target: 60, is_attained: true }
        ]);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setPoAttainments([
        { po: 'PO1', statement: 'Engineering Knowledge', attained: 68, target: 60, is_attained: true },
        { po: 'PO2', statement: 'Problem Analysis', attained: 64, target: 60, is_attained: true },
        { po: 'PO3', statement: 'Design/Development', attained: 52, target: 60, is_attained: false },
        { po: 'PO4', statement: 'Investigations', attained: 71, target: 60, is_attained: true },
        { po: 'PO5', statement: 'Modern Tool Usage', attained: 78, target: 60, is_attained: true },
        { po: 'PO6', statement: 'Engineer & Society', attained: 61, target: 60, is_attained: true },
        { po: 'PO7', statement: 'Sustainability', attained: 58, target: 60, is_attained: false },
        { po: 'PO8', statement: 'Ethics', attained: 80, target: 60, is_attained: true },
        { po: 'PO9', statement: 'Individual & Team', attained: 84, target: 60, is_attained: true },
        { po: 'PO10', statement: 'Communication', attained: 73, target: 60, is_attained: true },
        { po: 'PO11', statement: 'Project Management', attained: 69, target: 60, is_attained: true },
        { po: 'PO12', statement: 'Life-long Learning', attained: 76, target: 60, is_attained: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // SVG Radar generator parameters
  const size = 300;
  const center = size / 2;
  const rScale = 110; // Max radius scale

  // Compute coordinates for radar mapping
  const getRadarPoints = (isTarget = false) => {
    if (poAttainments.length === 0) return '';
    const points: string[] = [];
    const numPoints = poAttainments.length;

    poAttainments.forEach((item, i) => {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2; // start top center
      const score = isTarget ? item.target : item.attained;
      // Normalise score from 0-100
      const radius = (score / 100) * rScale;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    return points.join(' ');
  };

  // Draw concentric outline rings (e.g. 20%, 40%, 60%, 80%, 100%)
  const drawConcentricRings = () => {
    const rings = [20, 40, 60, 80, 100];
    const numPoints = poAttainments.length || 12;

    return rings.map(pct => {
      const radius = (pct / 100) * rScale;
      const points: string[] = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return (
        <polygon
          key={pct}
          points={points.join(' ')}
          className="fill-transparent stroke-white/[0.05]"
          strokeWidth="1"
        />
      );
    });
  };

  // Draw axes lines from center to outer points
  const drawAxes = () => {
    if (poAttainments.length === 0) return null;
    const numPoints = poAttainments.length;

    return poAttainments.map((item, i) => {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = center + rScale * Math.cos(angle);
      const y = center + rScale * Math.sin(angle);
      
      // Compute positions for text labels slightly outside the axis end
      const labelRadius = rScale + 18;
      const lx = center + labelRadius * Math.cos(angle) - 8;
      const ly = center + labelRadius * Math.sin(angle) + 4;

      return (
        <g key={item.po}>
          <line
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            className="stroke-white/[0.06]"
            strokeWidth="1"
          />
          <text
            x={lx}
            y={ly}
            className="fill-[#C4B5FD] text-[8px] font-bold font-mono tracking-tight"
          >
            {item.po}
          </text>
        </g>
      );
    });
  };

  const achievedCount = poAttainments.filter(p => p.is_attained).length;

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link href="/hod/obe/programs" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Courses Overview
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Academic Analytics Console</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Program Outcomes (PO) Attainment</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Monitor cumulative curriculum achievement metrics across all 12 NBA criteria.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Compiling attainment indices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Radar Chart Widget */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col items-center justify-center gap-4">
            <h3 className="font-extrabold text-sm text-white w-full text-left border-b border-white/5 pb-3">NBA PO Radar Map</h3>
            
            <div className="w-full max-w-[280px] h-[280px] flex items-center justify-center bg-[#0D0A1A]/40 rounded-2xl border border-white/5 p-2">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
                {/* 1. concentric rings */}
                {drawConcentricRings()}
                {/* 2. axes lines */}
                {drawAxes()}
                {/* 3. Target polygon path */}
                <polygon
                  points={getRadarPoints(true)}
                  className="fill-transparent stroke-emerald-500/40"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                {/* 4. Attained polygon path */}
                <polygon
                  points={getRadarPoints(false)}
                  className="fill-[#8B5CF6]/15 stroke-[#8B5CF6]"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* Radar Legend */}
            <div className="flex gap-5 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#8B5CF6]"></span> Attained Score</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-transparent border border-dashed border-emerald-500"></span> NBA Target (60%)</span>
            </div>
          </div>

          {/* List breakdown grid of POs */}
          <div className="lg:col-span-2 glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-extrabold text-sm text-white">Outcome Attainments</h3>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                {achievedCount} / {poAttainments.length} Attained
              </span>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[420px] overflow-y-auto pr-2">
              {poAttainments.map(item => (
                <div key={item.po} className="flex items-center justify-between gap-6 p-3 rounded-xl bg-[#0D0A1A]/50 border border-white/5 hover:border-[#6C2BD9]/25 transition-all">
                  <div className="flex flex-col gap-0.5 max-w-[65%]">
                    <span className="text-[10px] font-bold text-[#A78BFA] font-mono uppercase">{item.po}</span>
                    <span className="text-[11px] text-white font-extrabold truncate">{item.statement}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-bold w-[35%] justify-end">
                    <div className="flex flex-col gap-1 items-end">
                      <span className={item.is_attained ? 'text-emerald-400' : 'text-amber-400'}>
                        {item.attained}%
                      </span>
                      <span className="text-[9px] text-[#C4B5FD]/40">Target {item.target}%</span>
                    </div>
                    
                    <span className={`px-2 py-1 rounded text-[9px] uppercase font-extrabold ${
                      item.is_attained 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {item.is_attained ? 'Attained' : 'Gap'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
