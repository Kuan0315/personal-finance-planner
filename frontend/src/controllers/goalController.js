/**
 * controllers/goalController.js  (FRONTEND)
 * ───────────────────────────────────────────
 * Adapts the raw API service for GoalsPage consumption.
 * Contains ONLY:
 *   • API call wrappers (delegates to goalService)
 *   • Pure UI helpers (filter, empty form shape)
 *
 * NO financial calculations — those live entirely in the backend.
 */

import {
  fetchGoals,
  fetchSummary,
  createGoal as apiCreate,
  updateGoal as apiUpdate,
  deleteGoal as apiDelete,
  fetchAdvice as apiFetchAdvice,
} from '../services/goalService';

// ── Data loaders ──────────────────────────────────────────────────────────────

export const loadGoals = () => fetchGoals();

export const loadSummary = () => fetchSummary();

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const createGoal = (formData) => apiCreate(formData);

export const updateGoal = (id, formData) => apiUpdate(id, formData);

export const deleteGoal = (id) => apiDelete(id);

// ── AI Advisory ───────────────────────────────────────────────────────────────

export const fetchAdvice = (goalId) => apiFetchAdvice(goalId);

// ── UI helpers ────────────────────────────────────────────────────────────────

/**
 * Returns a blank form object that matches the shape GoalsPage expects.
 * No defaults with computed values — those come from the backend.
 */
export const emptyForm = () => ({
  icon: '📦',
  name: '',
  desc: '',
  target: '',
  savings: '',
  monthly: '',
  dateLabel: '',
});

/**
 * Client-side filter/search — purely presentational, no financial logic.
 * The `status` field on each goal is already computed by the backend.
 */
export const filterGoals = (goals, filter, searchTerm) => {
  let result = goals;

  if (filter !== 'all') {
    result = result.filter((g) => g.status === filter);
  }

  if (searchTerm?.trim()) {
    const q = searchTerm.toLowerCase();
    result = result.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.desc?.toLowerCase().includes(q)
    );
  }

  return result;
};