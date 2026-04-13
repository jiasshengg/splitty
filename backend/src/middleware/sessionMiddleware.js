const session = require('express-session');
const redis = require('redis');
const { RedisStore } = require('connect-redis');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isHttps = isProd;

let redisClient;

/**
 * build session middleware after redis is ready
 */

function getRedisClient() {
  return redisClient;
}

async function buildSessionMiddleware() {
  let store;

  try {
    if (isProd && process.env.REDIS_URL) {
      // ================= prod (upstash) =================
      console.log('Production mode - connecting to Upstash Redis...');

      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
        },
      });
    } else {
      // ================= dev (local redis) =================
      console.log(
        'Development mode - connecting to local Redis @ 127.0.0.1:6379',
      );

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
    console.error(
      'Redis initialization failed. Falling back to MemoryStore:',
      err,
    );
    store = new session.MemoryStore();
  }

  return session({
    store,
    secret: process.env.SESSION_SECRET || 'theSecret',
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
      return res.status(400).json({
        success: false,
        message: 'No user data to create session',
      });
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
        console.error('session.save error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to create session',
          error: err.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Authenticated',
        data: {
          username: user.username,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error('generateSessionRedisUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
    });
  }
};

/* ===================== guards ===================== */

const checkForSessionUser = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: 'Please register or login',
    });
  }

  next();
};

module.exports = {
  buildSessionMiddleware,
  generateSessionRedisUser,
  checkForSessionUser,
  getRedisClient,
};