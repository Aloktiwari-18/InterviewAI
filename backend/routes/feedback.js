const express = require('express');
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');
const ATSAnalysis = require('../models/ATSAnalysis');

const router = express.Router();

// GET /api/feedback/interview/:id
router.get('/interview/:id', protect, async (req, res) => {
  const interview = await Interview.findOne({ 
    _id: req.params.id, 
    user: req.user._id,
    status: 'completed'
  });
  
  if (!interview) {
    return res.status(404).json({ error: 'Completed interview not found' });
  }

  res.json({
    scores: interview.scores,
    feedback: interview.feedback,
    answers: interview.answers,
    jobTitle: interview.jobTitle,
    duration: interview.duration,
    completedAt: interview.completedAt
  });
});

// GET /api/feedback/dashboard
router.get('/dashboard', protect, async (req, res) => {
  const interviews = await Interview.find({ 
    user: req.user._id,
    status: 'completed'
  }).sort({ createdAt: -1 }).limit(5);

  const analyses = await ATSAnalysis.find({ 
    user: req.user._id 
  }).sort({ createdAt: -1 }).limit(5);

  // Calculate averages
  let avgScore = 0;
  if (interviews.length > 0) {
    avgScore = interviews.reduce((sum, i) => sum + (i.scores.overall || 0), 0) / interviews.length;
  }

  res.json({
    recentInterviews: interviews,
    recentAnalyses: analyses,
    stats: {
      totalInterviews: await Interview.countDocuments({ user: req.user._id }),
      completedInterviews: interviews.length,
      averageScore: Math.round(avgScore),
      totalAnalyses: await ATSAnalysis.countDocuments({ user: req.user._id })
    }
  });
});

module.exports = router;