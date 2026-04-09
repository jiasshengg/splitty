const ignoredLinePatterns = [
  /^subtotal$/i,
  /^total$/i,
  /^grand total$/i,
  /^cash$/i,
  /^change$/i,
  /^tax$/i,
  /^gst$/i,
  /^service charge$/i,
  /^discount$/i,
  /^rounding$/i,
  /^qty$/i,
  /^item$/i,
  /^amount$/i,
  /^price$/i,
];

const cleanName = (name = '') =>
  name
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

const parsePrice = (value = '') => {
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const looksIgnored = (name = '') => {
  const normalized = name.trim().toLowerCase();
  return ignoredLinePatterns.some((pattern) => pattern.test(normalized));
};

const findLinePrice = (line = '') => {
  const matches = [...line.matchAll(/(\d+[.,]\d{2})/g)];
  if (matches.length === 0) {
    return null;
  }

  return matches[matches.length - 1][1];
};

module.exports.parseReceiptTextToItems = function (text = '') {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedItems = [];
  const seen = new Set();

  for (const line of lines) {
    const priceToken = findLinePrice(line);

    if (!priceToken) {
      continue;
    }

    const price = parsePrice(priceToken);
    if (!price) {
      continue;
    }

    const name = cleanName(line.replace(priceToken, ''));
    if (!name || name.length < 2 || looksIgnored(name)) {
      continue;
    }

    const dedupeKey = `${name.toLowerCase()}::${price.toFixed(2)}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    parsedItems.push({ name, price });
  }

  return parsedItems;
}