const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cycle: {
    type: String, // e.g., '2026-2027 Q2'
    required: true,
  },
  selfReviewText: {
    type: String,
  },
  managerFeedbackText: {
    type: String,
  },
  aiInsights: {
    type: String, // AI generated feedback based on goals and check-ins
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Reviewed', 'Acknowledged'],
    default: 'Draft',
  },
  performanceScore: {
    type: Number, // 1 to 5 scale or 0 to 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
