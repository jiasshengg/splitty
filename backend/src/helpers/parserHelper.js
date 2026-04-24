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
    .replace(/^\d+\s*(x|pcs?|qty)?\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizePriceToken = (value = '') =>
  value
    .replace(/[Oo]/g, '0')
    .replace(/[Ss]/g, '5')
    .replace(/[Il]/g, '1')
    .replace(/[,]/g, '')
    .replace(/[:;]/g, '.')
    .replace(/\s+/g, '.')
    .trim();

const parsePrice = (value = '') => {
  const normalized = normalizePriceToken(value);
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const looksIgnored = (name = '') => {
  const normalized = name.trim().toLowerCase();
  return (
    ignoredLinePatterns.some((pattern) => pattern.test(normalized)) ||
    /(subtotal|grand total|total|cash|change|tax|gst|service charge|discount|rounding)/i.test(
      normalized
    )
  );
};

const findLinePrice = (line = '') => {
  const matches = [
    ...line.matchAll(
      /((?:\d[\dOolIsS,]*[.,:;]\d{2})|(?:\d[\dOolIsS,]*\s\d{2}))(?!.*(?:\d[\dOolIsS,]*[.,:;]\d{2}|\d[\dOolIsS,]*\s\d{2}))/g
    ),
  ];

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

    const name = cleanName(
      line
        .replace(priceToken, '')
        .replace(/\b\d+\s*@\s*$/i, '')
        .replace(/\s{2,}/g, ' ')
    );
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
