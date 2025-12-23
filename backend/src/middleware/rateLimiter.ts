import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (for production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple rate limiter middleware
 */
export const rateLimiter = (
  maxRequests: number = 200, // Increased from 100 to 200
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up old entries
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    // Check or create entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    // Increment and check
    store[key].count++;

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
      return;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count));
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    next();
  };
};

/**
 * Rate limiter for authentication endpoints (more lenient for development)
 */
export const authRateLimiter = rateLimiter(20, 15 * 60 * 1000); // 20 requests per 15 minutes

