import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  getFCMToken, 
  onForegroundMessage, 
  isMessagingSupported 
} from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  showLocalNotification, 
  playNotificationSound, 
  triggerVibration,
  setActiveRoom,
  getActiveRoom,
  type UnifiedNotificationPayload,
  type NotificationType,
  type NotificationPriority
} from '@/utils/notificationManager';

interface UseFCMOptions {
  onMessage?: (payload: any) => void;
  autoRequestPermission?: boolean;
}

export const useFirebasePushNotifications = (options: UseFCMOptions = {}) => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isMessagingSupported());
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register Firebase messaging service worker
  useEffect(() => {
    const registerFirebaseSW = async () => {
      if (!isMessagingSupported()) return;

      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('Firebase SW registered:', registration);
      } catch (error) {
        console.error('Firebase SW registration failed:', error);
      }
    };

    registerFirebaseSW();
  }, []);

  // Listen for foreground messages (data-only payloads)
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('FCM Foreground message:', payload);
      
      // Extract data from data-only payload
      const data = payload.data || {};
      const type = (data.type as NotificationType) || 'system';
      const title = data.title || payload.notification?.title || 'New Notification';
      const body = data.body || payload.notification?.body || '';
      
      // Build unified payload
      const unifiedPayload: UnifiedNotificationPayload = {
        type,
        title,
        body,
        entityId: data.entityId || data.roomId || data.requestId || '',
        priority: (data.priority as NotificationPriority) || 'normal',
        senderRole: data.senderRole,
        timestamp: parseInt(data.timestamp) || Date.now(),
        data,
      };

      // Show local notification (handles active room check internally)
      showLocalNotification(unifiedPayload);

      // Call custom handler if provided
      options.onMessage?.(payload);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isSupported, options.onMessage]);

  // Listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('App received SW message:', event.data);
      
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const { url, data } = event.data;
        if (url) {
          window.location.href = url;
        }
      }
      
      if (event.data?.type === 'MARK_AS_READ') {
        // Handle mark as read from notification action
        const { roomId } = event.data.data || {};
        if (roomId && user) {
          supabase
            .from('chat_messages')
            .update({ 
              is_read: true, 
              read_at: new Date().toISOString(),
              status: 'read'
            })
            .eq('room_id', roomId)
            .neq('sender_id', user.id)
            .neq('status', 'read');
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [user]);

  // Save FCM token to database
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert(
          {
            user_id: user.id,
            token: token,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'web',
            is_active: true,
          },
          { onConflict: 'user_id,token' }
        );

      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('FCM token saved to database');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }, [user]);

  // Request permission and get token
  const requestPermissionAndGetToken = useCallback(async (): Promise<string | null> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return null;
    }

    setIsLoading(true);

    try {
      const token = await getFCMToken();
      
      if (token) {
        setFcmToken(token);
        setPermission('granted');
        toast.success('Push notifications enabled! 🔔');
        
        // Save token to database
        await saveTokenToDatabase(token);
        
        return token;
      } else {
        setPermission(Notification.permission);
        if (Notification.permission === 'denied') {
          toast.error('Notifications blocked. Please enable in browser settings.');
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      toast.error('Failed to enable push notifications');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, saveTokenToDatabase]);

  return {
    fcmToken,
    permission,
    isLoading,
    isSupported,
    requestPermissionAndGetToken,
    playNotificationSound,
    setActiveRoom,
    getActiveRoom,
  };
};

export default useFirebasePushNotifications;
