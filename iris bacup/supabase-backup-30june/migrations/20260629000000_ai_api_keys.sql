-- Add AI API key columns to institutions table
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS claude_api_key TEXT;
