/**
 * controllers/goalController.js
 * ──────────────────────────────
 * HTTP layer only. No business logic here.
 * All calculations live in utils/financialEngine.js via services/goalService.js.
 */

const goalService = require('../services/goalService'); //Node.js way of importing.

// ─── GET /api/goals ───────────────────────────────────────────────────────────
exports.getGoals = async (req, res) => {
  try {
    const goals = await goalService.getAllGoals(req.user._id);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/goals/summary ───────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const summary = await goalService.getSummary(req.user._id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/goals/:id ───────────────────────────────────────────────────────
exports.getGoal = async (req, res) => {
  try {
    const goal = await goalService.getGoalById(req.params.id, req.user._id); // goal id and user id
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal); //→ defaults to 200 OK, means "success, here's your data
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/goals ──────────────────────────────────────────────────────────
exports.createGoal = async (req, res) => {
  try {
    const { name, target } = req.body;
    if (!name || !target) {
      return res.status(400).json({ message: 'name and target are required' });
    }
    const goal = await goalService.createGoal(req.user._id, req.body);
    res.status(201).json(goal); // → specifically means "something new was created successfully"
  } catch (err) {
    if (err.name === 'ValidationError'){
      return res.status(400).json({message: err.message});
    }
    
    res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/goals/:id ───────────────────────────────────────────────────────
exports.updateGoal = async (req, res) => {
  try {
    const goal = await goalService.updateGoal(req.params.id, req.user._id, req.body);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) { 
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/goals/:id ────────────────────────────────────────────────────
exports.deleteGoal = async (req, res) => {
  try {
    const deleted = await goalService.deleteGoal(req.params.id, req.user._id); // true or false
    if (!deleted) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/goals/:id/advice ───────────────────────────────────────────────
exports.getAdvice = async (req, res) => {
  try {
    const advice = await goalService.getAIAdvice(req.params.id, req.user._id);
    if (!advice) return res.status(404).json({ message: 'Goal not found' });
    res.json(advice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/goals/:id/portfolio ─────────────────────────────────────────────
exports.assignPortfolio = async (req, res) => {
  try {
    const goal = await goalService.assignPortfolio(req.params.id, req.user._id, req.body);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};