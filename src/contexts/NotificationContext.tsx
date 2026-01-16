import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useFirebasePushNotifications } from '@/hooks/useFirebasePushNotifications';
import EmergencyFlashNotification from '@/components/EmergencyFlashNotification';

interface EmergencyNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'urgent' | 'info';
  navigateTo: string;
  createdAt: Date;
  // Additional data for InDrive-style notification
  patientName: string;
  city: string | null;
  services: string[];
  urgency: 'critical' | 'within_1_hour' | 'scheduled';
  distance: number | null;
  patientOfferPrice: number | null;
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

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const { permission, requestPermission, showNotification, playNotificationSound } = usePushNotifications();
  const { 
    requestPermissionAndGetToken: requestFCMPermission, 
    isSupported: isFCMSupported 
  } = useFirebasePushNotifications();
  const [pendingNotifications, setPendingNotifications] = useState<EmergencyNotification[]>([]);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const [isApprovedNurse, setIsApprovedNurse] = useState(false);
  const [nurseLocation, setNurseLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nurseRadius, setNurseRadius] = useState<number>(10); // Default 10km

  // Get nurse's current location
  useEffect(() => {
    if (!isApprovedNurse) return;

    const getLocation = () => {
      if (!navigator.geolocation) return;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNurseLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log('Nurse location updated:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Location error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Get location immediately and then every 5 minutes
    getLocation();
    const interval = setInterval(getLocation, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isApprovedNurse]);

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
        .select('id, status, home_visit_radius')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && data.status === 'approved') {
        setNurseId(data.id);
        setIsApprovedNurse(true);
        setNurseRadius(data.home_visit_radius || 10);
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
  }, [isApprovedNurse, nurseId, nurseLocation, nurseRadius, permission]);

  const handleNewEmergencyRequest = useCallback((request: any) => {
    console.log('handleNewEmergencyRequest called:', request);
    
    // Check distance if we have nurse location
    let distance: number | null = null;
    if (nurseLocation) {
      distance = calculateDistance(
        nurseLocation.lat,
        nurseLocation.lng,
        request.location_lat,
        request.location_lng
      );
      
      console.log('Distance to request:', distance, 'km, Nurse radius:', nurseRadius, 'km');
      
      // Only notify if within radius (default 10km if not set)
      if (distance > nurseRadius) {
        console.log('Request too far, skipping notification');
        return;
      }
    }
    
    const urgencyType = request.urgency === 'critical' ? 'critical' : 
                        request.urgency === 'within_1_hour' ? 'urgent' : 'info';
    
    const urgencyLabel = request.urgency === 'critical' ? '🚨 CRITICAL' :
                         request.urgency === 'within_1_hour' ? '⏰ URGENT' : '📅 Scheduled';

    const servicesText = Array.isArray(request.services_needed) 
      ? request.services_needed.slice(0, 2).join(', ')
      : 'Nursing care';

    const title = `${urgencyLabel} - New Emergency Request!`;
    const message = `Patient needs: ${servicesText}${request.city ? ` in ${request.city}` : ''}${distance ? ` (${distance.toFixed(1)}km away)` : ''}`;

    // Play sound immediately
    console.log('Playing notification sound');
    playNotificationSound();

    // Show browser/system notification
    console.log('Notification permission:', permission);
    if (permission === 'granted') {
      console.log('Showing system notification');
      showNotification({
        title,
        body: message,
        data: { url: '/nurse-emergency-feed' }
      });
    }

    // Add to flash notifications queue (in-app InDrive-style notification)
    const notification: EmergencyNotification = {
      id: request.id,
      title,
      message,
      type: urgencyType,
      navigateTo: '/nurse-emergency-feed',
      createdAt: new Date(),
      patientName: request.patient_name || 'Patient',
      city: request.city,
      services: request.services_needed || [],
      urgency: request.urgency,
      distance: distance ? Math.round(distance * 10) / 10 : null,
      patientOfferPrice: request.patient_offer_price,
    };

    console.log('Adding flash notification:', notification);
    setPendingNotifications((prev) => {
      // Don't add duplicate notifications
      if (prev.some((n) => n.id === notification.id)) return prev;
      const updated = [notification, ...prev];
      console.log('Updated pending notifications:', updated.length);
      return updated;
    });
  }, [permission, showNotification, playNotificationSound, nurseLocation, nurseRadius]);

  // Combined permission request that also enables FCM
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const browserResult = await requestPermission();
    
    // Also request FCM permission if supported
    if (isFCMSupported && browserResult) {
      await requestFCMPermission();
    }
    
    return browserResult;
  }, [requestPermission, requestFCMPermission, isFCMSupported]);

  const dismissNotification = useCallback((id: string) => {
    setPendingNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const currentNotification = pendingNotifications[0];

  return (
    <NotificationContext.Provider
      value={{
        pendingNotifications,
        dismissNotification,
        requestNotificationPermission,
        notificationPermission: permission,
        hasUnreadNotifications: pendingNotifications.length > 0,
      }}
    >
      {children}
      
      {/* InDrive-Style Emergency Flash Notification */}
      {currentNotification && (
        <EmergencyFlashNotification
          requestId={currentNotification.id}
          patientName={currentNotification.patientName}
          city={currentNotification.city}
          services={currentNotification.services}
          urgency={currentNotification.urgency}
          distance={currentNotification.distance}
          patientOfferPrice={currentNotification.patientOfferPrice}
          onDismiss={() => dismissNotification(currentNotification.id)}
          autoHideSeconds={30}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
