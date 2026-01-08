-- Fix update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_order_unique_id function to set search_path
CREATE OR REPLACE FUNCTION public.generate_order_unique_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.orders;
  new_id := 'MEDI-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  NEW.unique_id := new_id;
  RETURN NEW;
END;
$$;