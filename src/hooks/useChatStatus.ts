import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatStatusResult {
  isAccessible: boolean;
  isActive: boolean;
  status: 'not_started' | 'active' | 'ended';
  minutesUntilActive: number | null;
  minutesUntilEnd: number | null;
  chatRoomId: string | null;
  message: string;
}

interface UseChatStatusOptions {
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationType?: string;
  appointmentStatus?: string;
}

// Pakistan timezone offset (UTC+5)
const PKT_OFFSET = 5 * 60; // in minutes

const getPKTNow = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (PKT_OFFSET * 60000));
};

const parseAppointmentDateTime = (date: string, time: string): Date => {
  // Parse time like "10:00 AM" or "2:30 PM"
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  
  let hour24 = hours;
  if (period?.toLowerCase() === 'pm' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period?.toLowerCase() === 'am' && hours === 12) {
    hour24 = 0;
  }
  
  const appointmentDate = new Date(date);
  appointmentDate.setHours(hour24, minutes, 0, 0);
  
  return appointmentDate;
};

export const useChatStatus = (options: UseChatStatusOptions): ChatStatusResult => {
  const { appointmentId, appointmentDate, appointmentTime, consultationType, appointmentStatus } = options;
  
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch chat room ID for this appointment
  useEffect(() => {
    const fetchChatRoom = async () => {
      if (!appointmentId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('appointment_id', appointmentId)
          .maybeSingle();

        if (!error && data) {
          setChatRoomId(data.id);
        }
      } catch (err) {
        console.error('Error fetching chat room:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatRoom();
  }, [appointmentId]);

  // Calculate chat status
  const calculateStatus = useCallback((): ChatStatusResult => {
    // Not an online consultation
    if (consultationType !== 'online') {
      return {
        isAccessible: false,
        isActive: false,
        status: 'not_started',
        minutesUntilActive: null,
        minutesUntilEnd: null,
        chatRoomId: null,
        message: 'Chat is only available for online consultations',
      };
    }

    // Appointment cancelled or completed
    if (appointmentStatus === 'cancelled') {
      return {
        isAccessible: false,
        isActive: false,
        status: 'ended',
        minutesUntilActive: null,
        minutesUntilEnd: null,
        chatRoomId,
        message: 'Appointment was cancelled',
      };
    }

    if (!appointmentDate || !appointmentTime) {
      return {
        isAccessible: false,
        isActive: false,
        status: 'not_started',
        minutesUntilActive: null,
        minutesUntilEnd: null,
        chatRoomId,
        message: 'Appointment details not available',
      };
    }

    const now = getPKTNow();
    const appointmentDateTime = parseAppointmentDateTime(appointmentDate, appointmentTime);
    
    // Active window: 15 minutes before to 24 hours after
    const activeStart = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    const activeEnd = new Date(appointmentDateTime.getTime() + 24 * 60 * 60 * 1000);
    
    const nowTime = now.getTime();
    const activeStartTime = activeStart.getTime();
    const activeEndTime = activeEnd.getTime();

    if (nowTime < activeStartTime) {
      // Chat not yet active
      const minutesUntil = Math.ceil((activeStartTime - nowTime) / 60000);
      return {
        isAccessible: true, // Can view but not send
        isActive: false,
        status: 'not_started',
        minutesUntilActive: minutesUntil,
        minutesUntilEnd: null,
        chatRoomId,
        message: minutesUntil > 60 
          ? `Chat opens in ${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
          : `Chat opens in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`,
      };
    }

    if (nowTime >= activeStartTime && nowTime <= activeEndTime) {
      // Chat is active
      const minutesRemaining = Math.ceil((activeEndTime - nowTime) / 60000);
      const hoursRemaining = Math.floor(minutesRemaining / 60);
      return {
        isAccessible: true,
        isActive: true,
        status: 'active',
        minutesUntilActive: 0,
        minutesUntilEnd: minutesRemaining,
        chatRoomId,
        message: hoursRemaining > 0 
          ? `Active for ${hoursRemaining}h ${minutesRemaining % 60}m`
          : `Active for ${minutesRemaining}m`,
      };
    }

    // Chat window has ended
    return {
      isAccessible: true, // Can still view history
      isActive: false,
      status: 'ended',
      minutesUntilActive: null,
      minutesUntilEnd: null,
      chatRoomId,
      message: 'Chat session ended (read-only)',
    };
  }, [appointmentDate, appointmentTime, consultationType, appointmentStatus, chatRoomId]);

  const [status, setStatus] = useState<ChatStatusResult>(calculateStatus());

  // Update status every minute
  useEffect(() => {
    setStatus(calculateStatus());
    
    const interval = setInterval(() => {
      setStatus(calculateStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [calculateStatus]);

  return status;
};

// Utility function to check if chat is active (for use in useChat hook)
export const isChatActiveForAppointment = (
  appointmentDate: string,
  appointmentTime: string,
  appointmentStatus: string
): boolean => {
  if (appointmentStatus === 'cancelled') return false;

  const now = getPKTNow();
  const appointmentDateTime = parseAppointmentDateTime(appointmentDate, appointmentTime);
  
  const activeStart = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
  const activeEnd = new Date(appointmentDateTime.getTime() + 24 * 60 * 60 * 1000);
  
  return now >= activeStart && now <= activeEnd;
};
