"use client";

import React, { useState, useEffect } from 'react';
import { CalendarDays, BookOpen, Clock, MapPin } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = ['09:00 - 10:00 AM', '10:15 - 11:15 AM', '11:30 - 12:30 PM', '02:00 - 03:00 PM'];

  useEffect(() => {
    const teacherId = '';
    (teacherId ? apiGet(`/core/timetable/teacher/${teacherId}`) : Promise.resolve({} as any)).then(res => {
      if (res?.success) {
        setTimetable(res.timetable || []);
      }
      setIsLoading(false);
    });
  }, []);

  const getBlock = (day: string, slot: string) => {
    return timetable.find(b => b.day_of_week === day && b.time_slot === slot);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Your Teaching Timetable</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Inspect scheduled lectures, assigned rooms, and weekly assignment slots.</p>
          </div>
        </div>

        {/* Timetable Grid Map */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#C4B5FD]">Loading schedule matrix...</div>
          ) : (
            <div className="min-w-[800px] grid grid-cols-6 gap-4 text-xs">
              
              {/* Grid Header */}
              <div className="p-3 text-transparent">Slot</div>
              {days.map(day => (
                <div key={day} className="p-3 font-heading font-bold text-white text-center border-b border-[#6C2BD9]/30">
                  {day}
                </div>
              ))}

              {/* Grid Rows */}
              {slots.map(slot => (
                <React.Fragment key={slot}>
                  <div className="p-3 font-mono font-bold text-[#C4B5FD] flex items-center">{slot}</div>
                  
                  {days.map(day => {
                    const block = getBlock(day, slot);
                    return (
                      <div key={`${day}-${slot}`} className="p-4 rounded-xl min-h-[100px] border flex flex-col justify-between bg-white/5 border-white/5 hover:border-[#6C2BD9]/30 transition-all">
                        {block ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <h4 className="font-bold text-white flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#A78BFA]" /> {block.subject}</h4>
                              <p className="text-[10px] text-[#C4B5FD]/70 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#C4B5FD]" /> {block.room}</p>
                            </div>
                            <div className="text-[9px] text-[#A78BFA] font-semibold flex items-center gap-1 mt-3">
                              <Clock className="w-3 h-3" /> Lecture Active
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-[#C4B5FD]/10 italic">
                            No Lectures
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
