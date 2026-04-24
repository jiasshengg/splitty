const multer = require('multer');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/x-portable-bitmap',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        'Unsupported image format. Please upload JPG, PNG, WEBP, GIF, or BMP.'
      )
    );
  },
});

module.exports = upload;
