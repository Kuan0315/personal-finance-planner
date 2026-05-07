/**
 * routes/goalRoutes.js
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGoals,
  getSummary,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  getAdvice,
  assignPortfolio,
} = require('../controllers/goalController');

// All goal routes are protected
router.use(protect);

router.get('/summary', getSummary);          // GET  /api/goals/summary
router.get('/', getGoals);                   // GET  /api/goals
router.get('/:id', getGoal);                 // GET  /api/goals/:id
router.post('/', createGoal);                // POST /api/goals
router.put('/:id', updateGoal);              // PUT  /api/goals/:id
router.delete('/:id', deleteGoal);           // DELETE /api/goals/:id
router.post('/:id/advice', getAdvice);       // POST /api/goals/:id/advice  ← AI
router.put('/:id/portfolio', assignPortfolio); // PUT /api/goals/:id/portfolio

module.exports = router;