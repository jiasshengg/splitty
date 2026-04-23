const express = require('express');
const upload = require('../middleware/multerMiddleware');
const { scanReceiptImagesController } = require('../controllers/scannerController');

const router = express.Router();

router.post('/receipt', upload.array('images', 10), scanReceiptImagesController);

module.exports = router;
