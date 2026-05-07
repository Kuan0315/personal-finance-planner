require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { getMarketInsights } = require('./controllers/marketController');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

const User = require('./models/User')

const goalRoutes = require('./routes/goalRoutes');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);

// 1. Your new "Front Door" route correctly placed AFTER app is defined
app.get('/', (req, res) => {
  res.send('Personal Financial Planning System API is live and running!');
});

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (mongoUri && !mongoUri.includes('your_mongodb_atlas_connection_string_here')) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.warn(`MongoDB connection skipped: ${error.message}`));
} else {
  console.warn('MongoDB URI not configured. Market insights will run without cache.');
}

app.get('/api/market-insights', getMarketInsights);

const goals = [
  { id: 'goal-1', name: 'Dream Home Down Payment', saved: 88400, target: 130000, status: 'on-track', portfolioType: null },
  { id: 'goal-2', name: 'Personal Savings Fund', saved: 44000, target: 100000, status: 'on-track', portfolioType: null },
  { id: 'goal-3', name: 'Emergency Fund', saved: 16500, target: 30000, status: 'at-risk', portfolioType: null },
  { id: 'goal-4', name: 'Travel Fund', saved: 16400, target: 20000, status: 'on-track', portfolioType: null },
  { id: 'goal-5', name: 'Early Retirement Fund', saved: 210000, target: 1000000, status: 'high-risk', portfolioType: null },
  { id: 'goal-6', name: 'Japan Travel Fund', saved: 5500, target: 5500, status: 'completed', portfolioType: null },
  { id: 'goal-7', name: 'Laptop Upgrade Fund', saved: 4000, target: 4000, status: 'completed', portfolioType: null },
];

app.put('/api/goals/:id/apply-portfolio', (req, res) => {
  const goalId = req.params.id;
  const { portfolioType } = req.body;

  if (!portfolioType) {
    return res.status(400).json({ message: 'portfolioType is required' });
  }

  const goal = goals.find(g => g.id === goalId);
  if (!goal) {
    return res.status(404).json({ message: 'Goal not found' });
  }

  goal.portfolioType = portfolioType;
  if (portfolioType === 'aggressive') {
    goal.status = 'high-risk';
  } else if (portfolioType === 'balanced') {
    goal.status = 'on-track';
  } else if (portfolioType === 'conservative') {
    goal.status = goal.status === 'completed' ? 'completed' : 'on-track';
  }

  return res.json(goal);
});

app.listen(PORT, () => {
  console.log(`Personal Finance Planner API is running on http://localhost:${PORT}`);
});

