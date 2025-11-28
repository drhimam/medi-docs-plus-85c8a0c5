-- Add footer_line_enabled column to prescription_settings table
ALTER TABLE prescription_settings 
ADD COLUMN IF NOT EXISTS footer_line_enabled boolean NOT NULL DEFAULT true;