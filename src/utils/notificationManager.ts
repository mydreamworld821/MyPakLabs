/**
 * Unified Notification Manager
 * 
 * Handles all local notifications with WhatsApp-like behavior:
 * - Chat messages with sender preview
 * - Appointments & activities
 * - Emergency nursing (critical priority with full-screen alerts)
 * 
 * Uses LOCAL notification creation from FCM data-only payloads
 */

import { supabase } from '@/integrations/supabase/client';

// Notification types
export type NotificationType = 'chat' | 'appointment' | 'emergency' | 'system';
export type NotificationPriority = 'normal' | 'high' | 'critical';

export interface UnifiedNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  entityId: string;
  priority: NotificationPriority;
  senderRole?: 'doctor' | 'patient' | 'nurse' | 'system';
  timestamp: number;
  data?: Record<string, string>;
}

// Notification channels (for Android)
export const NOTIFICATION_CHANNELS = {
  chat: {
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'Messages from doctors and patients',
    importance: 'high' as const,
    sound: true,
    vibration: [100, 50, 100],
  },
  appointment: {
    id: 'appointments',
    name: 'Appointments',
    description: 'Booking confirmations, reminders, and updates',
    importance: 'default' as const,
    sound: true,
    vibration: [200, 100, 200],
  },
  emergency: {
    id: 'emergency_nursing',
    name: 'Emergency Nursing',
    description: 'Critical emergency nursing requests',
    importance: 'max' as const,
    sound: true,
    vibration: [500, 200, 500, 200, 500],
  },
  system: {
    id: 'system_updates',
    name: 'System Updates',
    description: 'General system notifications',
    importance: 'low' as const,
    sound: false,
    vibration: [],
  },
};

// Track currently active chat room to prevent showing notification
let activeRoomId: string | null = null;

export const setActiveRoom = (roomId: string | null) => {
  activeRoomId = roomId;
};

export const getActiveRoom = () => activeRoomId;

// Play notification sound based on type
export const playNotificationSound = (type: NotificationType = 'chat') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    
    const playNote = (freq: number, startTime: number, duration: number, volume: number = 0.3) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;

    switch (type) {
      case 'chat':
        // WhatsApp-style double beep
        playNote(800, now, 0.12, 0.2);
        playNote(1000, now + 0.15, 0.12, 0.2);
        break;
      case 'emergency':
        // Urgent alarm sound
        playNote(880, now, 0.2, 0.4);
        playNote(700, now + 0.25, 0.2, 0.4);
        playNote(880, now + 0.5, 0.2, 0.4);
        playNote(700, now + 0.75, 0.2, 0.4);
        break;
      case 'appointment':
        // Pleasant chime
        playNote(523.25, now, 0.15, 0.25);
        playNote(659.25, now + 0.12, 0.15, 0.25);
        playNote(783.99, now + 0.24, 0.2, 0.25);
        break;
      default:
        // Simple beep
        playNote(600, now, 0.15, 0.2);
    }

    setTimeout(() => audioContext.close(), 1500);
  } catch (e) {
    console.log('Could not play notification sound:', e);
  }
};

// Trigger device vibration
export const triggerVibration = (type: NotificationType = 'chat') => {
  if (!('vibrate' in navigator)) return;
  
  try {
    const channel = NOTIFICATION_CHANNELS[type] || NOTIFICATION_CHANNELS.chat;
    if (channel.vibration.length > 0) {
      navigator.vibrate(channel.vibration);
    }
  } catch (e) {
    console.log('Vibration not supported:', e);
  }
};

// Group notifications by sender/chat
const notificationGroups = new Map<string, number>();

// Show local notification
export const showLocalNotification = async (payload: UnifiedNotificationPayload): Promise<Notification | null> => {
  // Don't show if notifications not supported
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return null;
  }

  // Don't show if permission not granted
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  // Don't show chat notification if user is in that chat
  if (payload.type === 'chat' && payload.entityId === activeRoomId) {
    console.log('User is in this chat, not showing notification');
    // Still play sound for in-app message
    playNotificationSound('chat');
    return null;
  }

  // Don't show if document is focused AND it's not an emergency
  if (document.hasFocus() && payload.priority !== 'critical') {
    // Just play sound
    playNotificationSound(payload.type);
    triggerVibration(payload.type);
    return null;
  }

  // Get notification channel config
  const channel = NOTIFICATION_CHANNELS[payload.type] || NOTIFICATION_CHANNELS.system;

  // Build notification options
  const options: NotificationOptions = {
    body: payload.body,
    icon: '/images/mypaklabs-logo.png',
    badge: '/images/mypaklabs-logo.png',
    tag: `${payload.type}-${payload.entityId}`,
    data: {
      ...payload.data,
      type: payload.type,
      entityId: payload.entityId,
      priority: payload.priority,
      timestamp: payload.timestamp,
    },
    requireInteraction: payload.priority === 'critical',
    silent: !channel.sound,
  };

  // Add vibration pattern
  if (channel.vibration.length > 0) {
    (options as any).vibrate = channel.vibration;
  }

  // Add actions based on type
  if (payload.type === 'chat') {
    (options as any).actions = [
      { action: 'reply', title: '💬 Reply' },
      { action: 'mark_read', title: '✓ Read' },
    ];
  } else if (payload.type === 'emergency') {
    (options as any).actions = [
      { action: 'accept', title: '✓ Accept' },
      { action: 'view', title: 'View Details' },
    ];
  } else {
    (options as any).actions = [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ];
  }

  try {
    // Play sound
    if (channel.sound) {
      playNotificationSound(payload.type);
    }

    // Trigger vibration
    triggerVibration(payload.type);

    // Create notification
    const notification = new Notification(payload.title, options);

    // Handle click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      // Navigate based on type
      let url = '/';
      switch (payload.type) {
        case 'chat':
          url = `/chat/${payload.entityId}`;
          break;
        case 'appointment':
          url = '/my-bookings';
          break;
        case 'emergency':
          url = `/nurse-emergency-feed?requestId=${payload.entityId}`;
          break;
      }
      
      if (payload.data?.url) {
        url = payload.data.url;
      }
      
      window.location.href = url;
      notification.close();
    };

    // Auto close after timeout (except critical)
    if (payload.priority !== 'critical') {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Send notification via FCM (data-only payload)
export const sendNotificationToUser = async (
  userId: string,
  payload: Omit<UnifiedNotificationPayload, 'timestamp'>
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('send-fcm-notification', {
      body: {
        title: payload.title,
        body: payload.body,
        userIds: [userId],
        data: {
          type: payload.type,
          entityId: payload.entityId,
          priority: payload.priority,
          senderRole: payload.senderRole || 'system',
          timestamp: Date.now().toString(),
          url: payload.data?.url || '/',
          ...payload.data,
        },
      },
    });

    if (error) {
      console.error('Error sending notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Chat-specific notification helper
export const sendChatNotification = async (
  receiverId: string,
  senderName: string,
  roomId: string,
  messagePreview: string,
  messageType: 'text' | 'image' | 'voice' = 'text'
): Promise<boolean> => {
  let body = messagePreview;
  let title = senderName;

  if (messageType === 'image') {
    body = '📷 Photo';
    title = `📷 ${senderName}`;
  } else if (messageType === 'voice') {
    body = '🎤 Voice message';
    title = `🎤 ${senderName}`;
  }

  return sendNotificationToUser(receiverId, {
    type: 'chat',
    title,
    body: body.substring(0, 100),
    entityId: roomId,
    priority: 'high',
    senderRole: 'patient', // Will be overridden based on actual sender
    data: {
      url: `/chat/${roomId}`,
      roomId,
      messageType,
    },
  });
};

// Emergency notification helper
export const sendEmergencyNotification = async (
  nurseUserId: string,
  requestId: string,
  patientName: string,
  services: string[],
  city: string | null,
  urgency: string
): Promise<boolean> => {
  const urgencyLabel = urgency === 'critical' ? '🚨 CRITICAL' :
                       urgency === 'within_1_hour' ? '⏰ URGENT' : '📅 Scheduled';

  const servicesText = services.slice(0, 2).join(', ');

  return sendNotificationToUser(nurseUserId, {
    type: 'emergency',
    title: `${urgencyLabel} - Emergency Request`,
    body: `${patientName} needs: ${servicesText}${city ? ` in ${city}` : ''}`,
    entityId: requestId,
    priority: 'critical',
    senderRole: 'patient',
    data: {
      url: '/nurse-emergency-feed',
      requestId,
      urgency,
    },
  });
};

// Appointment notification helper
export const sendAppointmentNotification = async (
  userId: string,
  appointmentId: string,
  title: string,
  body: string,
  notifType: 'booking' | 'confirmation' | 'cancellation' | 'reminder' = 'booking'
): Promise<boolean> => {
  return sendNotificationToUser(userId, {
    type: 'appointment',
    title,
    body,
    entityId: appointmentId,
    priority: notifType === 'reminder' ? 'high' : 'normal',
    senderRole: 'system',
    data: {
      url: '/my-bookings',
      appointmentId,
      notifType,
    },
  });
};

// Export singleton manager
export const notificationManager = {
  setActiveRoom,
  getActiveRoom,
  playNotificationSound,
  triggerVibration,
  showLocalNotification,
  requestNotificationPermission,
  sendNotificationToUser,
  sendChatNotification,
  sendEmergencyNotification,
  sendAppointmentNotification,
};

export default notificationManager;
