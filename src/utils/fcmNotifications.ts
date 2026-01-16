import { supabase } from '@/integrations/supabase/client';

interface SendFCMNotificationParams {
  title: string;
  body: string;
  userIds?: string[];
  tokens?: string[];
  data?: Record<string, string>;
}

/**
 * Send FCM push notification to users
 */
export const sendFCMNotification = async (params: SendFCMNotificationParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-fcm-notification', {
      body: params,
    });

    if (error) {
      console.error('Error sending FCM notification:', error);
      return { success: false, error };
    }

    console.log('FCM notification result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error invoking FCM function:', error);
    return { success: false, error };
  }
};

/**
 * Send emergency notification to all nearby nurses
 * This fetches nurse user IDs and sends FCM notifications
 */
export const sendEmergencyNotificationToNurses = async (
  requestId: string,
  city: string | null,
  services: string[],
  urgency: string
) => {
  try {
    // Fetch all approved nurses' user IDs
    const { data: nurses, error } = await supabase
      .from('nurses')
      .select('user_id')
      .eq('status', 'approved')
      .eq('emergency_available', true)
      .not('user_id', 'is', null);

    if (error || !nurses || nurses.length === 0) {
      console.log('No nurses available for FCM notification');
      return { success: false, error: 'No nurses available' };
    }

    const userIds = nurses.map(n => n.user_id).filter(Boolean) as string[];
    
    const urgencyLabel = urgency === 'critical' ? '🚨 CRITICAL' :
                         urgency === 'within_1_hour' ? '⏰ URGENT' : '📅 Scheduled';

    const servicesText = services.slice(0, 2).join(', ');
    
    return await sendFCMNotification({
      title: `${urgencyLabel} - New Emergency Request!`,
      body: `Patient needs: ${servicesText}${city ? ` in ${city}` : ''}`,
      userIds,
      data: {
        url: '/nurse-emergency-feed',
        requestId,
        type: 'emergency_request',
      },
    });
  } catch (error) {
    console.error('Error sending emergency FCM notification:', error);
    return { success: false, error };
  }
};
