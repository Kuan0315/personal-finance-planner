const RoiCalculation = require('../models/RoiCalculation');
// Save ROI data
const saveRoi = async (req, res) => {
    try {
        const {
            mode,
            principal,
            monthlyContribution,
            annualInterestRate,
            durationInYears,
            invested,
            futureValue,
            profit,
            gainPercentage,
            timeLineData
        } = req.body;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const roi = await RoiCalculation.create({
            userId: req.user._id,
            mode,
            initialInvestment: principal,
            monthlyContribution,
            annualInterestRate,
            durationInYears,
            invested,
            futureValue,
            profit,
            gainPercentage,
            timeLineData
        });
        res.status(201).json(roi);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get ROI history for a user
const getRoi = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (req.params && req.params.userId && req.params.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const history = await RoiCalculation.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete a specific ROI record
const deleteRoi = async (req, res) => {
    try {
        const roi = await RoiCalculation.findById(req.params.roiId);
        if (!roi) {
            return res.status(404).json({ message: 'Roi record not found' });
        }
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Ensure only the owner can delete their record
        if (roi.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Forbidden: not allowed to delete this record' });
        }

        await RoiCalculation.findByIdAndDelete(req.params.roiId);
        res.json({ message: 'Roi record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete many ROI records
const deleteManyRoi = async (req, res) => {
    try {
        if (!req.user || !req.user._id)
            return res.status(401).json({ message: 'Unauthorized' });
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });

        // Delete only records owned by the authenticated user
        const result = await RoiCalculation.deleteMany({ _id: { $in: ids }, userId: req.user._id });
        res.json({ message: 'Deleted records', deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    saveRoi,
    getRoi,
    deleteRoi
    , deleteManyRoi
}