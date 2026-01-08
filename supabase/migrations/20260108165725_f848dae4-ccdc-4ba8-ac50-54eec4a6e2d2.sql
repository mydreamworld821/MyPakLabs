-- Drop the trigger first
DROP TRIGGER IF EXISTS generate_order_id ON public.orders;

-- Now drop the function
DROP FUNCTION IF EXISTS public.generate_order_unique_id();