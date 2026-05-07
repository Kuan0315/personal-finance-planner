const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  { pct: Number, label: String },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    name: String,
    riskLevel: String,
    allocation: [allocationSchema],
    instruments: [String],
    expectedReturn: String,
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    icon: { type: String, default: '📦' },
    name: { type: String, required: true, trim: true },
    desc: { type: String, default: '' },
    target: { type: Number, required: true, min: 1 },
    savings: { type: Number, default: 0, min: 0 },
    monthly: { type: Number, default: 0, min: 0 },
    // stored as "YYYY-MM" string, e.g. "2027-06"
    dateLabel: { type: String, default: '' },
    assignedPortfolio: { type: portfolioSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);