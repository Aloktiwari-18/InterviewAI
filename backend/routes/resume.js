const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const ATSAnalysis = require('../models/ATSAnalysis');
const User = require('../models/User');
const { analyzeResume } = require('../services/aiService');

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

// Extract text from uploaded file
async function extractTextFromFile(filePath, mimeType) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.txt') {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    }
    
    // For .doc/.docx - return placeholder (would need mammoth/docx2txt in production)
    return 'Resume text extraction: Please install additional libraries for DOC/DOCX support. Add mammoth package and implement extraction.';
  } catch (error) {
    console.error('Text extraction error:', error);
    return '';
  }
}

// POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const resumeText = await extractTextFromFile(req.file.path, req.file.mimetype);
  
  res.json({
    fileName: req.file.originalname,
    filePath: req.file.path,
    resumeText,
    message: 'Resume uploaded successfully'
  });
});

// POST /api/resume/analyze
router.post('/analyze', protect, async (req, res) => {
  const { resumeText, jobDescription, fileName } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text is required' });
  }

  const analysis = await analyzeResume(resumeText, jobDescription);

  // Detect sections
  const sections = {
    hasContact: /email|phone|linkedin|github/i.test(resumeText),
    hasSummary: /summary|objective|profile|about/i.test(resumeText),
    hasExperience: /experience|work|employment|position/i.test(resumeText),
    hasEducation: /education|degree|university|college/i.test(resumeText),
    hasSkills: /skills|technologies|tools|competencies/i.test(resumeText),
    hasProjects: /project|portfolio|built|developed/i.test(resumeText)
  };

  const atsRecord = await ATSAnalysis.create({
    user: req.user._id,
    resumeText,
    jobDescription,
    fileName: fileName || 'resume.pdf',
    scores: analysis.scores,
    analysis: {
      matchedKeywords: analysis.matchedKeywords || [],
      missingKeywords: analysis.missingKeywords || [],
      presentSkills: analysis.presentSkills || [],
      missingSkills: analysis.missingSkills || [],
      suggestions: analysis.suggestions || [],
      rewrittenSummary: analysis.rewrittenSummary || '',
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || []
    },
    sections
  });

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalResumesAnalyzed': 1 }
  });

  res.json({
    analysisId: atsRecord._id,
    scores: analysis.scores,
    analysis: atsRecord.analysis,
    sections
  });
});

// GET /api/resume/history
router.get('/history', protect, async (req, res) => {
  const analyses = await ATSAnalysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-resumeText -jobDescription');

  res.json({ analyses });
});

// GET /api/resume/:id
router.get('/:id', protect, async (req, res) => {
  const analysis = await ATSAnalysis.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }

  res.json({ analysis });
});

module.exports = router;