/**
 * Express Server Demonstrating Configurable Tiered Rate Limiting & Strict Input Schema Validation
 */

'use strict';

const express = require('express');
const {
  createAuthRateLimiter,
  createPublicRateLimiter,
  createAuthenticatedRateLimiter,
  getConfig
} = require('./rateLimiter');

const { validateBody, PATTERNS } = require('./validator');

const app = express();
app.use(express.json());
app.use(express.static('.'));

console.log('⚡ Rate Limiter Threshold Configuration:', JSON.stringify(getConfig(), null, 2));

/* ============================================================
   STRICT VALIDATION SCHEMAS
   ============================================================ */

const loginSchema = {
  type: 'object',
  allowUnknown: false,
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email', minLength: 5, maxLength: 254 },
    password: { type: 'string', minLength: 8, maxLength: 128 }
  }
};

const signupSchema = {
  type: 'object',
  allowUnknown: false,
  required: ['name', 'email', 'password'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100, format: 'name' },
    email: { type: 'string', format: 'email', minLength: 5, maxLength: 254 },
    password: { type: 'string', minLength: 8, maxLength: 128, format: 'strongPassword' }
  }
};

const resetPasswordSchema = {
  type: 'object',
  allowUnknown: false,
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', minLength: 5, maxLength: 254 }
  }
};

const contactSchema = {
  type: 'object',
  allowUnknown: false,
  required: ['name', 'email', 'message'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    email: { type: 'string', format: 'email', minLength: 5, maxLength: 254 },
    phone: { type: 'string', format: 'phone', minLength: 7, maxLength: 20 },
    message: { type: 'string', minLength: 10, maxLength: 2000 }
  }
};

const profileUpdateSchema = {
  type: 'object',
  allowUnknown: false,
  required: [],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    bio: { type: 'string', minLength: 2, maxLength: 500 },
    website: { type: 'string', format: 'url', minLength: 8, maxLength: 200 }
  }
};

/* ============================================================
   1. AUTHENTICATION ROUTES (Strict Limits + Exponential Backoff + Strict Validation)
   ============================================================ */
const authLimiter = createAuthRateLimiter();

app.post('/api/auth/login', authLimiter, validateBody(loginSchema), (req, res) => {
  const { email, password } = req.body;

  // Read credentials safely from environment variables (defaults for local test runner)
  const expectedEmail = process.env.AUTH_DEMO_EMAIL || 'user@example.com';
  const expectedPassword = process.env.AUTH_DEMO_PASSWORD || 'Secret123!';

  const isValid = email === expectedEmail && password === expectedPassword;

  if (!isValid) {
    const backoff = res.recordAuthFailure();
    return res.status(401).json({
      error: 'Invalid Credentials',
      message: `Invalid login attempt. Failed attempt count: ${backoff.attempts}. Next backoff penalty: ${backoff.delaySec} seconds.`,
      nextBackoffSeconds: backoff.delaySec
    });
  }

  res.recordAuthSuccess();

  return res.json({
    success: true,
    message: 'Login successful!',
    user: { email, role: 'developer' }
  });
});

app.post('/api/auth/signup', authLimiter, validateBody(signupSchema), (req, res) => {
  return res.json({
    success: true,
    message: 'Signup successful! Account created.'
  });
});

app.post('/api/auth/reset-password', authLimiter, validateBody(resetPasswordSchema), (req, res) => {
  return res.json({
    success: true,
    message: 'Password reset instructions sent to your email.'
  });
});

/* ============================================================
   2. PUBLIC ENDPOINTS (Moderate Limits + Strict Validation + File Upload Safety)
   ============================================================ */
const publicLimiter = createPublicRateLimiter();
const { handleFileUploadMiddleware, secureServeFile } = require('./fileUploader');

app.get('/api/public/portfolio', publicLimiter, (req, res) => {
  return res.json({
    status: 'ok',
    developer: 'Aman Sharma',
    projects: 6,
    skills: ['React', 'Python', 'Node.js', 'AI']
  });
});

app.post('/api/public/contact', publicLimiter, validateBody(contactSchema), (req, res) => {
  const { name, email, message, phone } = req.body;
  return res.json({
    success: true,
    message: `Thank you, ${name}! Your contact message has been received.`,
    data: { name, email, phone: phone || null }
  });
});

app.post('/api/public/upload', publicLimiter, handleFileUploadMiddleware(), (req, res) => {
  return res.json({
    success: true,
    message: 'File uploaded safely to isolated storage outside web root.',
    file: {
      id: req.uploadedFile.filename,
      sizeBytes: req.uploadedFile.size
    }
  });
});

app.get('/api/public/upload/download/:filename', publicLimiter, (req, res) => {
  secureServeFile(req.params.filename, res);
});

/* ============================================================
   3. AUTHENTICATED USER ACTIONS (Looser Limits + Strict Validation)
   ============================================================ */
const authedLimiter = createAuthenticatedRateLimiter();

app.use('/api/user/*', (req, res, next) => {
  req.user = { id: 'usr_aman_85', name: 'Aman Sharma' };
  next();
});

app.get('/api/user/dashboard', authedLimiter, (req, res) => {
  return res.json({
    success: true,
    message: 'Dashboard data retrieved.',
    user: req.user
  });
});

app.post('/api/user/update-profile', authedLimiter, validateBody(profileUpdateSchema), (req, res) => {
  return res.json({
    success: true,
    message: 'Profile updated successfully.',
    updatedFields: req.body
  });
});

const PORT = process.env.PORT || 4001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running with rate limiting and strict validation at http://localhost:${PORT}`);
  });
}

module.exports = app;
