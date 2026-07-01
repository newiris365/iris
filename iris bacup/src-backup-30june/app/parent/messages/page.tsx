"use client";

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Clock, User, AlertCircle, RefreshCw, ChevronRight, Check
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

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

export default function ParentMessagesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: 't-1', name: 'Dr. Aditya Kumar', subject: 'Compiler Design' },
    { id: 't-2', name: 'Prof. Sarah Vance', subject: 'Database Systems' },
    { id: 't-3', name: 'Dr. Vivek Sharma', subject: 'Artificial Intelligence' }
  ]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t-1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [selectedTeacherId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch(`/api/v1/parent/messages/${selectedTeacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
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
          teacher_id: selectedTeacherId,
          message: inputText
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: data.message.id,
          sender_role: 'Parent',
          sender_id: 'parent_id',
          receiver_id: selectedTeacherId,
          message: inputText,
          created_at: new Date().toISOString()
        }]);
        setInputText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId);

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#A78BFA]" />
            Teacher Query Portal
          </h1>
          <p className="text-[#A78BFA]/70 mt-1">
            Send messages directly to class faculties. Responses are guaranteed within 48 business hours.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 px-3.5 py-2 rounded-xl text-xs text-[#A78BFA]">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Active 48h Response SLA Guarantee</span>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[560px]">
        {/* Left Column: Teacher List */}
        <div className="bg-[#13102A]/80 backdrop-blur-md p-4 rounded-2xl border border-[#6C2BD9]/30 flex flex-col h-full">
          <h2 className="text-sm font-semibold text-[#A78BFA]/70 uppercase tracking-wider mb-4 px-2">
            Select Course Faculty
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {teachers.map(teacher => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacherId(teacher.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTeacherId === teacher.id 
                    ? 'bg-[#6C2BD9]/20 border-[#8B5CF6]' 
                    : 'bg-[#0D0A1A]/40 border-[#6C2BD9]/10 hover:bg-[#6C2BD9]/5'
                }`}
              >
                <div className="font-bold text-sm flex justify-between items-center">
                  <span>{teacher.name}</span>
                  <ChevronRight className="w-4 h-4 text-[#A78BFA]/50" />
                </div>
                <div className="text-xs text-[#A78BFA]/60 mt-1">{teacher.subject}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className="lg:col-span-2 bg-[#13102A]/80 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/30 flex flex-col h-full overflow-hidden">
          {activeTeacher ? (
            <>
              {/* Active Thread Bar */}
              <div className="bg-[#0D0A1A]/60 px-6 py-4 border-b border-[#6C2BD9]/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6C2BD9]/30 flex items-center justify-center font-bold border border-[#6C2BD9]/50 text-white">
                    {activeTeacher.name[4] || 'F'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{activeTeacher.name}</h3>
                    <span className="text-xs text-[#A78BFA]/60">Subject: {activeTeacher.subject}</span>
                  </div>
                </div>

                <div className="text-xs text-[#A78BFA]/50 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  SLA Active
                </div>
              </div>

              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0D0A1A]/20">
                {loading ? (
                  <div className="text-center text-[#A78BFA]/60 py-12">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C2BD9]" />
                    Loading messages...
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSelf = msg.sender_role === 'Parent';
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
                  placeholder={`Ask ${activeTeacher.name} a question...`}
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
              Select a faculty member to start chat thread.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
