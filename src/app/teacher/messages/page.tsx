"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Clock, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  sender_role: 'Parent' | 'Teacher';
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sla_deadline?: string;
}

interface Thread {
  id: string;
  parentName: string;
  studentName: string;
  lastMessage: string;
  lastActive: string;
  slaUrgent: boolean;
  slaTimeLeft: string;
}

export default function TeacherMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch('/api/v1/parent/messages/threads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        const liveThreads = data.threads || [];
        setThreads(liveThreads);
        if (liveThreads.length > 0 && !activeThreadId) {
          setActiveThreadId(liveThreads[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch threads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      fetchThreadMessages();
    } else {
      setMessages([]);
    }
  }, [activeThreadId]);

  const fetchThreadMessages = async () => {
    if (!activeThreadId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch(`/api/v1/parent/messages/${activeThreadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeThreadId) return;
    try {
      setSending(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch('/api/v1/parent/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teacher_id: activeThreadId,
          message: inputText
        })
      });
      const data = await res.json();
      if (data.success) {
        const savedProfile = localStorage.getItem('iris_user_profile');
        const selfProfile = savedProfile ? JSON.parse(savedProfile) : null;

        setMessages(prev => [...prev, {
          id: data.message.id,
          sender_role: 'Teacher',
          sender_id: selfProfile?.id || 'teacher_id',
          receiver_id: activeThreadId,
          message: inputText,
          created_at: new Date().toISOString()
        }]);

        // Update thread preview
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              lastMessage: inputText,
              lastActive: new Date().toISOString(),
              slaUrgent: false,
              slaTimeLeft: 'Responded (SLA safe)'
            };
          }
          return t;
        }));
        setInputText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-[#A78BFA]" />
          Parent Communications Center
        </h1>
        <p className="text-[#A78BFA]/70 mt-1">
          Maintain active dialog with parents. Note: School policy mandates response to all parent queries within 48 hours.
        </p>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Column: Threads list */}
        <div className="bg-[#13102A]/80 backdrop-blur-md p-4 rounded-2xl border border-[#6C2BD9]/30 flex flex-col h-full">
          <h2 className="text-sm font-semibold text-[#A78BFA]/70 uppercase tracking-wider mb-4 px-2">
            Active Query Threads
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#A78BFA]/40 text-xs">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <span>No active query threads found.</span>
              </div>
            ) : (
              threads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeThreadId === thread.id 
                      ? 'bg-[#6C2BD9]/20 border-[#8B5CF6]' 
                      : 'bg-[#0D0A1A]/40 border-[#6C2BD9]/10 hover:bg-[#6C2BD9]/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{thread.parentName}</h3>
                      <span className="text-[10px] text-[#A78BFA]/50">Student: {thread.studentName}</span>
                    </div>
                    {thread.slaUrgent ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Urgent SLA
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A78BFA]/85 truncate mb-2">{thread.lastMessage}</p>
                  <div className="flex justify-between items-center text-[10px] text-[#A78BFA]/40">
                    <span>{new Date(thread.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={thread.slaUrgent ? 'text-orange-400 font-semibold' : ''}>{thread.slaTimeLeft}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className="lg:col-span-2 bg-[#13102A]/80 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/30 flex flex-col h-full overflow-hidden">
          {activeThread ? (
            <>
              {/* Active Thread Bar */}
              <div className="bg-[#0D0A1A]/60 px-6 py-4 border-b border-[#6C2BD9]/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6C2BD9]/30 flex items-center justify-center font-bold border border-[#6C2BD9]/50 text-white">
                    {activeThread.parentName ? activeThread.parentName.charAt(0) : 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{activeThread.parentName}</h3>
                    <span className="text-xs text-[#A78BFA]/60">Parent of {activeThread.studentName}</span>
                  </div>
                </div>

                {activeThread.slaUrgent && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-xs text-red-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    SLA Action: 48h Responding Window Ending soon
                  </div>
                )}
              </div>

              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0D0A1A]/20">
                {loading ? (
                  <div className="text-center text-[#A78BFA]/60 py-12">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C2BD9]" />
                    Loading conversation thread...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-[#A78BFA]/40 py-12 text-xs">
                    No messages in this thread yet.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSelf = msg.sender_role === 'Teacher';
                    return (
                      <div 
                        key={msg.id || index}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl p-4 text-sm leading-relaxed border ${
                          isSelf 
                            ? 'bg-[#6C2BD9] border-[#8B5CF6] text-white rounded-tr-none shadow-md shadow-[#6C2BD9]/10' 
                            : 'bg-[#13102A]/90 border-[#6C2BD9]/20 text-[#A78BFA]/90 rounded-tl-none'
                        }`}>
                          <p>{msg.message}</p>
                          <span className="block text-[9px] mt-1 text-white/50 text-right">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply block */}
              <div className="p-4 border-t border-[#6C2BD9]/20 bg-[#0D0A1A]/40 flex gap-3">
                <input
                  type="text"
                  placeholder="Type your reply to parent..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-3 bg-[#0D0A1A]/95 border border-[#6C2BD9]/30 rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !inputText.trim()}
                  className="bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white px-5 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-[#A78BFA]/40 py-12">
              <MessageSquare className="w-12 h-12 mb-3" />
              Select a parent messaging thread to view chat details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
