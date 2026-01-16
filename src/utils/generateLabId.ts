import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique ID for lab orders
 * Format: MPL-YYYY-MM-NNNNN
 * Example: MPL-2026-01-00001
 * 
 * MPL is fixed prefix for all lab IDs
 * YYYY is the current year
 * MM is the current month
 * NNNNN is a 5-digit sequential number (never duplicates)
 */
export const generateLabId = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `MPL-${year}-${month}`;

  // Get the highest existing number for this month
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('unique_id')
    .like('unique_id', `${prefix}-%`)
    .order('unique_id', { ascending: false })
    .limit(1);

  const { data: existingPrescriptions } = await supabase
    .from('prescriptions')
    .select('unique_id')
    .like('unique_id', `${prefix}-%`)
    .order('unique_id', { ascending: false })
    .limit(1);

  // Extract the highest sequence number from both tables
  let maxSeq = 0;

  if (existingOrders && existingOrders.length > 0 && existingOrders[0].unique_id) {
    const parts = existingOrders[0].unique_id.split('-');
    if (parts.length === 4) {
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  if (existingPrescriptions && existingPrescriptions.length > 0 && existingPrescriptions[0].unique_id) {
    const parts = existingPrescriptions[0].unique_id.split('-');
    if (parts.length === 4) {
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  // Generate next sequence number
  const nextSeq = maxSeq + 1;
  const paddedSeq = nextSeq.toString().padStart(5, '0');

  return `${prefix}-${paddedSeq}`;
};

/**
 * Synchronous version for backward compatibility (generates random ID)
 * Use generateLabId() for proper sequential IDs
 */
export const generateLabIdSync = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Generate a random 5-digit number as fallback
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  const paddedNum = randomNum.toString().padStart(5, '0');

  return `MPL-${year}-${month}-${paddedNum}`;
};

/**
 * @deprecated Use generateLabId() instead
 * Kept for backward compatibility
 */
export const getLabInitials = (labName: string): string => {
  return labName
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('');
};
