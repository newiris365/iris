"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  source?: string;
  language?: string;
  timestamp: Date;
  isPlaying?: boolean;
}

interface TranscriptEntry {
  id: string;
  transcript: string;
  language: string;
  source: string;
  created_at: string;
}

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState<TranscriptEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const amplitudeInterval = useRef<any>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    fetchVoiceHistory();
    return () => {
      if (amplitudeInterval.current) clearInterval(amplitudeInterval.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchVoiceHistory = async () => {
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'demo';
      const res = await fetch(`${API}/ai/voice/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVoiceHistory(data.transcripts || []);
    } catch {}
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      // Simulate audio amplitude animation
      amplitudeInterval.current = setInterval(() => {
        setAmplitude(Math.random() * 100);
      }, 100);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (amplitudeInterval.current) {
        clearInterval(amplitudeInterval.current);
        amplitudeInterval.current = null;
      }
      setAmplitude(0);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (amplitudeInterval.current) clearInterval(amplitudeInterval.current);
      setAmplitude(0);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const sendVoiceQuery = async (text?: string) => {
    const queryText = text || transcript;
    if (!queryText.trim()) return;

    const userMsg: VoiceMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      text: queryText,
      source: 'web_speech',
      language,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setTranscript('');
    setLoading(true);

    try {
      const token = localStorage.getItem('iris_jwt_token') || 'demo';
      const res = await fetch(`${API}/ai/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transcript: queryText,
          language,
          source: 'web_speech',
          confidence: 0.95
        })
      });

      const data = await res.json();

      const assistantMsg: VoiceMessage = {
        id: `msg_${Date.now()}_resp`,
        type: 'assistant',
        text: data.response || 'Sorry, I could not process your request.',
        language: data.language || language,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Auto-play TTS response
      if (data.tts && synthRef.current) {
        speakText(data.tts.text, data.tts.lang);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        type: 'assistant',
        text: 'Network error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string, lang: string = 'en-US') => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const waveBarCount = 32;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#E0E7FF', margin: 0 }}>
            🎙️ Voice Assistant
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Speak naturally in Hindi or English — IRIS listens and responds
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              background: language === 'hi' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${language === 'hi' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              color: language === 'hi' ? '#F59E0B' : '#10B981',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {language === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(108, 43, 217, 0.2)',
              border: '1px solid rgba(108, 43, 217, 0.4)',
              color: '#C4B5FD',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            📜 History
          </button>
        </div>
      </div>

      {/* Voice History Panel */}
      {showHistory && (
        <div style={{
          background: 'rgba(19, 16, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: '1rem',
          border: '1px solid rgba(108, 43, 217, 0.3)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#C4B5FD', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Recent Voice Transcripts</h3>
          {voiceHistory.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: '0.8rem' }}>No voice history yet.</p>
          ) : voiceHistory.slice(0, 10).map(entry => (
            <div key={entry.id} style={{
              padding: '0.6rem 0.8rem',
              marginBottom: '0.5rem',
              background: 'rgba(108, 43, 217, 0.1)',
              borderRadius: '0.5rem',
              borderLeft: `3px solid ${entry.language === 'hi' ? '#F59E0B' : '#10B981'}`,
              cursor: 'pointer'
            }} onClick={() => sendVoiceQuery(entry.transcript)}>
              <p style={{ color: '#E0E7FF', fontSize: '0.8rem', margin: 0 }}>{entry.transcript}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>{entry.source}</span>
                <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>·</span>
                <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>{entry.language === 'hi' ? 'हिंदी' : 'English'}</span>
                <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>·</span>
                <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>{new Date(entry.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages Area */}
      <div style={{
        background: 'rgba(19, 16, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '1rem',
        border: '1px solid rgba(108, 43, 217, 0.2)',
        padding: '1.25rem',
        minHeight: '400px',
        maxHeight: '500px',
        overflowY: 'auto',
        marginBottom: '1.5rem'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '6rem', color: '#6B7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎤</div>
            <p style={{ fontSize: '0.95rem', color: '#9CA3AF' }}>
              {language === 'hi' ? 'माइक बटन दबाएं और अपना सवाल पूछें' : 'Press the mic button and ask your question'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
              {[
                language === 'hi' ? 'मेरी अटेंडेंस बताओ' : 'What is my attendance?',
                language === 'hi' ? 'फीस कितनी बाकी है?' : 'How much fees pending?',
                language === 'hi' ? 'आज कौन सी क्लास है?' : 'What classes do I have today?'
              ].map((suggestion, i) => (
                <button key={i} onClick={() => sendVoiceQuery(suggestion)} style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '1rem',
                  background: 'rgba(108, 43, 217, 0.15)',
                  border: '1px solid rgba(108, 43, 217, 0.3)',
                  color: '#C4B5FD',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}>{suggestion}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              maxWidth: '75%',
              padding: '0.8rem 1rem',
              borderRadius: msg.type === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
              background: msg.type === 'user'
                ? 'linear-gradient(135deg, rgba(108, 43, 217, 0.4), rgba(139, 92, 246, 0.3))'
                : 'rgba(30, 25, 55, 0.8)',
              border: `1px solid ${msg.type === 'user' ? 'rgba(108, 43, 217, 0.5)' : 'rgba(55, 48, 80, 0.6)'}`,
              color: '#E0E7FF',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                  {msg.type === 'user' ? '🎤 You' : '🤖 IRIS'}
                </span>
                {msg.type === 'assistant' && (
                  <button onClick={() => speakText(msg.text, msg.language === 'hi' ? 'hi-IN' : 'en-US')} style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#C4B5FD'
                  }}>🔊</button>
                )}
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{
              padding: '0.8rem 1rem',
              borderRadius: '1rem 1rem 1rem 0.25rem',
              background: 'rgba(30, 25, 55, 0.8)',
              border: '1px solid rgba(55, 48, 80, 0.6)',
              color: '#C4B5FD',
              fontSize: '0.85rem'
            }}>
              <span className="typing-dots">🤖 IRIS is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input Area */}
      <div style={{
        background: 'rgba(19, 16, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: '1rem',
        border: '1px solid rgba(108, 43, 217, 0.3)',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        {/* Waveform Visualization */}
        {isListening && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2px',
            height: '60px',
            marginBottom: '1rem'
          }}>
            {Array.from({ length: waveBarCount }).map((_, i) => {
              const h = Math.max(4, Math.abs(Math.sin((i + amplitude / 10) * 0.5)) * 50 * (amplitude / 100));
              return (
                <div key={i} style={{
                  width: '3px',
                  height: `${h}px`,
                  borderRadius: '2px',
                  background: `linear-gradient(to top, #6C2BD9, #C4B5FD)`,
                  transition: 'height 0.1s ease'
                }} />
              );
            })}
          </div>
        )}

        {/* Live Transcript Preview */}
        {transcript && (
          <div style={{
            padding: '0.6rem 1rem',
            background: 'rgba(108, 43, 217, 0.1)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#E0E7FF',
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}>
            "{transcript}"
          </div>
        )}

        {/* Mic Button */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={isListening ? stopListening : startListening}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: isListening
                ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                : 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
              border: `3px solid ${isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(108, 43, 217, 0.5)'}`,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening
                ? '0 0 30px rgba(239, 68, 68, 0.4)'
                : '0 0 30px rgba(108, 43, 217, 0.3)',
              transition: 'all 0.3s ease',
              animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>

          {transcript && !isListening && (
            <button
              onClick={() => sendVoiceQuery()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              Send ➤
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🔇 Stop
            </button>
          )}
        </div>

        <p style={{ color: '#6B7280', fontSize: '0.7rem', marginTop: '0.75rem' }}>
          {isListening
            ? (language === 'hi' ? 'सुन रहा है... बोलिए' : 'Listening... speak now')
            : (language === 'hi' ? 'माइक दबाएं' : 'Tap the microphone to start')}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .typing-dots::after {
          content: '';
          animation: dots 1.5s infinite;
        }
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
      ` }} />
    </div>
  );
}
