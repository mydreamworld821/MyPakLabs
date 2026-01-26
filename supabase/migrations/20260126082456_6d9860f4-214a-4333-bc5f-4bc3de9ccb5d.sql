-- Create enum for message types
CREATE TYPE public.chat_message_type AS ENUM ('text', 'image', 'voice', 'call_started', 'call_ended');

-- Create enum for call types
CREATE TYPE public.call_type AS ENUM ('video', 'audio');

-- Create enum for call status
CREATE TYPE public.call_status AS ENUM ('initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected');

-- Create chat_rooms table (one per video consultation appointment)
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('doctor', 'patient')),
  message_type chat_message_type NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  media_duration INTEGER, -- for voice messages in seconds
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_calls table
CREATE TABLE public.chat_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL,
  caller_type TEXT NOT NULL CHECK (caller_type IN ('doctor', 'patient')),
  call_type call_type NOT NULL,
  status call_status NOT NULL DEFAULT 'initiated',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  daily_room_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_presence table for online status
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  typing_in_room UUID REFERENCES public.chat_rooms(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Patients can view their chat rooms"
ON public.chat_rooms FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their chat rooms"
ON public.chat_rooms FOR SELECT
USING (EXISTS (
  SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all chat rooms"
ON public.chat_rooms FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for chat_messages
CREATE POLICY "Participants can view messages in their rooms"
ON public.chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_messages.room_id 
  AND (chat_rooms.patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
  ))
));

CREATE POLICY "Participants can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_messages.room_id 
  AND chat_rooms.is_active = true
  AND (chat_rooms.patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
  ))
));

CREATE POLICY "Participants can update message read status"
ON public.chat_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_messages.room_id 
  AND (chat_rooms.patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
  ))
));

CREATE POLICY "Admins can manage all messages"
ON public.chat_messages FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for chat_calls
CREATE POLICY "Participants can view calls in their rooms"
ON public.chat_calls FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_calls.room_id 
  AND (chat_rooms.patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
  ))
));

CREATE POLICY "Participants can create calls"
ON public.chat_calls FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_calls.room_id 
  AND chat_rooms.is_active = true
  AND (chat_rooms.patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
  ))
));

CREATE POLICY "Participants can update calls"
ON public.chat_calls FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_calls.room_id 
  AND (chat_rooms.patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = chat_rooms.doctor_id AND doctors.user_id = auth.uid()
  ))
));

CREATE POLICY "Admins can manage all calls"
ON public.chat_calls FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_presence
CREATE POLICY "Anyone can view presence"
ON public.user_presence FOR SELECT
USING (true);

CREATE POLICY "Users can update their own presence"
ON public.user_presence FOR ALL
USING (auth.uid() = user_id);

-- Create function to auto-create chat room when video consultation is booked
CREATE OR REPLACE FUNCTION public.create_chat_room_for_video_consultation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create chat room for video/online consultations
  IF NEW.consultation_type = 'online' THEN
    INSERT INTO public.chat_rooms (appointment_id, doctor_id, patient_id)
    VALUES (NEW.id, NEW.doctor_id, NEW.patient_id)
    ON CONFLICT (appointment_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating chat rooms
DROP TRIGGER IF EXISTS trigger_create_chat_room ON public.appointments;
CREATE TRIGGER trigger_create_chat_room
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_chat_room_for_video_consultation();

-- Create function to update chat room activation status
CREATE OR REPLACE FUNCTION public.update_chat_room_activation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_time_pkt TIMESTAMP WITH TIME ZONE;
BEGIN
  current_time_pkt := NOW() AT TIME ZONE 'Asia/Karachi';
  
  -- Activate rooms 15 minutes before appointment
  UPDATE public.chat_rooms cr
  SET is_active = true, activated_at = NOW(), updated_at = NOW()
  FROM public.appointments a
  WHERE cr.appointment_id = a.id
    AND cr.is_active = false
    AND a.consultation_type = 'online'
    AND a.status NOT IN ('cancelled', 'completed')
    AND (a.appointment_date || ' ' || a.appointment_time)::timestamp AT TIME ZONE 'Asia/Karachi' <= current_time_pkt + INTERVAL '15 minutes';
  
  -- Deactivate rooms 24 hours after appointment
  UPDATE public.chat_rooms cr
  SET is_active = false, deactivated_at = NOW(), updated_at = NOW()
  FROM public.appointments a
  WHERE cr.appointment_id = a.id
    AND cr.is_active = true
    AND (a.appointment_date || ' ' || a.appointment_time)::timestamp AT TIME ZONE 'Asia/Karachi' <= current_time_pkt - INTERVAL '24 hours';
END;
$$;

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Create indexes for performance
CREATE INDEX idx_chat_rooms_patient ON public.chat_rooms(patient_id);
CREATE INDEX idx_chat_rooms_doctor ON public.chat_rooms(doctor_id);
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_calls_room ON public.chat_calls(room_id);
CREATE INDEX idx_user_presence_user ON public.user_presence(user_id);