require('dotenv').config({ path: '../.env' });

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================
// 🔥 COMMON AI CALL
// ============================
async function callAI(prompt, maxTokens = 1000) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert AI interviewer and resume evaluator. Always respond with valid JSON when requested." },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ OpenAI ERROR:", error.message);
    throw error;
  }
}

// ============================
// 📄 STRUCTURED RESUME PARSING
// ============================
async function parseResumeStructured(resumeText) {
  const prompt = `
Analyze this resume and extract structured information. Return ONLY valid JSON:

RESUME:
${resumeText}

Return exactly this JSON structure (fill in all fields, use empty arrays/strings if not found):
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "skills": {
    "technical": [],
    "languages": [],
    "tools": [],
    "soft": []
  },
  "experience": [
    {
      "company": "",
      "jobTitle": "",
      "duration": "",
      "keyAchievements": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "year": ""
    }
  ],
  "certifications": [],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ]
}
`;

  try {
    const response = await callAI(prompt, 2000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    console.error("Resume parsing error:", err.message);
    // Fallback: extract basic info
    return getBasicResumeInfo(resumeText);
  }
}

// Fallback basic extraction
function getBasicResumeInfo(resumeText) {
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = resumeText.match(/\+?[\d\s().-]{7,}/);
  
  return {
    personalInfo: {
      name: "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: "",
      linkedin: "",
      github: ""
    },
    summary: "",
    skills: { technical: [], languages: [], tools: [], soft: [] },
    experience: [],
    education: [],
    certifications: [],
    projects: []
  };
}

//
// ============================
// 🎯 INTERVIEW QUESTIONS
// ============================
async function generateInterviewQuestions(jobTitle, jobDescription, resumeText) {
  const prompt = `
Generate exactly 15 interview questions for ${jobTitle} role.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Return ONLY valid JSON array of strings (no other text):
["question 1", "question 2", ...]
`;

  const response = await callAI(prompt, 1200);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch[0]).map(q => ({
      question: typeof q === "string" ? q : q.question
    }));
  } catch (err) {
    console.error("❌ Question parsing error:", err.message);
    throw new Error("Invalid AI response format");
  }
}

//
// ============================
// 🎯 ANSWER EVALUATION (WITH EMPTY CHECK)
// ============================
// HARD RULE: Empty answer = 0 score immediately
function calculateAnswerScore(answer) {
  const trimmed = (answer || "").trim();
  
  // Hard rule 1: Empty answer = 0
  if (trimmed.length === 0) return 0;
  
  // Hard rule 2: Very short answer (< 10 chars) = max 15% score
  if (trimmed.length < 10) return Math.floor(Math.random() * 15);
  
  // Hard rule 3: Short answer (10-50 chars) = max 30% score
  if (trimmed.length < 50) return Math.floor(20 + Math.random() * 10);
  
  // Answer is long enough - can score 40-100 based on quality
  return null; // Will be evaluated by AI
}

async function evaluateInterviewAnswers(questions, answers, jobTitle) {
  try {
    // Pre-check for empty answers
    const answerScores = answers.map((ans, idx) => {
      const hardScore = calculateAnswerScore(ans);
      return { index: idx, hardScore, answer: ans };
    });

    // Count empty answers
    const emptyCount = answerScores.filter(s => s.hardScore === 0).length;
    if (emptyCount > (questions.length * 0.5)) {
      console.warn(`⚠️ More than 50% empty answers detected (${emptyCount}/${questions.length})`);
    }

    // Build prompt only with non-zero-scored answers
    const qa = questions.map((q, i) => {
      const score = answerScores[i].hardScore;
      if (score === 0) {
        return `Q${i+1}: ${q}\nA${i+1}: [EMPTY - NO RESPONSE GIVEN]`;
      }
      return `Q${i+1}: ${q}\nA${i+1}: ${answers[i]}`;
    }).join("\n\n");

    const prompt = `
You are an expert interviewer evaluating answers for a ${jobTitle} role.

IMPORTANT SCORING RULES:
- Empty or missing answers = 0/100
- Answers less than 50 characters = max 30/100
- Short answers (50-150 chars) = max 50/100
- Detailed answers (150+ chars) = can score 50-100

Evaluate these answers:

${qa}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "scores": {
    "overall": <0-100>,
    "communication": <0-100>,
    "technical": <0-100>,
    "confidence": <0-100>,
    "relevance": <0-100>
  },
  "feedback": {
    "summary": "brief summary",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "improvements": ["improvement1", "improvement2"],
    "verdict": "pass/fail/borderline"
  },
  "answerScores": [<0-100>, <0-100>]
}
`;

    const response = await callAI(prompt, 1500);

    try {
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      
      let result = JSON.parse(jsonMatch[0]);

      // Validate scores are within 0-100
      const validateScore = (s) => Math.max(0, Math.min(100, parseInt(s) || 0));
      
      // Override with hard-scored empty answers
      if (Array.isArray(result.answerScores)) {
        result.answerScores = result.answerScores.map((score, idx) => {
          const hardScore = answerScores[idx].hardScore;
          if (hardScore === 0) return 0; // Empty = 0
          return validateScore(score);
        });
      }

      // Validate overall scores
      result.scores = {
        overall: validateScore(result.scores?.overall),
        communication: validateScore(result.scores?.communication),
        technical: validateScore(result.scores?.technical),
        confidence: validateScore(result.scores?.confidence),
        relevance: validateScore(result.scores?.relevance)
      };

      return result;
    } catch (parseErr) {
      console.error("Evaluation parsing error:", parseErr.message);
      
      // Fallback: use hard-coded scores
      return {
        scores: {
          overall: Math.round(answerScores.reduce((sum, s) => sum + (s.hardScore ?? 50), 0) / answerScores.length),
          communication: 50,
          technical: 50,
          confidence: 50,
          relevance: 50
        },
        feedback: {
          summary: "Evaluation completed",
          strengths: ["Participated in interview"],
          weaknesses: emptyCount > 0 ? [`${emptyCount} answers were empty`] : [],
          improvements: ["Try to provide detailed answers"],
          verdict: "borderline"
        },
        answerScores: answerScores.map(s => s.hardScore ?? 50)
      };
    }
  } catch (err) {
    console.error("Evaluation error:", err.message);
    throw err;
  }
}

//
// ============================
// 🎯 RESUME AI ANALYSIS (ONLY AI PART)
// ============================
// Helper: Validate and clamp scores to 0-100
function validateScores(scores) {
  return {
    ats: Math.max(0, Math.min(100, parseInt(scores?.ats) || 50)),
    jobMatch: Math.max(0, Math.min(100, parseInt(scores?.jobMatch) || 50)),
    keywords: Math.max(0, Math.min(100, parseInt(scores?.keywords) || 50)),
    formatting: Math.max(0, Math.min(100, parseInt(scores?.formatting) || 50)),
    overall: Math.max(0, Math.min(100, parseInt(scores?.overall) || 50))
  };
}

// ============================
// 🎯 RESUME AI ANALYSIS (COMPLETE REWRITE)
// ============================
async function analyzeResumeAI(resumeText, jobDescription) {
  try {
    if (!resumeText || resumeText.trim().length < 50) {
      console.warn("Resume text too short for analysis");
      return {
        scores: { ats: 20, jobMatch: 20, keywords: 15, formatting: 30, overall: 20 },
        matchedKeywords: [],
        missingKeywords: [],
        presentSkills: [],
        missingSkills: [],
        suggestions: ["Resume is too short. Add more details about experience and skills."],
        rewrittenSummary: "Unable to rewrite - resume needs more content",
        strengths: ["Added resume for analysis"],
        weaknesses: ["Resume lacks detail"]
      };
    }

    const structuredResume = await parseResumeStructured(resumeText);

    // ✅ STEP 1: Extract keywords from job description
    const extractKeywordsPrompt = `
Extract ONLY technical keywords and required skills from this job description. Return a JSON array of keywords (max 15).

JOB DESCRIPTION:
${jobDescription || 'Software development role'}

Return ONLY this format:
["keyword1", "keyword2", "keyword3"]
`;

    const keywordsResponse = await callAI(extractKeywordsPrompt, 500);
    let extractedKeywords = [];
    try {
      const keywordMatch = keywordsResponse.match(/\[[\s\S]*\]/);
      if (keywordMatch) {
        extractedKeywords = JSON.parse(keywordMatch[0]).filter(k => typeof k === 'string' && k.length > 0);
      }
    } catch (e) {
      console.warn("Keyword extraction fallback:", e.message);
      // Fallback: extract common tech keywords
      extractedKeywords = ['React', 'JavaScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git', 'REST API', 'MongoDB'];
    }

    // ✅ STEP 2: Match keywords against resume
    const resumeUpper = resumeText.toUpperCase();
    const matchedKeywords = extractedKeywords.filter(keyword => {
      return resumeUpper.includes(keyword.toUpperCase());
    });
    const missingKeywords = extractedKeywords.filter(keyword => {
      return !resumeUpper.includes(keyword.toUpperCase());
    });

    // ✅ STEP 3: Calculate keyword match score
    const keywordMatchScore = extractedKeywords.length > 0 
      ? Math.round((matchedKeywords.length / extractedKeywords.length) * 100)
      : 50;

    // ✅ STEP 4: Get comprehensive AI analysis
    const analysisPrompt = `
You are an expert ATS and resume reviewer. Analyze this resume comprehensively.

RESUME:
${resumeText.substring(0, 2000)}

STRUCTED DATA:
- Skills: ${structuredResume.skills?.technical?.join(', ') || 'None found'}
- Experience: ${structuredResume.experience?.length || 0} positions
- Education: ${structuredResume.education?.length || 0} degrees
- Contact: ${structuredResume.personalInfo?.email ? 'Yes' : 'No'}

MATCHED KEYWORDS: ${matchedKeywords.slice(0, 8).join(', ') || 'None'}
MISSING KEYWORDS: ${missingKeywords.slice(0, 8).join(', ') || 'All present'}

Return ONLY valid JSON:
{
  "atsScore": <0-100>,
  "jobMatchScore": <0-100>,
  "formattingScore": <0-100>,
  "strengths": ["item1", "item2"],
  "weaknesses": ["item1", "item2"],
  "suggestions": ["improvement1", "improvement2"],
  "rewrittenSummary": "Professional 2-3 sentence summary"
}
`;

    const analysisResponse = await callAI(analysisPrompt, 1000);
    let analysis = {};

    try {
      const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("AI analysis parsing error:", e.message);
      analysis = {};
    }

    // ✅ STEP 5: Calculate final scores
    const atsScore = Math.max(0, Math.min(100, parseInt(analysis.atsScore) || 65));
    const jobMatchScore = Math.max(0, Math.min(100, parseInt(analysis.jobMatchScore) || 70));
    const formattingScore = Math.max(0, Math.min(100, parseInt(analysis.formattingScore) || 75));
    const overallScore = Math.round((atsScore + jobMatchScore + keywordMatchScore + formattingScore) / 4);

    console.log(`📊 Resume Analysis:
      - ATS: ${atsScore}%
      - Job Match: ${jobMatchScore}%
      - Keywords: ${keywordMatchScore}% (${matchedKeywords.length}/${extractedKeywords.length})
      - Formatting: ${formattingScore}%
      - Overall: ${overallScore}%`);

    return {
      scores: {
        ats: atsScore,
        jobMatch: jobMatchScore,
        keywords: keywordMatchScore,
        formatting: formattingScore,
        overall: overallScore
      },
      matchedKeywords: matchedKeywords.slice(0, 10),
      missingKeywords: missingKeywords.slice(0, 10),
      presentSkills: structuredResume.skills?.technical?.slice(0, 15) || [],
      missingSkills: missingKeywords.slice(0, 10),
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 5) : [
        "Add metrics to your achievements",
        "Include relevant certifications",
        "Use action verbs in job descriptions",
        "Add keywords from job posting",
        "Improve formatting and readability"
      ],
      rewrittenSummary: typeof analysis.rewrittenSummary === 'string' 
        ? analysis.rewrittenSummary.substring(0, 300)
        : "Results-driven professional with strong technical background. Seeking challenging role to leverage expertise and drive impact.",
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [
        "Clear career progression",
        "Relevant technical skills",
        "Professional formatting"
      ],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses.slice(0, 5) : [
        "Could add more quantifiable achievements",
        "Some keywords from job description missing"
      ]
    };

  } catch (err) {
    console.error("Resume analysis error:", err.message);
    
    // Comprehensive fallback
    const structuredResume = await parseResumeStructured(resumeText).catch(() => ({}));
    return {
      scores: { ats: 50, jobMatch: 50, keywords: 50, formatting: 60, overall: 50 },
      matchedKeywords: [],
      missingKeywords: [],
      presentSkills: structuredResume.skills?.technical?.slice(0, 10) || [],
      missingSkills: [],
      suggestions: [
        "Review resume for better keyword alignment",
        "Add quantifiable achievements",
        "Include relevant certifications",
        "Improve contact information visibility",
        "Use action verbs and metrics"
      ],
      rewrittenSummary: "Experienced professional with proven track record of success. Seeking opportunity to contribute expertise and grow.",
      strengths: ["Resume submitted successfully"],
      weaknesses: ["Could benefit from additional details and metrics"]
    };
  }
}

//
// ============================
// 🎯 SAMPLE ANSWER GENERATOR
// ============================
async function generateSampleAnswer(question, jobTitle) {
  const prompt = `
You are preparing a strong, professional answer for an interview.

Role: ${jobTitle}
Question: ${question}

Provide a concise but comprehensive answer (100-150 words) that demonstrates:
1. Understanding of the role
2. Relevant experience
3. Problem-solving ability

Answer:`;

  const response = await callAI(prompt, 400);
  return response.trim();
}

//
// ============================
// 🚀 EXPORTS
// ============================
module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  analyzeResumeAI,
  generateSampleAnswer,
  parseResumeStructured  // Export for resume upload endpoint
};