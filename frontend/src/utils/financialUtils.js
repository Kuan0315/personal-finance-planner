/**
 * utils/financialUtils.js  (FRONTEND)
 * ──────────────────────────────────────
 * DISPLAY-ONLY helpers. No financial calculations.
 * All numbers (progressPercent, projectedSavings, lagPercent, status, etc.)
 * arrive pre-computed from the backend.
 */

/**
 * Format a number as Malaysian Ringgit.
 * e.g. 12500 → "RM 12,500"
 */
export const formatRM = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'RM —';
  return `RM ${Number(value).toLocaleString('en-MY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};