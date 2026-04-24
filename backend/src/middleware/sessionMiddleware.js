const session = require('express-session');
const redis = require('redis');
const { RedisStore } = require('connect-redis');
const responseView = require('../views/responseView');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isHttps = isProd;

let redisClient;

function getRedisClient() {
  return redisClient;
}

async function buildSessionMiddleware() {

  const sessionSecret = process.env.SESSION_SECRET?.trim() || '';

  let store;

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is required');
  }

  try {
    if (process.env.REDIS_URL) {
      console.log('Connecting to Redis using REDIS_URL...');

      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
        },
      });
    } else {
      console.log('Development mode - connecting to local Redis @ 127.0.0.1:6379');

      redisClient = redis.createClient({
        socket: {
          host: '127.0.0.1',
          port: 6379,
        },
      });
    }

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Redis connected successfully.');

    store = new RedisStore({ client: redisClient });
  } catch (err) {
    console.error('Redis initialization failed:', err);
    throw err;
  }

  return session({
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: isHttps,
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
}

/* ===================== login helpers ===================== */

const generateSessionRedisUser = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return responseView.BadRequest(res, "No User Data");
    }

    if (!req.session) {
      return responseView.sendError(
        res,
        "Failed to create session",
        new Error("Session middleware is not initialized")
      );
    }

    const userId = user.id ?? user.user_id;

    req.session.user = {
      id: userId,
      username: user.username,
      role: user.role,
    };

    // ensure redis store writes session before sending response
    req.session.save((err) => {
      if (err) {
        return responseView.sendError(res, "Failed to create session", err);
      }

      return responseView.sendSuccess(res, req.session.user, "Authenticated");

    });
  } catch (error) {
    return responseView.sendError(res, "Failed to create session", error);
  }
};

/* ===================== guards ===================== */

const checkForSessionUser = (req, res, next) => {
  if (!req.session?.user) {
    return responseView.Unauthorized(res, "Please register or login");
  }

  next();
};

const checkForAdmin = (req, res, next) => {
  if (!req.session?.user) {
    return responseView.Unauthorized(res, 'Please register or login');
  }

  if (req.session.user.role !== 2) {
    return responseView.Forbidden(res, 'Admin access required');
  }

  return next();
};

const checkForCurrentSessionUserOrAdmin = (req, res, next) => {
  if (!req.session?.user) {
    return responseView.Unauthorized(res, 'Please register or login');
  }

  const requestedUserId = Number(req.params?.id);

  if (
    req.session.user.role === 2 ||
    (Number.isInteger(requestedUserId) && req.session.user.id === requestedUserId)
  ) {
    return next();
  }

  return responseView.Forbidden(res, 'You can only access your own account');
};

module.exports = {
  buildSessionMiddleware,
  generateSessionRedisUser,
  checkForSessionUser,
  checkForAdmin,
  checkForCurrentSessionUserOrAdmin,
  getRedisClient,
};
