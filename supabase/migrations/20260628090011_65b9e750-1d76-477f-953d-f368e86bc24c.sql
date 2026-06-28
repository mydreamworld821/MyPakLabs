
CREATE OR REPLACE FUNCTION public.notify_emergency_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nurse_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted'::emergency_request_status THEN
      SELECT full_name INTO v_nurse_name FROM nurses WHERE id = NEW.accepted_nurse_id;
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Nurse Assigned 🏥', 'A nurse (' || COALESCE(v_nurse_name, 'Nurse') || ') has been assigned to your emergency request.', 'nurse_confirmed', 'Heart', NEW.id::text, 'emergency', '/emergency-request/' || NEW.id);
    ELSIF NEW.status = 'in_progress'::emergency_request_status THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Service In Progress', 'Your emergency nursing service is now in progress.', 'info', 'Heart', NEW.id::text, 'emergency', '/emergency-request/' || NEW.id);
    ELSIF NEW.status = 'completed'::emergency_request_status THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Service Completed ✅', 'Your emergency nursing service has been completed. Please leave a review!', 'booking_confirmed', 'Heart', NEW.id::text, 'emergency', '/emergency-request/' || NEW.id);
    ELSIF NEW.status = 'cancelled'::emergency_request_status THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Emergency Request Cancelled', 'Your emergency nursing request has been cancelled.' || COALESCE(' Reason: ' || NEW.cancellation_reason, ''), 'appointment_cancelled', 'Heart', NEW.id::text, 'emergency', '/emergency-request/' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
