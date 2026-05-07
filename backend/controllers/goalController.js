const Goal = require('../models/Goal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper: format goal for frontend
const formatGoal = (goal) => ({
  id: goal._id,
  name: goal.name,
  desc: goal.description,
  icon: goal.icon,
  target: `RM ${goal.targetAmount.toLocaleString()}`,
  savings: `RM ${goal.currentSavings.toLocaleString()}`,
  targetAmount: goal.targetAmount,
  currentSavings: goal.currentSavings,
  monthly: `RM ${goal.monthlySavingNeeded.toLocaleString()}`,
  monthlySavingNeeded: goal.monthlySavingNeeded,
  monthsRemaining: goal.monthsRemaining,
  monthlyContribution: goal.monthlyContribution,
  monthly: `RM ${(goal.monthlyContribution || goal.monthlySavingNeeded).toLocaleString()}`,
  dateLabel: goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '',
  progressPercent: goal.progressPercent,
  lagPercent: goal.lagPercent,
  status: goal.status,
  feasibility: goal.feasibility,
  hasAI: true,
});

// ── GET /api/goals ─────────────────────────────────────
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(goals.map(formatGoal));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/goals ────────────────────────────────────
exports.createGoal = async (req, res) => {
  try {
    const { name, description, icon, targetAmount, currentSavings, targetDate, monthlyContribution } = req.body;
    const goal = await Goal.create({
      user: req.user.id,
      name, description, icon,
      targetAmount: Number(targetAmount),
      currentSavings: Number(currentSavings) || 0,
      targetDate,
      monthlyContribution: Number(monthlyContribution) || 0,
    });
    res.status(201).json(formatGoal(goal));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── PUT /api/goals/:id ─────────────────────────────────
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { name, description, icon, targetAmount, currentSavings, targetDate, monthlyContribution } = req.body;
    if (name !== undefined) goal.name = name;
    if (description !== undefined) goal.description = description;
    if (icon !== undefined) goal.icon = icon;
    if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
    if (currentSavings !== undefined) goal.currentSavings = Number(currentSavings);
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (monthlyContribution !== undefined) goal.monthlyContribution = Number(monthlyContribution);

    await goal.save();
    res.json(formatGoal(goal));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── DELETE /api/goals/:id ──────────────────────────────
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/goals/:id/ai-advice ───────────────────────
exports.getAIAdvice = async (req, res) => {
  const userMonthly = goal.monthlyContribution || goal.monthlySavingNeeded;
  const remaining = Math.max(0, goal.targetAmount - goal.currentSavings);

  // Option A: how many extra months if we keep current monthly saving
  const totalMonthsNeeded = Math.ceil(remaining / userMonthly);
  const extraMonths = Math.max(0, totalMonthsNeeded - months);
  const newDeadline = new Date();
  newDeadline.setMonth(newDeadline.getMonth() + totalMonthsNeeded);
  const newDeadlineLabel = newDeadline.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const optionA = {
    extraMonths,
    newDeadline: newDeadlineLabel,
    currentMonthly: userMonthly,
    desc: `Keeping RM ${userMonthly.toLocaleString()}/month, you'll reach your goal by ${newDeadlineLabel} (${extraMonths} extra months).`,
  };

  // Option B: how much to increase monthly to still hit original deadline
  const exactMonthlyNeeded = parseFloat((remaining / months).toFixed(2));
  const increase = parseFloat((exactMonthlyNeeded - userMonthly).toFixed(2));

  const optionB = {
    newMonthly: exactMonthlyNeeded,
    increase: Math.max(0, increase),
    desc: `Increase to RM ${exactMonthlyNeeded.toLocaleString()}/month (+RM ${Math.max(0, increase).toLocaleString()}) to hit your original deadline.`,
  };

  // ── Gemini AI personalized advice ─────────────────
  let aiAdvice = null;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a professional personal financial advisor in Malaysia. A user needs help with their financial goal.

GOAL ANALYSIS:
- Goal Name: ${goal.name}
- Target Amount: RM ${goal.targetAmount.toLocaleString()}
- Current Savings: RM ${goal.currentSavings.toLocaleString()}
- Amount Remaining: RM ${remaining.toLocaleString()}
- Monthly Saving Needed: RM ${monthly.toLocaleString()}
- Months Remaining: ${months} months (${Math.floor(months / 12)} years ${months % 12} months)
- Progress: ${goal.progressPercent}%
- Status: ${goal.status.toUpperCase()}
- Feasibility: ${feasibility.label}

TWO OPTIONS CALCULATED:
- Option A (Extend Time): Keep RM ${monthly.toLocaleString()}/month, finish by ${newDeadlineLabel} (${extraMonths} extra months)
- Option B (Increase Amount): Save RM ${exactMonthlyNeeded.toLocaleString()}/month (+RM ${Math.max(0, increase).toLocaleString()} more) to keep original deadline

Please provide a SHORT, PERSONALIZED financial advisory response with:
1. One sentence assessing their "${goal.name}" goal specifically
2. Which option (A or B) you recommend and why (1-2 sentences)
3. Three specific behavioural finance tips tailored to this goal type (auto-transfer, expense cutting, consistency, risk awareness, investment diversification — pick what's most relevant)
4. One motivational closing line

Keep it concise, friendly, specific. Use RM currency. Plain text only, no markdown, no bullet symbols.
Max 150 words total.
      `;

    const result = await model.generateContent(prompt);
    aiAdvice = result.response.text();
  } catch (aiErr) {
    console.warn('Gemini AI failed:', aiErr.message);
    aiAdvice = null;
  }

  // ── Fallback tips if Gemini fails ─────────────────
  const tips = aiAdvice ? null : (() => {
    if (feasibility.level === 'hard') return [
      'Set up an automatic transfer on payday so savings happen before you spend.',
      'Review subscriptions and non-essential spending — even RM200/month saved adds up significantly.',
      'Consider a side income: freelancing, part-time, or selling unused items.',
      '⚠️ High risk: without changes, this goal may not be achievable by the deadline.',
    ];
    if (feasibility.level === 'moderate') return [
      'Automate your monthly transfer to avoid missing contributions.',
      'Review your budget quarterly to find extra savings opportunities.',
      'Stay consistent — missing even 2 months can set you back significantly.',
    ];
    return [
      'You are on a great track! Consider putting surplus into low-risk unit trusts.',
      'Keep your automated transfers running and avoid withdrawing from this fund.',
      'Review your goal yearly to adjust for inflation or lifestyle changes.',
    ];
  })();

  res.json({
    goal: formatGoal(goal),
    monthlySavingNeeded: monthly,
    monthsRemaining: months,
    remaining,
    feasibility,
    optionA,
    optionB,
    aiAdvice,
    tips,
  });
} catch (err) {
  res.status(500).json({ message: err.message });
}
};