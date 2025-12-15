import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(req: Request): string {
    const userId = (req as any).user?.userId || 'anonymous';
    const path = req.path;
    const query = JSON.stringify(req.query);
    return `${userId}:${path}:${query}`;
  }
}

export const responseCache = new ResponseCache();

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (ttl: number = 5 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = responseCache.generateKey(req);
    const cached = responseCache.get(cacheKey);

    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode === 200 && body.success) {
        responseCache.set(cacheKey, body, ttl);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for a specific user
 */
export const clearUserCache = (userId: number): void => {
  // Clear all cache entries for this user
  // In production, you might want a more efficient approach
  responseCache.clear();
};

