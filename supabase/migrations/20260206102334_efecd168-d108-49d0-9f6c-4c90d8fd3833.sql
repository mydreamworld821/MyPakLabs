
-- Create user_notifications table for in-app notification panel
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'booking_confirmed', 'lab_confirmed', 'nurse_confirmed', 'prescription_approved', 'appointment_cancelled', 'info'
  icon TEXT DEFAULT 'Bell',
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id TEXT, -- ID of related booking/order/appointment
  reference_type TEXT, -- 'order', 'appointment', 'prescription', 'nurse_booking'
  navigate_to TEXT, -- URL to navigate when clicking notification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.user_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System/admin can insert notifications (via triggers/functions)
CREATE POLICY "System can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (true);

-- Admin can manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON public.user_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast queries
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id, is_read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Trigger function to create notification when order status changes to approved
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lab_name TEXT;
BEGIN
  -- Only trigger on status change to approved
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Get lab name
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
  
  -- Notify on rejection
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT name INTO v_lab_name FROM labs WHERE id = NEW.lab_id;
    
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.user_id,
      'Lab Test Update',
      'Your lab test booking' || COALESCE(' at ' || v_lab_name, '') || ' has been updated. Please check your bookings for details.',
      'info',
      'FlaskConical',
      NEW.unique_id,
      'order',
      '/my-bookings'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_notification
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- Trigger function for appointment status changes
CREATE OR REPLACE FUNCTION public.notify_appointment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doctor_name TEXT;
BEGIN
  -- Notify on confirmation
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT full_name INTO v_doctor_name FROM doctors WHERE id = NEW.doctor_id;
    
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.patient_id,
      'Appointment Confirmed ✅',
      'Your appointment with Dr. ' || COALESCE(v_doctor_name, 'Doctor') || ' on ' || TO_CHAR(NEW.appointment_date, 'DD Mon YYYY') || ' at ' || NEW.appointment_time || ' has been confirmed.',
      'booking_confirmed',
      'Stethoscope',
      NEW.unique_id,
      'appointment',
      '/my-bookings'
    );
  END IF;
  
  -- Notify on cancellation
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT full_name INTO v_doctor_name FROM doctors WHERE id = NEW.doctor_id;
    
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.patient_id,
      'Appointment Cancelled',
      'Your appointment with Dr. ' || COALESCE(v_doctor_name, 'Doctor') || ' has been cancelled.' || COALESCE(' Reason: ' || NEW.cancellation_reason, ''),
      'appointment_cancelled',
      'Stethoscope',
      NEW.unique_id,
      'appointment',
      '/my-bookings'
    );
  END IF;
  
  -- Notify on completion
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT full_name INTO v_doctor_name FROM doctors WHERE id = NEW.doctor_id;
    
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.patient_id,
      'Appointment Completed',
      'Your appointment with Dr. ' || COALESCE(v_doctor_name, 'Doctor') || ' has been completed. Please leave a review!',
      'info',
      'Stethoscope',
      NEW.unique_id,
      'appointment',
      '/my-bookings'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_appointment_notification
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_appointment_status_change();

-- Trigger function for prescription status changes
CREATE OR REPLACE FUNCTION public.notify_prescription_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Notify on approval
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.user_id,
      'Prescription Approved ✅',
      'Your prescription has been reviewed and approved. You can now view the recommended tests.',
      'prescription_approved',
      'FileText',
      NEW.unique_id,
      'prescription',
      '/my-prescriptions'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_prescription_notification
AFTER UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_prescription_status_change();

-- Trigger for nurse booking status changes
CREATE OR REPLACE FUNCTION public.notify_nurse_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nurse_name TEXT;
BEGIN
  -- Notify on confirmation
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT full_name INTO v_nurse_name FROM nurses WHERE id = NEW.nurse_id;
    
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.patient_id,
      'Nurse Booking Confirmed ✅',
      'Your home nursing booking with ' || COALESCE(v_nurse_name, 'Nurse') || ' has been confirmed.',
      'nurse_confirmed',
      'Heart',
      NEW.unique_id,
      'nurse_booking',
      '/my-bookings'
    );
  END IF;
  
  -- Notify on cancellation
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT full_name INTO v_nurse_name FROM nurses WHERE id = NEW.nurse_id;
    
    INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
    VALUES (
      NEW.patient_id,
      'Nurse Booking Cancelled',
      'Your home nursing booking with ' || COALESCE(v_nurse_name, 'Nurse') || ' has been cancelled.',
      'info',
      'Heart',
      NEW.unique_id,
      'nurse_booking',
      '/my-bookings'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_nurse_booking_notification
AFTER UPDATE ON public.nurse_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_nurse_booking_status_change();

-- Also create notification on NEW appointment creation (patient gets confirmation they booked)
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doctor_name TEXT;
BEGIN
  SELECT full_name INTO v_doctor_name FROM doctors WHERE id = NEW.doctor_id;
  
  INSERT INTO public.user_notifications (user_id, title, message, type, icon, reference_id, reference_type, navigate_to)
  VALUES (
    NEW.patient_id,
    'Appointment Booked 📋',
    'Your appointment with Dr. ' || COALESCE(v_doctor_name, 'Doctor') || ' on ' || TO_CHAR(NEW.appointment_date, 'DD Mon YYYY') || ' at ' || NEW.appointment_time || ' has been submitted. Awaiting confirmation.',
    'info',
    'Stethoscope',
    NEW.unique_id,
    'appointment',
    '/my-bookings'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_appointment_notification
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_appointment();
