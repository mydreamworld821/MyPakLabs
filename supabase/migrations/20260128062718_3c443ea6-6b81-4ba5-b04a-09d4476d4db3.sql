-- Enable realtime replication for chat tables so doctors/patients receive messages instantly
DO $$
BEGIN
  -- Add chat_messages to realtime publication (ignore if already added)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- (Optional but useful) chat_rooms updates (unread, updated_at) can also be listened to
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Replace message INSERT policy: don’t depend on chat_rooms.is_active (which may not be synced),
-- instead enforce the same time window (15 min before -> 24h after) using appointment time in PKT.
DROP POLICY IF EXISTS "Participants can send messages" ON public.chat_messages;

CREATE POLICY "Participants can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_rooms cr
    JOIN public.appointments a ON a.id = cr.appointment_id
    WHERE cr.id = chat_messages.room_id
      AND a.consultation_type = 'online'
      AND a.status NOT IN ('cancelled', 'completed')
      AND (
        -- Pakistan time window: 15 min before to 24h after
        (a.appointment_date::text || ' ' || a.appointment_time)::timestamp AT TIME ZONE 'Asia/Karachi'
        <= (NOW() AT TIME ZONE 'Asia/Karachi') + INTERVAL '15 minutes'
      )
      AND (
        (a.appointment_date::text || ' ' || a.appointment_time)::timestamp AT TIME ZONE 'Asia/Karachi'
        >= (NOW() AT TIME ZONE 'Asia/Karachi') - INTERVAL '24 hours'
      )
      AND (
        cr.patient_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.doctors d
          WHERE d.id = cr.doctor_id AND d.user_id = auth.uid()
        )
      )
  )
);