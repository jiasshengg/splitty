const { extractReceiptItemsFromImages } = require('../helpers/scannerHelper');
const responseView = require('../views/responseView');

module.exports.scanReceiptImagesController= async function(req, res, next) {
  try {
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length === 0) {
      return responseView.BadRequest(res, "Please upload at least one receipt image.");
    }

    const receipts = await extractReceiptItemsFromImages(files);
    const extractedCount = receipts.reduce(
      (sum, receipt) => sum + (Array.isArray(receipt.items) ? receipt.items.length : 0),
      0,
    );

    return res.json({
      receipts,
      scannedImages: files.length,
      extractedCount,
    });
  } catch (error) {
    return next(error);
  }
}
