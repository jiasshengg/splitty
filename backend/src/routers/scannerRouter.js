const express = require('express');
const upload = require('../middleware/multerMiddleware');
const { scanReceiptImagesController } = require('../controllers/scannerController');
const { scanRateLimiter } = require('../config/rateLimitConfig');

const router = express.Router();

router.post('/receipt', scanRateLimiter, upload.array('images', 5), scanReceiptImagesController);

module.exports = router;
