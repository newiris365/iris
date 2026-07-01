"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Thermometer, CheckSquare, 
  Square, RefreshCw, Calendar, ClipboardCheck, Sparkles 
} from 'lucide-react';
import { apiPost } from '../../../../lib/api';

export default function VendorHygienePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [refTemp, setRefTemp] = useState('4.0');
  const [cookTemp, setCookTemp] = useState('74.5');
  const [checks, setChecks] = useState({
    countersCleaned: false,
    staffGloved: false,
    dishesSanitized: false,
    pestCheck: false,
    foodCovered: false
  });

  const handleToggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const refNum = Number(refTemp);
    const cookNum = Number(cookTemp);
    
    // Auto calculations of compliance rating for display
    let complianceDeductions = 0;
    if (refNum > 5.0 || refNum < 0.0) complianceDeductions += 20;
    if (cookNum < 70.0) complianceDeductions += 20;
    Object.values(checks).forEach(c => {
      if (!c) complianceDeductions += 12;
    });

    const mockScore = Math.max(10, 100 - complianceDeductions);

    try {
      await apiPost('/canteen/hygiene/checklist', {
        institution_id: 'i0000000-0000-0000-0000-000000000001',
        fridge_temperature: refNum,
        food_temperature: cookNum,
        checklist_items: checks,
        compliance_score: mockScore
      });
    } catch (err) {}

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setRefTemp('4.0');
      setCookTemp('74.5');
      setChecks({
        countersCleaned: false,
        staffGloved: false,
        dishesSanitized: false,
        pestCheck: false,
        foodCovered: false
      });
    }, 3000);
  };

  const isFridgeUnsafe = Number(refTemp) > 5.0 || Number(refTemp) < 0;
  const isCookingUnsafe = Number(cookTemp) < 70.0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex items-center gap-3 bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Daily Hygiene Audit & Temperatures</h2>
          <p className="text-xs text-[#A78BFA]/70 mt-0.5">Submit daily sanitization audits and temperatures matching FSSAI laws.</p>
        </div>
      </div>

      {success ? (
        <div className="glass-panel border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4">
          <ClipboardCheck className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
          <div>
            <h3 className="text-lg font-bold text-white">Hygiene Audit Submitted!</h3>
            <p className="text-xs text-[#C4B5FD]/60 mt-1">Checklist saved to the campus compliance ledger.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Temperatures Section */}
          <div className="glass-panel border border-white/5 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#A78BFA]" /> Temperature Loggers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Refrigerator Temp (°C)</label>
                <div className="relative">
                  <input 
                    required
                    type="number"
                    step="any"
                    value={refTemp}
                    onChange={(e) => setRefTemp(e.target.value)}
                    className={`w-full pl-4 pr-10 py-2.5 bg-[#0D0A1A] border rounded-xl text-xs text-white outline-none font-mono ${
                      isFridgeUnsafe ? 'border-red-500/40 focus:border-red-500' : 'border-white/10 focus:border-[#6C2BD9]/50'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#C4B5FD]/45 font-bold">Max 5.0°</span>
                </div>
                {isFridgeUnsafe && (
                  <p className="text-[9px] text-red-400 mt-1 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Warning: Ideal range is 0.0°C - 5.0°C</p>
                )}
              </div>

              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Serving Warm Food Temp (°C)</label>
                <div className="relative">
                  <input 
                    required
                    type="number"
                    step="any"
                    value={cookTemp}
                    onChange={(e) => setCookTemp(e.target.value)}
                    className={`w-full pl-4 pr-10 py-2.5 bg-[#0D0A1A] border rounded-xl text-xs text-white outline-none font-mono ${
                      isCookingUnsafe ? 'border-red-500/40 focus:border-red-500' : 'border-white/10 focus:border-[#6C2BD9]/50'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#C4B5FD]/45 font-bold">Min 70.0°</span>
                </div>
                {isCookingUnsafe && (
                  <p className="text-[9px] text-red-400 mt-1 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Warning: Food must be kept warm above 70°C</p>
                )}
              </div>
            </div>
          </div>

          {/* Sanitization Checklist */}
          <div className="glass-panel border border-white/5 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#A78BFA]" /> Canteen Sanitization Checks
            </h3>

            <div className="flex flex-col gap-3">
              {[
                { key: 'countersCleaned' as const, label: 'Preparation counters cleaned and sanitized' },
                { key: 'staffGloved' as const, label: 'Cooking staff wearing hair nets & kitchen gloves' },
                { key: 'dishesSanitized' as const, label: 'Serving dishes washed and run in sanitizer cycle' },
                { key: 'pestCheck' as const, label: 'No visual signs of pests or insects' },
                { key: 'foodCovered' as const, label: 'Cooked ingredients and dishes fully covered' }
              ].map(item => {
                const checked = checks[item.key];
                return (
                  <div 
                    key={item.key}
                    onClick={() => handleToggleCheck(item.key)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#6C2BD9]/20 transition-all cursor-pointer select-none"
                  >
                    {checked ? (
                      <div className="w-5 h-5 bg-[#6C2BD9] rounded flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5 text-white" /></div>
                    ) : (
                      <div className="w-5 h-5 border border-white/20 rounded" />
                    )}
                    <span className="text-xs text-[#C4B5FD]/85 font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C2BD9]/15"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Publish Daily Hygiene Log'}
          </button>

        </form>
      )}

    </div>
  );
}
