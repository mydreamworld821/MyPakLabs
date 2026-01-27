import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Track sent reminders to avoid duplicates
const sentReminders = new Set<string>();

export const useAppointmentReminders = () => {
  const { user } = useAuth();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkAndSendReminders = useCallback(async () => {
    if (!user) return;

    try {
      // Get current time in PKT
      const now = new Date();
      const pktOffset = 5 * 60;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pktNow = new Date(utc + (pktOffset * 60000));

      // Fetch confirmed appointments for the user (as patient or doctor)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          consultation_type,
          status,
          patient_id,
          doctor_id,
          doctors:doctor_id (
            full_name,
            email,
            user_id
          )
        `)
        .eq('status', 'confirmed')
        .gte('appointment_date', pktNow.toISOString().split('T')[0]);

      if (error || !appointments) return;

      for (const apt of appointments) {
        const reminderKey = `${apt.id}-5min`;
        
        // Skip if already sent
        if (sentReminders.has(reminderKey)) continue;

        // Parse appointment time
        const [timePart, period] = apt.appointment_time.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        let hour24 = hours;
        if (period?.toLowerCase() === 'pm' && hours !== 12) hour24 = hours + 12;
        else if (period?.toLowerCase() === 'am' && hours === 12) hour24 = 0;

        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(hour24, minutes, 0, 0);

        // Check if appointment is 5-6 minutes away
        const timeDiff = aptDate.getTime() - pktNow.getTime();
        const minutesUntil = timeDiff / 60000;

        if (minutesUntil >= 4 && minutesUntil <= 6) {
          console.log(`Sending 5-minute reminder for appointment ${apt.id}`);
          
          try {
            // Get patient email
            const { data: patientEmailData } = await supabase.functions.invoke(
              'send-admin-notification',
              { body: { action: 'get_user_email', userId: apt.patient_id } }
            );

            // Get patient profile for name
            const { data: patientProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', apt.patient_id)
              .maybeSingle();

            // Send reminder
            await supabase.functions.invoke('send-admin-notification', {
              body: {
                action: 'send_appointment_reminder',
                patientEmail: patientEmailData?.email,
                patientName: patientProfile?.full_name || 'Patient',
                doctorEmail: (apt.doctors as any)?.email,
                doctorName: (apt.doctors as any)?.full_name || 'Doctor',
                appointmentDate: new Date(apt.appointment_date).toLocaleDateString('en-PK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
                appointmentTime: apt.appointment_time,
                consultationType: apt.consultation_type,
                appointmentId: apt.id,
                minutesUntil: 5
              }
            });

            sentReminders.add(reminderKey);
            console.log(`Reminder sent for appointment ${apt.id}`);
          } catch (sendErr) {
            console.error('Failed to send reminder:', sendErr);
          }
        }
      }
    } catch (err) {
      console.error('Error checking reminders:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial check
    checkAndSendReminders();

    // Check every minute
    checkIntervalRef.current = setInterval(checkAndSendReminders, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, checkAndSendReminders]);
};
