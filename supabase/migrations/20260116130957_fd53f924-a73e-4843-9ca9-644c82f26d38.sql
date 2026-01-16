-- Add card_height column for precise pixel control
ALTER TABLE public.service_cards 
ADD COLUMN IF NOT EXISTS card_height integer DEFAULT 100;