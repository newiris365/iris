"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, X, Send, ThumbsUp, ThumbsDown, 
  Sparkles, RefreshCw, MessageSquareCode, Clock, Check
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  rating?: 'up' | 'down';
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>('student');
  const [sessionId, setSessionId] = useState<string>('');
  const [charCount, setCharCount] = useState(0);
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getWelcomeMessage = (roleName: string) => {
    const r = roleName.toLowerCase();
    switch (r) {
      case 'superadmin':
        return "Welcome, SuperAdmin. I can provide institution-wide stats including total students, revenue, and campus summaries. How can I help you manage the network today?";
      case 'admin':
        return "Welcome, Campus Administrator. I can provide campus-level statistics: student count, staff summaries, overall attendance rate, and fee collection. What would you like to review?";
      case 'student':
        return "Hi! I am IRIS, your AI campus concierge. Ask me about your attendance, outstanding fees, today's timetable, or registered courses.";
      case 'hod':
        return "Welcome, Head of Department. I can assist you with department-level student statistics, attendance rates, and faculty records. How can I support your department today?";
      case 'teacher':
        return "Welcome! I can help you with class-level inquiries: your teaching schedule, student attendance, or lecture timings.";
      case 'warden':
      case 'hostelwarden':
        return "Welcome, Warden. I can provide hostel room occupancy rates, current mess notices, or pending maintenance complaints. How can I help manage the hostel today?";
      case 'security':
      case 'gatesecurity':
        return "Welcome, Security Desk. I can show today's gate visitor logs, RFID entry/exit scans, or trigger gate access alerts.";
      case 'librarian':
        return "Welcome, Librarian. I can provide book inventory details, overdue/pending returns, and library operations status. How can I assist you?";
      case 'parent':
        return "Hello! I can provide child-level details: child's attendance rate, pending fees, and school transport/bus location. How can I help you today?";
      case 'driver':
        return "Welcome. I can provide transit details: your assigned route today, bus schedule, and passenger boardings.";
      case 'vendor':
      case 'canteenvendor':
        return "Welcome to the Canteen Console. I can show today's orders count, active menu items, or current queue status.";
      case 'staff':
        return "Welcome! I can provide general staff updates: recent announcements, your assigned tasks, and office hours.";
      default:
        return "Hi! I am IRIS, your AI campus concierge. How can I assist you with your campus queries today?";
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('iris_jwt_token');
    setIsAuthenticated(!!token);
  }, [pathname]);

  useEffect(() => {
    // Load or generate session_id
    let savedSession = localStorage.getItem('iris_ai_session_id');
    if (!savedSession) {
      savedSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('iris_ai_session_id', savedSession);
    }
    setSessionId(savedSession);

    // Detect user role from local storage profile
    const profileStr = localStorage.getItem('iris_user_profile');
    if (profileStr) {
      try {
        const prof = JSON.parse(profileStr);
        if (prof.role) {
          setRole(prof.role.toLowerCase());
        }
      } catch {}
    }

    // Load conversation history from backend
    if (savedSession && isAuthenticated) {
      loadHistory(savedSession);
    }
  }, [role, isAuthenticated]); // Reload if role or authentication status updates

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadHistory = async (sessId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
    const isMockToken = token && token.startsWith('mock-sandbox-jwt-token-value');
    
    // In local dev with mock tokens or when no token at all, skip the API call
    if (!token || isMockToken) {
      setMessages([
        {
          role: 'assistant',
          content: getWelcomeMessage(role),
          timestamp: new Date().toISOString()
        }
      ]);
      return;
    }

    try {
      const res = await apiGet(`/ai/chat/history/${sessId}`);
      if (res.success && res.conversation?.messages?.length > 0) {
        const msgs = res.conversation.messages.map((m: any, idx: number) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(Date.now() - (res.conversation.messages.length - idx) * 60000).toISOString()
        }));
        setMessages(msgs);
      } else {
        // No previous history — show welcome message
        setMessages([
          {
            role: 'assistant',
            content: getWelcomeMessage(role),
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch {
      setMessages([
        {
          role: 'assistant',
          content: getWelcomeMessage(role),
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || text.length > 500 || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setCharCount(0);
    setLoading(true);

    try {
      console.log('[AIChatWidget] Sending request to /ai/chat:', { message: text, session_id: sessionId });
      const res = await apiPost('/ai/chat', {
        message: text,
        session_id: sessionId
      });
      console.log('[AIChatWidget] Received response from /ai/chat:', res);

      if (res.success && res.response) {
        const assistantMsg: Message = {
          id: res.message_id,
          role: 'assistant',
          content: res.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Show error feedback when API returns failure
        const errorText = res.error || "I'm unable to process your request right now. Please try again.";
        const assistantMsg: Message = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errorText}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch {
      // Fallback when API is unreachable
      const responseText = "I'm unable to connect to the IRIS server right now. Please try again in a moment, or ask your administrator to check the AI configuration in Admin > AI Settings.";
      
      const assistantMsg: Message = {
        id: `msg_mock_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    }
    setLoading(false);
  };

  const handleRating = async (idx: number, ratingType: 'up' | 'down') => {
    const msg = messages[idx];
    if (!msg.id) return;

    try {
      const ratingVal = ratingType === 'up' ? 5 : 1;
      await apiPost(`/ai/chat/${msg.id}/feedback`, {
        rating: ratingVal,
        flagged: ratingType === 'down'
      });
      
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, rating: ratingType } : m));
    } catch {
      // Sandbox fallback rating UI
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, rating: ratingType } : m));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= 550) {
      setInputMsg(text);
      setCharCount(text.length);
    }
  };

  // Basic Markdown renderer
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      // 1. Table Row Matcher
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '');
        return (
          <div key={lIdx} className="flex border-b border-white/5 py-1 text-[11px] font-mono justify-between text-white/80">
            {cells.map((c, cIdx) => (
              <span key={cIdx} className="px-1.5">{c.trim()}</span>
            ))}
          </div>
        );
      }
      
      // 2. Bold text matcher **bold**
      let renderedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      parts.push(line.substring(lastIndex));

      const finalLineElement = parts.length > 1 ? parts : renderedLine;

      // 3. Bullets matcher
      if (line.startsWith('* ') || line.startsWith('• ')) {
        return (
          <li key={lIdx} className="list-disc list-inside text-xs text-[#C4B5FD]/90 pl-1 mt-1 leading-relaxed">
            {line.substring(2)}
          </li>
        );
      }

      // 4. Link matcher (e.g. /fees, /transit)
      const linkRegex = /(\/student\/\S+|\/fees|\/transit|\/library\/\S+|\/ai\/\S+)/g;
      if (linkRegex.test(line)) {
        const lineParts = line.split(linkRegex);
        return (
          <p key={lIdx} className="text-xs leading-relaxed mt-1 text-white/85">
            {lineParts.map((p, pIdx) => {
              if (linkRegex.test(p)) {
                return (
                  <Link key={pIdx} href={p} className="text-[#A78BFA] font-bold underline hover:text-white transition-all inline-flex items-center gap-0.5">
                    {p}
                  </Link>
                );
              }
              return p;
            })}
          </p>
        );
      }

      return (
        <p key={lIdx} className="text-xs leading-relaxed mt-1 text-white/85">
          {finalLineElement}
        </p>
      );
    });
  };

  const getQuickChips = () => {
    const r = role.toLowerCase();
    switch (r) {
      case 'superadmin':
        return ["Total students", "Total revenue", "Campus count", "System health"];
      case 'admin':
        return ["Total students", "Staff count", "Attendance rate", "Fee collection"];
      case 'student':
        return ["My attendance?", "Fee status", "Today's timetable", "Canteen menu", "Next exam?"];
      case 'hod':
        return ["Dept students", "Dept attendance", "Faculty list", "Dept notices"];
      case 'teacher':
        return ["My classes today", "My schedule", "Student attendance", "Room locations"];
      case 'warden':
      case 'hostelwarden':
        return ["Room occupancy", "Mess notices", "Pending complaints", "Hostel roster"];
      case 'security':
      case 'gatesecurity':
        return ["Today's visitor logs", "RFID scans today", "Gate alerts", "Incident log"];
      case 'librarian':
        return ["Book inventory", "Pending returns", "Library hours", "New arrivals"];
      case 'parent':
        return ["My child's attendance", "Child's fees", "Bus location", "PTM bookings"];
      case 'driver':
        return ["Today's route", "Bus schedule", "Passenger count", "Route status"];
      case 'vendor':
      case 'canteenvendor':
        return ["Today's orders", "Canteen menu", "Queue status", "Wallet status"];
      case 'staff':
        return ["Announcements", "My tasks", "Office hours", "Submit leave"];
      default:
        return ["My attendance?", "Fee status", "Today's timetable", "Canteen menu", "Next exam?"];
    }
  };

  if (!mounted || pathname === '/login' || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING CHAT BUBBLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-violet-500/20 hover:scale-105 transition-all z-50 border border-white/10"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <BrainCircuit className="w-6 h-6 animate-pulse" />
        )}
      </button>

      {/* 2. CHAT DRAWER PANEL */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] md:w-[400px] h-[520px] bg-[#0D0A1A]/95 border border-[#8B5CF6]/20 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/5 bg-[#13102A]/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#6C2BD9]/25 border border-[#8B5CF6]/30">
                <BrainCircuit className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">IRIS Concierge</h3>
                <span className="text-[9px] text-[#C4B5FD]/70 flex items-center gap-1 font-mono">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Claude-4 Intel Active
                </span>
              </div>
            </div>
            <button 
              onClick={() => setMessages([{ role: 'assistant', content: 'Conversation reset. How can I help you?', timestamp: new Date().toISOString() }])}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body (Messages view) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[340px]">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                } space-y-1`}
              >
                <div 
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs border ${
                    msg.role === 'user'
                      ? 'bg-[#6C2BD9]/15 border-[#8B5CF6]/25 text-white rounded-br-none'
                      : 'bg-black/35 border-white/5 text-white/95 rounded-bl-none'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>

                <div className="flex items-center gap-2 px-1 text-[9px] text-white/30 font-mono">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'assistant' && idx > 0 && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleRating(idx, 'up')}
                        className={`hover:text-emerald-400 transition-all ${msg.rating === 'up' ? 'text-emerald-400' : ''}`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleRating(idx, 'down')}
                        className={`hover:text-red-400 transition-all ${msg.rating === 'down' ? 'text-red-400' : ''}`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start space-y-1">
                <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 rounded-bl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Drawer Footer input control */}
          <div className="p-4 border-t border-white/5 bg-[#13102A]/30 space-y-3">
            {/* Quick chips options */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none scroll-smooth">
              {getQuickChips().map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] text-[#C4B5FD] font-semibold whitespace-nowrap transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMsg); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="Ask IRIS anything..."
                value={inputMsg}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-xs text-white placeholder-white/20 focus:border-[#8B5CF6]/50 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || charCount > 500}
                className="absolute right-2.5 p-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] disabled:bg-[#6C2BD9]/30 text-white transition-all shadow"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex justify-between items-center text-[9px] text-white/35 font-mono px-1">
              <span>IRIS 365 Concierge Assistant</span>
              <span className={charCount > 500 ? 'text-red-400 font-bold' : ''}>
                {charCount}/500 chars
              </span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
