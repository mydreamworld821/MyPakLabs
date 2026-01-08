/**
 * Generates a unique ID based on lab name
 * Format: [LAB_INITIALS]-[YEAR]-[5_DIGIT_NUMBER]
 * Example: IDC-2025-00001 for "Islamabad Diagnostic Center"
 */
export const generateLabId = (labName: string): string => {
  // Extract initials from lab name (first letter of each word)
  const initials = labName
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('');

  // Get current year
  const year = new Date().getFullYear();

  // Generate a 5-digit random number (00001 to 99999)
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  const paddedNum = randomNum.toString().padStart(5, '0');

  return `${initials}-${year}-${paddedNum}`;
};

/**
 * Extracts lab initials from lab name
 * Example: "Islamabad Diagnostic Center" -> "IDC"
 */
export const getLabInitials = (labName: string): string => {
  return labName
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('');
};
