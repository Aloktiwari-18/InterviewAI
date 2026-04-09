# 🚀 InterviewAI — AI-Powered Interview & Resume Analysis Platform

A production-ready SaaS platform for AI mock interviews, ATS resume scoring, and career prep.  
Built with the **MERN stack** + **Llama 3.1** (HuggingFace) + **LangChain/LangGraph**.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🎙 AI Mock Interviews | Voice-enabled Q&A with Llama 3.1, silence detection, 15 questions per session |
| 📄 ATS Resume Analyzer | Upload PDF/TXT → get ATS score, keyword gaps, job match % |
| 📊 Detailed Feedback | Scores for communication, technical, confidence, relevance |
| 🔐 JWT Authentication | Secure login/register with bcrypt password hashing |
| 🌗 Dark/Light Mode | Smooth theme toggle throughout the app |
| 📜 Interview History | All past sessions with scores and downloadable reports |

---

## 🧱 Tech Stack

**Frontend:** React 18 · Tailwind CSS · Framer Motion · React Router v6  
**Backend:** Node.js · Express.js · MongoDB · Mongoose  
**AI:** HuggingFace API (Llama 3.1) · LangChain  
**Voice:** Web Speech API (SpeechRecognition + SpeechSynthesis)  
**Camera:** WebRTC MediaDevices  

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- MongoDB Atlas account OR local MongoDB
- HuggingFace account (free) for AI features

---

### Step 1 — Clone & Install

```bash
# Clone repository
git clone <your-repo-url> interview-ai
cd interview-ai

# Install all dependencies at once
npm run install-all
```

This installs root, backend, and frontend dependencies automatically.

---

### Step 2 — Configure Environment Variables

```bash
# Copy the example env file
cp .env.example backend/.env
```

Then edit `backend/.env` with your actual values:

```env
# MongoDB — Get from https://cloud.mongodb.com (free tier)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/interviewai

# JWT — Generate a random secret (e.g., run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_very_long_random_secret_here

# HuggingFace API Key — Get from https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: LangSmith for tracing
LANGCHAIN_API_KEY=ls__xxxx
LANGSMITH_API_KEY=ls__xxxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=interview-ai

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> 💡 **Note:** The app works WITHOUT an API key using smart mock data. Perfect for testing locally!

---

### Step 3 — Run the Application

```bash
# From the root directory — starts both frontend + backend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

---

## 🗝 Where to Put API Keys

| Key | Where to Get | Where to Put |
|---|---|---|
| `MONGO_URI` | [MongoDB Atlas](https://cloud.mongodb.com) (free M0 cluster) | `backend/.env` |
| `JWT_SECRET` | Any random string (32+ chars) | `backend/.env` |
| `HUGGINGFACE_API_KEY` | [HuggingFace Settings](https://huggingface.co/settings/tokens) → New Token (Read) | `backend/.env` |
| `LANGSMITH_API_KEY` | [LangSmith](https://smith.langchain.com) (optional) | `backend/.env` |

---

## 📁 Project Structure

```
interview-ai/
├── package.json              ← Root scripts (runs both frontend + backend)
├── .env.example              ← Template for all env variables
│
├── backend/
│   ├── server.js             ← Express app entry point
│   ├── package.json
│   ├── .env                  ← YOUR env file (create from .env.example)
│   ├── models/
│   │   ├── User.js           ← User schema (name, email, password, stats)
│   │   ├── Interview.js      ← Interview sessions + answers + feedback
│   │   └── ATSAnalysis.js    ← Resume analysis results
│   ├── routes/
│   │   ├── auth.js           ← /api/auth/* (register, login, me)
│   │   ├── interview.js      ← /api/interview/* (generate, submit, complete)
│   │   ├── resume.js         ← /api/resume/* (upload, analyze, history)
│   │   └── feedback.js       ← /api/feedback/* (results, dashboard)
│   ├── middleware/
│   │   └── auth.js           ← JWT verification middleware
│   ├── services/
│   │   └── aiService.js      ← HuggingFace Llama 3.1 integration + fallback mocks
│   └── uploads/              ← Uploaded resume files (auto-created)
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js            ← Router setup
│       ├── index.js          ← Entry point
│       ├── context/
│       │   ├── AuthContext.js    ← Global auth state
│       │   └── ThemeContext.js   ← Dark/light mode state
│       ├── utils/
│       │   └── api.js            ← Axios instance + all API calls
│       ├── styles/
│       │   └── index.css         ← Tailwind + CSS variables + custom styles
│       ├── components/
│       │   └── shared/
│       │       ├── Navbar.js
│       │       ├── Sidebar.js
│       │       ├── DashboardLayout.js
│       │       └── ScoreCircle.js
│       └── pages/
│           ├── LandingPage.js    ← High-conversion SaaS landing page
│           ├── LoginPage.js
│           ├── RegisterPage.js
│           ├── Dashboard.js      ← Stats, quick actions, recent activity
│           ├── InterviewPage.js  ← Full interview system (voice + camera)
│           ├── ResumeAnalyzer.js ← ATS scoring + analysis
│           ├── FeedbackPage.js   ← Detailed interview results
│           └── HistoryPage.js    ← All past sessions
│
├── ai-services/
│   └── langchain-workflow.md ← LangChain/LangGraph workflow documentation
│
└── docs/
    └── api-reference.md      ← Full API documentation
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### Interview
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interview/generate-questions` | AI generates 15 questions |
| POST | `/api/interview/start/:id` | Start session timer |
| POST | `/api/interview/submit-answer/:id` | Submit one answer + get sample |
| POST | `/api/interview/complete/:id` | End interview → trigger AI evaluation |
| GET | `/api/interview/history` | List past interviews |
| GET | `/api/interview/:id` | Get single interview |

### Resume
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload PDF/TXT file |
| POST | `/api/resume/analyze` | Run ATS + job match analysis |
| GET | `/api/resume/history` | List past analyses |

### Feedback
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/feedback/interview/:id` | Get interview feedback |
| GET | `/api/feedback/dashboard` | Dashboard stats + recent activity |

---

## 🤖 How AI Works (No API Key Mode)

The app has an intelligent **fallback mock system** in `backend/services/aiService.js`.

Without a HuggingFace API key:
- Interview questions are realistic pre-generated questions
- Evaluation returns plausible scores (60–85% range)
- ATS analysis returns sample keyword analysis
- Resume rewrite suggestions are contextual

**To enable real AI:** Add your `HUGGINGFACE_API_KEY` to `backend/.env`.  
The model used is `meta-llama/Meta-Llama-3.1-8B-Instruct` (free tier on HuggingFace).

---

## 🚨 Common Errors & Fixes

### "MongoDB connection error"
```
Error: MongoServerError: bad auth
```
**Fix:** Double-check your `MONGO_URI` in `backend/.env`. Make sure:
- Username and password are URL-encoded (no special chars like `@` in password)
- You've whitelisted your IP in MongoDB Atlas → Network Access → Add IP Address

---

### "Cannot find module 'react-scripts'"
```
Fix: cd frontend && npm install
```

---

### "Port 5000 already in use"
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9  # Mac/Linux
# Or change PORT in backend/.env
```

---

### "Speech recognition not supported"
- Use Google Chrome (desktop) for best voice support
- Grant microphone permissions when prompted

---

### "HuggingFace API 503 error"
- The model may be cold-starting. Wait 20 seconds and retry.
- Free tier has rate limits. The app automatically falls back to mock data.

---

### Frontend not connecting to backend
Ensure `"proxy": "http://localhost:5000"` is in `frontend/package.json` (already set).  
Or set `REACT_APP_API_URL=http://localhost:5000/api` in `frontend/.env`.

---

## 🌐 Deployment

### Backend (Railway / Render / Fly.io)
```bash
cd backend
# Set env vars in the platform's dashboard
# Deploy command:
npm start
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Set REACT_APP_API_URL to your backend URL
```

---

## 🔐 Security Notes

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Rate limiting: 100 requests per 15 minutes per IP
- Helmet.js for security headers
- CORS configured for your frontend URL only

---

## 📦 Dependencies Summary

### Backend
- `express` — Web framework
- `mongoose` — MongoDB ODM
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT auth
- `multer` — File uploads
- `pdf-parse` — PDF text extraction
- `node-fetch` — HuggingFace API calls
- `helmet` + `cors` + `express-rate-limit` — Security

### Frontend
- `react` + `react-dom` — UI framework
- `react-router-dom` — Routing
- `framer-motion` — Animations
- `axios` — API calls
- `react-dropzone` — File upload UI
- `react-hot-toast` — Notifications
- `lucide-react` — Icons

---

## 🧑‍💻 Development Tips

```bash
# Run only backend
cd backend && npm run dev

# Run only frontend  
cd frontend && npm start

# Check backend health
curl http://localhost:5000/api/health

# Create a test user via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'
```

---

## 📄 License

MIT License — Free to use, modify, and deploy.

---

Built with ❤️ | MERN + Llama 3.1 + LangChain | InterviewAI 2025
