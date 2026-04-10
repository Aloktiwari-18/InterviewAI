const express = require('express');
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { generateInterviewQuestions, evaluateInterviewAnswers, generateSampleAnswer } = require('../services/aiService');

const router = express.Router();

// POST /api/interview/generate-questions
router.post('/generate-questions', protect, async (req, res) => {
  const { jobTitle, jobDescription, resumeText } = req.body;
  
  if (!jobTitle) {
    return res.status(400).json({ error: 'Job title is required' });
  }

  const questions = await generateInterviewQuestions(jobTitle, jobDescription, resumeText);

  // Create interview session
  const interview = await Interview.create({
    user: req.user._id,
    jobTitle,
    jobDescription,
    resumeText,
    questions,
    status: 'pending'
  });

  res.json({ 
    interviewId: interview._id,
    questions 
  });
});

// POST /api/interview/start/:id
router.post('/start/:id', protect, async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  interview.status = 'in-progress';
  interview.startedAt = new Date();
  await interview.save();

  res.json({ message: 'Interview started', interview });
});

// POST /api/interview/submit-answer/:id
router.post('/submit-answer/:id', protect, async (req, res) => {
  const { questionIndex, answer, duration } = req.body;
  
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  // Get sample answer for this question
  const question = interview.questions[questionIndex];
  const sampleAnswer = await generateSampleAnswer(question, interview.jobTitle);

  // Add or update answer
  const existingIndex = interview.answers.findIndex(a => a.questionIndex === questionIndex);
  const answerData = {
    questionIndex,
    question,
    answer,
    duration: duration || 0,
    sampleAnswer: sampleAnswer.trim()
  };

  if (existingIndex >= 0) {
    interview.answers[existingIndex] = answerData;
  } else {
    interview.answers.push(answerData);
  }

  await interview.save();
  res.json({ message: 'Answer submitted', sampleAnswer: sampleAnswer.trim() });
});

// POST /api/interview/complete/:id
router.post('/complete/:id', protect, async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  // Evaluate all answers
  const questions = interview.questions;
  const answers = questions.map((_, i) => {
    const ans = interview.answers.find(a => a.questionIndex === i);
    return ans?.answer || '';
  });

  const evaluation = await evaluateInterviewAnswers(questions, answers, interview.jobTitle);

  // Update interview with scores
  interview.scores = evaluation.scores;
  interview.feedback = evaluation.feedback;
  interview.status = 'completed';
  interview.completedAt = new Date();
  interview.duration = interview.startedAt 
    ? Math.floor((new Date() - interview.startedAt) / 1000) 
    : 0;

  // Add scores to individual answers
  if (evaluation.answerScores) {
    interview.answers.forEach((ans, i) => {
      ans.score = evaluation.answerScores[i] || 0;
    });
  }

  await interview.save();

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalInterviews': 1 },
    $max: { 'stats.bestScore': evaluation.scores.overall }
  });

  res.json({ 
    message: 'Interview completed',
    scores: interview.scores,
    feedback: interview.feedback,
    answers: interview.answers
  });
});

// GET /api/interview/history
router.get('/history', protect, async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('-questions -resumeText');

  res.json({ interviews });
});

// GET /api/interview/:id
router.get('/:id', protect, async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  res.json({ interview });
});

module.exports = router;