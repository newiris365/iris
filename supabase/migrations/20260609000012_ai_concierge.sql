-- ============================================================
-- MODULE 10: AI Concierge — Schema & Semantic Setup
-- ============================================================

-- Ensure pgvector is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. CREATE ai_conversations TABLE
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('app', 'whatsapp', 'web')),
  session_id TEXT UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE ai_query_logs TABLE
CREATE TABLE IF NOT EXISTS ai_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  channel TEXT,
  query TEXT NOT NULL,
  intent TEXT,
  response TEXT NOT NULL,
  module TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  was_escalated BOOLEAN DEFAULT false,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE faq_knowledge_base TABLE
CREATE TABLE IF NOT EXISTS faq_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  module TEXT,
  embedding vector(1536),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE ai_escalations TABLE
CREATE TABLE IF NOT EXISTS ai_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT,
  reason TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE whatsapp_subscribers TABLE
CREATE TABLE IF NOT EXISTS whatsapp_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false,
  opted_in BOOLEAN DEFAULT true,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, phone)
);

-- 6. CREATE smart_notifications TABLE
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  type TEXT,
  trigger TEXT,
  template_en TEXT,
  template_hi TEXT,
  target_roles TEXT[],
  is_active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE search_index TABLE
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PERFORMANCE INDEXES & VECTOR OPERATIONS INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_conv_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_conv ON ai_query_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_faq_kb_inst ON faq_knowledge_base(institution_id);
CREATE INDEX IF NOT EXISTS idx_ai_escalations_user ON ai_escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_subs_phone ON whatsapp_subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_search_index_inst ON search_index(institution_id);

-- Cosine Distance Vector Indexes for Fast Retrieval
CREATE INDEX IF NOT EXISTS idx_faq_embedding ON faq_knowledge_base USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_search_index_embedding ON search_index USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation_ai_conversations" ON ai_conversations
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_ai_query_logs" ON ai_query_logs
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_faq_kb" ON faq_knowledge_base
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_ai_escalations" ON ai_escalations
  USING (user_id IN (SELECT id FROM users WHERE institution_id = get_auth_institution_id()));

CREATE POLICY "tenant_isolation_whatsapp_subs" ON whatsapp_subscribers
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_smart_notifs" ON smart_notifications
  USING (institution_id = get_auth_institution_id());

CREATE POLICY "tenant_isolation_search_index" ON search_index
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- pgvector RPC VECTOR SEARCH HELPER FUNCTIONS
-- ============================================================

-- A. Cosine Similarity FAQ Match RPC
CREATE OR REPLACE FUNCTION match_faq (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  inst_id uuid
)
RETURNS TABLE (
  id uuid,
  category text,
  question text,
  answer text,
  module text,
  usage_count integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faq_knowledge_base.id,
    faq_knowledge_base.category,
    faq_knowledge_base.question,
    faq_knowledge_base.answer,
    faq_knowledge_base.module,
    faq_knowledge_base.usage_count,
    1 - (faq_knowledge_base.embedding <=> query_embedding) AS similarity
  FROM faq_knowledge_base
  WHERE faq_knowledge_base.institution_id = inst_id 
    AND faq_knowledge_base.is_active = true
    AND faq_knowledge_base.embedding IS NOT NULL
    AND 1 - (faq_knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY faq_knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- B. Cosine Similarity Global Search Index Match RPC
CREATE OR REPLACE FUNCTION match_search_index (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  inst_id uuid
)
RETURNS TABLE (
  id uuid,
  entity_type text,
  entity_id uuid,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    search_index.id,
    search_index.entity_type,
    search_index.entity_id,
    search_index.title,
    search_index.content,
    search_index.metadata,
    1 - (search_index.embedding <=> query_embedding) AS similarity
  FROM search_index
  WHERE search_index.institution_id = inst_id 
    AND search_index.embedding IS NOT NULL
    AND 1 - (search_index.embedding <=> query_embedding) > match_threshold
  ORDER BY search_index.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- PRE-SEED FAQ KNOWLEDGE BASE SAMPLE DATA
-- ============================================================
INSERT INTO faq_knowledge_base (institution_id, category, question, answer, module, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'General', 'What is IRIS 365?', 'IRIS 365 is our campus operating system that unifies hostel, library, gym, transit, and canteen facilities.', 'Core', true),
  ('a0000000-0000-0000-0000-000000000001', 'Finance', 'How do I pay my semester fees?', 'Navigate to the billing console (/student/fees) or click the "Pay Now" link in your AI chats to pay securely via Razorpay.', 'Finance', true),
  ('a0000000-0000-0000-0000-000000000001', 'Library', 'What are the library overdue charges?', 'Overdue library books carry a fine of ₹10 per day, which accumulates under your unpaid fines registry.', 'Library', true),
  ('a0000000-0000-0000-0000-000000000001', 'Transit', 'How can I track my bus location?', 'Go to the transit page (/transit) and click "Track Bus" on your active pass to view real-time GPS coordinates.', 'Transit', true);
