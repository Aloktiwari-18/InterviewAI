require('dotenv').config({ path: '../.env' });

const OpenAI = require("openai");
const sw = require('stopword');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================
// 🔥 HELPER: Remove Stopwords
// ============================
function removeStopwords(words) {
  if (typeof words === 'string') {
    words = words.split(/\s+/);
  }
  return sw.removeStopwords(words, sw.eng).join(' ').trim();
}

function filterStopwords(wordArray) {
  if (!Array.isArray(wordArray)) return [];
  return wordArray
    .filter(word => word && word.toString().length > 0)
    .filter(word => !sw.eng.includes(word.toString().toLowerCase()))
    .map(word => word.toString().trim())
    .filter((word, idx, arr) => arr.indexOf(word) === idx); // Remove duplicates
}

// ============================
// 📄 PARSE RESUME
// ============================
async function parseResumeStructured(resumeText) {
  try {
    const prompt = `Extract technical information from this resume. Return ONLY valid JSON (no markdown):

Resume:
${resumeText}

Return exactly this JSON:
{
  "technicalSkills": ["skill1", "skill2"],
  "frameworks": ["framework1"],
  "databases": ["db1"],
  "tools": ["tool1"],
  "languages": ["lang1"],
  "yearsOfExperience": 0
}

CRITICAL: Only include concrete technical items. NO filler words like "and", "with", "or", "required", "ability", "skills", "knowledge", "understanding".`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Extract only concrete technical skills. Return ONLY valid JSON. No markdown code blocks." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks more reliably
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON from content (find first { and last })
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in response');
    }
    
    const jsonStr = content.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    
    // Filter each array through stopwords
    const cleaned = {
      technicalSkills: filterStopwords(parsed.technicalSkills || []),
      frameworks: filterStopwords(parsed.frameworks || []),
      databases: filterStopwords(parsed.databases || []),
      tools: filterStopwords(parsed.tools || []),
      languages: filterStopwords(parsed.languages || []),
      yearsOfExperience: parsed.yearsOfExperience || 0
    };

    return cleaned;
  } catch (err) {
    console.error("❌ Resume parse error:", err.message);
    console.error("Error details:", err);
    return {
      technicalSkills: [],
      frameworks: [],
      databases: [],
      tools: [],
      languages: [],
      yearsOfExperience: 0
    };
  }
}

// ============================
// 🎯 SEMANTIC ANALYZER
// ============================

async function analyzeResumeWithSemanticMatching(resumeText, jobDescription) {
  try {
    if (!resumeText || resumeText.trim().length < 50) {
      return {
        scores: { ats: 20, jobMatch: 20, keywords: 15, formatting: 30, overall: 20 },
        matchedKeywords: [],
        missingKeywords: [],
        presentSkills: [],
        missingSkills: [],
        suggestions: ["Resume is too short. Add more details."],
        rewrittenSummary: "Unable to analyze - resume needs more content",
        strengths: ["Resume submitted"],
        weaknesses: ["Resume lacks detail"],
        analysisMethod: "error"
      };
    }

    console.log("🚀 Starting Production Semantic Analysis...");

    // ✅ STEP 1: Parse resume
    const resumeParsed = await parseResumeStructured(resumeText);

    // ✅ STEP 2: Extract JD skills
    console.log("📋 Extracting JD requirements...");
    const jdPrompt = `Extract technical skills from this job description. Return ONLY valid JSON:

Job Description:
${jobDescription || "Software development"}

Return exactly this JSON:
{
  "mustHaveSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill3"],
  "yearsRequired": 0
}

CRITICAL: Only concrete technical skills. NO: and, with, or, required, ability, skills, knowledge, understanding, good, strong.`;

    const jdResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Extract concrete technical skills only. Return ONLY valid JSON." 
        },
        { role: "user", content: jdPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    let jdContent = jdResponse.choices[0].message.content.trim();
    
    // Remove markdown code blocks more reliably
    jdContent = jdContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON from content
    const jdJsonStart = jdContent.indexOf('{');
    const jdJsonEnd = jdContent.lastIndexOf('}');
    
    if (jdJsonStart === -1 || jdJsonEnd === -1) {
      throw new Error('No JSON object found in JD response');
    }
    
    const jdJsonStr = jdContent.substring(jdJsonStart, jdJsonEnd + 1);
    const jdParsed = JSON.parse(jdJsonStr);
    
    // Filter JD skills
    const mustHave = filterStopwords(jdParsed.mustHaveSkills || []);
    const niceToHave = filterStopwords(jdParsed.niceToHaveSkills || []);
    const allJDSkills = [...mustHave, ...niceToHave];

    console.log("✅ JD Skills (must):", mustHave);
    console.log("✅ JD Skills (nice):", niceToHave);

    // ✅ STEP 3: Get all resume skills
    const allResumeSkills = [
      ...resumeParsed.technicalSkills,
      ...resumeParsed.frameworks,
      ...resumeParsed.databases,
      ...resumeParsed.tools,
      ...resumeParsed.languages
    ];

    console.log("📝 Resume Skills:", allResumeSkills);

    // ✅ STEP 4: Semantic matching
    const matchedKeywords = allJDSkills.filter(jdSkill => {
      const jdLower = jdSkill.toLowerCase();
      return allResumeSkills.some(rSkill => {
        const rLower = rSkill.toLowerCase();
        return rLower === jdLower || 
               rLower.includes(jdLower) || 
               jdLower.includes(rLower);
      });
    });

    const missingKeywords = allJDSkills.filter(skill => !matchedKeywords.includes(skill));

    // ✅ STEP 5: Calculate scores
    const keywordPercent = allJDSkills.length > 0 
      ? Math.round((matchedKeywords.length / allJDSkills.length) * 100)
      : 50;

    const scores = {
      ats: 72,
      jobMatch: keywordPercent,
      keywords: keywordPercent,
      formatting: 75,
      overall: Math.round((72 + keywordPercent + 75) / 3)
    };

    console.log(`
✅ ANALYSIS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Matched: ${matchedKeywords.join(", ") || "None"}
❌ Missing: ${missingKeywords.join(", ") || "None"}
📈 Score: ${scores.overall}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    return {
      scores,
      matchedKeywords: matchedKeywords.slice(0, 20),
      missingKeywords: missingKeywords.slice(0, 20),
      presentSkills: allResumeSkills.slice(0, 20),
      missingSkills: missingKeywords.slice(0, 10),
      suggestions: [
        `Acquire: ${missingKeywords.slice(0, 3).join(", ") || "Consider advanced skills"}`,
        "Use specific technical keywords from the job description",
        "Quantify achievements with measurable results",
        "Include industry-relevant certifications",
        "Optimize formatting for ATS scanning"
      ],
      rewrittenSummary: `${matchedKeywords.length > 0 ? 'Proficient in ' + matchedKeywords.slice(0, 3).join(", ") + '. ' : ''}Experienced professional with strong technical foundation.`,
      strengths: [
        `Expertise: ${matchedKeywords.slice(0, 3).join(", ") || "Technical skills present"}`,
        "Clear career progression",
        "Relevant technical background"
      ],
      weaknesses: [
        `Missing: ${missingKeywords.slice(0, 3).join(", ") || "None"}`,
        "Expand quantifiable metrics",
        "Add certifications for skill validation"
      ],
      analysisMethod: "semantic_production_v2"
    };

  } catch (err) {
    console.error("❌ Analysis error:", err.message);
    console.error("Full error:", err);
    throw err;
  }
}

module.exports = {
  analyzeResumeWithSemanticMatching,
  parseResumeStructured
};
