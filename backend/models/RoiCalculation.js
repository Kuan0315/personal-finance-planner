const mongoose = require('mongoose');

const roiCalculation = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mode: {
        type: String,
        enum: ['simple', 'compound'],
        required: true
    },
    initialInvestment: {
        type: Number,
        required: true
    },
    monthlyContribution: {
        type: Number,
        default: 0
    },
    annualInterestRate: {
        type: Number,
        required: true
    },
    durationInYears: {
        type: Number,
        required: true
    },
    invested: {
        type: Number,
        required: true
    },
    futureValue: {
        type: Number,
        required: true
    },
    profit: {
        type: Number,
        required: true
    },
    gainPercentage: {
        type: Number,
        required: true
    },
    timeLineData: {
        labels: [String],
        values: [Number]
    }
},
    { timestamps: true }
);
module.exports = mongoose.model('RoiCalculation', roiCalculation);  