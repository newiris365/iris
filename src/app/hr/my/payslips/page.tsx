"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, FileText, RefreshCw } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../../../lib/exportUtils';

interface PayslipRow {
  id: string;
  month: number;
  month_name: string;
  year: number;
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
  is_published: boolean;
}

export default function EmployeePayslipHistory() {
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hr/payslips/d0000000-0000-0000-0000-000000000003', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setPayslips(data.payslips);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = async (slip: PayslipRow) => {
    try {
      const token = localStorage.getItem('iris_jwt_token');
      const res = await fetch(`/api/v1/hr/payslips/download/${slip.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${slip.month_name}_${slip.year}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      throw new Error('API download failed');
    } catch (err) {
      // Local fallback using exportToPDF
      const mockSlipDetails = [];
      exportToPDF(
        `IRIS 365 Monthly Payslip - ${slip.month_name} ${slip.year}`,
        mockSlipDetails,
        `Payslip_${slip.month_name}_${slip.year}`,
        ["Earnings/Deductions Parameter", "Amount/Details"],
        ["label", "value"]
      );
    }
  };

  const exportHistoryCSV = () => {
    const headers = ["Month", "Year", "Gross Earnings", "Total Deductions", "Net Salary"];
    const data = payslips.map(s => ({
      month: s.month_name,
      year: s.year,
      gross: `₹${s.gross_earnings.toLocaleString('en-IN')}`,
      deductions: `₹${s.total_deductions.toLocaleString('en-IN')}`,
      net: `₹${s.net_salary.toLocaleString('en-IN')}`
    }));
    exportToCSV(data, 'payslips_history', headers, ["month", "year", "gross", "deductions", "net"]);
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link href="/hr/my/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Financial Ledger</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Payslips Archives</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Access and download monthly salary disbursement payslips and statutory Form 16 certificates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading financial archives...</p>
        </div>
      ) : (
        <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl overflow-hidden bg-[#13102A]/40">
          <div className="p-6 border-b border-white/5 flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-extrabold text-sm text-white">Monthly Payslips</h3>
            <div className="flex gap-2">
              <button
                onClick={exportHistoryCSV}
                className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#C4B5FD] font-bold hover:bg-white/10 transition-all"
              >
                Export History (CSV)
              </button>
              <button
                onClick={() => window.open('/api/v1/hr/payroll/reports/form16/d0000000-0000-0000-0000-000000000003', '_blank')}
                className="px-3.5 py-2 rounded-xl bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/45 border border-[#6C2BD9]/40 text-xs text-[#A78BFA] font-bold hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Download Form 16 (FY26)
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD] text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Month / Year</th>
                  <th className="py-4 px-6">Gross Earnings</th>
                  <th className="py-4 px-6">Total Deductions</th>
                  <th className="py-4 px-6">Net take-home</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(slip => (
                  <tr key={slip.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs text-white">
                    <td className="py-4 px-6 font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#8B5CF6]" />
                      <span>{slip.month_name} {slip.year}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#C4B5FD]/90">₹{slip.gross_earnings.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 font-semibold text-red-400">₹{slip.total_deductions.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 font-extrabold text-emerald-400">₹{slip.net_salary.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDownload(slip)}
                        className="px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/45 border border-[#6C2BD9]/40 text-[#A78BFA] text-[10px] font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Payslip PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
