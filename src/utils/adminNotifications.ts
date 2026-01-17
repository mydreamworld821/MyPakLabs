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
  patientEmail?: string; // Customer email for confirmation
  patientAge?: number;
  patientGender?: string;
  patientCity?: string;
}

interface TestDetail {
  name: string;
  originalPrice: number;
  discountedPrice: number;
}

interface PrescriptionNotification extends BaseNotificationData {
  type: 'prescription';
}

interface OrderNotification extends BaseNotificationData {
  type: 'order';
  orderId: string;
  labName?: string;
  testNames?: string[];
  totalAmount?: number;
  // PDF generation data
  tests?: TestDetail[];
  totalOriginal?: number;
  totalDiscounted?: number;
  totalSavings?: number;
  discountPercentage?: number;
  validityDays?: number;
  bookingDate?: string;
}

interface DoctorAppointmentNotification extends BaseNotificationData {
  type: 'doctor_appointment';
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType?: string;
  appointmentFee?: number;
}

interface NurseBookingNotification extends BaseNotificationData {
  type: 'nurse_booking';
  nurseName: string;
  serviceNeeded: string;
  preferredDate: string;
  preferredTime?: string;
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
  deliveryAddress?: string;
}

type NotificationData = 
  | PrescriptionNotification
  | OrderNotification
  | DoctorAppointmentNotification
  | NurseBookingNotification
  | EmergencyRequestNotification
  | MedicineOrderNotification;

/**
 * Send email notification to admin and optionally confirmation to customer
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
      console.error('Error sending email notification:', error);
      return { success: false, error };
    }

    console.log('Email notification sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error invoking notification function:', error);
    return { success: false, error };
  }
};
