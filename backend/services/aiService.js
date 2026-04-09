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
        { role: "system", content: "You are an expert AI interviewer and resume evaluator." },
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

Return ONLY valid JSON array of strings.
`;

  const response = await callAI(prompt);

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
// 🎯 ANSWER EVALUATION
// ============================
async function evaluateInterviewAnswers(questions, answers, jobTitle) {
  const qa = questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i]}`).join("\n\n");

  const prompt = `
Evaluate the following answers for ${jobTitle}.

${qa}

Return JSON:
{
  "scores": {
    "overall": number,
    "communication": number,
    "technical": number,
    "confidence": number,
    "relevance": number
  },
  "feedback": {
    "summary": "",
    "strengths": [],
    "weaknesses": [],
    "improvements": [],
    "verdict": ""
  },
  "answerScores": []
}
`;

  const response = await callAI(prompt, 1500);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Invalid evaluation response");
  }
}

//
// ============================
// 🎯 RESUME AI ANALYSIS (ONLY AI PART)
// ============================
// ⚠️ NO scoring, NO keywords here
//
async function analyzeResumeAI(resumeText, jobDescription) {
  const prompt = `
Analyze this resume against the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return JSON:
{
  "suggestions": [],
  "rewrittenSummary": "",
  "strengths": [],
  "weaknesses": []
}
`;

  const response = await callAI(prompt, 1200);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      suggestions: [],
      rewrittenSummary: "",
      strengths: [],
      weaknesses: []
    };
  }
}

//
// ============================
// 🎯 SAMPLE ANSWER GENERATOR
// ============================
async function generateSampleAnswer(question, jobTitle) {
  const prompt = `
Provide a strong and professional answer for a ${jobTitle} role.

Question:
${question}

Max 150 words.
`;

  return await callAI(prompt, 300);
}

//
// ============================
// 🚀 EXPORTS
// ============================
module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  analyzeResumeAI,
  generateSampleAnswer
};