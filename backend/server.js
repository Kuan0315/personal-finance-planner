require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const goalRoutes = require('./routes/goalRoutes');
const roiRoutes = require('./routes/roiRoutes');
const { getMarketInsights } = require('./controllers/marketController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/roi', roiRoutes);

// Front door route
app.get('/', (req, res) => {
  res.send('Personal Financial Planning System API is live and running!');
});

// Market insights route
app.get('/api/market-insights', getMarketInsights);

// Database connection (ONLY when not testing)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    const ok = await connectDB(mongoUri);
    if (!ok) {
      console.error('Failed to connect to MongoDB. Exiting.');
      process.exit(1);
    }

    // Start server after DB is connected
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
}

module.exports = app;
module.exports.app = app;