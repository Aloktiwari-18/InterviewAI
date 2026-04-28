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
// 🎯 RESUME AI ANALYSIS (PRODUCTION LEVEL)
// ============================

// ✅ Filter out common stop words & filler words
const STOP_WORDS = new Set([
  'with', 'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'from',
  'as', 'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'shall', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'which', 'who', 'whom', 'what', 'when', 'where', 'why', 'how',
  'required', 'preferred', 'ability', 'skills', 'experience', 'knowledge', 'understanding',
  'good', 'strong', 'excellent', 'proficiency', 'familiarity', 'working', 'worked', 'works'
]);

// ✅ Production keywords to extract from JD
const TECH_SKILL_KEYWORDS = {
  languages: ['java', 'python', 'javascript', 'typescript', 'c#', 'c++', 'go', 'rust', 'kotlin', 'swift', 'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'groovy', 'gradle'],
  frameworks: ['spring', 'springboot', 'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'express', 'node.js', 'asp.net', 'laravel', 'rails', 'quarkus'],
  databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sql server', 'dynamodb', 'cassandra', 'elasticsearch', 'neo4j', 'firebase', 'sqlite'],
  apis: ['rest', 'restful', 'graphql', 'soap', 'grpc', 'websocket', 'api', 'rest api', 'web services', 'microservices'],
  cloud: ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'docker compose', 'jenkins', 'gitlab', 'github', 'heroku', 'cloudflare'],
  tools: ['git', 'github', 'gitlab', 'bitbucket', 'maven', 'gradle', 'npm', 'yarn', 'pip', 'junit', 'mockito', 'jira', 'confluence'],
  methodologies: ['agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd', 'tdd', 'bdd', 'oops', 'oop', 'solid', 'design patterns'],
  databases_extended: ['sql', 'nosql', 'relational database', 'non-relational database', 'jdbc', 'hibernate', 'jpa', 'mybatis', 'orm']
};

// ✅ Smart keyword extraction from text
function extractSkillsIntelligent(text, jobDescription = '') {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const allSkills = new Set();
  
  // Extract from JD first (higher priority)
  if (jobDescription) {
    const lowerJD = jobDescription.toLowerCase();
    Object.values(TECH_SKILL_KEYWORDS).forEach(skills => {
      skills.forEach(skill => {
        if (lowerJD.includes(skill)) {
          allSkills.add(skill);
        }
      });
    });
  }
  
  // Extract from resume
  Object.values(TECH_SKILL_KEYWORDS).forEach(skills => {
    skills.forEach(skill => {
      if (lowerText.includes(skill)) {
        allSkills.add(skill);
      }
    });
  });
  
  return Array.from(allSkills);
}

// ✅ Extract ONLY important skills from JD
async function extractJDRequiredSkills(jobDescription) {
  const prompt = `
You are a technical recruiter. Extract ONLY the core required technical skills from this job description.

Return a JSON array with these categories:
{
  "mandatory": ["skill1", "skill2"],  // Must have
  "preferred": ["skill3", "skill4"],  // Nice to have
  "technical": ["skill5", "skill6"]   // All technical
}

JOB DESCRIPTION:
${jobDescription || 'Software development role'}

Return ONLY valid JSON, no other text.
`;

  try {
    const response = await callAI(prompt, 600);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        mandatory: Array.isArray(parsed.mandatory) ? parsed.mandatory : [],
        preferred: Array.isArray(parsed.preferred) ? parsed.preferred : [],
        technical: Array.isArray(parsed.technical) ? parsed.technical : []
      };
    }
  } catch (e) {
    console.warn("JD skills extraction error:", e.message);
  }
  
  return { mandatory: [], preferred: [], technical: [] };
}

// ✅ Intelligent matching algorithm
function intelligentMatch(resumeSkills, jdSkills) {
  const resumeLower = resumeSkills.map(s => s.toLowerCase());
  const jdLower = jdSkills.map(s => s.toLowerCase());
  
  const matched = jdLower.filter(skill => {
    return resumeLower.some(rSkill => {
      // Exact match
      if (rSkill === skill) return true;
      // Substring match for longer skills
      if (skill.includes(rSkill) || rSkill.includes(skill)) return true;
      return false;
    });
  });
  
  const missing = jdLower.filter(skill => !matched.includes(skill));
  
  return { matched, missing };
}

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

    // ✅ STEP 1: Extract required skills from JD
    const jdSkillsData = await extractJDRequiredSkills(jobDescription || '');
    const allJDSkills = [
      ...jdSkillsData.mandatory,
      ...jdSkillsData.preferred,
      ...jdSkillsData.technical
    ].filter(s => s && s.length > 0 && !STOP_WORDS.has(s.toLowerCase()));

    // ✅ STEP 2: Extract skills from resume intelligently
    const resumeSkills = [
      ...extractSkillsIntelligent(resumeText, jobDescription),
      ...(structuredResume.skills?.technical || []),
      ...(structuredResume.skills?.tools || [])
    ].filter(s => s && s.length > 0 && !STOP_WORDS.has(s.toLowerCase()));

    // ✅ STEP 3: Match skills (smart comparison)
    const { matched: matchedKeywords, missing: missingKeywords } = intelligentMatch(resumeSkills, allJDSkills);

    // ✅ STEP 4: Calculate scores
    const keywordMatchScore = allJDSkills.length > 0 
      ? Math.round((matchedKeywords.length / allJDSkills.length) * 100)
      : 50;

    // ✅ STEP 5: Get comprehensive AI analysis
    const analysisPrompt = `
You are an expert ATS and technical recruiter. Analyze this resume comprehensively against job requirements.

RESUME (first 2000 chars):
${resumeText.substring(0, 2000)}

JD REQUIRED SKILLS:
- Mandatory: ${jdSkillsData.mandatory.join(', ') || 'None specified'}
- Preferred: ${jdSkillsData.preferred.join(', ') || 'None specified'}

CANDIDATE SKILLS FOUND:
${resumeSkills.slice(0, 15).join(', ') || 'Basic skills detected'}

MATCH ANALYSIS:
- Matched: ${matchedKeywords.slice(0, 10).join(', ') || 'None'}
- Missing: ${missingKeywords.slice(0, 10).join(', ') || 'All covered'}

RESUME STRUCTURE:
- Experience: ${structuredResume.experience?.length || 0} positions
- Education: ${structuredResume.education?.length || 0} degrees
- Projects: ${structuredResume.projects?.length || 0}
- Contact info: ${structuredResume.personalInfo?.email ? 'Yes' : 'No'}

Provide honest scores and actionable feedback.

Return ONLY valid JSON (no markdown):
{
  "atsScore": <0-100>,
  "jobMatchScore": <0-100>,
  "formattingScore": <0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["Fix 1", "Fix 2", "Fix 3"],
  "rewrittenSummary": "Professional 2-3 sentence summary focused on JD requirements"
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

    // ✅ STEP 6: Calculate final scores
    const atsScore = Math.max(0, Math.min(100, parseInt(analysis.atsScore) || 65));
    const jobMatchScore = Math.max(0, Math.min(100, parseInt(analysis.jobMatchScore) || 70));
    const formattingScore = Math.max(0, Math.min(100, parseInt(analysis.formattingScore) || 75));
    const overallScore = Math.round((atsScore + jobMatchScore + keywordMatchScore + formattingScore) / 4);

    console.log(`📊 Resume Analysis:
      - ATS: ${atsScore}%
      - Job Match: ${jobMatchScore}%
      - Keywords: ${keywordMatchScore}% (${matchedKeywords.length}/${allJDSkills.length})
      - Formatting: ${formattingScore}%
      - Overall: ${overallScore}%
      - Matched Skills: ${matchedKeywords.join(', ')}
      - Missing Skills: ${missingKeywords.join(', ')}`);

    return {
      scores: {
        ats: atsScore,
        jobMatch: jobMatchScore,
        keywords: keywordMatchScore,
        formatting: formattingScore,
        overall: overallScore
      },
      matchedKeywords: matchedKeywords.slice(0, 15),
      missingKeywords: missingKeywords.slice(0, 15),
      presentSkills: resumeSkills.slice(0, 20),
      missingSkills: missingKeywords.slice(0, 15),
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 5) : [
        "Add more quantifiable achievements with metrics",
        "Include all relevant certifications and technical skills",
        "Use action verbs and technical terminology",
        "Highlight projects matching job requirements",
        "Ensure ATS-friendly formatting (avoid tables, images)"
      ],
      rewrittenSummary: typeof analysis.rewrittenSummary === 'string' 
        ? analysis.rewrittenSummary.substring(0, 300)
        : "Results-driven professional with strong technical background. Proven expertise in key technologies. Seeking role to leverage skills and drive impact.",
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [
        "Clear career progression",
        "Relevant technical skills",
        "Professional structure"
      ],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses.slice(0, 5) : [
        "Some key skills from JD missing",
        "Could add more quantifiable metrics"
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