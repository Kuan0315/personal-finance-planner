const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoal, deleteGoal, getAIAdvice } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // all goal routes require login

router.route('/')
  .get(getGoals)       // GET  /api/goals
  .post(createGoal);   // POST /api/goals

router.route('/:id')
  .put(updateGoal)     // PUT  /api/goals/:id
  .delete(deleteGoal); // DELETE /api/goals/:id

router.get('/:id/ai-advice', getAIAdvice); // GET /api/goals/:id/ai-advice

module.exports = router;