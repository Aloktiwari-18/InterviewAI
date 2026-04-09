const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const ATSAnalysis = require('../models/ATSAnalysis');
const User = require('../models/User');
const { analyzeResume } = require('../services/aiService');

const router = express.Router();


// ==========================
// 📂 MULTER CONFIG
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random();
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });


// ==========================
// 📄 TEXT EXTRACTION
// ==========================
async function extractTextFromFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.txt') {
      return fs.readFileSync(filePath, 'utf8');
    }

    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }

    return '';
  } catch (err) {
    console.log("❌ Extraction error:", err);
    return '';
  }
}


// ==========================
// 🔤 KEYWORD EXTRACTOR
// ==========================
function extractKeywords(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
}


// ==========================
// 📤 UPLOAD
// ==========================
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const resumeText = await extractTextFromFile(req.file.path);

    res.json({
      fileName: req.file.originalname,
      resumeText
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});


// ==========================
// 🧠 ANALYZE (FINAL FIX 🔥)
// ==========================
router.post('/analyze', protect, async (req, res) => {
  try {
    const { resumeText, jobDescription, fileName } = req.body;

    // =========================
    // ❗ VALIDATION (FIXED)
    // =========================
    if (!resumeText || !jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        error: "Resume + Job Description required"
      });
    }

    console.log("🧠 JD:", jobDescription);
    console.log("📄 Resume length:", resumeText.length);

    // =========================
    // 🔥 KEYWORD MATCHING
    // =========================
    const resumeWords = new Set(extractKeywords(resumeText));
    const jdWords = new Set(extractKeywords(jobDescription));

    console.log("JD WORDS:", [...jdWords]);

    if (jdWords.size === 0) {
      return res.status(400).json({
        error: "Job description is empty or invalid"
      });
    }

    const matched = [];
    const missing = [];

    jdWords.forEach(word => {
      if (resumeWords.has(word)) matched.push(word);
      else missing.push(word);
    });

    // =========================
    // 🎯 SCORE CALCULATION
    // =========================
    const totalJD = jdWords.size;
    const matchCount = matched.length;

    const jobMatchScore = Math.round((matchCount / totalJD) * 100);
    const keywordScore = Math.min(100, matchCount * 5);

    // =========================
    // 📑 SECTION DETECTION
    // =========================
    const sections = {
      hasContact: /email|phone|linkedin|github/i.test(resumeText),
      hasSummary: /summary|objective|profile/i.test(resumeText),
      hasExperience: /experience|work/i.test(resumeText),
      hasEducation: /education|degree/i.test(resumeText),
      hasSkills: /skills|tools/i.test(resumeText),
      hasProjects: /project|built/i.test(resumeText)
    };

    const sectionScore =
      (sections.hasContact ? 10 : 0) +
      (sections.hasSummary ? 10 : 0) +
      (sections.hasExperience ? 20 : 0) +
      (sections.hasEducation ? 10 : 0) +
      (sections.hasSkills ? 20 : 0) +
      (sections.hasProjects ? 20 : 0);

    // =========================
    // 🎯 FORMATTING SCORE (IMPROVED)
    // =========================
    const formattingScore = sectionScore;

    const overallScore = Math.round(
      (jobMatchScore + keywordScore + sectionScore + formattingScore) / 4
    );

    // =========================
    // 🤖 AI (OPTIONAL)
    // =========================
    let parsed = {};

    try {
      const aiRaw = await analyzeResume(resumeText, jobDescription);
      parsed = JSON.parse(aiRaw);
    } catch (err) {
      console.log("AI optional fail");
    }

    // =========================
    // 💾 SAVE TO DB
    // =========================
    const atsRecord = await ATSAnalysis.create({
      user: req.user._id,
      resumeText,
      jobDescription,
      fileName: fileName || 'resume.pdf',

      scores: {
        ats: sectionScore,
        jobMatch: jobMatchScore,
        keywords: keywordScore,
        formatting: formattingScore,
        overall: overallScore
      },

      analysis: {
        matchedKeywords: matched,
        missingKeywords: missing.slice(0, 20),
        presentSkills: matched,
        missingSkills: missing.slice(0, 10),
        suggestions: parsed?.analysis?.suggestions || [],
        rewrittenSummary: parsed?.analysis?.rewrittenSummary || "",
        strengths: parsed?.analysis?.strengths || [],
        weaknesses: parsed?.analysis?.weaknesses || []
      },

      sections
    });

    // =========================
    // 📈 UPDATE USER
    // =========================
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalResumesAnalyzed': 1 }
    });

    // =========================
    // 📤 RESPONSE
    // =========================
    res.json({
      analysisId: atsRecord._id,
      scores: atsRecord.scores,
      analysis: atsRecord.analysis,
      sections
    });

  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// ==========================
// 📜 HISTORY
// ==========================
router.get('/history', protect, async (req, res) => {
  const analyses = await ATSAnalysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-resumeText');

  res.json({ analyses });
});


// ==========================
// 📄 GET SINGLE
// ==========================
router.get('/:id', protect, async (req, res) => {
  const analysis = await ATSAnalysis.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!analysis) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({ analysis });
});

module.exports = router;