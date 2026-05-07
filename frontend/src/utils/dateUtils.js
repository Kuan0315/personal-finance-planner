/**
 * utils/dateUtils.js  (FRONTEND)
 * ────────────────────────────────
 * DISPLAY-ONLY. Converts pre-computed { months, days } from the backend
 * into a human-readable string. No date arithmetic here.
 */

/**
 * formatRemainingTime({ months, days })
 * Returns a compact label like "2y 3m", "4m", "18d", or "Due soon".
 */
export const formatRemainingTime = ({ months = 0, days = 0 } = {}) => {
  if (months <= 0 && days <= 0) return 'Due soon';

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (years > 0 && remMonths > 0) return `${years}y ${remMonths}m`;
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}m`;
  return `${days}d`;
};