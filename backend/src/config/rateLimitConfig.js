const responseView = require('../views/responseView');

function normalizePositiveInteger(value, fallbackValue) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function getDefaultKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter(options = {}) {
  const windowMs = normalizePositiveInteger(options.windowMs, 60 * 1000);
  const max = normalizePositiveInteger(options.max, 10);
  const keyPrefix = String(options.keyPrefix || 'rate-limit');
  const message = options.message || 'Too many requests. Please try again later.';
  const getKey = typeof options.getKey === 'function' ? options.getKey : getDefaultKey;
  const store = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const requestKey = `${keyPrefix}:${getKey(req)}`;
    const currentEntry = store.get(requestKey);

    if (!currentEntry || currentEntry.expiresAt <= now) {
      store.set(requestKey, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (currentEntry.count >= max) {
      const retryAfterSeconds = Math.ceil((currentEntry.expiresAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return responseView.TooManyRequests(res, message);
    }

    currentEntry.count += 1;
    store.set(requestKey, currentEntry);
    return next();
  };
}

const loginRateLimiter = createRateLimiter({
  keyPrefix: 'login',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
  getKey(req) {
    const username = typeof req.body?.username === 'string'
      ? req.body.username.trim().toLowerCase()
      : '';
    return `${req.ip}:${username}`;
  },
});

const forgotPasswordRateLimiter = createRateLimiter({
  keyPrefix: 'forgot-password',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
  getKey(req) {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    return `${req.ip}:${email}`;
  },
});

const resetPasswordRateLimiter = createRateLimiter({
  keyPrefix: 'reset-password',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts. Please try again later.',
});

const scanRateLimiter = createRateLimiter({
  keyPrefix: 'receipt-scan',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many receipt scans. Please try again later.',
});

module.exports = {
  createRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  scanRateLimiter,
};
