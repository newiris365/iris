-- Migration: Add is_visible_on_homepage flag to institutions table
-- Purpose : SuperAdmin can control which institutions appear on the public applicant home page.
-- Default : false — no institution is shown publicly until explicitly enabled.
-- Apply   : Run this in the Supabase SQL Editor (do NOT auto-apply via CLI without review).

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS is_visible_on_homepage BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN institutions.is_visible_on_homepage IS
  'When true, this institution is listed on the public /home applicant discovery page. '
  'Only SuperAdmin can toggle this flag. Defaults to false (hidden).';
