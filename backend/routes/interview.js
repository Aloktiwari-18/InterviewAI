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
      return res.status(400).json({ message: 'Job title is required' });
    }

    const questionsRaw = await generateInterviewQuestions(
      jobTitle,
      jobDescription,
      resumeText
    );

    // ✅ Normalize (important)
    const questions = questionsRaw.map(q =>
      typeof q === "string" ? q : q.question
    );

    const interview = await Interview.create({
      user: req.user._id,
      jobTitle,
      jobDescription,
      resumeText,
      questions,
      status: 'pending'
    });

    res.json({
      success: true,
      interviewId: interview._id,
      questions
    });

  } catch (error) {
    console.error("❌ GENERATE ERROR:", error);
    res.status(500).json({
      message: error.message || 'Failed to generate questions'
    });
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
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();

    res.json({
      message: 'Interview started',
      interview
    });

  } catch (error) {
    console.error("❌ START ERROR:", error);
    res.status(500).json({
      message: error.message || 'Failed to start interview'
    });
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
      return res.status(404).json({ message: 'Interview not found' });
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
    res.status(500).json({
      message: error.message || 'Failed to submit answer'
    });
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
      return res.status(404).json({ message: 'Interview not found' });
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

    // ✅ COUNT VIOLATIONS AND APPLY SCORE REDUCTION
    let violationCount = 0;
    let violationPenalty = 0;

    if (interview.violations && interview.violations.length > 0) {
      violationCount = interview.violations.length;
      
      // Count by severity
      const tabSwitches = interview.violations.filter(v => v.type === 'TAB_SWITCH').length;
      const windowBlurs = interview.violations.filter(v => v.type === 'WINDOW_BLUR').length;
      const criticalViolations = interview.violations.filter(v => v.severity === 'critical' || v.severity === 'major').length;

      // Calculate penalty: 2% per tab switch, 1% per blur, 5% per critical
      violationPenalty = (tabSwitches * 2) + (windowBlurs * 1) + (criticalViolations * 5);
      violationPenalty = Math.min(violationPenalty, 40); // Max 40% deduction

      console.log(`📊 Violations: ${violationCount} total, Penalty: ${violationPenalty}%`);
    }

    // Apply penalty to all scores
    if (violationPenalty > 0) {
      evaluation.scores.overall = Math.max(0, evaluation.scores.overall - violationPenalty);
      evaluation.scores.confidence = Math.max(0, evaluation.scores.confidence - (violationPenalty * 0.5));
      
      if (evaluation.feedback) {
        evaluation.feedback.weaknesses = evaluation.feedback.weaknesses || [];
        evaluation.feedback.weaknesses.push(
          `${violationCount} integrity violations detected during interview (${violationPenalty}% score reduction)`
        );
      }
    }

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
      answers: interview.answers,
      violations: {
        count: violationCount,
        penalty: violationPenalty,
        details: interview.violations
      }
    });

  } catch (error) {
    console.error("❌ COMPLETE ERROR:", error);
    res.status(500).json({
      message: error.message || 'Failed to complete interview'
    });
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
    res.status(500).json({
      message: error.message || 'Failed to fetch history'
    });
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
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });

  } catch (error) {
    console.error("❌ GET ERROR:", error);
    res.status(500).json({
      message: error.message || 'Failed to fetch interview'
    });
  }
});

// ============================
// ⚠️ LOG VIOLATION
// ============================
router.post('/violation', protect, async (req, res) => {
  try {
    const { interviewId, type, severity, timestamp } = req.body;

    if (!interviewId || !type) {
      return res.status(400).json({ message: 'Interview ID and violation type required' });
    }

    // Find interview
    const interview = await Interview.findOne({
      _id: interviewId,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Initialize violations array if not exists
    if (!interview.violations) {
      interview.violations = [];
    }

    // Add violation
    interview.violations.push({
      type,
      severity: severity || 'warning',
      timestamp: timestamp || new Date(),
      logged: true
    });

    await interview.save();

    console.log(`⚠️ Violation logged: ${type} for interview ${interviewId}`);

    res.json({ 
      success: true,
      violationCount: interview.violations.length,
      message: `${type} violation recorded`
    });

  } catch (error) {
    console.error("❌ VIOLATION LOG ERROR:", error);
    res.status(500).json({
      message: error.message || 'Failed to log violation'
    });
  }
});

module.exports = router;