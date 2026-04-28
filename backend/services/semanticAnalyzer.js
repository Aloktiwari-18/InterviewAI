require('dotenv').config({ path: '../.env' });

const { ChatOpenAI } = require("@langchain/openai");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { PromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require("@langchain/core/prompts");
const { LLMChain } = require("langchain/chains");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("langchain/document");
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================
// 🔥 LANGCHAIN SETUP
// ============================
const chatModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 2000
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================
// 📄 PARSE RESUME STRUCTURED
// ============================
async function parseResumeStructured(resumeText) {
  const prompt = `
Analyze this resume and extract structured information. Return ONLY valid JSON:

RESUME:
${resumeText}

Return exactly this JSON structure:
{
  "personalInfo": {"name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": ""},
  "summary": "",
  "skills": {"technical": [], "languages": [], "tools": [], "soft": []},
  "experience": [{"company": "", "jobTitle": "", "duration": "", "keyAchievements": []}],
  "education": [{"institution": "", "degree": "", "field": "", "year": ""}],
  "certifications": [],
  "projects": [{"name": "", "description": "", "technologies": []}]
}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Extract structured resume data. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Resume parsing error:", err.message);
    return { personalInfo: {}, summary: "", skills: {}, experience: [], education: [], certifications: [], projects: [] };
  }
}

// ============================
// 🎯 SEMANTIC RESUME ANALYZER (PRODUCTION)
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

    console.log("🚀 Starting Production Semantic Resume Analysis with LangChain...");

    // ✅ STEP 1: Parse resume structure
    console.log("📄 Parsing resume structure...");
    const structuredResume = await parseResumeStructured(resumeText);

    // ✅ STEP 2: Extract JD requirements using LangChain chain
    console.log("📋 Extracting JD requirements...");
    const jdExtractionPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        "You are a senior technical recruiter. Extract ALL technical, soft, and professional requirements from the job description comprehensively."
      ),
      HumanMessagePromptTemplate.fromTemplate(`
Job Description:
{jobDescription}

Extract requirements in these categories:
{
  "technicalSkills": [],      // Programming languages, frameworks, databases, tools
  "experience": [],            // Required years, domains, specific areas
  "certifications": [],        // Any mentioned certifications
  "softSkills": [],            // Communication, leadership, teamwork, etc.
  "keyResponsibilities": [],   // Main responsibilities mentioned
  "mustHaveSkills": [],        // Critical required skills
  "niceToHaveSkills": []      // Preferred but not required
}

Return ONLY valid JSON with actual values from the JD.
`)
    ]);

    const jdChain = new LLMChain({
      llm: chatModel,
      prompt: jdExtractionPrompt
    });

    const jdResult = await jdChain.call({
      jobDescription: jobDescription || "Software development role"
    });

    let jdRequirements = {
      technicalSkills: [],
      experience: [],
      certifications: [],
      softSkills: [],
      keyResponsibilities: [],
      mustHaveSkills: [],
      niceToHaveSkills: []
    };

    try {
      const jsonMatch = jdResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jdRequirements = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("⚠️ JD extraction parsing error:", e.message);
    }

    console.log("✅ JD Requirements extracted:", Object.keys(jdRequirements).map(k => `${k}: ${Array.isArray(jdRequirements[k]) ? jdRequirements[k].length : 0}`).join(", "));

    // ✅ STEP 3: Create vector store for semantic similarity search
    console.log("🔄 Building semantic vector store...");
    const documents = [
      new Document({
        pageContent: resumeText.substring(0, 3000),
        metadata: { type: "resumeFullText", source: "resume" }
      }),
      new Document({
        pageContent: (structuredResume.skills?.technical || []).join(", "),
        metadata: { type: "resumeSkills", source: "resume" }
      }),
      new Document({
        pageContent: (structuredResume.experience || []).map(e => `${e.jobTitle} at ${e.company}: ${e.keyAchievements?.join("; ")}`).join("\n"),
        metadata: { type: "resumeExperience", source: "resume" }
      }),
      new Document({
        pageContent: (jdRequirements.technicalSkills || []).join(", "),
        metadata: { type: "jdTechnicalSkills", source: "jd" }
      }),
      new Document({
        pageContent: (jdRequirements.mustHaveSkills || []).join(", "),
        metadata: { type: "jdMustHave", source: "jd" }
      }),
      new Document({
        pageContent: (jdRequirements.niceToHaveSkills || []).join(", "),
        metadata: { type: "jdNiceToHave", source: "jd" }
      })
    ];

    const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
    console.log("✅ Vector store created");

    // ✅ STEP 4: Perform semantic similarity matching
    console.log("🔍 Performing semantic matching...");
    const mustHaveQuery = (jdRequirements.mustHaveSkills || []).slice(0, 5).join(" ");
    const similarityResults = await vectorStore.similaritySearchWithScore(mustHaveQuery, 5);

    // ✅ STEP 5: Use LangChain to analyze semantic match
    console.log("📊 Analyzing semantic alignment...");
    const resumeAnalysisPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are JobScan - an AI resume analyzer like production-level ATS systems.
Analyze semantic alignment, not just keywords. Consider:
- Skill relevance and proficiency level
- Experience alignment with role expectations
- Education and certifications
- Achievement quantification
- Cultural fit indicators
Be thorough and fair.`
      ),
      HumanMessagePromptTemplate.fromTemplate(`
RESUME SUMMARY:
- Skills: {resumeSkills}
- Experience: {yearsExp} years, {positions} positions
- Education: {education}
- Projects: {projectCount}

JD REQUIREMENTS:
- Must Have: {mustHave}
- Nice to Have: {niceToHave}
- Key Responsibilities: {responsibilities}

SIMILARITY MATCH (from semantic search):
{similarityScore}

Provide comprehensive semantic analysis. Return ONLY JSON:
{
  "semanticAlignment": <0-100>,
  "skillsMatch": <0-100>,
  "experienceMatch": <0-100>,
  "educationMatch": <0-100>,
  "matchedAreas": ["area1", "area2"],
  "gapAreas": ["gap1", "gap2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2"],
  "atsScore": <0-100>,
  "jobMatchPercentage": <0-100>,
  "rewrittenSummary": "professional summary"
}
`)
    ]);

    const yearsExp = structuredResume.experience?.length || 0;
    const positions = structuredResume.experience?.length || 0;
    const education = (structuredResume.education || []).map(e => `${e.degree}`).join(", ") || "Not specified";
    const projectCount = structuredResume.projects?.length || 0;
    const similarityScore = similarityResults.length > 0 
      ? `Top match: ${(similarityResults[0][1] * 100).toFixed(0)}% similar`
      : "No direct matches";

    const analysisChain = new LLMChain({
      llm: chatModel,
      prompt: resumeAnalysisPrompt
    });

    const analysisResult = await analysisChain.call({
      resumeSkills: (structuredResume.skills?.technical || []).slice(0, 20).join(", "),
      yearsExp,
      positions,
      education,
      projectCount,
      mustHave: (jdRequirements.mustHaveSkills || []).slice(0, 8).join(", "),
      niceToHave: (jdRequirements.niceToHaveSkills || []).slice(0, 5).join(", "),
      responsibilities: (jdRequirements.keyResponsibilities || []).slice(0, 5).join("; "),
      similarityScore
    });

    let analysis = {
      semanticAlignment: 70,
      skillsMatch: 65,
      experienceMatch: 60,
      educationMatch: 75,
      matchedAreas: [],
      gapAreas: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      atsScore: 70,
      jobMatchPercentage: 65,
      rewrittenSummary: "Results-driven professional"
    };

    try {
      const jsonMatch = analysisResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("⚠️ Analysis parsing error:", e.message);
    }

    // ✅ STEP 6: Calculate matched and missing keywords semantically
    console.log("🔑 Identifying matched and missing keywords...");
    
    const resumeSkillsLower = (structuredResume.skills?.technical || []).map(s => s.toLowerCase());
    const allJDSkills = [
      ...(jdRequirements.technicalSkills || []),
      ...(jdRequirements.mustHaveSkills || []),
      ...(jdRequirements.niceToHaveSkills || [])
    ];

    const matchedKeywords = allJDSkills.filter(skill => {
      const skillLower = skill.toLowerCase();
      return resumeSkillsLower.some(rSkill => 
        rSkill.includes(skillLower) || skillLower.includes(rSkill)
      );
    }).slice(0, 15);

    const missingKeywords = allJDSkills.filter(skill => {
      const skillLower = skill.toLowerCase();
      return !resumeSkillsLower.some(rSkill => 
        rSkill.includes(skillLower) || skillLower.includes(rSkill)
      );
    }).slice(0, 15);

    // ✅ STEP 7: Calculate final scores
    const overallScore = Math.round(
      (analysis.semanticAlignment + analysis.atsScore) / 2
    );

    console.log(`
✅ PRODUCTION SEMANTIC ANALYSIS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Scores:
  - Semantic Alignment: ${analysis.semanticAlignment}%
  - Skills Match: ${analysis.skillsMatch}%
  - Experience Match: ${analysis.experienceMatch}%
  - ATS Score: ${analysis.atsScore}%
  - Job Match: ${analysis.jobMatchPercentage}%
  - Overall: ${overallScore}%
  
🎯 Keywords:
  - Matched: ${matchedKeywords.length} skills
  - Missing: ${missingKeywords.length} skills
  
📈 Matched Areas: ${analysis.matchedAreas?.length || 0}
📉 Gap Areas: ${analysis.gapAreas?.length || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    return {
      scores: {
        ats: Math.min(100, Math.max(0, analysis.atsScore || 70)),
        jobMatch: Math.min(100, Math.max(0, analysis.jobMatchPercentage || 65)),
        keywords: Math.min(100, Math.max(0, analysis.skillsMatch || 65)),
        formatting: 75,
        overall: overallScore
      },
      matchedKeywords,
      missingKeywords,
      presentSkills: structuredResume.skills?.technical || [],
      missingSkills: missingKeywords,
      matchedAreas: analysis.matchedAreas || [],
      gapAreas: analysis.gapAreas || [],
      suggestions: analysis.recommendations || [
        "Add quantifiable metrics and achievements",
        "Include relevant technologies from job posting",
        "Highlight projects aligned with job requirements",
        "Improve ATS formatting",
        "Add relevant certifications"
      ],
      rewrittenSummary: typeof analysis.rewrittenSummary === 'string' 
        ? analysis.rewrittenSummary.substring(0, 300)
        : "Results-driven professional with proven expertise in key technologies",
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      analysisMethod: "semantic_langchain",
      semanticMatch: {
        overallAlignment: analysis.semanticAlignment || 70,
        skillsAlignment: analysis.skillsMatch || 65,
        experienceAlignment: analysis.experienceMatch || 60,
        educationAlignment: analysis.educationMatch || 75
      },
      jdRequirements: {
        mustHave: (jdRequirements.mustHaveSkills || []).slice(0, 10),
        niceToHave: (jdRequirements.niceToHaveSkills || []).slice(0, 10),
        technicalSkills: (jdRequirements.technicalSkills || []).slice(0, 10)
      }
    };

  } catch (err) {
    console.error("❌ Semantic analysis error:", err.message);
    throw err;
  }
}

module.exports = {
  analyzeResumeWithSemanticMatching,
  parseResumeStructured
};
