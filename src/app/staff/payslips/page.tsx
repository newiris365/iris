"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Search } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function StaffPayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchPayslips(); }, []);

  const fetchPayslips = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('staff/payslips');
      if (res.success) setPayslips(res.payslips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <FileText size={24} className="text-amber-400" /> Payslips
      </h1>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : payslips.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-50" />
          <p>No payslips available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payslips.map(p => (
            <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{p.month} {p.year}</p>
                  <p className="text-xs text-slate-400">
                    Basic: ₹{p.basic_salary?.toLocaleString() || '—'} · Deductions: ₹{p.deductions?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    Net Pay: ₹{p.net_pay?.toLocaleString() || '—'}
                  </p>
                </div>
                <button className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-500 flex items-center gap-1">
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
