/**
 * Configurable Tiered Rate Limiter Middleware
 * Supporting:
 * 1. Auth Routes: Strict limits + per-IP & per-account tracking + exponential backoff
 * 2. Public Endpoints: Moderate limits per IP
 * 3. Authenticated User Actions: Looser limits per user ID
 */

'use strict';

class MemoryStore {
  constructor() {
    this.hits = new Map();
    this.backoffs = new Map();

    // Periodic cleanup every 5 minutes to prevent memory leaks
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  getHitCount(key, windowMs) {
    const now = Date.now();
    const record = this.hits.get(key);
    if (!record) return 0;
    
    // Filter timestamps inside current window
    const validHits = record.filter(timestamp => now - timestamp < windowMs);
    this.hits.set(key, validHits);
    return validHits.length;
  }

  addHit(key) {
    const now = Date.now();
    const record = this.hits.get(key) || [];
    record.push(now);
    this.hits.set(key, record);
  }

  getBackoff(key) {
    const record = this.backoffs.get(key);
    if (!record) return null;

    const now = Date.now();
    if (now < record.retryAfter) {
      return {
        attempts: record.attempts,
        retryAfterMs: record.retryAfter - now,
        retryAfterSec: Math.ceil((record.retryAfter - now) / 1000)
      };
    }
    return null;
  }

  recordFailure(key, config) {
    const now = Date.now();
    const record = this.backoffs.get(key) || { attempts: 0, retryAfter: 0 };
    record.attempts += 1;

    // Exponential Backoff calculation: delay = min(base * (factor ^ (attempts - 1)), max)
    const delay = Math.min(
      config.baseBackoffMs * Math.pow(config.backoffFactor, record.attempts - 1),
      config.maxBackoffMs
    );

    record.retryAfter = now + delay;
    this.backoffs.set(key, record);

    return {
      attempts: record.attempts,
      delayMs: delay,
      delaySec: Math.ceil(delay / 1000)
    };
  }

  resetFailure(key) {
    this.backoffs.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, hits] of this.hits.entries()) {
      const validHits = hits.filter(t => now - t < 24 * 60 * 60 * 1000);
      if (validHits.length === 0) this.hits.delete(key);
      else this.hits.set(key, validHits);
    }
    for (const [key, record] of this.backoffs.entries()) {
      if (now > record.retryAfter + 60 * 60 * 1000) {
        this.backoffs.delete(key);
      }
    }
  }
}

const store = new MemoryStore();

/**
 * Load Rate Limiter Configuration (from env or custom options)
 */
function getConfig(customConfig = {}) {
  return {
    auth: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins default
      maxPerIp: parseInt(process.env.RATE_LIMIT_AUTH_MAX_IP, 10) || 10,                 // 10 reqs per IP
      maxPerAccount: parseInt(process.env.RATE_LIMIT_AUTH_MAX_ACCOUNT, 10) || 5,         // 5 reqs per Account
      baseBackoffMs: parseInt(process.env.RATE_LIMIT_AUTH_BASE_BACKOFF_MS, 10) || 1000, // 1 sec base
      maxBackoffMs: parseInt(process.env.RATE_LIMIT_AUTH_MAX_BACKOFF_MS, 10) || 60000,  // 60 sec max
      backoffFactor: parseFloat(process.env.RATE_LIMIT_AUTH_BACKOFF_FACTOR) || 2.0,      // factor 2
      ...customConfig.auth
    },
    public: {
      windowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins default
      maxRequests: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX, 10) || 100,              // 100 reqs per IP
      ...customConfig.public
    },
    authenticated: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTHED_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins default
      maxRequests: parseInt(process.env.RATE_LIMIT_AUTHED_MAX, 10) || 1000,             // 1000 reqs per User
      ...customConfig.authenticated
    }
  };
}

/**
 * Extract Client IP safely
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}

/**
 * Extract Account Identifier (email, username, or account_id from req body/params)
 */
function getAccountIdentifier(req) {
  return (
    req.body?.email ||
    req.body?.username ||
    req.body?.accountIdentifier ||
    req.params?.username ||
    null
  );
}

/**
 * Auth Route Rate Limiter (Per-IP + Per-Account + Exponential Backoff)
 */
function createAuthRateLimiter(options = {}) {
  return (req, res, next) => {
    const config = getConfig(options).auth;
    const ip = getClientIp(req);
    const account = getAccountIdentifier(req);

    const ipKey = `auth:ip:${ip}`;
    const accountKey = account ? `auth:account:${account.toLowerCase()}` : null;

    // Check active exponential backoffs
    const ipBackoff = store.getBackoff(ipKey);
    const accountBackoff = accountKey ? store.getBackoff(accountKey) : null;
    const activeBackoff = ipBackoff || accountBackoff;

    if (activeBackoff) {
      res.setHeader('Retry-After', activeBackoff.retryAfterSec);
      res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + activeBackoff.retryAfterMs) / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Exponential backoff active due to repeated failed attempts. Please wait ${activeBackoff.retryAfterSec} seconds before retrying.`,
        retryAfterSeconds: activeBackoff.retryAfterSec,
        attempts: activeBackoff.attempts,
        type: 'EXPONENTIAL_BACKOFF'
      });
    }

    // Check per-IP hit limits
    const ipHits = store.getHitCount(ipKey, config.windowMs);
    if (ipHits >= config.maxPerIp) {
      const retrySec = Math.ceil(config.windowMs / 1000);
      res.setHeader('Retry-After', retrySec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `IP rate limit exceeded for authentication routes. Limit is ${config.maxPerIp} requests per ${config.windowMs / 1000}s.`,
        retryAfterSeconds: retrySec,
        type: 'IP_LIMIT_EXCEEDED'
      });
    }

    // Check per-Account hit limits
    if (accountKey) {
      const accountHits = store.getHitCount(accountKey, config.windowMs);
      if (accountHits >= config.maxPerAccount) {
        const retrySec = Math.ceil(config.windowMs / 1000);
        res.setHeader('Retry-After', retrySec);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Account rate limit exceeded for ${account}. Limit is ${config.maxPerAccount} requests per ${config.windowMs / 1000}s.`,
          retryAfterSeconds: retrySec,
          type: 'ACCOUNT_LIMIT_EXCEEDED'
        });
      }
    }

    // Add hits for tracking
    store.addHit(ipKey);
    if (accountKey) store.addHit(accountKey);

    // Attach failure recorder helper to res for controller usage
    res.recordAuthFailure = () => {
      const ipResult = store.recordFailure(ipKey, config);
      const accountResult = accountKey ? store.recordFailure(accountKey, config) : null;
      return accountResult || ipResult;
    };

    // Attach success reset helper
    res.recordAuthSuccess = () => {
      store.resetFailure(ipKey);
      if (accountKey) store.resetFailure(accountKey);
    };

    next();
  };
}

/**
 * Public Endpoint Rate Limiter (Moderate Limits Per IP)
 */
function createPublicRateLimiter(options = {}) {
  return (req, res, next) => {
    const config = getConfig(options).public;
    const ip = getClientIp(req);
    const key = `public:ip:${ip}`;

    const currentHits = store.getHitCount(key, config.windowMs);
    const remaining = Math.max(0, config.maxRequests - currentHits - 1);
    const resetTime = Math.ceil((Date.now() + config.windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (currentHits >= config.maxRequests) {
      const retrySec = Math.ceil(config.windowMs / 1000);
      res.setHeader('Retry-After', retrySec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Public API rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 60000} minutes.`,
        retryAfterSeconds: retrySec,
        type: 'PUBLIC_LIMIT_EXCEEDED'
      });
    }

    store.addHit(key);
    next();
  };
}

/**
 * Authenticated User Actions Rate Limiter (Looser Limits Per User)
 */
function createAuthenticatedRateLimiter(options = {}) {
  return (req, res, next) => {
    const config = getConfig(options).authenticated;
    const userId = req.user?.id || req.user?.userId || getClientIp(req);
    const key = `authed:user:${userId}`;

    const currentHits = store.getHitCount(key, config.windowMs);
    const remaining = Math.max(0, config.maxRequests - currentHits - 1);
    const resetTime = Math.ceil((Date.now() + config.windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (currentHits >= config.maxRequests) {
      const retrySec = Math.ceil(config.windowMs / 1000);
      res.setHeader('Retry-After', retrySec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Authenticated user rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 60000} minutes.`,
        retryAfterSeconds: retrySec,
        type: 'AUTHED_USER_LIMIT_EXCEEDED'
      });
    }

    store.addHit(key);
    next();
  };
}

module.exports = {
  createAuthRateLimiter,
  createPublicRateLimiter,
  createAuthenticatedRateLimiter,
  getConfig,
  store
};
