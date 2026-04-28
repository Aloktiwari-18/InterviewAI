# Production Deployment Checklist

## Required Environment Variables for Render

Set these in Render dashboard under **Environment**:

### 1. Database
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/interview-ai`)

### 2. Authentication  
- `JWT_SECRET` - Secret key for JWT tokens (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 3. AI Services (REQUIRED for Resume Analyzer)
- `OPENAI_API_KEY` - OpenAI API key (get from https://platform.openai.com/api-keys)

### 4. Optional Config
- `NODE_ENV` - Set to `production` (Render auto-sets this)
- `PORT` - Defaults to 5000 (Render usually overrides)

## What Fails Without These

### Without OPENAI_API_KEY
- ❌ Resume analysis endpoint returns 500 error
- ❌ Cannot extract resume skills
- ❌ Cannot extract job requirements

### Without MONGODB_URI
- ❌ Database connection fails
- ❌ Cannot save analysis results
- ❌ Authentication fails

### Without JWT_SECRET
- ❌ Cannot generate/verify login tokens
- ❌ Protected endpoints fail

## Current Issue

The `/api/resume/analyze` endpoint is returning **500** because:
- ✅ Code is correct locally
- ❌ `OPENAI_API_KEY` likely not set on Render
- ❌ Server can start but API calls fail when resumeText is sent

## Fix Steps on Render

1. Go to Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add all three variables above
5. Redeploy

After setting variables, test:
```bash
curl -X POST https://interviewai-1-xfn8.onrender.com/api/resume/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Java developer with 5 years...","jobDescription":"Need Java dev..."}'
```

## Deployment Logs

If it still fails, check Render logs:
1. Render dashboard → Select service
2. Click **Logs** tab
3. Look for error messages

Share the error output for debugging.
