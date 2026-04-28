const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const ATSAnalysis = require('../models/ATSAnalysis');
const User = require('../models/User');
const { analyzeResumeAI, parseResumeStructured } = require('../services/aiService');

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
    
    // ✅ FIX: Support DOCX files
    if (ext === '.docx') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (mammothErr) {
        console.warn('Mammoth extraction failed, trying docx package:', mammothErr.message);
        const docx = require('docx-parser');
        return await docx.parseAsync(filePath);
      }
    }
    
    // ✅ FIX: Support DOC files (legacy)
    if (ext === '.doc') {
      try {
        const docx = require('docx-parser');
        return await docx.parseAsync(filePath);
      } catch (docxErr) {
        console.error('DOC extraction error:', docxErr.message);
        return 'Resume extraction: .DOC files are legacy. Please convert to PDF or DOCX.';
      }
    }
    
    return 'Unsupported file format';
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
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

  try {
    // ✅ FIX 1: Use structured analysis from AI service
    const structuredResume = await parseResumeStructured(resumeText);
    
    // ✅ FIX 2: Get detailed AI analysis
    const analysis = await analyzeResumeAI(resumeText, jobDescription);

    // ✅ FIX 3: Improved section detection with structured data
    const sections = {
      hasContact: !!(
        structuredResume.personalInfo.email || 
        structuredResume.personalInfo.phone ||
        structuredResume.personalInfo.linkedin
      ),
      hasSummary: !!(structuredResume.summary && structuredResume.summary.trim().length > 0),
      hasExperience: structuredResume.experience.length > 0,
      hasEducation: structuredResume.education.length > 0,
      hasSkills: Object.values(structuredResume.skills).some(arr => arr.length > 0),
      hasProjects: structuredResume.projects.length > 0,
      hasCertifications: structuredResume.certifications.length > 0
    };

    // ✅ FIX 4: Create comprehensive ATS record
    const atsRecord = await ATSAnalysis.create({
      user: req.user._id,
      resumeText,
      jobDescription,
      fileName: fileName || 'resume.pdf',
      scores: analysis.scores || { overall: 0, skillMatch: 0, experienceMatch: 0 },
      analysis: {
        structuredData: structuredResume,
        matchedKeywords: analysis.matchedKeywords || [],
        missingKeywords: analysis.missingKeywords || [],
        presentSkills: analysis.presentSkills || structuredResume.skills.technical,
        missingSkills: analysis.missingSkills || [],
        suggestions: analysis.suggestions || [],
        rewrittenSummary: analysis.rewrittenSummary || structuredResume.summary,
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
      sections,
      structuredResume
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze resume' 
    });
  }
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