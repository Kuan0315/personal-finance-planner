const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    saveRoi,
    getRoi,
    deleteRoi,
    deleteManyRoi
} = require('../controllers/roiController');

// Save ROI data
router.post('/save', protect, saveRoi);
router.post('/history', protect, saveRoi);

// Get ROI history for a user
router.get('/history/:userId', protect, getRoi);

// Delete a specific ROI record
router.delete('/delete/:roiId', protect, deleteRoi);
router.delete('/history/:roiId', protect, deleteRoi);
router.delete('/history', protect, deleteManyRoi);

module.exports = router;