"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, User, ExternalLink, Plus,
  CheckCircle, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../../lib/api';

interface Round {
  id: string;
  application_id: string;
  round_number: number;
  round_type: string;
  scheduled_at: string;
  venue?: string;
  meeting_link?: string;
  interviewer_name?: string;
  result?: string;
  status: string;
  drive_applications: {
    students: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function TpoDriveRoundOperations() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;

  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form Fields
  const [applicationId, setApplicationId] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundType, setRoundType] = useState<'aptitude' | 'coding' | 'technical' | 'hr' | 'gd' | 'case_study' | 'final'>('technical');
  const [scheduledAt, setScheduledAt] = useState('');
  const [venue, setVenue] = useState('Virtual');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [duration, setDuration] = useState(45);

  const [saving, setSaving] = useState(false);
  const [activeDrives, setActiveDrives] = useState<any[]>([]);

  useEffect(() => {
    loadRoundsAndApplicants();
  }, [driveId]);

  const loadRoundsAndApplicants = async () => {
    try {
      const res = await apiGet(`/placements/rounds/drive/${driveId}`);
      if (res.success && res.rounds) {
        setRounds(res.rounds);
      }

      // Fetch drive for applications
      const driveRes = await apiGet(`/placements/drives/${driveId}`);
      if (driveRes.success && driveRes.drive) {
        setActiveDrives(driveRes.drive.drive_applications || []);
        if (driveRes.drive.drive_applications?.length > 0) {
          setApplicationId(driveRes.drive.drive_applications[0].id);
        }
      }
    } catch (err) {
      console.log('Error loading rounds data');
    }

    // fallback mock if empty
    if (rounds.length === 0) {
      setRounds([]);
    }
    setLoading(false);
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        application_id: applicationId,
        drive_id: driveId,
        student_id: activeDrives.find(d => d.id === applicationId)?.student_id || '',
        round_number: roundNumber,
        round_type: roundType,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        venue,
        meeting_link: meetingLink,
        interviewer_name: interviewerName,
        interviewer_email: interviewerEmail,
        duration_minutes: duration
      };

      const res = await apiPost('/placements/rounds', payload);
      if (res.success && res.round) {
        alert('Interview round successfully scheduled!');
        setShowForm(false);
        loadRoundsAndApplicants();
      }
    } catch (err) {
      console.log('Error scheduling round');
    }
    setSaving(false);
  };

  const handleResultUpdate = async (roundId: string, result: 'pass' | 'fail' | 'hold' | 'no_show') => {
    try {
      const res = await apiPut(`/placements/rounds/${roundId}/result`, {
        result,
        score: 85,
        feedback: 'Candidate cleared tech questions successfully.'
      });
      if (res.success) {
        setRounds(prev => prev.map(r => r.id === roundId ? { ...r, result, status: 'completed' } : r));
        alert('Result recorded. Candidate round status advanced automatically.');
      }
    } catch (err) {
      console.log('Error updating results');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href={`/tpo/drives/${driveId}`} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="font-extrabold text-2xl text-white">Interview Rounds desk</h1>
              <p className="text-xs text-[#C4B5FD]/70">Coordinate technical rounds, assign interviewers, and lock results progression.</p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Schedule Interview
            </button>
          )}
        </div>

        {showForm ? (
          /* Form scheduling */
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20">
            <h2 className="text-sm font-bold text-white mb-4">Schedule Interview</h2>
            
            <form onSubmit={handleCreateRound} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Select Candidate</label>
                  <select
                    value={applicationId}
                    onChange={e => setApplicationId(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  >
                    {activeDrives.map(d => (
                      <option key={d.id} value={d.id}>{d.students?.first_name} {d.students?.last_name} ({d.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Round Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roundNumber}
                    onChange={e => setRoundNumber(parseInt(e.target.value))}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Round Type</label>
                  <select
                    value={roundType}
                    onChange={e => setRoundType(e.target.value as any)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="technical">Technical Round</option>
                    <option value="coding">Coding Assessment</option>
                    <option value="aptitude">Aptitude Test</option>
                    <option value="hr">HR Round</option>
                    <option value="gd">Group Discussion</option>
                    <option value="final">Final Interview</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Venue (or Virtual)</label>
                  <input
                    required
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Interviewer Name</label>
                  <input
                    required
                    value={interviewerName}
                    onChange={e => setInterviewerName(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold shadow-lg shadow-[#6C2BD9]/20"
                >
                  {saving ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* scheduled interviews lists */
          <div className="bg-[#13102A]/85 border border-[#6C2BD9]/20 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-xs text-[#C4B5FD]/40">Loading interview rounds...</div>
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
                      <th className="p-4 text-right">Progress Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map(round => (
                      <tr key={round.id} className="border-b border-white/5 hover:bg-[#0D0A1A]/35 transition-colors">
                        <td className="p-4 font-bold text-white">
                          {round.drive_applications?.students?.first_name} {round.drive_applications?.students?.last_name}
                        </td>
                        <td className="p-4 font-semibold text-white flex flex-col gap-0.5">
                          <span>Round {round.round_number}</span>
                          <span className="text-[9px] text-[#A78BFA] uppercase">{round.round_type}</span>
                        </td>
                        <td className="p-4 text-[#C4B5FD]/70">{round.interviewer_name || 'N/A'}</td>
                        <td className="p-4 flex flex-col gap-0.5">
                          <span>{new Date(round.scheduled_at).toLocaleString()}</span>
                          {round.meeting_link && (
                            <a href={round.meeting_link} target="_blank" rel="noreferrer" className="text-[9px] text-[#A78BFA] flex items-center gap-0.5">
                              Meeting URL <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            round.result === 'pass'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : round.result === 'fail'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {round.result || 'pending'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {round.status === 'scheduled' ? (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => handleResultUpdate(round.id, 'fail')}
                                className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-[9px] font-bold text-red-400 hover:bg-red-500/20"
                              >
                                Fail
                              </button>
                              <button
                                onClick={() => handleResultUpdate(round.id, 'pass')}
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
        )}

      </div>
    </main>
  );
}
