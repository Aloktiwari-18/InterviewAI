# InterviewAI — API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/register
```json
Request:
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }

Response 201:
{ "token": "jwt...", "user": { "id": "...", "name": "John Doe", "email": "...", "plan": "free" } }
```

### POST /auth/login
```json
Request:
{ "email": "john@example.com", "password": "secret123" }

Response 200:
{ "token": "jwt...", "user": { "id": "...", "name": "John Doe", ... } }
```

### GET /auth/me *(protected)*
```json
Response 200:
{ "user": { "id": "...", "name": "...", "email": "...", "stats": {...} } }
```

---

## Interview

### POST /interview/generate-questions *(protected)*
```json
Request:
{
  "jobTitle": "Senior React Developer",
  "jobDescription": "We are looking for...",
  "resumeText": "5 years of experience in..."
}

Response 200:
{
  "interviewId": "64f...",
  "questions": ["Tell me about yourself...", "...15 questions total"]
}
```

### POST /interview/start/:id *(protected)*
```json
Response 200:
{ "message": "Interview started", "interview": { ... } }
```

### POST /interview/submit-answer/:id *(protected)*
```json
Request:
{ "questionIndex": 0, "answer": "I have 5 years of...", "duration": 45 }

Response 200:
{ "message": "Answer submitted", "sampleAnswer": "A strong answer would be..." }
```

### POST /interview/complete/:id *(protected)*
```json
Response 200:
{
  "scores": { "overall": 78, "communication": 82, "technical": 74, "confidence": 80, "relevance": 76 },
  "feedback": {
    "summary": "Strong performance...",
    "strengths": ["Clear communication", "..."],
    "weaknesses": ["Could be more specific", "..."],
    "improvements": ["Use STAR method", "..."],
    "verdict": "Strong Hire"
  },
  "answers": [...]
}
```

---

## Resume

### POST /resume/upload *(protected)*
```
Content-Type: multipart/form-data
Field: resume (file, PDF/TXT max 5MB)

Response 200:
{ "fileName": "resume.pdf", "resumeText": "Extracted text...", "message": "Resume uploaded" }
```

### POST /resume/analyze *(protected)*
```json
Request:
{
  "resumeText": "John Doe\nSoftware Engineer...",
  "jobDescription": "We need a React developer...",
  "fileName": "john_resume.pdf"
}

Response 200:
{
  "analysisId": "64f...",
  "scores": { "ats": 76, "jobMatch": 68, "keywords": 72, "formatting": 85, "overall": 75 },
  "analysis": {
    "matchedKeywords": ["React", "JavaScript", "Node.js"],
    "missingKeywords": ["TypeScript", "Docker", "AWS"],
    "presentSkills": ["Frontend Development", "Backend Development"],
    "missingSkills": ["Cloud Deployment", "DevOps"],
    "suggestions": ["Add TypeScript skills", "Include AWS experience", "..."],
    "rewrittenSummary": "Results-driven developer...",
    "strengths": ["Strong full-stack foundation", "..."],
    "weaknesses": ["Missing cloud skills", "..."]
  },
  "sections": {
    "hasContact": true, "hasSummary": false, "hasExperience": true,
    "hasEducation": true, "hasSkills": true, "hasProjects": true
  }
}
```

---

## Feedback

### GET /feedback/interview/:id *(protected)*
```json
Response 200:
{
  "scores": { "overall": 78, ... },
  "feedback": { "summary": "...", "strengths": [...], ... },
  "answers": [{ "questionIndex": 0, "question": "...", "answer": "...", "score": 75, "sampleAnswer": "..." }],
  "jobTitle": "Senior React Developer",
  "duration": 1840,
  "completedAt": "2025-01-15T10:30:00Z"
}
```

### GET /feedback/dashboard *(protected)*
```json
Response 200:
{
  "recentInterviews": [...],
  "recentAnalyses": [...],
  "stats": {
    "totalInterviews": 5,
    "completedInterviews": 4,
    "averageScore": 74,
    "totalAnalyses": 3
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

| Code | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
