import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'mhmmdaqib@gmail.com';

type NotificationType = 
  | 'prescription' 
  | 'order' 
  | 'doctor_appointment' 
  | 'nurse_booking' 
  | 'emergency_request' 
  | 'medicine_order';

interface BaseNotificationData {
  patientName: string;
  patientPhone?: string;
}

interface PrescriptionNotification extends BaseNotificationData {
  type: 'prescription';
}

interface OrderNotification extends BaseNotificationData {
  type: 'order';
  orderId: string;
  labName?: string;
}

interface DoctorAppointmentNotification extends BaseNotificationData {
  type: 'doctor_appointment';
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType?: string;
}

interface NurseBookingNotification extends BaseNotificationData {
  type: 'nurse_booking';
  nurseName: string;
  serviceNeeded: string;
  preferredDate: string;
}

interface EmergencyRequestNotification extends BaseNotificationData {
  type: 'emergency_request';
  city?: string;
  urgency: string;
  services: string[];
}

interface MedicineOrderNotification extends BaseNotificationData {
  type: 'medicine_order';
  orderId: string;
  pharmacyName?: string;
}

type NotificationData = 
  | PrescriptionNotification
  | OrderNotification
  | DoctorAppointmentNotification
  | NurseBookingNotification
  | EmergencyRequestNotification
  | MedicineOrderNotification;

/**
 * Send email notification to admin for any booking/order
 */
export const sendAdminEmailNotification = async (data: NotificationData) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-admin-notification', {
      body: {
        ...data,
        adminEmail: ADMIN_EMAIL,
      },
    });

    if (error) {
      console.error('Error sending admin email notification:', error);
      return { success: false, error };
    }

    console.log('Admin email notification sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error invoking admin notification function:', error);
    return { success: false, error };
  }
};
