import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker on mount
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered:', registration);
          setSwRegistration(registration);
          setServiceWorkerReady(true);
          
          // Check for updates
          registration.update();
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();

    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled! 🔔',
          description: 'You will receive alerts for new emergency requests',
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Show a system notification (like WhatsApp notifications in status bar)
  const showNotification = useCallback(async (notificationData: NotificationData) => {
    console.log('showNotification called, permission:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Play notification sound
    playNotificationSound();

    try {
      // Try service worker first for better mobile support
      if (swRegistration?.active) {
        console.log('Sending notification via service worker');
        swRegistration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data
        });
      }
      
      // Also show via Notification API directly for immediate display
      // This ensures notification appears in system tray like WhatsApp
      if ('Notification' in window) {
        console.log('Creating direct notification');
        const notification = new Notification(notificationData.title, {
          body: notificationData.body,
          icon: '/images/mypaklabs-logo.png',
          badge: '/images/mypaklabs-logo.png',
          tag: `emergency-${Date.now()}`, // Unique tag to prevent overwriting
          requireInteraction: true, // Keep notification until user interacts
          silent: false, // Allow system sound
        } as NotificationOptions);

        notification.onclick = () => {
          window.focus();
          if (notificationData.data?.url) {
            window.location.href = notificationData.data.url as string;
          }
          notification.close();
        };
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission, swRegistration]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create two-note chime
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

      // Play ascending chime (like message tone)
      const now = audioContext.currentTime;
      playNote(523.25, now, 0.15);        // C5
      playNote(659.25, now + 0.12, 0.15); // E5
      playNote(783.99, now + 0.24, 0.2);  // G5
      
      // Close context after sound completes
      setTimeout(() => audioContext.close(), 600);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  };

  return {
    permission,
    serviceWorkerReady,
    requestPermission,
    showNotification,
    playNotificationSound,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  };
};

export default usePushNotifications;
