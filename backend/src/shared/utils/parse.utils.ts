/**
 * Safely parses a string value into a boolean.
 * Returns true if the string is 'true', '1', 'yes', or 'on' (case-insensitive).
 *
 * @param value The string to parse.
 * @param defaultValue The default value to return if the string is undefined or empty.
 * @returns boolean
 */
export const parseBoolean = (value?: string, defaultValue = false): boolean => {
  if (value === undefined || value === null || value.trim() === '') {
    return defaultValue;
  }
  const lowerValue = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'on'].includes(lowerValue);
};

/**
 * Safely parses a string value into a number.
 * Returns the defaultValue if the string cannot be parsed into a valid number.
 *
 * @param value The string to parse.
 * @param defaultValue The default value to return if parsing fails.
 * @returns number
 */
export const parseNumber = (value?: string, defaultValue = 0): number => {
  if (value === undefined || value === null || value.trim() === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};
