
-- Create nurse_wallets table to track nurse earnings
CREATE TABLE public.nurse_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_commission_owed NUMERIC NOT NULL DEFAULT 0,
  total_commission_paid NUMERIC NOT NULL DEFAULT 0,
  pending_commission NUMERIC NOT NULL DEFAULT 0,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nurse_id)
);

-- Create nurse_wallet_transactions for tracking all earnings
CREATE TABLE public.nurse_wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.nurse_wallets(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('emergency', 'advance')),
  booking_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nurse_commission_payments for tracking commission payments to admin
CREATE TABLE public.nurse_commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.nurse_wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  screenshot_url TEXT,
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission_settings table for admin to configure commission rate
CREATE TABLE public.commission_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_percentage NUMERIC NOT NULL DEFAULT 10,
  payment_cycle_days INTEGER NOT NULL DEFAULT 7,
  grace_period_days INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default commission settings
INSERT INTO public.commission_settings (commission_percentage, payment_cycle_days, grace_period_days)
VALUES (10, 7, 3);

-- Enable RLS
ALTER TABLE public.nurse_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nurse_wallets
CREATE POLICY "Admins can manage nurse wallets"
ON public.nurse_wallets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can view own wallet"
ON public.nurse_wallets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM nurses WHERE nurses.id = nurse_wallets.nurse_id AND nurses.user_id = auth.uid()
));

-- RLS Policies for nurse_wallet_transactions
CREATE POLICY "Admins can manage wallet transactions"
ON public.nurse_wallet_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can view own transactions"
ON public.nurse_wallet_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM nurses WHERE nurses.id = nurse_wallet_transactions.nurse_id AND nurses.user_id = auth.uid()
));

-- RLS Policies for nurse_commission_payments
CREATE POLICY "Admins can manage commission payments"
ON public.nurse_commission_payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can view own commission payments"
ON public.nurse_commission_payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM nurses WHERE nurses.id = nurse_commission_payments.nurse_id AND nurses.user_id = auth.uid()
));

CREATE POLICY "Nurses can create commission payments"
ON public.nurse_commission_payments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM nurses WHERE nurses.id = nurse_commission_payments.nurse_id AND nurses.user_id = auth.uid()
));

-- RLS Policies for commission_settings
CREATE POLICY "Admins can manage commission settings"
ON public.commission_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view commission settings"
ON public.commission_settings FOR SELECT
USING (true);

-- Function to add nurse earnings
CREATE OR REPLACE FUNCTION public.add_nurse_earnings(
  p_nurse_id UUID,
  p_booking_type TEXT,
  p_booking_id UUID,
  p_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  -- Get commission rate
  SELECT commission_percentage INTO v_commission_rate FROM commission_settings WHERE is_active = true LIMIT 1;
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 10;
  END IF;
  
  -- Calculate commission
  v_commission_amount := (p_amount * v_commission_rate) / 100;
  v_net_amount := p_amount - v_commission_amount;
  
  -- Get or create wallet
  SELECT id INTO v_wallet_id FROM nurse_wallets WHERE nurse_id = p_nurse_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO nurse_wallets (nurse_id, total_earnings, total_commission_owed, pending_commission)
    VALUES (p_nurse_id, p_amount, v_commission_amount, v_commission_amount)
    RETURNING id INTO v_wallet_id;
  ELSE
    UPDATE nurse_wallets
    SET total_earnings = total_earnings + p_amount,
        total_commission_owed = total_commission_owed + v_commission_amount,
        pending_commission = pending_commission + v_commission_amount,
        updated_at = now()
    WHERE id = v_wallet_id;
  END IF;
  
  -- Insert transaction
  INSERT INTO nurse_wallet_transactions (nurse_id, wallet_id, booking_type, booking_id, amount, commission_amount, net_amount)
  VALUES (p_nurse_id, v_wallet_id, p_booking_type, p_booking_id, p_amount, v_commission_amount, v_net_amount);
END;
$$;

-- Function to check and suspend nurses with overdue payments
CREATE OR REPLACE FUNCTION public.check_nurse_payment_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_cycle INTEGER;
  v_grace_period INTEGER;
BEGIN
  SELECT payment_cycle_days, grace_period_days INTO v_payment_cycle, v_grace_period
  FROM commission_settings WHERE is_active = true LIMIT 1;
  
  -- Suspend nurses who haven't paid within cycle + grace period
  UPDATE nurse_wallets
  SET is_suspended = true,
      suspension_reason = 'Overdue commission payment',
      updated_at = now()
  WHERE pending_commission > 0
    AND (last_payment_date IS NULL OR last_payment_date < now() - ((v_payment_cycle + v_grace_period) || ' days')::interval)
    AND is_suspended = false;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_nurse_wallets_updated_at
BEFORE UPDATE ON public.nurse_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurse_commission_payments_updated_at
BEFORE UPDATE ON public.nurse_commission_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_settings_updated_at
BEFORE UPDATE ON public.commission_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
