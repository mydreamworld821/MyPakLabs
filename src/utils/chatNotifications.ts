// Local notification helper for WhatsApp-like chat notifications
export interface ChatNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: {
    roomId?: string;
    messageId?: string;
    url?: string;
  };
  requireInteraction?: boolean;
}

class ChatNotificationManager {
  private permission: NotificationPermission = 'default';
  private notificationSound: HTMLAudioElement | null = null;

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    // Create notification sound
    this.initSound();
  }

  private initSound() {
    // Create a simple notification beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Web Audio API not supported for notification sound');
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async showNotification(options: ChatNotificationOptions): Promise<Notification | null> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return null;
    }

    // Request permission if needed
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Don't show notification if page is focused
    if (document.hasFocus()) {
      // Just play sound for in-app notification
      this.playSound();
      return null;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/favicon.png',
        tag: options.tag || `chat-${Date.now()}`,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: false,
      };

      const notification = new Notification(options.title, notificationOptions);

      // Play custom sound
      this.playSound();

      // Handle click
      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        } else if (options.data?.roomId) {
          window.location.href = `/chat/${options.data.roomId}`;
        }
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  private playSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create two beeps like WhatsApp
      const playBeep = (startTime: number, frequency: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      };

      const now = audioContext.currentTime;
      playBeep(now, 800);
      playBeep(now + 0.2, 1000);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Singleton instance
export const chatNotificationManager = new ChatNotificationManager();
