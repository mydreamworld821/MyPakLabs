CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lab_name TEXT;
BEGIN
  -- Notify on confirmation
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT name INTO v_lab_name FROM labs WHERE id = NEW.lab_id;

    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.user_id,
      'Lab Test Confirmed ✅',
      'Your lab test booking' || COALESCE(' at ' || v_lab_name, '') || ' has been confirmed. Show your booking to the lab attendant.',
      'booking_confirmed',
      'FlaskConical',
      NEW.unique_id,
      'order',
      '/my-bookings'
    );
  END IF;

  -- Notify on cancellation
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT name INTO v_lab_name FROM labs WHERE id = NEW.lab_id;

    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.user_id,
      'Lab Test Update',
      'Your lab test booking' || COALESCE(' at ' || v_lab_name, '') || ' has been cancelled. Please check your bookings for details.',
      'info',
      'FlaskConical',
      NEW.unique_id,
      'order',
      '/my-bookings'
    );
  END IF;

  RETURN NEW;
END;
$function$;