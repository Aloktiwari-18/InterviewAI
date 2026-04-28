const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ✅ FIX 1: Enhanced token generation with refresh token support
const generateTokens = (id) => {
  const token = jwt.sign(
    { id }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  return { token, refreshToken };
};

// ✅ FIX 2: Enhanced password validation
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number');

// POST /api/auth/register
router.post('/register', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  passwordValidation
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    const user = await User.create({ name, email, password });
    const { token, refreshToken } = generateTokens(user._id);

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      code: 'REGISTER_FAILED'
    });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // ✅ FIX 3: Don't reveal if email exists
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const { token, refreshToken } = generateTokens(user._id);

    // ✅ FIX 4: Optional: Set refresh token as secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      token,
      refreshToken, // Also send in body for localStorage fallback
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
});

// ✅ NEW: POST /api/auth/refresh - Refresh access token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { refreshToken } = req.body;

    try {
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const { token: newToken } = generateTokens(user._id);

      res.json({
        success: true,
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      return res.status(401).json({ 
        error: 'Refresh token invalid or expired',
        code: 'REFRESH_FAILED'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ 
      success: true,
      user: req.user 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    
    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ✅ NEW: POST /api/auth/logout - No token required (client cleans up)
router.post('/logout', (req, res) => {
  // ✅ FIX: Don't require token validation for logout
  // Client will clear localStorage themselves
  // This endpoint just serves as an API signal point
  res.json({ 
    success: true,
    message: 'Logged out successfully. Client should clear localStorage.' 
  });
});

module.exports = router;
