const express = require('express');
const cors = require('cors');
const scannerRouter = require('./routers/scannerRouter');
const userRouter = require('./routers/userRouter');
const billRouter = require('./routers/billRouter');
const sessionMiddleware = require('./middleware/sessionMiddleware');

async function createApp() {
  const app = express();
  const session = await sessionMiddleware.buildSessionMiddleware();
  const configuredOrigins = String(
    process.env.FRONTEND_URLS || process.env.FRONTEND_URL || ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    ...configuredOrigins,
  ]);

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.static('public'));
  app.use(session);

  app.get('/health', function (req, res) {
    res.json({ ok: true });
  });

  app.use('/api/scan', scannerRouter);
  app.use('/api/users', userRouter);
  app.use('/api/bills', billRouter);

  app.use(function (req, res) {
    res.status(404).json({
      success: false,
      message: `Unknown resource ${req.method} ${req.path}`,
    });
  });

  app.use(function (err, req, res, next) {
    return res.status(err.status || 500).json({
      error: err.message || 'Unknown Server Error!',
    });
  });

  return app;
}

module.exports = createApp;
