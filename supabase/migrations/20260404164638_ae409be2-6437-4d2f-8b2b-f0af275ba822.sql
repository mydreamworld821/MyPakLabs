
-- Add patient counter offer price column to nurse_offers
ALTER TABLE public.nurse_offers ADD COLUMN IF NOT EXISTS patient_counter_price integer DEFAULT NULL;

-- Add a status value for counter-offered state
-- First check existing enum values and add 'countered' if not exists
DO $$ BEGIN
  ALTER TYPE nurse_offer_status ADD VALUE IF NOT EXISTS 'countered';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
