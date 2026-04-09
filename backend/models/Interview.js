const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  question: String,
  answer: String,
  duration: Number, // seconds taken to answer
  score: Number,
  feedback: String,
  sampleAnswer: String
});

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
  jobDescription: String,
  resumeText: String,
  questions: [String],
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'abandoned'],
    default: 'pending'
  },
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
  duration: Number, // total duration in seconds
  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
