
-- 1. Trigger for medicine_orders status changes
CREATE OR REPLACE FUNCTION public.notify_medicine_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_store_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT store_name INTO v_store_name FROM medical_stores WHERE id = NEW.store_id;

    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.user_id, 'Medicine Order Confirmed ✅', 'Your medicine order' || COALESCE(' from ' || v_store_name, '') || ' has been confirmed.', 'booking_confirmed', 'ShoppingCart', NEW.id::text, 'medicine_order', '/my-bookings');
    ELSIF NEW.status = 'preparing' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.user_id, 'Order Being Prepared 📦', 'Your medicine order' || COALESCE(' from ' || v_store_name, '') || ' is being prepared.', 'info', 'ShoppingCart', NEW.id::text, 'medicine_order', '/my-bookings');
    ELSIF NEW.status = 'dispatched' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.user_id, 'Order Dispatched 🚚', 'Your medicine order' || COALESCE(' from ' || v_store_name, '') || ' has been dispatched.', 'info', 'ShoppingCart', NEW.id::text, 'medicine_order', '/my-bookings');
    ELSIF NEW.status = 'delivered' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.user_id, 'Order Delivered ✅', 'Your medicine order' || COALESCE(' from ' || v_store_name, '') || ' has been delivered.', 'booking_confirmed', 'ShoppingCart', NEW.id::text, 'medicine_order', '/my-bookings');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.user_id, 'Order Cancelled', 'Your medicine order' || COALESCE(' from ' || v_store_name, '') || ' has been cancelled.', 'appointment_cancelled', 'ShoppingCart', NEW.id::text, 'medicine_order', '/my-bookings');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_medicine_order_status_change
  AFTER UPDATE ON public.medicine_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_medicine_order_status_change();

-- 2. Trigger for emergency_nursing_requests status changes
CREATE OR REPLACE FUNCTION public.notify_emergency_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nurse_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'nurse_assigned' THEN
      SELECT full_name INTO v_nurse_name FROM nurses WHERE id = NEW.accepted_nurse_id;
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Nurse Assigned 🏥', 'A nurse (' || COALESCE(v_nurse_name, 'Nurse') || ') has been assigned to your emergency request.', 'nurse_confirmed', 'Heart', NEW.id::text, 'emergency', '/emergency-request-status/' || NEW.id);
    ELSIF NEW.status = 'in_progress' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Service In Progress', 'Your emergency nursing service is now in progress.', 'info', 'Heart', NEW.id::text, 'emergency', '/emergency-request-status/' || NEW.id);
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Service Completed ✅', 'Your emergency nursing service has been completed. Please leave a review!', 'booking_confirmed', 'Heart', NEW.id::text, 'emergency', '/emergency-request-status/' || NEW.id);
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
      VALUES (NEW.patient_id, 'Emergency Request Cancelled', 'Your emergency nursing request has been cancelled.' || COALESCE(' Reason: ' || NEW.cancellation_reason, ''), 'appointment_cancelled', 'Heart', NEW.id::text, 'emergency', '/emergency-request-status/' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_emergency_status_change
  AFTER UPDATE ON public.emergency_nursing_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_emergency_status_change();

-- 3. Trigger for new lab order creation
CREATE OR REPLACE FUNCTION public.notify_new_lab_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lab_name TEXT;
BEGIN
  SELECT name INTO v_lab_name FROM labs WHERE id = NEW.lab_id;
  INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
  VALUES (NEW.user_id, 'Lab Test Booked 📋', 'Your lab test booking' || COALESCE(' at ' || v_lab_name, '') || ' has been submitted. Awaiting confirmation.', 'info', 'FlaskConical', NEW.unique_id, 'order', '/my-bookings');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_lab_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lab_order();

-- 4. Trigger for new nurse booking creation
CREATE OR REPLACE FUNCTION public.notify_new_nurse_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nurse_name TEXT;
BEGIN
  SELECT full_name INTO v_nurse_name FROM nurses WHERE id = NEW.nurse_id;
  INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
  VALUES (NEW.patient_id, 'Nurse Booking Submitted 📋', 'Your home nursing booking with ' || COALESCE(v_nurse_name, 'Nurse') || ' has been submitted. Awaiting confirmation.', 'info', 'Heart', NEW.unique_id, 'nurse_booking', '/my-bookings');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_nurse_booking
  AFTER INSERT ON public.nurse_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_nurse_booking()
