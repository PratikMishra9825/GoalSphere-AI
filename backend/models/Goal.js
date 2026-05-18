const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  quarter: {
    type: String,
    enum: ['Q1', 'Q2', 'Q3', 'Q4'],
    required: true,
  },
  actualAchievement: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Not Started', 'On Track', 'Delayed', 'Completed', 'Blocked'],
    default: 'Not Started',
  },
  progressNotes: {
    type: String,
  },
  evidenceUrl: {
    type: String,
  },
  managerComments: {
    type: String,
  },
  aiSuggestions: {
    type: String,
  },
  submittedAt: {
    type: Date,
  }
});

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a goal title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  thrustArea: {
    type: String,
    required: true,
  },
  uom: {
    type: String,
    enum: ['Numeric', 'Percentage', 'Timeline', 'Zero-based'],
    required: true,
  },
  targetValue: {
    type: Number,
    required: true,
  },
  weightage: {
    type: Number,
    required: true,
    min: 10,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Rework Required'],
    default: 'Draft',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  sharedPrimaryOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cycle: {
    type: String,
    default: '2026-2027',
  },
  checkIns: [checkInSchema],
  managerFeedback: {
    type: String,
  },
  attachments: [{
    name: String,
    url: String,
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Goal', goalSchema);
