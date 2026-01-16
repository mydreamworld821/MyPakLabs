import { useState, useEffect } from 'react';
import { Bell, X, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { sendFCMNotification } from '@/utils/fcmNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const NotificationPermissionBanner = () => {
  const { notificationPermission, requestNotificationPermission } = useNotifications();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [testingSending, setTestingSending] = useState(false);

  // Check if we should show the banner
  const shouldShow = 
    notificationPermission === 'default' && 
    !dismissed &&
    'Notification' in window;

  useEffect(() => {
    // Check localStorage for dismissal
    const wasDismissed = localStorage.getItem('notification-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    await requestNotificationPermission();
    setRequesting(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  const handleTestNotification = async () => {
    if (!user) {
      toast.error('Please login to test notifications');
      return;
    }
    
    setTestingSending(true);
    const result = await sendFCMNotification({
      title: '🔔 Test Notification',
      body: 'This is a test push notification from MyPakLabs!',
      userIds: [user.id],
      data: {
        url: '/',
        type: 'test',
      },
    });
    setTestingSending(false);
    
    if (result.success) {
      toast.success('Test notification sent!');
    } else {
      toast.error('Failed to send test notification');
    }
  };

  // Show test button if notifications are enabled
  if (notificationPermission === 'granted' && user) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestNotification}
          disabled={testingSending}
          className="shadow-lg"
        >
          <TestTube2 className="w-4 h-4 mr-2" />
          {testingSending ? 'Sending...' : 'Test Push'}
        </Button>
      </div>
    );
  }

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">
              Enable Notifications
            </h4>
            <p className="text-xs text-primary-foreground/80 mb-3">
              Get instant alerts for new emergency nursing requests, even when the app is closed.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleEnable}
                disabled={requesting}
                className="bg-white hover:bg-white/90 text-primary"
              >
                {requesting ? 'Enabling...' : 'Enable'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
              >
                Not now
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
