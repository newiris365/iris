-- IRIS 365: WhatsApp API Configuration
-- Institute admins configure their own WhatsApp provider credentials

CREATE TABLE IF NOT EXISTS whatsapp_api_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'twilio', -- twilio, meta_cloud, gupshup, wati, custom
  api_url TEXT NOT NULL,
  api_key TEXT, -- or auth token
  phone_number_id VARCHAR(100), -- WhatsApp Business phone number ID
  from_number VARCHAR(50), -- sender number (e.g., whatsapp:+14155238886 for Twilio)
  verify_token VARCHAR(200), -- webhook verify token
  access_token TEXT, -- for Meta Cloud API / Gupshup / WATI
  template_namespace VARCHAR(200), -- Twilio content template SID prefix
  is_active BOOLEAN DEFAULT true,
  extra_config JSONB DEFAULT '{}', -- provider-specific extra fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active config at a time
CREATE UNIQUE INDEX idx_whatsapp_config_active ON whatsapp_api_config (is_active) WHERE is_active = true;

-- RLS: Only Admin/SuperAdmin can manage
ALTER TABLE whatsapp_api_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_config_admin_manage" ON whatsapp_api_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "whatsapp_config_service_role" ON whatsapp_api_config
  FOR ALL
  USING (auth.role() = 'service_role');

-- Log table for WhatsApp message delivery
CREATE TABLE IF NOT EXISTS whatsapp_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone VARCHAR(30) NOT NULL,
  from_phone VARCHAR(30),
  template_name VARCHAR(100),
  message_body TEXT,
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, failed, sandbox
  provider VARCHAR(50),
  provider_message_id VARCHAR(200),
  error_message TEXT,
  channel_purpose VARCHAR(50), -- fee_reminder, attendance_warning, fee_escalation, daily_digest, broadcast, general
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whatsapp_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_log_admin_read" ON whatsapp_delivery_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "whatsapp_log_service_insert" ON whatsapp_delivery_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE whatsapp_api_config IS 'Institute WhatsApp API provider configuration. Admin provides their own API credentials.';
COMMENT ON TABLE whatsapp_delivery_log IS 'Audit log of all WhatsApp messages sent through the system.';
