const mongoose = require('mongoose');

const atsSchema = new mongoose.Schema({

  // =========================
  // 👤 USER INFO
  // =========================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // =========================
  // 📄 INPUT DATA
  // =========================
  resumeText: {
    type: String,
    default: ""
  },

  jobDescription: {
    type: String,
    default: ""
  },

  fileName: {
    type: String,
    default: ""
  },

  // =========================
  // 📊 SCORES
  // =========================
  scores: {
    ats: { type: Number, default: 0 },
    jobMatch: { type: Number, default: 0 },
    keywords: { type: Number, default: 0 },
    formatting: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },

  // =========================
  // 🧠 ANALYSIS (IMPORTANT FIX)
  // =========================
  analysis: {
    matchedKeywords: {
      type: [String],
      default: []
    },
    missingKeywords: {
      type: [String],
      default: []
    },
    presentSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [String],
      default: []
    },
    suggestions: {
      type: [String],
      default: []
    },
    rewrittenSummary: {
      type: String,
      default: ""
    },
    strengths: {
      type: [String],
      default: []
    },
    weaknesses: {
      type: [String],
      default: []
    }
  },

  // =========================
  // 📑 SECTIONS CHECK
  // =========================
  sections: {
    hasContact: { type: Boolean, default: false },
    hasSummary: { type: Boolean, default: false },
    hasExperience: { type: Boolean, default: false },
    hasEducation: { type: Boolean, default: false },
    hasSkills: { type: Boolean, default: false },
    hasProjects: { type: Boolean, default: false }
  }

}, { timestamps: true });


// =========================
// 🔥 PRE-SAVE DEBUG HOOK
// =========================
atsSchema.pre('save', function (next) {
  console.log("💾 Saving ATS Analysis...");

  if (!this.analysis || Object.keys(this.analysis).length === 0) {
    console.log("⚠️ WARNING: Analysis is empty while saving!");
  }

  if (!this.scores || Object.keys(this.scores).length === 0) {
    console.log("⚠️ WARNING: Scores are empty while saving!");
  }

  next();
});


// =========================
// 🚀 EXPORT MODEL
// =========================
module.exports = mongoose.model('ATSAnalysis', atsSchema);