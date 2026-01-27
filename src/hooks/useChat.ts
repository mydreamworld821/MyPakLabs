import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendFCMNotification } from '@/utils/fcmNotifications';
import { isChatActiveForAppointment } from '@/hooks/useChatStatus';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  content: string | null;
  message_type: 'text' | 'image' | 'voice';
  media_url: string | null;
  media_duration: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  is_active: boolean;
  activated_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
  appointment?: {
    appointment_date: string;
    appointment_time: string;
    status: string;
    consultation_type: string;
    unique_id: string | null;
  };
  doctor?: {
    id: string;
    full_name: string;
    photo_url: string | null;
    qualification: string | null;
    user_id: string | null;
  };
  patient?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: ChatMessage | null;
  unread_count?: number;
}

interface UseChatOptions {
  roomId?: string;
}

export const useChat = (options: UseChatOptions = {}) => {
  const { user } = useAuth();
  const { roomId } = options;
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Check if user is a doctor
  useEffect(() => {
    const checkUserType = async () => {
      if (!user) return;
      
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      
      if (doctor) {
        setUserType('doctor');
        setDoctorId(doctor.id);
      } else {
        setUserType('patient');
      }
    };
    
    checkUserType();
  }, [user]);

  // Fetch all chat rooms for the user
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          appointment:appointments!chat_rooms_appointment_id_fkey (
            appointment_date,
            appointment_time,
            status,
            consultation_type,
            unique_id
          ),
          doctor:doctors!chat_rooms_doctor_id_fkey (
            id,
            full_name,
            photo_url,
            qualification,
            user_id
          )
        `)
        .order('updated_at', { ascending: false });

      // Filter based on user type
      if (userType === 'doctor' && doctorId) {
        query = query.eq('doctor_id', doctorId);
      } else {
        query = query.eq('patient_id', user.id);
      }

      const { data: roomsData, error } = await query;
      
      if (error) throw error;

      // Fetch patient profiles and last messages
      const enrichedRooms = await Promise.all(
        (roomsData || []).map(async (room) => {
          // Get patient profile
          const { data: patientProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', room.patient_id)
            .maybeSingle();

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...room,
            patient: patientProfile,
            last_message: lastMessageData as ChatMessage | null,
            unread_count: unreadCount || 0,
          };
        })
      );

      setRooms(enrichedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, userType, doctorId]);

  // Fetch messages for a specific room
  const fetchMessages = useCallback(async (roomIdToFetch: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          appointment:appointments!chat_rooms_appointment_id_fkey (
            appointment_date,
            appointment_time,
            status,
            consultation_type,
            unique_id
          ),
          doctor:doctors!chat_rooms_doctor_id_fkey (
            id,
            full_name,
            photo_url,
            qualification,
            user_id
          )
        `)
        .eq('id', roomIdToFetch)
        .maybeSingle();

      if (roomError) throw roomError;
      
      if (roomData) {
        // Get patient profile
        const { data: patientProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', roomData.patient_id)
          .maybeSingle();

        setCurrentRoom({
          ...roomData,
          patient: patientProfile,
        });
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomIdToFetch)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages((messagesData || []) as ChatMessage[]);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('room_id', roomIdToFetch)
        .neq('sender_id', user.id)
        .eq('is_read', false);

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check if chat is currently active using the unified helper
  const isChatActive = useCallback((room: ChatRoom | null): boolean => {
    if (!room) return false;
    if (!room.appointment) return false;
    
    return isChatActiveForAppointment(
      room.appointment.appointment_date,
      room.appointment.appointment_time,
      room.appointment.status
    );
  }, []);

  // Send a text message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !roomId || !content.trim()) return;
    if (!isChatActive(currentRoom)) {
      toast.error('Chat is not active at this time');
      return;
    }
    
    setIsSending(true);
    try {
      const senderType = userType === 'doctor' ? 'doctor' : 'patient';
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          sender_type: senderType,
          content: content.trim(),
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      // Update room's updated_at
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      // Send FCM notification to receiver
      if (currentRoom) {
        const receiverId = userType === 'doctor' 
          ? currentRoom.patient_id 
          : currentRoom.doctor?.user_id;
        
        const senderName = userType === 'doctor' 
          ? currentRoom.doctor?.full_name 
          : currentRoom.patient?.full_name;
        
        if (receiverId) {
          sendFCMNotification({
            title: `New message from ${senderName || 'User'}`,
            body: content.trim().substring(0, 100),
            userIds: [receiverId],
            data: {
              url: `/chat/${roomId}`,
              type: 'chat_message',
            },
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, currentRoom, userType, isChatActive]);

  // Send an image message
  const sendImage = useCallback(async (file: File) => {
    if (!user || !roomId) return;
    if (!isChatActive(currentRoom)) {
      toast.error('Chat is not active at this time');
      return;
    }
    
    setIsSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      const senderType = userType === 'doctor' ? 'doctor' : 'patient';

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          sender_type: senderType,
          message_type: 'image',
          media_url: fileName, // Store path, not full URL
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      // Send notification
      if (currentRoom) {
        const receiverId = userType === 'doctor' 
          ? currentRoom.patient_id 
          : currentRoom.doctor?.user_id;
        
        const senderName = userType === 'doctor' 
          ? currentRoom.doctor?.full_name 
          : currentRoom.patient?.full_name;
        
        if (receiverId) {
          sendFCMNotification({
            title: `📷 Image from ${senderName || 'User'}`,
            body: 'Sent you an image',
            userIds: [receiverId],
            data: {
              url: `/chat/${roomId}`,
              type: 'chat_message',
            },
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image');
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, currentRoom, userType, isChatActive]);

  // Send a voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!user || !roomId) return;
    if (!isChatActive(currentRoom)) {
      toast.error('Chat is not active at this time');
      return;
    }
    
    setIsSending(true);
    try {
      const fileName = `${roomId}/voice-${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      const senderType = userType === 'doctor' ? 'doctor' : 'patient';

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          sender_type: senderType,
          message_type: 'voice',
          media_url: fileName,
          media_duration: Math.round(duration),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      // Send notification
      if (currentRoom) {
        const receiverId = userType === 'doctor' 
          ? currentRoom.patient_id 
          : currentRoom.doctor?.user_id;
        
        const senderName = userType === 'doctor' 
          ? currentRoom.doctor?.full_name 
          : currentRoom.patient?.full_name;
        
        if (receiverId) {
          sendFCMNotification({
            title: `🎤 Voice message from ${senderName || 'User'}`,
            body: `${Math.round(duration)}s voice message`,
            userIds: [receiverId],
            data: {
              url: `/chat/${roomId}`,
              type: 'chat_message',
            },
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, currentRoom, userType, isChatActive]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!roomId) return;

    channelRef.current = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if from other user
          if (user && newMessage.sender_id !== user.id) {
            supabase
              .from('chat_messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  // Initial fetch
  useEffect(() => {
    if (roomId) {
      fetchMessages(roomId);
    } else {
      fetchRooms();
    }
  }, [roomId, fetchMessages, fetchRooms, userType, doctorId]);

  return {
    rooms,
    messages,
    currentRoom,
    isLoading,
    isSending,
    userType,
    doctorId,
    sendMessage,
    sendImage,
    sendVoiceMessage,
    fetchRooms,
    fetchMessages,
    isChatActive,
  };
};
