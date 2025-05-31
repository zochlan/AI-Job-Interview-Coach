/**
 * Utility functions for handling time-related operations
 */

/**
 * Gets the current time from the server to avoid issues with incorrect client system clocks
 * Falls back to client time if server is unreachable
 * @returns Promise<number> - Current timestamp in milliseconds
 */
export const getServerTime = async (): Promise<number> => {
  try {
    // Try to get the server time
    const response = await fetch('/time');
    if (response.ok) {
      const data = await response.json();
      return data.timestamp;
    }

    // If server time is not available, use client time
    console.warn('Could not get server time, using client time instead');
    return Date.now();
  } catch (error) {
    console.error('Error getting server time:', error);
    // Fall back to client time
    return Date.now();
  }
};

/**
 * Calculates the time difference between server and client
 * This can be used to adjust timestamps throughout the application
 * @returns Promise<number> - Time difference in milliseconds (server - client)
 */
export const getTimeDifference = async (): Promise<number> => {
  const clientTime = Date.now();
  const serverTime = await getServerTime();
  return serverTime - clientTime;
};

/**
 * Gets the adjusted current time, accounting for any difference between server and client clocks
 * @param timeDifference - The time difference between server and client (from getTimeDifference)
 * @returns number - Adjusted current timestamp in milliseconds
 */
export const getAdjustedTime = (timeDifference: number = 0): number => {
  return Date.now() + timeDifference;
};

/**
 * Formats a date for display
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns string - Formatted date string
 */
export const formatDate = (
  date: Date | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};
