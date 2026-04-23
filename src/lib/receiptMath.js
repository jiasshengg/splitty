export const DISCOUNT_TYPES = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundToCents = (value) => Math.round(toNumber(value) * 100);

export const centsToAmount = (value) => toNumber(value) / 100;

export const normalizeDiscountType = (value) =>
  value === DISCOUNT_TYPES.PERCENTAGE
    ? DISCOUNT_TYPES.PERCENTAGE
    : DISCOUNT_TYPES.FIXED;

export const calculateItemsSubtotalCents = (items = []) =>
  (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + roundToCents(item?.price),
    0
  );

export const clampDiscountValue = (discountType, discountValue, subtotalCents) => {
  const safeValue = Math.max(0, toNumber(discountValue));

  if (normalizeDiscountType(discountType) === DISCOUNT_TYPES.PERCENTAGE) {
    return Math.min(safeValue, 100);
  }

  return Math.min(safeValue, centsToAmount(subtotalCents));
};

export const calculateDiscountAmountCents = (
  discountType,
  discountValue,
  subtotalCents
) => {
  if (subtotalCents <= 0) {
    return 0;
  }

  const clampedValue = clampDiscountValue(
    discountType,
    discountValue,
    subtotalCents
  );

  if (normalizeDiscountType(discountType) === DISCOUNT_TYPES.PERCENTAGE) {
    return Math.min(
      subtotalCents,
      Math.round((subtotalCents * clampedValue) / 100)
    );
  }

  return Math.min(subtotalCents, roundToCents(clampedValue));
};

export const summarizeReceiptAmounts = ({
  items = [],
  discountType = DISCOUNT_TYPES.FIXED,
  discountValue = 0,
  gstRate = 0,
}) => {
  const subtotalCents = calculateItemsSubtotalCents(items);
  const normalizedDiscountType = normalizeDiscountType(discountType);
  const normalizedDiscountValue = clampDiscountValue(
    normalizedDiscountType,
    discountValue,
    subtotalCents
  );
  const discountAmountCents = calculateDiscountAmountCents(
    normalizedDiscountType,
    normalizedDiscountValue,
    subtotalCents
  );
  const discountedSubtotalCents = subtotalCents - discountAmountCents;
  const normalizedGstRate = Math.max(0, toNumber(gstRate));
  const gstAmountCents = Math.round(
    (discountedSubtotalCents * normalizedGstRate) / 100
  );

  return {
    subtotalCents,
    discountType: normalizedDiscountType,
    discountValue: normalizedDiscountValue,
    discountAmountCents,
    discountedSubtotalCents,
    gstRate: normalizedGstRate,
    gstAmountCents,
  };
};
