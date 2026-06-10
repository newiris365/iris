"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, ShieldAlert, Sparkles, User, Settings, ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminGymEquipment() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('cardio');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Maintenance Modal state
  const [selectedEquip, setSelectedEquip] = useState<any>(null);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintType, setMaintType] = useState('routine');
  const [performedBy, setPerformedBy] = useState('');
  const [maintCost, setMaintCost] = useState(0);
  const [nextDue, setNextDue] = useState('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/fitzone/gym/equipment');
      if (res.success && res.equipment?.length > 0) {
        setEquipment(res.equipment);
      }
    } catch (err) {
      console.log('Error loading equipment, using mocks');
      setEquipment([
        { id: 'e1', name: 'Commercial Treadmill T90', category: 'cardio', quantity: 4, condition: 'good', last_serviced: '2026-05-10', next_service: '2026-07-10', notes: 'Heavy daily usage' },
        { id: 'e2', name: 'Olympic Barbell & Weights Rack', category: 'strength', quantity: 2, condition: 'excellent', last_serviced: '2026-06-01', next_service: '2026-09-01', notes: 'New plates added recently' },
        { id: 'e3', name: 'Spin Cycle S120', category: 'cardio', quantity: 6, condition: 'maintenance', last_serviced: '2026-02-15', next_service: '2026-06-09', notes: 'Left pedal replacement needed' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await apiPost('/fitzone/gym/equipment', {
        name,
        category,
        quantity,
        condition,
        notes
      });

      if (res.success) {
        setSuccess('Equipment registered successfully!');
        setName('');
        setNotes('');
        loadEquipment();
      } else {
        setError(res.error || 'Failed to register equipment.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  const triggerMaintenance = (equip: any) => {
    setSelectedEquip(equip);
    setNextDue(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setShowMaintModal(true);
  };

  const handleSaveMaintenance = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await apiPost(`/fitzone/gym/equipment/${selectedEquip.id}/maintenance`, {
        maintenance_type: maintType,
        performed_by: performedBy,
        cost: maintCost,
        next_due: nextDue,
        notes: `Logged via Admin: ${maintType} servicing`
      });

      if (res.success) {
        setSuccess('Maintenance details recorded. Equipment status reset to Good.');
        setShowMaintModal(false);
        loadEquipment();
      } else {
        setError(res.error || 'Failed to save maintenance details.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <Link href="/admin/gym" className="flex items-center gap-1.5 text-xs text-[#C4B5FD]/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Equipment Inventory & Servicing</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Track athletic machines, schedule technical services, and manage down-times.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Add Equipment Form */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <form onSubmit={handleCreate} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#A78BFA]" /> Register Equipment
            </h3>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Equipment Name</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Bowflex Dumbbell Set"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
                >
                  <option value="cardio">Cardio Machine</option>
                  <option value="strength">Strength Unit</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Quantity</label>
                <input
                  required
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Notes / Description</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Details of the equipment unit..."
                rows={2}
                className="w-full px-4 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white shadow-lg mt-2"
            >
              Add To Inventory
            </button>
          </form>
        </div>

        {/* Inventory Table List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {success}
            </div>
          )}

          <h3 className="text-sm font-bold text-white mb-2">Registered Units</h3>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/45">Loading inventory list...</div>
            ) : equipment.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/30">No machines configured. Use the form to log.</div>
            ) : (
              equipment.map(e => (
                <div
                  key={e.id}
                  className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#6C2BD9]/20 transition-all"
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 text-[#A78BFA] text-[9px] font-bold uppercase">
                        {e.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        e.condition === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                        e.condition === 'good' ? 'bg-emerald-500/10 text-emerald-300' :
                        e.condition === 'fair' ? 'bg-yellow-500/15 text-yellow-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {e.condition}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1.5">{e.name} <span className="text-xs text-[#C4B5FD]/50 font-normal">(Qty: {e.quantity})</span></h4>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#C4B5FD]/85">
                      <span>Last Serviced: {e.last_serviced || 'N/A'}</span>
                      <span>Next Due: {e.next_service || 'N/A'}</span>
                    </div>

                    {e.notes && <p className="text-[11px] text-[#C4B5FD]/50 mt-1">"{e.notes}"</p>}
                  </div>

                  <div>
                    <button
                      onClick={() => triggerMaintenance(e)}
                      className="px-4 py-2 rounded-xl bg-[#6C2BD9]/15 border border-[#6C2BD9]/30 hover:bg-[#6C2BD9] text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" /> Log Service
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Log Maintenance Details Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] rounded-3xl border border-white/10 p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">Log Maintenance Service</h3>
            <p className="text-xs text-[#C4B5FD]/60">Log standard technical service details for <span className="font-extrabold text-white">{selectedEquip?.name}</span></p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 block mb-1">Service Type</label>
                <select
                  value={maintType}
                  onChange={e => setMaintType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
                >
                  <option value="routine">Routine Calibration</option>
                  <option value="repair">Component Repair</option>
                  <option value="part_replacement">Part Replacement</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 block mb-1">Technician / Vendor Name</label>
                <input
                  required
                  value={performedBy}
                  onChange={e => setPerformedBy(e.target.value)}
                  placeholder="e.g., Acme Tech Fitness Ltd"
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 block mb-1">Service Cost (₹)</label>
                  <input
                    type="number"
                    value={maintCost}
                    onChange={e => setMaintCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 block mb-1">Next Service Date</label>
                  <input
                    type="date"
                    value={nextDue}
                    onChange={e => setNextDue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowMaintModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaintenance}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white shadow-lg"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
