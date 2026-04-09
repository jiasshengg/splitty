const express = require('express');
const cors = require('cors');
const scannerRouter = require('./routers/scannerRouter');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  })
);
app.use(express.json());
app.use(express.static('public'));

app.get('/health', function (req, res) {
  res.json({ ok: true });
});

app.use('/scan', scannerRouter);

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

module.exports = app;
