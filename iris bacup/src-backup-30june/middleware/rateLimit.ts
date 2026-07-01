import rateLimit from 'express-rate-limit';

// Strict rate limit for authentication endpoints (prevents brute-force)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 60 seconds before trying again.'
  }
});

// Standard rate limit for write/mutation endpoints
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 writes per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Maximum 30 write requests per minute.'
  }
});

// Relaxed rate limit for read endpoints
export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 reads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Maximum 100 read requests per minute.'
  }
});

// Global catch-all rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Global rate limit exceeded. Please try again later.'
  }
});
