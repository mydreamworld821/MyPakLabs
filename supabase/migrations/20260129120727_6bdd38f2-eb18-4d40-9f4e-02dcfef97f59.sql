-- Add message status enum
DO $$ BEGIN
  CREATE TYPE message_delivery_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add status column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS status message_delivery_status NOT NULL DEFAULT 'sent';

-- Add index for faster status updates
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON public.chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_sender ON public.chat_messages(room_id, sender_id);

-- Update existing messages: if is_read is true, set status to 'read'
UPDATE public.chat_messages SET status = 'read' WHERE is_read = true;

-- Create function to update message status to delivered when user comes online
CREATE OR REPLACE FUNCTION public.mark_messages_delivered(p_room_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.chat_messages
  SET status = 'delivered'
  WHERE room_id = p_room_id
    AND sender_id != p_user_id
    AND status = 'sent';
END;
$function$;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_room_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.chat_messages
  SET status = 'read', is_read = true, read_at = NOW()
  WHERE room_id = p_room_id
    AND sender_id != p_user_id
    AND status != 'read';
END;
$function$;