const { createWorker } = require('tesseract.js');
const { parseReceiptTextToItems } = require('./parserHelper');

const getReceiptLabel = (file, index) => {
  const originalName =
    typeof file?.originalname === 'string' ? file.originalname.trim() : '';

  if (!originalName) {
    return `Receipt ${index + 1}`;
  }

  return originalName.replace(/\.[^/.]+$/, '').trim() || `Receipt ${index + 1}`;
};

module.exports.extractReceiptItemsFromImages = async function (files = []) {
  const worker = await createWorker('eng', 1, {
    cacheMethod: 'none',
  });

  try {
    const receipts = [];

    for (const [index, file] of files.entries()) {
      const result = await worker.recognize(file.buffer);
      const text = result?.data?.text || '';
      const parsedItems = parseReceiptTextToItems(text);
      const subtotal = parsedItems.reduce(
        (sum, item) => sum + Number(item.price || 0),
        0
      );

      if (parsedItems.length > 0) {
        receipts.push({
          label: getReceiptLabel(file, index),
          items: parsedItems,
          subtotal,
          gst: 0,
          serviceCharge: 0,
          total: subtotal,
        });
      }
    }

    return receipts;
  } finally {
    await worker.terminate();
  }
};
