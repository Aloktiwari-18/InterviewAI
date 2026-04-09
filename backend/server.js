const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const interviewRoutes = require('./routes/interview');
const feedbackRoutes = require('./routes/feedback');

const app = express();


// ======================
// 🔐 SECURITY MIDDLEWARE
// ======================
app.use(helmet());
app.use(morgan('dev'));


// ======================
// 🚦 RATE LIMITING
// ======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);


// ======================
// 🌐 CORS CONFIG (FINAL FIX)
// ======================
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://interview-ai-one-sepia.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

// ✅ Preflight fix
app.options("*", cors(corsOptions));

// ✅ Extra safety (Render fix)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://interview-ai-one-sepia.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});


// ======================
// 📦 BODY PARSER
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// ======================
// 📁 STATIC FILES
// ======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ======================
// 🚀 ROUTES
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/feedback', feedbackRoutes);


// ======================
// ❤️ HEALTH CHECK
// ======================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});


// ======================
// ❌ ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
});


// ======================
// 🗄️ DB + SERVER START
// ======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;