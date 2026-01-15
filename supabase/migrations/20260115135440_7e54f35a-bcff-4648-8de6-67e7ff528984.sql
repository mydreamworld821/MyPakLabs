-- Add layout configuration columns to service_cards
ALTER TABLE public.service_cards 
ADD COLUMN IF NOT EXISTS card_size TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS col_span INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS row_span INTEGER DEFAULT 1;