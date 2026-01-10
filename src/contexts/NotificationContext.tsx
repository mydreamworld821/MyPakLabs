import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import FlashNotification from '@/components/FlashNotification';

interface EmergencyNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'urgent' | 'info';
  navigateTo: string;
  createdAt: Date;
}

interface NotificationContextType {
  pendingNotifications: EmergencyNotification[];
  dismissNotification: (id: string) => void;
  requestNotificationPermission: () => Promise<boolean>;
  notificationPermission: NotificationPermission;
  hasUnreadNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const { permission, requestPermission, showNotification, playNotificationSound } = usePushNotifications();
  const [pendingNotifications, setPendingNotifications] = useState<EmergencyNotification[]>([]);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const [isApprovedNurse, setIsApprovedNurse] = useState(false);

  // Check if user is an approved nurse
  useEffect(() => {
    const checkNurseStatus = async () => {
      if (!user) {
        setNurseId(null);
        setIsApprovedNurse(false);
        return;
      }

      const { data } = await supabase
        .from('nurses')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && data.status === 'approved') {
        setNurseId(data.id);
        setIsApprovedNurse(true);
      } else {
        setNurseId(null);
        setIsApprovedNurse(false);
      }
    };

    checkNurseStatus();
  }, [user]);

  // Subscribe to emergency requests if user is an approved nurse
  useEffect(() => {
    if (!isApprovedNurse || !nurseId) return;

    console.log('Setting up emergency request notifications for nurse:', nurseId);

    const channel = supabase
      .channel('nurse-emergency-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_nursing_requests',
        },
        (payload) => {
          console.log('New emergency request received:', payload);
          handleNewEmergencyRequest(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Notification channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isApprovedNurse, nurseId, permission]);

  const handleNewEmergencyRequest = useCallback((request: any) => {
    const urgencyType = request.urgency === 'critical' ? 'critical' : 
                        request.urgency === 'within_1_hour' ? 'urgent' : 'info';
    
    const urgencyLabel = request.urgency === 'critical' ? '🚨 CRITICAL' :
                         request.urgency === 'within_1_hour' ? '⏰ URGENT' : '📅 Scheduled';

    const servicesText = Array.isArray(request.services_needed) 
      ? request.services_needed.slice(0, 2).join(', ')
      : 'Nursing care';

    const title = `${urgencyLabel} - New Emergency Request!`;
    const message = `Patient needs: ${servicesText}${request.city ? ` in ${request.city}` : ''}`;

    // Play sound immediately
    playNotificationSound();

    // Show browser notification (works even when tab is in background)
    if (permission === 'granted') {
      showNotification({
        title,
        body: message,
        data: { url: '/nurse-emergency-feed' }
      });
    }

    // Add to flash notifications queue
    const notification: EmergencyNotification = {
      id: request.id,
      title,
      message,
      type: urgencyType,
      navigateTo: '/nurse-emergency-feed',
      createdAt: new Date(),
    };

    setPendingNotifications((prev) => {
      // Don't add duplicate notifications
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  }, [permission, showNotification, playNotificationSound]);

  const dismissNotification = useCallback((id: string) => {
    setPendingNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const currentNotification = pendingNotifications[0];

  return (
    <NotificationContext.Provider
      value={{
        pendingNotifications,
        dismissNotification,
        requestNotificationPermission: requestPermission,
        notificationPermission: permission,
        hasUnreadNotifications: pendingNotifications.length > 0,
      }}
    >
      {children}
      
      {/* Flash Notification Banner */}
      {currentNotification && (
        <FlashNotification
          title={currentNotification.title}
          message={currentNotification.message}
          type={currentNotification.type}
          navigateTo={currentNotification.navigateTo}
          onDismiss={() => dismissNotification(currentNotification.id)}
          autoHideSeconds={15}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
