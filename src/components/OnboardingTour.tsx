"use client";

import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, X, Sparkles } from 'lucide-react';

interface TourStep {
  title: string;
  text: string;
  selector?: string;
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  Admin: [
    { title: "Welcome to Admin Console", text: "This is your campus operations command center. You can manage student records, admissions, rosters, fees, and more." },
    { title: "Smart Global Search (Ctrl + K)", text: "Instantly lookup student profiles, library records, notices, or placement rounds using the new search box.", selector: "#global-search-input" },
    { title: "Unified Notification Inbox", text: "Receive real-time system alerts, mess announcements, and escalation logs gathered in one dropdown.", selector: "#notification-bell" }
  ],
  Student: [
    { title: "Welcome to Student Hub", text: "Access your grades, academic health status, fees, and smart features here." },
    { title: "Smart Global Search", text: "Quickly locate course books, notices, or events using the new global search input.", selector: "#global-search-input" },
    { title: "AI Study Planner", text: "Generate a personalized study calendar based on your exam dates and weak areas.", selector: "#ai-study-planner-widget" },
    { title: "Unified Notifications Bell", text: "Stay updated on mess notices, class schedule shifts, fees due dates, and AI nudges.", selector: "#notification-bell" }
  ],
  Teacher: [
    { title: "Welcome to Teacher Portal", text: "Mark attendance, configure session QR codes, and review outcome-based maps." },
    { title: "Smart Global Search", text: "Use global search to find students, books, or notices instantly.", selector: "#global-search-input" },
    { title: "Unified Inbox", text: "Keep track of notifications, administrative alerts, and department changes.", selector: "#notification-bell" }
  ],
  Director: [
    { title: "Welcome, Director", text: "Access high-level institutional analytics, financial ledgers, and NAAC scorecards." },
    { title: "AI Campus Vibe Tracker", text: "Monitor student sentiment analysis of campus queries and unresolved issues.", selector: "#ai-sentiment-widget" },
    { title: "Smart Global Search", text: "Locate specific student records, books, or event logs with one click.", selector: "#global-search-input" }
  ],
  default: [
    { title: "Welcome to IRIS 365", text: "Explore class timetables, notice boards, and campus services." },
    { title: "Global Search (Ctrl + K)", text: "Type keywords to instantly search the campus catalog and directory.", selector: "#global-search-input" },
    { title: "Unified Notifications Bell", text: "Click the bell to see personal alerts, mess updates, and admin notices.", selector: "#notification-bell" }
  ]
};

interface OnboardingTourProps {
  role: string;
  portalName: string;
}

export default function OnboardingTour({ role, portalName }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const storageKey = `iris_onboarded_${(role || 'default').toLowerCase()}_${portalName.toLowerCase().replace(/\s+/g, '_')}`;

  const steps = TOUR_STEPS[role] || TOUR_STEPS.default;
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    // Check if user has already seen this tour
    const onboarded = localStorage.getItem(storageKey);
    if (!onboarded) {
      setIsOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen || !currentStep?.selector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(currentStep.selector!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    // Re-check layout on window resize
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, currentStepIndex, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  const restartTour = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    // Show a tiny "Help Tour" button in the corner to allow manually re-triggering the tour
    return (
      <button
        onClick={restartTour}
        className="fixed bottom-6 right-6 p-2.5 rounded-full bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white border border-[#8B5CF6]/30 shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-1.5 text-xs font-bold"
        title="Restart onboarding tour"
      >
        <HelpCircle className="w-4.5 h-4.5" />
        <span className="hidden sm:inline">Portal Guide</span>
      </button>
    );
  }

  // Position styles
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
  };

  if (targetRect) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
      tooltipStyle = {
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        zIndex: 9999,
      };
    } else {
      // Calculate top/left to display tooltip relative to targeted element
      tooltipStyle = {
        position: 'absolute',
        top: `${targetRect.bottom + window.scrollY + 12}px`,
        left: `${Math.max(16, Math.min(window.innerWidth - 340, targetRect.left + window.scrollX - 40))}px`,
        zIndex: 9999,
      };
    }
  }

  return (
    <>
      {/* Target Element Highlight overlay */}
      {targetRect && (
        <div
          className="fixed pointer-events-none border-2 border-[#A78BFA] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300 z-[9998]"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        className="w-80 bg-[#13102A]/95 border border-[#8B5CF6]/40 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-3.5 animate-fadeIn"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#A78BFA] font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Guide Step {currentStepIndex + 1} of {steps.length}</span>
          </div>
          <button
            onClick={handleComplete}
            className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-white">{currentStep.title}</h4>
          <p className="text-xs text-[#C4B5FD]/75 mt-1.5 leading-relaxed">{currentStep.text}</p>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-1.5">
          <button
            onClick={handleComplete}
            className="text-[10px] font-bold text-white/50 hover:text-white transition-colors"
          >
            Skip Guide
          </button>

          <button
            onClick={handleNext}
            className="px-3.5 py-1.5 rounded-lg bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-[10px] flex items-center gap-1 hover:shadow-lg transition-all"
          >
            <span>{currentStepIndex === steps.length - 1 ? 'Got it!' : 'Next'}</span>
            {currentStepIndex < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </>
  );
}
