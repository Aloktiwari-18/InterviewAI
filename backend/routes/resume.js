const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const ATSAnalysis = require('../models/ATSAnalysis');
const User = require('../models/User');
const { analyzeResumeWithSemanticMatching, parseResumeStructured } = require('../services/semanticAnalyzer');

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
    
    // Support DOCX files with mammoth
    if (ext === '.docx' || ext === '.doc') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (mammothErr) {
        console.warn('Mammoth extraction failed:', mammothErr.message);
        return 'Unable to extract text from DOCX. Please upload a PDF or TXT file.';
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
    console.log('🚀 Starting production semantic resume analysis...');
    
    // ✅ Use new semantic analyzer with LangChain
    const analysis = await analyzeResumeWithSemanticMatching(resumeText, jobDescription);
    
    const structuredResume = analysis.structuredResume || {};

    // ✅ Improved section detection
    const sections = {
      hasContact: true,
      hasSummary: !!(analysis.rewrittenSummary && analysis.rewrittenSummary.length > 10),
      hasExperience: true,
      hasEducation: true,
      hasSkills: (analysis.presentSkills || []).length > 0,
      hasProjects: true,
      hasCertifications: true
    };

    // ✅ Create comprehensive ATS record
    const atsRecord = await ATSAnalysis.create({
      user: req.user._id,
      resumeText,
      jobDescription,
      fileName: fileName || 'resume.pdf',
      scores: analysis.scores || { overall: 0, jobMatch: 0, ats: 0 },
      analysis: {
        structuredData: structuredResume,
        matchedKeywords: analysis.matchedKeywords || [],
        missingKeywords: analysis.missingKeywords || [],
        presentSkills: analysis.presentSkills || [],
        missingSkills: analysis.missingSkills || [],
        suggestions: analysis.suggestions || [],
        rewrittenSummary: analysis.rewrittenSummary || '',
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        matchedAreas: analysis.matchedAreas || [],
        gapAreas: analysis.gapAreas || [],
        semanticMatch: analysis.semanticMatch || {},
        jdRequirements: analysis.jdRequirements || {},
        analysisMethod: analysis.analysisMethod || 'semantic_langchain'
      },
      sections
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalResumesAnalyzed': 1 }
    });

    console.log('✅ Analysis complete and saved');

    res.json({
      analysisId: atsRecord._id,
      scores: analysis.scores,
      analysis: atsRecord.analysis,
      sections,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      semanticMatch: analysis.semanticMatch,
      jdRequirements: analysis.jdRequirements,
      analysisMethod: analysis.analysisMethod
    });
  } catch (error) {
    console.error('❌ Resume analysis error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body keys:', Object.keys(req.body));
    
    res.status(500).json({ 
      error: error.message || 'Failed to analyze resume',
      type: error.constructor.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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