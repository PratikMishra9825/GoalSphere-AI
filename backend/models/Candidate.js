const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    enum: ['Applied', 'Interviewing', 'Offered', 'Hired'],
    default: 'Applied'
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
