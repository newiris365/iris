"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar, User, ExternalLink, ArrowLeft,
  CheckCircle, AlertCircle, RefreshCw, Clock
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface InterviewSlot {
  id: string;
  round_number: number;
  round_type: string;
  scheduled_at: string;
  venue?: string;
  meeting_link?: string;
  interviewer_name?: string;
  result?: string;
  drive_applications: {
    students: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function CompanyHRInterviewSchedule() {
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadInterviewSlots();
  }, []);

  const loadInterviewSlots = async () => {
    try {
      const res = await apiGet('/placements/rounds/drive/d0000000-0000-0000-0000-000000000001');
      if (res.success && res.rounds) {
        setSlots(res.rounds);
      }
    } catch (err) {
      console.log('Error loading scheduled slots');
    }

    // fallback mock if empty
    if (slots.length === 0) {
      setSlots([
        {
          id: 'round-1',
          round_number: 1,
          round_type: 'technical',
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          venue: 'Virtual',
          meeting_link: 'https://meet.google.com',
          interviewer_name: 'Rajesh Kumar',
          drive_applications: {
            students: {
              first_name: 'Khushal',
              last_name: 'Sharma'
            }
          }
        }
      ]);
    }
    setLoading(false);
  };

  const handleRecordResult = async (id: string, result: 'pass' | 'fail') => {
    setUpdatingId(id);
    try {
      const res = await apiPut(`/placements/rounds/${id}/result`, {
        result,
        score: 90,
        feedback: 'Recruiter review: Excellent logic mapping.'
      });
      if (res.success) {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, result } : s));
        alert('Interview round result updated successfully.');
      }
    } catch (err) {
      console.log('Error recording round score');
    }
    setUpdatingId(null);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-[#A78BFA]" />
          <div>
            <h1 className="font-extrabold text-2xl text-white">Interview Schedules</h1>
            <p className="text-xs text-[#C4B5FD]/70">Access scheduled technical rounds, coding screens, and complete interview metrics.</p>
          </div>
        </div>

        {/* Schedule list */}
        <div className="bg-[#13102A]/85 border border-[#6C2BD9]/20 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#C4B5FD]/40">Loading interview timelines...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D0A1A]/80 border-b border-white/5 text-[#C4B5FD]/50 font-bold uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Round</th>
                    <th className="p-4">Interviewer</th>
                    <th className="p-4">Schedule Details</th>
                    <th className="p-4">Result</th>
                    <th className="p-4 text-right">Lock Result</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => (
                    <tr key={slot.id} className="border-b border-white/5 hover:bg-[#0D0A1A]/35 transition-colors">
                      <td className="p-4 font-bold text-white">
                        {slot.drive_applications?.students?.first_name} {slot.drive_applications?.students?.last_name}
                      </td>
                      <td className="p-4 font-semibold text-white flex flex-col gap-0.5">
                        <span>Round {slot.round_number}</span>
                        <span className="text-[9px] text-[#A78BFA] uppercase">{slot.round_type}</span>
                      </td>
                      <td className="p-4 text-[#C4B5FD]/70">{slot.interviewer_name}</td>
                      <td className="p-4 flex flex-col gap-0.5">
                        <span>{new Date(slot.scheduled_at).toLocaleString()}</span>
                        {slot.meeting_link && (
                          <a href={slot.meeting_link} target="_blank" rel="noreferrer" className="text-[9px] text-[#A78BFA] flex items-center gap-0.5">
                            Meeting Link <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                          slot.result === 'pass'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : slot.result === 'fail'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {slot.result || 'scheduled'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!slot.result ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              disabled={updatingId === slot.id}
                              onClick={() => handleRecordResult(slot.id, 'fail')}
                              className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-[9px] font-bold text-red-400 hover:bg-red-500/20"
                            >
                              Fail
                            </button>
                            <button
                              disabled={updatingId === slot.id}
                              onClick={() => handleRecordResult(slot.id, 'pass')}
                              className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              Pass
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/30">Locked</span>
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
    </main>
  );
}
