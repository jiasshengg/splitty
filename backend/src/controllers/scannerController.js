const { extractReceiptItemsFromImages } = require('../helpers/scannerHelper');

module.exports.scanReceiptImagesController= async function(req, res, next) {
  try {
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length === 0) {
      return responseView.BadRequest(res, "Please upload at least one receipt image.");
    }

    const items = await extractReceiptItemsFromImages(files);

    return res.json({
      items,
      scannedImages: files.length,
      extractedCount: items.length,
    });
  } catch (error) {
    return next(error);
  }
}
