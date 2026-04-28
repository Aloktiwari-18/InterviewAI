const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    default: ''
  },
  resumeText: {
    type: String,
    default: ''
  },
  questions: [{
    type: String
  }],
  answers: [{
    questionIndex: Number,
    question: String,
    answer: String,
    sampleAnswer: String,
    duration: { type: Number, default: 0 },
    score: { type: Number, default: 0 }
  }],
  scores: {
    overall: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 }
  },
  feedback: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    improvements: [String],
    verdict: String
  },
  violations: [{
    type: {
      type: String,
      enum: ['TAB_SWITCH', 'WINDOW_BLUR', 'NO_FACE', 'MULTIPLE_FACES', 'LOW_LIGHT', 'CHEATING_DETECTED'],
      default: 'TAB_SWITCH'
    },
    severity: {
      type: String,
      enum: ['warning', 'minor', 'major', 'critical'],
      default: 'warning'
    },
    timestamp: { type: Date, default: Date.now },
    logged: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  duration: { type: Number, default: 0 },
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);