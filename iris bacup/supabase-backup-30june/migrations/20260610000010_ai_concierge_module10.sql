-- ============================================================
-- MODULE 10 ADDITIONS: AI Concierge Enhanced Intelligence
-- Voice Interface, Proactive Nudges, Study Planner, Sentiment
-- ============================================================

-- 1. CREATE voice_transcripts TABLE
-- Stores speech-to-text transcriptions from Web Speech API,
-- Expo-AV recordings, and WhatsApp voice notes (Whisper)
CREATE TABLE IF NOT EXISTS voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  source TEXT CHECK (source IN ('web_speech', 'expo_av', 'whatsapp_whisper')) DEFAULT 'web_speech',
  duration_seconds INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE proactive_nudges TABLE
-- AI-generated push intelligence notifications for students
CREATE TABLE IF NOT EXISTS proactive_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN (
    'weekly_prep', 'assignment_reminder', 'attendance_warning',
    'fee_reminder', 'event_suggestion', 'library_due',
    'health_tip', 'motivational', 'exam_countdown',
    'streak_celebration', 'custom'
  )),
  message TEXT NOT NULL,
  title TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  channel TEXT DEFAULT 'push' CHECK (channel IN ('push', 'whatsapp', 'email', 'in_app')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  was_read BOOLEAN DEFAULT false,
  was_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE study_plans TABLE
-- AI-generated personalized study schedules per student
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  exam_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  subjects JSONB DEFAULT '[]'::jsonb,
  weak_areas JSONB DEFAULT '[]'::jsonb,
  study_hours_per_day DECIMAL DEFAULT 4.0,
  plan_start_date DATE,
  plan_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
  completion_percentage DECIMAL DEFAULT 0.0,
  generated_at TIMESTAMPTZ DEFAULT now(),
  last_adjusted TIMESTAMPTZ DEFAULT now(),
  claude_reasoning TEXT
);

-- 4. CREATE sentiment_logs TABLE
-- Nightly batch analysis of student messages for mood trends
CREATE TABLE IF NOT EXISTS sentiment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  department TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  avg_sentiment DECIMAL DEFAULT 0.0,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  flagged_keywords TEXT[] DEFAULT '{}'::text[],
  flagged_messages JSONB DEFAULT '[]'::jsonb,
  complaint_categories JSONB DEFAULT '{}'::jsonb,
  auto_routed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, date, department)
);

-- 5. CREATE nudge_preferences TABLE
-- Per-student opt-in settings for proactive nudges
CREATE TABLE IF NOT EXISTS nudge_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  enabled_types TEXT[] DEFAULT ARRAY[
    'weekly_prep', 'assignment_reminder', 'attendance_warning',
    'fee_reminder', 'event_suggestion', 'exam_countdown'
  ],
  preferred_channels TEXT[] DEFAULT ARRAY['push', 'in_app'],
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  max_nudges_per_day INTEGER DEFAULT 5,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_voice_tx_user ON voice_transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_tx_conv ON voice_transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_tx_inst ON voice_transcripts(institution_id);

CREATE INDEX IF NOT EXISTS idx_nudges_student ON proactive_nudges(student_id);
CREATE INDEX IF NOT EXISTS idx_nudges_inst ON proactive_nudges(institution_id);
CREATE INDEX IF NOT EXISTS idx_nudges_type ON proactive_nudges(nudge_type);
CREATE INDEX IF NOT EXISTS idx_nudges_sent ON proactive_nudges(sent_at);

CREATE INDEX IF NOT EXISTS idx_study_plans_student ON study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_status ON study_plans(status);

CREATE INDEX IF NOT EXISTS idx_sentiment_inst_date ON sentiment_logs(institution_id, date);
CREATE INDEX IF NOT EXISTS idx_sentiment_dept ON sentiment_logs(department_id);

CREATE INDEX IF NOT EXISTS idx_nudge_prefs_student ON nudge_preferences(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_preferences ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation_voice_transcripts" ON voice_transcripts
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_proactive_nudges" ON proactive_nudges
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_study_plans" ON study_plans
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_sentiment_logs" ON sentiment_logs
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_nudge_preferences" ON nudge_preferences
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- SEED DATA — PROACTIVE NUDGE SAMPLES
-- ============================================================
INSERT INTO proactive_nudges (student_id, institution_id, nudge_type, title, message, priority, channel, was_read, was_actioned) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'weekly_prep', '📚 Week Ahead Prep',
   'You have 5 classes tomorrow starting with Maths at 9 AM. Your attendance is 84% — keep it up! Don''t forget: Physics assignment due Wednesday.',
   'normal', 'push', false, false),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'attendance_warning', '⚠️ Attendance Alert',
   'Your attendance in Data Structures dropped to 68% — you need 75% to sit for exams. Attend the next 4 classes consecutively to recover.',
   'high', 'push', true, false),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'fee_reminder', '💰 Fee Reminder',
   'Your semester fee installment of ₹12,500 is due in 3 days. Pay now to avoid late charges → /student/fees',
   'urgent', 'whatsapp', false, false),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'exam_countdown', '📝 Exam Countdown',
   'Mid-semester exams begin in 12 days! Your AI Study Plan suggests focusing on Linear Algebra and Thermodynamics this week.',
   'high', 'in_app', true, true),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'streak_celebration', '🔥 7-Day Streak!',
   'Congratulations! You''ve attended every class for 7 consecutive days. Keep the momentum going — you''re in the top 15% of your batch!',
   'low', 'push', true, true),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'library_due', '📖 Library Book Due',
   'Your book "Introduction to Algorithms" (CLRS) is due in 2 days. Return or renew it at /student/library to avoid ₹10/day fines.',
   'normal', 'in_app', false, false);

-- SEED DATA — STUDY PLAN SAMPLE
INSERT INTO study_plans (student_id, institution_id, exam_schedule, daily_plan, subjects, weak_areas, study_hours_per_day, plan_start_date, plan_end_date, status, completion_percentage, claude_reasoning) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   '[{"subject":"Mathematics","date":"2026-06-25","time":"09:00"},{"subject":"Physics","date":"2026-06-27","time":"09:00"},{"subject":"Data Structures","date":"2026-06-30","time":"14:00"},{"subject":"English","date":"2026-07-02","time":"09:00"}]',
   '[{"day":"Monday","blocks":[{"time":"06:00-08:00","subject":"Mathematics","topic":"Linear Algebra - Eigenvalues","type":"focus"},{"time":"09:00-10:30","subject":"Physics","topic":"Thermodynamics revision","type":"review"},{"time":"16:00-17:30","subject":"Data Structures","topic":"Binary Trees Practice","type":"practice"}]},{"day":"Tuesday","blocks":[{"time":"06:00-08:00","subject":"Data Structures","topic":"Graph Algorithms - DFS/BFS","type":"focus"},{"time":"09:00-10:30","subject":"Mathematics","topic":"Calculus - Integration","type":"review"},{"time":"16:00-17:30","subject":"English","topic":"Technical Writing","type":"light"}]},{"day":"Wednesday","blocks":[{"time":"06:00-08:00","subject":"Physics","topic":"Optics & Waves","type":"focus"},{"time":"16:00-18:00","subject":"Mathematics","topic":"Practice Problems Set","type":"practice"}]}]',
   '["Mathematics","Physics","Data Structures","English"]',
   '["Linear Algebra - Eigenvalues","Thermodynamics - Carnot Cycle","Graph Algorithms"]',
   5.0, '2026-06-15', '2026-07-02', 'active', 35.0,
   'Based on exam schedule analysis: Mathematics exam is earliest (June 25), so allocated 40% study time to Math. Physics weak area in Thermodynamics identified from past scores — added extra revision blocks. Data Structures graph algorithms flagged due to low practice test scores. Study blocks scheduled around existing timetable, avoiding class hours. Morning 6-8 AM blocks for deep focus, afternoon for lighter review.');

-- SEED DATA — SENTIMENT LOGS SAMPLES
INSERT INTO sentiment_logs (institution_id, date, department, avg_sentiment, positive_count, neutral_count, negative_count, message_count, flagged_keywords, complaint_categories) VALUES
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Computer Science', 0.72, 45, 30, 12, 87,
   ARRAY['slow wifi', 'lab closed', 'great faculty'],
   '{"infrastructure": 8, "academics": 2, "food": 2}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Mechanical Engineering', 0.58, 22, 18, 20, 60,
   ARRAY['workshop noise', 'placement worry', 'canteen quality'],
   '{"infrastructure": 5, "placements": 10, "food": 5}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Electrical Engineering', 0.81, 38, 20, 5, 63,
   ARRAY['excellent lab', 'helpful TA'],
   '{"academics": 3, "infrastructure": 2}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'Computer Science', 0.68, 40, 28, 18, 86,
   ARRAY['assignment overload', 'good hackathon'],
   '{"academics": 12, "events": 4, "food": 2}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'Mechanical Engineering', 0.55, 18, 22, 25, 65,
   ARRAY['hot workshop', 'placement anxiety', 'water cooler broken'],
   '{"infrastructure": 12, "placements": 8, "food": 5}'::jsonb);

-- SEED DATA — NUDGE PREFERENCES
INSERT INTO nudge_preferences (student_id, institution_id, enabled, enabled_types, preferred_channels, quiet_hours_start, quiet_hours_end, max_nudges_per_day) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   true,
   ARRAY['weekly_prep', 'assignment_reminder', 'attendance_warning', 'fee_reminder', 'exam_countdown', 'streak_celebration'],
   ARRAY['push', 'in_app'],
   '22:00', '07:00', 5);

-- SEED DATA — VOICE TRANSCRIPT SAMPLE
INSERT INTO voice_transcripts (user_id, institution_id, transcript, language, source, duration_seconds, confidence) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Mera attendance kitna hai is semester mein?', 'hi', 'web_speech', 4, 0.92),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'What is my pending fee amount for this semester?', 'en', 'web_speech', 3, 0.97);
