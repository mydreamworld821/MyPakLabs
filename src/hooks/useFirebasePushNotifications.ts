import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  getFCMToken, 
  onForegroundMessage, 
  isMessagingSupported 
} from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

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
        // Register the Firebase messaging service worker
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

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('FCM Foreground message:', payload);
      
      // Show toast notification for foreground messages
      const title = payload.notification?.title || 'New Notification';
      const body = payload.notification?.body || '';
      
      toast(title, {
        description: body,
        duration: 5000,
      });

      // Play notification sound
      playNotificationSound();

      // Call custom handler if provided
      options.onMessage?.(payload);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isSupported, options.onMessage]);

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

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playNote(523.25, now, 0.15);
      playNote(659.25, now + 0.12, 0.15);
      playNote(783.99, now + 0.24, 0.2);
      
      setTimeout(() => audioContext.close(), 600);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  };

  return {
    fcmToken,
    permission,
    isLoading,
    isSupported,
    requestPermissionAndGetToken,
    playNotificationSound,
  };
};

export default useFirebasePushNotifications;
