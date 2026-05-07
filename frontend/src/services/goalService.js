/**
 * services/goalService.js  (FRONTEND)
 * ─────────────────────────────────────
 * Pure HTTP transport layer.
 * NO financial calculations here — all logic lives in the backend.
 */

const BASE = '/api/goals';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const json = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

// ── Fetch all goals (enriched by backend) ────────────────────────────────────
export const fetchGoals = () =>
  fetch(BASE, { headers: authHeader() }).then(json);

// ── Fetch summary stats ───────────────────────────────────────────────────────
export const fetchSummary = () =>
  fetch(`${BASE}/summary`, { headers: authHeader() }).then(json);

// ── Fetch a single goal ───────────────────────────────────────────────────────
export const fetchGoal = (id) =>
  fetch(`${BASE}/${id}`, { headers: authHeader() }).then(json);

// ── Create a goal ─────────────────────────────────────────────────────────────
export const createGoal = (data) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  }).then(json);

// ── Update a goal ─────────────────────────────────────────────────────────────
export const updateGoal = (id, data) =>
  fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  }).then(json);

// ── Delete a goal ─────────────────────────────────────────────────────────────
export const deleteGoal = (id) =>
  fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  }).then(json);

// ── AI Advisory (POST — backend computes + calls Claude) ──────────────────────
export const fetchAdvice = (id) =>
  fetch(`${BASE}/${id}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  }).then(json);

// ── Apply AI Advisory option (A = extend dateLabel, B = increase monthly) ────
export const applyAdviceOption = (id, option, advice) => {
  let patch = {}

  if (option === 'A' && advice.optionA?.newTargetDate) {
    // Option A: extend the deadline
    patch = { dateLabel: advice.optionA.newTargetDate }
  } else if (option === 'B' && advice.optionB?.requiredMonthly) {
    // Option B: increase monthly contribution
    patch = { monthly: advice.optionB.requiredMonthly }
  }

  return updateGoal(id, patch)
}

// ── Assign portfolio to a goal ────────────────────────────────────────────────
export const assignPortfolio = (id, portfolioData) =>
  fetch(`${BASE}/${id}/portfolio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(portfolioData),
  }).then(json);