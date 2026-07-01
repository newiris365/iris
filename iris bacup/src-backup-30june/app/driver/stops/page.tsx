"use client";

import React, { useState, useEffect } from 'react';
import {
  MapPin, CheckCircle2, Clock, Navigation, ChevronRight
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Stop {
  stop_index: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  scheduled_time: string;
  is_reached: boolean;
  reached_at: string;
  passengers_boarded: number;
  passengers_alighted: number;
}

export default function DriverStopsPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boardingCount, setBoardingCount] = useState(0);
  const [alightingCount, setAlightingCount] = useState(0);

  useEffect(() => { loadStops(); }, []);

  const loadStops = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/driver/stops');
      if (res.success) setStops(res.stops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkReached = async (stopIndex: number) => {
    const res = await apiPost('campusCore/driver/stops/reach', {
      stop_index: stopIndex,
      passengers_boarded: boardingCount,
      passengers_alighted: alightingCount,
    });
    if (res.success) {
      loadStops();
      setBoardingCount(0);
      setAlightingCount(0);
    }
  };

  const reachedCount = stops.filter(s => s.is_reached).length;
  const totalBoarded = stops.reduce((acc, s) => acc + (s.passengers_boarded || 0), 0);
  const totalAlighted = stops.reduce((acc, s) => acc + (s.passengers_alighted || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <MapPin size={24} className="text-blue-400" />
        Stop Schedule
      </h1>

      {/* Progress */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-400">Progress</p>
          <p className="text-sm text-white font-medium">{reachedCount}/{stops.length} stops</p>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${stops.length > 0 ? (reachedCount / stops.length) * 100 : 0}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">{totalBoarded}</p>
            <p className="text-xs text-slate-400">Total Boarded</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">{totalAlighted}</p>
            <p className="text-xs text-slate-400">Total Alighted</p>
          </div>
        </div>
      </div>

      {/* Stops List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading stops...</div>
      ) : stops.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-50" />
          <p>No stops found. Start a trip first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stops.map((stop) => (
            <div key={stop.stop_index}
              className={`rounded-xl border p-4 transition-all ${
                stop.is_reached
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    stop.is_reached ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                  }`}>
                    {stop.is_reached ? <CheckCircle2 size={20} /> : stop.stop_index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{stop.stop_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {stop.scheduled_time || '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {stop.is_reached ? (
                    <div>
                      <p className="text-xs text-emerald-400 font-medium">Reached</p>
                      <p className="text-xs text-slate-400">
                        +{stop.passengers_boarded} / -{stop.passengers_alighted}
                      </p>
                    </div>
                  ) : (
                    <button onClick={() => handleMarkReached(stop.stop_index)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 flex items-center gap-1">
                      <Navigation size={14} /> Reach
                    </button>
                  )}
                </div>
              </div>

              {/* Boarding/Alighting inputs for current stop */}
              {!stop.is_reached && stop.stop_index === reachedCount && (
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Boarding</label>
                    <input type="number" value={boardingCount}
                      onChange={e => setBoardingCount(parseInt(e.target.value) || 0)}
                      min="0" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Alighting</label>
                    <input type="number" value={alightingCount}
                      onChange={e => setAlightingCount(parseInt(e.target.value) || 0)}
                      min="0" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm text-center" />
                  </div>
                </div>
              )}

              {/* Connection line */}
              {stop.stop_index < stops.length - 1 && (
                <div className="flex justify-center mt-2">
                  <div className={`w-0.5 h-4 ${stop.is_reached ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
