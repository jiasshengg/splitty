const { createWorker } = require('tesseract.js');
const { parseReceiptTextToItems } = require('./parserHelper');

module.exports.extractReceiptItemsFromImages = async function (files = []) {
  const allItems = [];
  const worker = await createWorker('eng', 1, {
    cacheMethod: 'none',
  });

  try {
    for (const file of files) {
      const result = await worker.recognize(file.buffer);
      const text = result?.data?.text || '';
      const parsedItems = parseReceiptTextToItems(text);
      allItems.push(...parsedItems);
    }

    return allItems;
  } finally {
    await worker.terminate();
  }
};
