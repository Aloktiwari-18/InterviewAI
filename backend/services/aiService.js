
require('dotenv').config({ path: '../.env' });

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================
// 🔥 MAIN CALL FUNCTION
// ============================
async function callAI(prompt, maxTokens = 1000) {
  try {
    console.log("🚀 Calling OpenAI...");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheap + best
      messages: [
        { role: "system", content: "You are an expert AI interviewer and evaluator." },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    console.log("✅ OpenAI Response received");

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ OpenAI ERROR:", error.message);
    throw error;
  }
}

// ============================
// 🎯 INTERVIEW QUESTIONS
// ============================
async function generateInterviewQuestions(jobTitle, jobDescription, resumeText) {
  const prompt = `
Generate exactly 15 interview questions for ${jobTitle}.
Job Description: ${jobDescription}
Resume: ${resumeText}

Return ONLY JSON array.
`;

  const response = await callAI(prompt);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch[0]);

    // ✅ FIXED FORMAT
    return parsed.map(q => ({
      question: typeof q === "string" ? q : q.question
    }));

  } catch (err) {
    console.error("❌ Parsing error:", err.message);
    throw new Error("Invalid AI response format");
  }
}
// ============================
// 🎯 ANSWER EVALUATION
// ============================
async function evaluateInterviewAnswers(questions, answers, jobTitle) {
  const qa = questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i]}`).join("\n\n");

  const prompt = `
Evaluate these answers for ${jobTitle}.

${qa}

Return JSON:
{
  scores: { overall, communication, technical, confidence, relevance },
  feedback: { summary, strengths, weaknesses, improvements, verdict },
  answerScores: []
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

// ============================
// 🎯 RESUME ANALYSIS
// ============================
async function analyzeResume(resumeText, jobDescription) {
  const prompt = `
Analyze this resume vs job description.

Resume: ${resumeText}
Job: ${jobDescription}

Return JSON:
{
  scores: {},
  matchedKeywords: [],
  missingKeywords: [],
  suggestions: []
}
`;

  const response = await callAI(prompt, 1500);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Invalid resume analysis response");
  }
}

// ============================
// 🎯 SAMPLE ANSWER
// ============================
async function generateSampleAnswer(question, jobTitle) {
  const prompt = `
Give a perfect answer for ${jobTitle} role:

Question: ${question}

Max 150 words.
`;

  return await callAI(prompt, 300);
}

module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  analyzeResume,
  generateSampleAnswer
};