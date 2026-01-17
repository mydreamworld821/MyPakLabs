import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'mhmmdaqib@gmail.com';

type NotificationType = 
  | 'prescription' 
  | 'order' 
  | 'doctor_appointment' 
  | 'nurse_booking' 
  | 'emergency_request' 
  | 'medicine_order';

type NotificationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BaseNotificationData {
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  patientCity?: string;
  bookingId?: string;
  status?: NotificationStatus;
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
  doctorId?: string;
  doctorName: string;
  doctorQualification?: string;
  doctorSpecialization?: string;
  doctorPhone?: string;
  clinicName?: string;
  clinicAddress?: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType?: string;
  appointmentFee?: number;
}

interface NurseBookingNotification extends BaseNotificationData {
  type: 'nurse_booking';
  nurseId?: string;
  nurseName: string;
  nurseQualification?: string;
  nursePhone?: string;
  serviceNeeded: string;
  preferredDate: string;
  preferredTime?: string;
  patientAddress?: string;
  nurseNotes?: string;
  serviceFee?: number;
}

interface EmergencyRequestNotification extends BaseNotificationData {
  type: 'emergency_request';
  city?: string;
  urgency: string;
  services: string[];
}

interface MedicineOrderNotification extends BaseNotificationData {
  type: 'medicine_order';
  storeId?: string;
  orderId: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
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
 * For doctor/nurse bookings, the status determines the message:
 * - 'pending': "Your booking request has been received, we will confirm soon"
 * - 'confirmed': "Your booking has been confirmed" + PDF slip
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

/**
 * Send confirmation notification when a booking is confirmed
 * This should be called from admin panels when status changes to 'confirmed'
 */
export const sendBookingConfirmationNotification = async (
  type: 'doctor_appointment' | 'nurse_booking',
  bookingData: Partial<DoctorAppointmentNotification | NurseBookingNotification>
) => {
  return sendAdminEmailNotification({
    ...bookingData,
    type,
    status: 'confirmed',
  } as NotificationData);
};
