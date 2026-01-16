import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  getFCMToken, 
  onForegroundMessage, 
  isMessagingSupported 
} from '@/lib/firebase';

interface UseFCMOptions {
  onMessage?: (payload: any) => void;
  autoRequestPermission?: boolean;
}

export const useFirebasePushNotifications = (options: UseFCMOptions = {}) => {
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
        
        // Here you would typically save the token to your database
        // to send notifications to this device later
        console.log('FCM Token to save:', token);
        
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
  }, [isSupported]);

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
