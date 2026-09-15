// ================================================================
// CYBER SECURITY LEARNING PORTAL
// RATE LIMITING MIDDLEWARE
// Express.js
// ================================================================

const rateLimit = require("express-rate-limit");

// ================================================================
// GENERAL API RATE LIMITER
// ================================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later."
  },

  handler: (req, res, next, options) => {
    console.warn(
      `Rate limit exceeded: ${req.ip} ${req.method} ${req.originalUrl}`
    );

    return res.status(options.statusCode).json(
      options.message
    );
  }
});


// ================================================================
// OTP REQUEST RATE LIMITER
// ================================================================
// Strict protection against OTP spam and abuse.
// ================================================================

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many OTP requests. Please try again later."
  },

  handler: (req, res, next, options) => {
    console.warn(
      `OTP rate limit exceeded: ${req.ip}`
    );

    return res.status(options.statusCode).json(
      options.message
    );
  }
});


// ================================================================
// OTP VERIFICATION RATE LIMITER
// ================================================================
// Prevents repeated OTP guessing attempts.
// ================================================================

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many OTP verification attempts. Please try again later."
  },

  handler: (req, res, next, options) => {
    console.warn(
      `OTP verification rate limit exceeded: ${req.ip}`
    );

    return res.status(options.statusCode).json(
      options.message
    );
  }
});


// ================================================================
// LOGIN / AUTHENTICATION RATE LIMITER
// ================================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication requests. Please try again later."
  },

  handler: (req, res, next, options) => {
    console.warn(
      `Authentication rate limit exceeded: ${req.ip}`
    );

    return res.status(options.statusCode).json(
      options.message
    );
  }
});


// ================================================================
// EXPORT
// ================================================================

module.exports = {
  apiLimiter,
  otpLimiter,
  otpVerifyLimiter,
  authLimiter
};