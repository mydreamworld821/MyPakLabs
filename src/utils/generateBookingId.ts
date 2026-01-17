import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique booking ID using database function
 * Doctor: MPL-DD-DR-NNNNN
 * Nurse: MPL-DD-NS-NNNNN
 */
export const generateBookingUniqueId = async (type: 'doctor' | 'nurse'): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('generate_booking_unique_id', {
      booking_type: type
    });

    if (error) {
      console.error("Error generating booking ID:", error);
      // Fallback to client-side generation
      return generateFallbackId(type);
    }

    return data as string;
  } catch (error) {
    console.error("Error calling generate_booking_unique_id:", error);
    return generateFallbackId(type);
  }
};

/**
 * Fallback client-side ID generation if database function fails
 */
const generateFallbackId = (type: 'doctor' | 'nurse'): string => {
  const now = new Date();
  // Get Pakistan time (UTC+5)
  const pktOffset = 5 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pktTime = new Date(utc + (pktOffset * 60000));
  
  const day = pktTime.getDate().toString().padStart(2, '0');
  const prefix = type === 'doctor' ? 'DR' : 'NS';
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  
  return `MPL-${day}-${prefix}-${randomNum.toString().padStart(5, '0')}`;
};
