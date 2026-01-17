-- Create wallet_settings table for admin controls
CREATE TABLE public.wallet_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  credits_per_booking INTEGER NOT NULL DEFAULT 10,
  minimum_redemption_credits INTEGER NOT NULL DEFAULT 1000,
  credits_to_pkr_ratio INTEGER NOT NULL DEFAULT 10,
  credits_expiry_months INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet transaction type enum
CREATE TYPE public.wallet_transaction_type AS ENUM ('credit', 'debit');

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type wallet_transaction_type NOT NULL,
  credits INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- Enable RLS
ALTER TABLE public.wallet_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_settings (admin only for write, public read)
CREATE POLICY "Anyone can view wallet settings"
ON public.wallet_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can update wallet settings"
ON public.wallet_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert wallet settings"
ON public.wallet_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for wallets
CREATE POLICY "Users can view their own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own wallet"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any wallet"
ON public.wallets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create any transaction"
ON public.wallet_transactions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_settings_updated_at
BEFORE UPDATE ON public.wallet_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default wallet settings
INSERT INTO public.wallet_settings (is_enabled, credits_per_booking, minimum_redemption_credits, credits_to_pkr_ratio, credits_expiry_months)
VALUES (true, 10, 1000, 10, 12);

-- Function to add credits to wallet
CREATE OR REPLACE FUNCTION public.add_wallet_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_service_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Get or create wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, total_credits)
    VALUES (p_user_id, 0)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Update wallet balance
  UPDATE wallets 
  SET total_credits = total_credits + p_credits
  WHERE id = v_wallet_id;
  
  -- Insert transaction
  INSERT INTO wallet_transactions (user_id, wallet_id, type, credits, service_type, reference_id, description)
  VALUES (p_user_id, v_wallet_id, 'credit', p_credits, p_service_type, p_reference_id, p_description);
END;
$$;

-- Function to deduct credits from wallet
CREATE OR REPLACE FUNCTION public.deduct_wallet_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_service_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_credits INTEGER;
BEGIN
  -- Get wallet
  SELECT id, total_credits INTO v_wallet_id, v_current_credits 
  FROM wallets WHERE user_id = p_user_id;
  
  -- Check if wallet exists and has enough credits
  IF v_wallet_id IS NULL OR v_current_credits < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Update wallet balance
  UPDATE wallets 
  SET total_credits = total_credits - p_credits
  WHERE id = v_wallet_id;
  
  -- Insert transaction
  INSERT INTO wallet_transactions (user_id, wallet_id, type, credits, service_type, reference_id, description)
  VALUES (p_user_id, v_wallet_id, 'debit', p_credits, p_service_type, p_reference_id, p_description);
  
  RETURN TRUE;
END;
$$;