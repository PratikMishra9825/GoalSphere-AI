const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cycle: {
    type: String, // e.g. '2026-2027'
    required: true,
  },
  quarter: {
    type: String, // e.g. 'Q1'
  },
  overallScore: {
    type: Number,
    required: true,
  },
  goalsCompletionRate: {
    type: Number, // Percentage 0-100
  },
  managerRating: {
    type: Number, // 1-5
  },
  aiProductivityScore: {
    type: Number, // AI generated score based on velocity and check-ins
  },
  status: {
    type: String,
    enum: ['On Track', 'Needs Attention', 'At Risk', 'Exceeding'],
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Performance', performanceSchema);
