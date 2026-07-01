-- =========================================================================
-- DEVICE TOKENS FOR FCM PUSH NOTIFICATIONS
-- =========================================================================

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own device tokens" 
  ON device_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own device tokens" 
  ON device_tokens FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens" 
  ON device_tokens FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens" 
  ON device_tokens FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
