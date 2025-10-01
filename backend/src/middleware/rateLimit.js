const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');

// Configure rate limiters
const rateLimiters = {
  // General API rate limiter
  general: new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // 15 minutes
  }),

  // Authentication rate limiter (stricter)
  auth: new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 5, // 5 attempts
    duration: 900, // 15 minutes
    blockDuration: 900, // Block for 15 minutes after limit exceeded
  }),

  // File upload rate limiter
  upload: new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 10, // 10 uploads
    duration: 3600, // 1 hour
  }),

  // Password reset rate limiter
  passwordReset: new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 3, // 3 attempts
    duration: 3600, // 1 hour
  })
};

// General rate limiter middleware
const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiters.general.consume(req.ip);
    next();
  } catch (rateLimiterRes) {
    const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: remainingTime
    });
  }
};

// Authentication rate limiter
const authRateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiters.auth.consume(req.ip);
    next();
  } catch (rateLimiterRes) {
    const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
    
    res.status(429).json({
      error: 'Too Many Login Attempts',
      message: 'Too many failed login attempts. Please try again later.',
      retryAfter: remainingTime
    });
  }
};

// File upload rate limiter
const uploadRateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiters.upload.consume(req.ip);
    next();
  } catch (rateLimiterRes) {
    const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
    
    res.status(429).json({
      error: 'Upload Limit Exceeded',
      message: 'Too many file uploads. Please try again later.',
      retryAfter: remainingTime
    });
  }
};

// Password reset rate limiter
const passwordResetRateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiters.passwordReset.consume(req.ip);
    next();
  } catch (rateLimiterRes) {
    const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
    
    res.status(429).json({
      error: 'Password Reset Limit Exceeded',
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: remainingTime
    });
  }
};

module.exports = {
  rateLimitMiddleware,
  authRateLimitMiddleware,
  uploadRateLimitMiddleware,
  passwordResetRateLimitMiddleware
};