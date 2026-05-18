const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'hr'],
    required: true,
  },
  weekStart: {
    type: Date,
    required: true,
  },
  weekEnd: {
    type: Date,
    required: true,
  },
  summaryText: {
    type: String,
    required: true,
  },
  metrics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 },
    leavesRequested: { type: Number, default: 0 },
    goalsActive: { type: Number, default: 0 },
    goalsApproved: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 85 },
  },
  burnoutRisk: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  productivityDelta: {
    type: String, // e.g. "+12% vs last week"
    default: 'No previous data',
  },
}, {
  timestamps: true,
});

// Only one weekly report per user per week
weeklyReportSchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
