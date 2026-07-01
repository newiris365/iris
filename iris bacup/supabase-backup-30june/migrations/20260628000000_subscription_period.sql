-- =========================================================================
-- ADD SUBSCRIPTION BILLING PERIOD TO INSTITUTIONS
-- =========================================================================

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subscription_period VARCHAR(50) DEFAULT 'monthly'
    CHECK (subscription_period IN ('monthly', 'quarterly', 'yearly'));
