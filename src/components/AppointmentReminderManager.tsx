import { useAppointmentReminders } from '@/hooks/useAppointmentReminders';

/**
 * Component that handles appointment reminder notifications.
 * This runs in the background and sends email reminders 5 minutes before appointments.
 */
export const AppointmentReminderManager = () => {
  // This hook checks for upcoming appointments and sends reminders
  useAppointmentReminders();
  
  // This component doesn't render anything
  return null;
};
