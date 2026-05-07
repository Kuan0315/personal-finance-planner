/**
 * services/goalService.js
 * ────────────────────────
 * Business-layer service. Uses Google Gemini API for AI advisory.
 */

const Goal = require('../models/Goal');
const { enrichGoalData, calcAdvisoryInputs } = require('../utils/financialEngine');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const toEnriched = (doc) => {
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return enrichGoalData(plain);
};

const getAllGoals = async (userId) => {
  const docs = await Goal.find({ user: userId }).sort({ createdAt: -1 });
  return docs.map(toEnriched);
};

const getGoalById = async (goalId, userId) => {
  const doc = await Goal.findOne({ _id: goalId, user: userId });
  if (!doc) return null;
  return toEnriched(doc);
};

const createGoal = async (userId, data) => {
  const doc = await Goal.create({ user: userId, ...sanitize(data) });
  return toEnriched(doc);
};

const updateGoal = async (goalId, userId, data) => {
  const doc = await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $set: sanitize(data) },
    { new: true, runValidators: true }
  );
  if (!doc) return null;
  return toEnriched(doc);
};

const deleteGoal = async (goalId, userId) => {
  const doc = await Goal.findOneAndDelete({ _id: goalId, user: userId });
  return doc ? true : false;
};

const sanitize = ({ icon, name, desc, target, savings, monthly, dateLabel }) => ({
  ...(icon      !== undefined && { icon }),
  ...(name      !== undefined && { name }),
  ...(desc      !== undefined && { desc }),
  ...(target    !== undefined && { target: Number(target) }),
  ...(savings   !== undefined && { savings: Number(savings) }),
  ...(monthly   !== undefined && { monthly: Number(monthly) }),
  ...(dateLabel !== undefined && { dateLabel }),
});

const getSummary = async (userId) => {
  const enriched = await getAllGoals(userId);
  return {
    totalGoals:     enriched.length,
    totalSaved:     enriched.reduce((s, g) => s + g.savings, 0),
    monthlyTotal:   enriched.reduce((s, g) => s + g.monthly, 0),
    projectedTotal: enriched.reduce((s, g) => s + g.projectedSavings, 0),
    onTrack:        enriched.filter((g) => g.status === 'on-track' || g.status === 'completed').length,
    needAttention:  enriched.filter((g) => g.status === 'at-risk' || g.status === 'high-risk').length,
  };
};

const getAIAdvice = async (goalId, userId) => {
  const enriched = await getGoalById(goalId, userId);
  if (!enriched) return null;

  if (enriched.status === 'completed') return { completed: true };

  const advisory = calcAdvisoryInputs(enriched, enriched.remainingMonths);
  const { target, savings, monthly, remainingMonths, deficit, optionA, optionB } = advisory;

  const prompt = `You are a concise personal finance advisor.

Goal: "${enriched.name}"
- Target amount: RM ${target.toLocaleString()}
- Current savings: RM ${savings.toLocaleString()}
- Monthly contribution: RM ${monthly.toLocaleString()}
- Months remaining: ${remainingMonths}
- Deficit at current pace: RM ${deficit.toLocaleString()}

Option A (Extend Timeline): Add ${optionA?.extraMonths ?? 'N/A'} extra months.
Option B (Increase Monthly): Raise monthly contribution by RM ${optionB?.monthlyIncrease?.toLocaleString() ?? 'N/A'}.

Respond ONLY with a valid JSON object — no markdown, no extra text:
{
  "optionA": {
    "extraMonths": <number>,
    "description": "<one concise sentence explaining Option A>",
    "tag": "<short 3-5 word label>"
  },
  "optionB": {
    "monthlyIncrease": <number>,
    "description": "<one concise sentence explaining Option B>",
    "tag": "<short 3-5 word label>"
  }
}`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  let parsed = {};
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    parsed = {};
  }

  return {
    completed: false,
    goalName: enriched.name,
    target, savings, monthly, remainingMonths, deficit,
    optionA: {
      extraMonths:   optionA?.extraMonths   ?? null,
      newTargetDate: optionA?.newTargetDate ?? null,
      description:   parsed.optionA?.description ?? '',
      tag:           parsed.optionA?.tag          ?? 'Extend timeline',
    },
    optionB: {
      monthlyIncrease: optionB?.monthlyIncrease ?? null,
      requiredMonthly: optionB?.requiredMonthly ?? null,
      description:     parsed.optionB?.description ?? '',
      tag:             parsed.optionB?.tag          ?? 'Increase contributions',
    },
  };
};

const assignPortfolio = async (goalId, userId, portfolioData) => {
  const doc = await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $set: { assignedPortfolio: portfolioData } },
    { new: true }
  );
  if (!doc) return null;
  return toEnriched(doc);
};

module.exports = {
  getAllGoals, getGoalById, createGoal, updateGoal,
  deleteGoal, getSummary, getAIAdvice, assignPortfolio,
};