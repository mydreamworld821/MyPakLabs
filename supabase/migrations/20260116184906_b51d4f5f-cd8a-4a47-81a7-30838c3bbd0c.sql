
-- Create a function to get the next lab order sequence number (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_next_order_sequence(prefix text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_seq integer := 0;
  order_seq integer;
  prescription_seq integer;
BEGIN
  -- Get max sequence from orders
  SELECT COALESCE(MAX(
    CASE 
      WHEN unique_id LIKE prefix || '-%' AND array_length(string_to_array(unique_id, '-'), 1) = 4
      THEN NULLIF(split_part(unique_id, '-', 4), '')::integer
      ELSE 0
    END
  ), 0) INTO order_seq FROM orders;
  
  -- Get max sequence from prescriptions
  SELECT COALESCE(MAX(
    CASE 
      WHEN unique_id LIKE prefix || '-%' AND array_length(string_to_array(unique_id, '-'), 1) = 4
      THEN NULLIF(split_part(unique_id, '-', 4), '')::integer
      ELSE 0
    END
  ), 0) INTO prescription_seq FROM prescriptions;
  
  -- Return the max + 1
  RETURN GREATEST(order_seq, prescription_seq) + 1;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_next_order_sequence(text) TO authenticated;
