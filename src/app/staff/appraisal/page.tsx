"use client";

import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function StaffAppraisalPage() {
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAppraisals(); }, []);

  const fetchAppraisals = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('staff/appraisals');
      if (res.success) setAppraisals(res.appraisals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Award size={24} className="text-amber-400" /> Performance Appraisal
      </h1>

      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-bold text-white mb-2">Appraisal Cycle</h3>
        <p className="text-xs text-slate-400">Annual performance reviews are conducted in August. Your next appraisal is scheduled for <span className="text-amber-400 font-medium">August 2026</span>.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : appraisals.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Award size={40} className="mx-auto mb-3 opacity-50" />
          <p>No appraisal records yet. Your first review is pending.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appraisals.map(a => (
            <div key={a.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Appraisal — {a.period || a.year}</p>
                  <p className="text-xs text-slate-400">Reviewed by: {a.reviewer || 'HOD'}</p>
                  {a.score && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${a.score}%` }} />
                      </div>
                      <span className="text-xs text-amber-400 font-medium">{a.score}%</span>
                    </div>
                  )}
                  {a.remarks && (
                    <p className="text-xs text-slate-500 mt-1">Remarks: {a.remarks}</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  a.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
