-- Run this in Supabase SQL Editor to add missing columns to institutions table

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subscription_period VARCHAR(50) DEFAULT 'monthly'
    CHECK (subscription_period IN ('monthly', 'quarterly', 'yearly'));

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS claude_api_key TEXT;

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS institute_type VARCHAR(50) DEFAULT 'college';

UPDATE institutions SET institute_type = 'college' WHERE institute_type IS NULL;
