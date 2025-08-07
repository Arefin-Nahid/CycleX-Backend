import moment from 'moment-timezone';

// Set default timezone to Bangladesh (Asia/Dhaka)
const BANGLADESH_TIMEZONE = 'Asia/Dhaka';

/**
 * Get current time in Bangladesh timezone
 * @returns {moment.Moment} Current time in Bangladesh
 */
export const getCurrentTimeInBangladesh = () => {
  return moment().tz(BANGLADESH_TIMEZONE);
};

/**
 * Convert UTC time to Bangladesh timezone
 * @param {Date|string} utcTime - UTC time to convert
 * @returns {moment.Moment} Time in Bangladesh timezone
 */
export const convertToBangladeshTime = (utcTime) => {
  return moment(utcTime).tz(BANGLADESH_TIMEZONE);
};

/**
 * Convert Bangladesh time to UTC
 * @param {Date|string} bangladeshTime - Bangladesh time to convert
 * @returns {moment.Moment} Time in UTC
 */
export const convertToUTC = (bangladeshTime) => {
  return moment.tz(bangladeshTime, BANGLADESH_TIMEZONE).utc();
};

/**
 * Format time for display in Bangladesh timezone
 * @param {Date|string} time - Time to format
 * @param {string} format - Moment.js format string
 * @returns {string} Formatted time string
 */
export const formatBangladeshTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  return convertToBangladeshTime(time).format(format);
};

/**
 * Get Bangladesh timezone offset in hours
 * @returns {number} Timezone offset in hours (6 for Bangladesh)
 */
export const getBangladeshTimezoneOffset = () => {
  return moment().tz(BANGLADESH_TIMEZONE).utcOffset() / 60;
};

/**
 * Create a date in Bangladesh timezone
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @param {number} second - Second (0-59)
 * @returns {moment.Moment} Date in Bangladesh timezone
 */
export const createBangladeshDate = (year, month, day, hour = 0, minute = 0, second = 0) => {
  return moment.tz([year, month - 1, day, hour, minute, second], BANGLADESH_TIMEZONE);
};

/**
 * Get start of day in Bangladesh timezone
 * @param {Date|string} date - Date to get start of day for
 * @returns {moment.Moment} Start of day in Bangladesh timezone
 */
export const getStartOfDayInBangladesh = (date) => {
  return convertToBangladeshTime(date).startOf('day');
};

/**
 * Get end of day in Bangladesh timezone
 * @param {Date|string} date - Date to get end of day for
 * @returns {moment.Moment} End of day in Bangladesh timezone
 */
export const getEndOfDayInBangladesh = (date) => {
  return convertToBangladeshTime(date).endOf('day');
};

/**
 * Check if a time is within business hours in Bangladesh (6 AM to 10 PM)
 * @param {Date|string} time - Time to check
 * @returns {boolean} True if within business hours
 */
export const isWithinBusinessHours = (time) => {
  const bangladeshTime = convertToBangladeshTime(time);
  const hour = bangladeshTime.hour();
  return hour >= 6 && hour < 22;
};

/**
 * Get formatted time difference between two times in Bangladesh timezone
 * @param {Date|string} startTime - Start time
 * @param {Date|string} endTime - End time
 * @returns {string} Formatted time difference
 */
export const getTimeDifference = (startTime, endTime) => {
  const start = convertToBangladeshTime(startTime);
  const end = convertToBangladeshTime(endTime);
  const duration = moment.duration(end.diff(start));
  
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Get current timezone info for Bangladesh
 * @returns {object} Timezone information
 */
export const getBangladeshTimezoneInfo = () => {
  const now = getCurrentTimeInBangladesh();
  return {
    timezone: BANGLADESH_TIMEZONE,
    offset: '+06:00',
    offsetHours: 6,
    currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
    currentTimeFormatted: now.format('MMMM Do YYYY, h:mm A'),
    isDST: now.isDST(),
  };
};

export default {
  getCurrentTimeInBangladesh,
  convertToBangladeshTime,
  convertToUTC,
  formatBangladeshTime,
  getBangladeshTimezoneOffset,
  createBangladeshDate,
  getStartOfDayInBangladesh,
  getEndOfDayInBangladesh,
  isWithinBusinessHours,
  getTimeDifference,
  getBangladeshTimezoneInfo,
};
