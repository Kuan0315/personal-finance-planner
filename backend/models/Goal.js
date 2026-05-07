const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🏠' },
  targetAmount: { type: Number, required: true },
  currentSavings: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  
}, { timestamps: true });

// ── Virtual: months remaining ──────────────────────────
goalSchema.virtual('monthsRemaining').get(function () {
  const now = new Date();
  const end = new Date(this.targetDate);
  return Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  );
});

// ── Virtual: monthly saving needed ────────────────────
// Formula: (Target - Saved) / Months
goalSchema.virtual('monthlySavingNeeded').get(function () {
  const remaining = Math.max(0, this.targetAmount - this.currentSavings);
  return parseFloat((remaining / this.monthsRemaining).toFixed(2));
});

// ── Virtual: progress percent ─────────────────────────
goalSchema.virtual('progressPercent').get(function () {
  if (this.targetAmount === 0) return 100;
  return Math.min(100, parseFloat(((this.currentSavings / this.targetAmount) * 100).toFixed(1)));
});

// ── Virtual: lag percent ──────────────────────────────
// How far behind the expected savings pace (based on time elapsed)
goalSchema.virtual('lagPercent').get(function () {
  if (this.currentSavings >= this.targetAmount) return 0;

  // Expected savings by now based on time elapsed
  const createdAt = this.createdAt || new Date();
  const now = new Date();
  const end = new Date(this.targetDate);

  const totalMonths = Math.max(
    1,
    (end.getFullYear() - createdAt.getFullYear()) * 12 + (end.getMonth() - createdAt.getMonth())
  );
  const elapsedMonths = Math.max(
    0,
    (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
  );

  const expectedByNow = (this.targetAmount / totalMonths) * elapsedMonths;
  const lag = Math.max(0, expectedByNow - this.currentSavings);
  const lagPct = parseFloat(((lag / this.targetAmount) * 100).toFixed(1));
  return Math.min(lagPct, 99); // cap at 99%
});

// ── Virtual: auto status ──────────────────────────────
goalSchema.virtual('status').get(function () {
  if (this.currentSavings >= this.targetAmount) return 'completed';
  const ratio = this.monthlySavingNeeded / (this.targetAmount * 0.05);
  if (ratio > 1.5) return 'high-risk';
  if (ratio > 0.8) return 'at-risk';
  return 'on-track';
});

// ── Virtual: feasibility ──────────────────────────────
goalSchema.virtual('feasibility').get(function () {
  const monthly = this.monthlySavingNeeded;
  if (this.currentSavings >= this.targetAmount) {
    return { label: '✅ Completed', level: 'completed' };
  }
  if (monthly > this.targetAmount * 0.1) {
    return { label: '⚠️ Not Realistic', level: 'hard' };
  }
  if (monthly > this.targetAmount * 0.03) {
    return { label: '⚖️ Manageable', level: 'moderate' };
  }
  return { label: '✅ Easily Achievable', level: 'easy' };
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);