/**
 * utils/financialEngine.js
 * ─────────────────────────
 * SINGLE SOURCE OF TRUTH for every financial calculation.
 * No financial logic should exist anywhere else.
 */

/**
 * Parse a "YYYY-MM" dateLabel into a Date object (first day of that month).
 * Returns null if the string is absent or invalid.
 */
const parseDateLabel = (dateLabel) => {
  if (!dateLabel || typeof dateLabel !== 'string') return null;
  const [year, month] = dateLabel.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1); // local midnight, first of month
};

/**
 * remainingMonths
 * Whole calendar months from today until targetDate.
 * Returns 0 if target is in the past or absent.
 */
const calcRemainingMonths = (targetDate) => {
  if (!targetDate) return 0;
  const now = new Date();
  const months =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth());
  return Math.max(0, months);
};

/**
 * remainingDays
 * Full calendar days between today (midnight) and targetDate.
 * Returns 0 if target is in the past or absent.
 */
const calcRemainingDays = (targetDate) => {
  if (!targetDate) return 0;
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = targetDate.getTime() - todayMidnight.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * progressPercent
 * (savings / target) * 100, capped at 100, rounded to 1 dp.
 */
const calcProgressPercent = (savings, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((savings / target) * 1000) / 10);
};

/**
 * projectedSavings
 * savings + (monthly * remainingMonths)
 */
const calcProjectedSavings = (savings, monthly, remainingMonths) => {
  return savings + monthly * remainingMonths;
};

/**
 * lagPercent
 * How far the projection falls short of target, as a % of target.
 * Negative = surplus (ahead of target), Positive = deficit (behind target).
 * (target - projectedSavings) / target * 100
 */
const calcLagPercent = (target, projectedSavings) => {
  if (!target || target <= 0) return 0;
  return Math.round(((target - projectedSavings) / target) * 1000) / 10;
};

/**
 * goalStatus — STRICT STATUS RULES
 * completed  → savings >= target
 * on-track   → projectedSavings >= target
 * at-risk    → projectedSavings is 80–99.9% of target
 * high-risk  → projectedSavings < 80% of target
 */
const calcStatus = (savings, target, projectedSavings) => {
  if (savings >= target) return 'completed';
  if (projectedSavings >= target) return 'on-track';
  const ratio = projectedSavings / target;
  if (ratio >= 0.8) return 'at-risk';
  return 'high-risk';
};

/**
 * AI advisory inputs
 * Returns the two recovery options the AI endpoint needs.
 *
 * Option A – extend timeline
 *   Extra months needed so that savings + monthly*(remainingMonths+extra) >= target
 *   extra = ceil((deficit) / monthly)
 *
 * Option B – increase monthly contribution
 *   New monthly = ceil((target - savings) / remainingMonths)
 *   Increase    = newMonthly - monthly
 */
const calcAdvisoryInputs = (goal, remainingMonths) => {
  const { target, savings, monthly } = goal;
  const projectedSavings = calcProjectedSavings(savings, monthly, remainingMonths);
  const deficit = target - projectedSavings;

  let optionA = null;
  let optionB = null;

  if (deficit > 0) {
    // Option A: how many extra months at current monthly contribution
    const extraMonths = monthly > 0 ? Math.ceil(deficit / monthly) : null;
    optionA = {
      extraMonths,
      newTargetDate: extraMonths
        ? (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + remainingMonths + extraMonths);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          })()
        : null,
    };

    // Option B: how much more per month to still hit target on time
    const requiredMonthly =
      remainingMonths > 0 ? Math.ceil((target - savings) / remainingMonths) : null;
    const monthlyIncrease =
      requiredMonthly !== null ? Math.max(0, requiredMonthly - monthly) : null;
    optionB = { requiredMonthly, monthlyIncrease };
  }

  return {
    target,
    savings,
    monthly,
    remainingMonths,
    deficit: Math.max(0, deficit),
    projectedSavings,
    optionA,
    optionB,
  };
};

/**
 * enrichGoalData
 * Attaches all calculated fields to a plain goal object.
 * Expects: { target, savings, monthly, dateLabel, ... }
 */
const enrichGoalData = (goal) => {
  const targetDate = parseDateLabel(goal.dateLabel);
  const remainingMonths = calcRemainingMonths(targetDate);
  const remainingDays = calcRemainingDays(targetDate);
  const progressPercent = calcProgressPercent(goal.savings, goal.target);
  const projectedSavings = calcProjectedSavings(goal.savings, goal.monthly, remainingMonths);
  const lagPercent = calcLagPercent(goal.target, projectedSavings);
  const status = calcStatus(goal.savings, goal.target, projectedSavings);
  const hasAI = status !== 'completed';

  return {
    ...goal,
    remainingMonths,
    remainingDays,
    progressPercent,
    projectedSavings,
    lagPercent,
    status,
    hasAI,
  };
};

module.exports = {
  parseDateLabel,
  calcRemainingMonths,
  calcRemainingDays,
  calcProgressPercent,
  calcProjectedSavings,
  calcLagPercent,
  calcStatus,
  calcAdvisoryInputs,
  enrichGoalData,
};