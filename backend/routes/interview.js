const express = require('express');
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');
const User = require('../models/User');
const {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  generateSampleAnswer
} = require('../services/aiService');

const router = express.Router();

// ============================
// 🎯 GENERATE QUESTIONS
// ============================
router.post('/generate-questions', protect, async (req, res) => {
  try {
    const { jobTitle, jobDescription, resumeText } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    // 🔥 STEP 1: AI call
    const questionsRaw = await generateInterviewQuestions(
      jobTitle,
      jobDescription,
      resumeText
    );

    // 🔥 STEP 2: NORMALIZE (MAIN FIX)
    const questions = questionsRaw.map(q =>
      typeof q === "string" ? q : q.question
    );

    console.log("✅ FINAL QUESTIONS:", questions);

    // 🔥 STEP 3: SAVE
    const interview = await Interview.create({
      user: req.user._id,
      jobTitle,
      jobDescription,
      resumeText,
      questions, // ✅ always string array
      status: 'pending'
    });

    // 🔥 STEP 4: RESPONSE
    res.json({
      success: true,
      interviewId: interview._id,
      questions
    });

  } catch (error) {
    console.error("❌ GENERATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// 🚀 START INTERVIEW
// ============================
router.post('/start/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();

    res.json({ message: 'Interview started', interview });

  } catch (error) {
    console.error("❌ START ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// 📝 SUBMIT ANSWER
// ============================
router.post('/submit-answer/:id', protect, async (req, res) => {
  try {
    const { questionIndex, answer, duration } = req.body;

    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const question = interview.questions[questionIndex];

    const sampleAnswer = await generateSampleAnswer(
      question,
      interview.jobTitle
    );

    const existingIndex = interview.answers.findIndex(
      a => a.questionIndex === questionIndex
    );

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

    res.json({
      message: 'Answer submitted',
      sampleAnswer: sampleAnswer.trim()
    });

  } catch (error) {
    console.error("❌ SUBMIT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// ✅ COMPLETE INTERVIEW
// ============================
router.post('/complete/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const questions = interview.questions;

    const answers = questions.map((_, i) => {
      const ans = interview.answers.find(a => a.questionIndex === i);
      return ans?.answer || '';
    });

    const evaluation = await evaluateInterviewAnswers(
      questions,
      answers,
      interview.jobTitle
    );

    interview.scores = evaluation.scores;
    interview.feedback = evaluation.feedback;
    interview.status = 'completed';
    interview.completedAt = new Date();

    interview.duration = interview.startedAt
      ? Math.floor((new Date() - interview.startedAt) / 1000)
      : 0;

    if (evaluation.answerScores) {
      interview.answers.forEach((ans, i) => {
        ans.score = evaluation.answerScores[i] || 0;
      });
    }

    await interview.save();

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

  } catch (error) {
    console.error("❌ COMPLETE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// 📜 HISTORY
// ============================
router.get('/history', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-questions -resumeText');

    res.json({ interviews });

  } catch (error) {
    console.error("❌ HISTORY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// 📄 GET SINGLE INTERVIEW
// ============================
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview });

  } catch (error) {
    console.error("❌ GET ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;