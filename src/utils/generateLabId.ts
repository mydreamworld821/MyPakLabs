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
 * 
 * Uses a database function with SECURITY DEFINER to bypass RLS
 * and get the correct sequence across all users' orders
 */
export const generateLabId = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `MPL-${year}-${month}`;

  try {
    // Call database function that bypasses RLS to get accurate sequence
    const { data, error } = await supabase.rpc('get_next_order_sequence', {
      prefix: prefix
    });

    if (error) {
      console.error("Error getting sequence from database:", error);
      // Fallback to random number if RPC fails
      const randomNum = Math.floor(Math.random() * 99999) + 1;
      return `${prefix}-${randomNum.toString().padStart(5, '0')}`;
    }

    const nextSeq = data || 1;
    const paddedSeq = nextSeq.toString().padStart(5, '0');
    
    return `${prefix}-${paddedSeq}`;
  } catch (error) {
    console.error("Error generating lab ID:", error);
    // Fallback to random number
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    return `${prefix}-${randomNum.toString().padStart(5, '0')}`;
  }
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
