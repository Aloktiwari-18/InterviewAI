# LangChain / LangGraph Workflow Documentation

## Overview

This document describes how LangChain and LangGraph are used in the InterviewAI platform.
The workflow is implemented in `backend/services/aiService.js`.

## Workflow Architecture

```
User Input
    │
    ▼
┌─────────────────────────────────────┐
│         LangGraph Orchestrator       │
│                                     │
│  ┌─────────┐    ┌──────────────┐   │
│  │  Parse  │───▶│   Generate   │   │
│  │ Resume  │    │  Questions   │   │
│  └─────────┘    └──────┬───────┘   │
│                         │          │
│                         ▼          │
│                  ┌──────────────┐  │
│                  │  Interview   │  │
│                  │   Session    │  │
│                  └──────┬───────┘  │
│                         │          │
│                         ▼          │
│                  ┌──────────────┐  │
│                  │   Evaluate   │  │
│                  │   Answers    │  │
│                  └──────┬───────┘  │
│                         │          │
│                         ▼          │
│                  ┌──────────────┐  │
│                  │   Generate   │  │
│                  │   Feedback   │  │
│                  └──────────────┘  │
└─────────────────────────────────────┘
```

## Node Descriptions

### 1. Resume Parser Node
- **Input:** Raw resume text (from PDF extraction or paste)
- **Process:** Extract key skills, experience, education
- **Output:** Structured resume data for question generation

### 2. Question Generator Node
- **Input:** Job title + job description + resume summary
- **Process:** Llama 3.1 generates 15 contextual questions mixing:
  - Technical questions (role-specific)
  - Behavioral questions (STAR method)
  - Situational questions
  - Culture fit questions
- **Output:** Array of 15 questions

### 3. Answer Evaluator Node
- **Input:** Question + candidate answer + job context
- **Process:** Score each answer on:
  - Relevance (0-100)
  - Completeness (0-100)
  - Technical accuracy (0-100)
  - Communication clarity (0-100)
- **Output:** Per-answer scores + sample answers

### 4. Feedback Generator Node
- **Input:** All answers + scores
- **Process:** Synthesize overall evaluation
- **Output:** 
  - Overall score
  - Category scores (communication, technical, confidence, relevance)
  - Strengths list
  - Weaknesses list
  - Improvement suggestions
  - Verdict

## ATS Analysis Workflow

```
Resume Text + Job Description
         │
         ▼
┌─────────────────┐
│  Keyword        │  ← Extract keywords from JD
│  Extraction     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Match          │  ← Compare resume vs JD keywords
│  Analysis       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Score          │  ← Calculate ATS, jobMatch, keywords, formatting
│  Calculation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Suggestion     │  ← Generate actionable improvements
│  Generator      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Resume         │  ← AI rewrites professional summary
│  Rewriter       │
└─────────────────┘
```

## LangSmith Tracing Setup

To enable LangSmith observability:

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your_key_here
LANGCHAIN_PROJECT=interview-ai-platform
```

Visit https://smith.langchain.com to see traces.

## Extending with Real LangGraph

To implement full LangGraph state machines, install:
```bash
cd backend
npm install langchain @langchain/community @langchain/langgraph
```

Example LangGraph state:
```javascript
const { StateGraph, END } = require('@langchain/langgraph');

const interviewGraph = new StateGraph({
  channels: {
    jobTitle: null,
    resumeText: null,
    questions: null,
    answers: null,
    evaluation: null,
    feedback: null,
  }
});

interviewGraph.addNode('generateQuestions', generateQuestionsNode);
interviewGraph.addNode('evaluateAnswers', evaluateAnswersNode);
interviewGraph.addNode('generateFeedback', generateFeedbackNode);

interviewGraph.addEdge('generateQuestions', 'evaluateAnswers');
interviewGraph.addEdge('evaluateAnswers', 'generateFeedback');
interviewGraph.addEdge('generateFeedback', END);

interviewGraph.setEntryPoint('generateQuestions');
const app = interviewGraph.compile();
```
