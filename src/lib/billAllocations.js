const normalizeInteger = (value) => {
  const parsed = Math.round(Number(value || 0));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const dedupeKeys = (keys = []) => {
  const seen = new Set();

  return keys.filter((key) => {
    const normalizedKey = String(key);

    if (seen.has(normalizedKey)) {
      return false;
    }

    seen.add(normalizedKey);
    return true;
  });
};

const getOrderedKeys = (keys = [], stableOrder = []) => {
  const normalizedKeys = dedupeKeys(keys);
  const keySet = new Set(normalizedKeys.map((key) => String(key)));
  const orderedKeys = [];

  stableOrder.forEach((key) => {
    if (!keySet.has(String(key))) {
      return;
    }

    orderedKeys.push(key);
    keySet.delete(String(key));
  });

  normalizedKeys.forEach((key) => {
    if (!keySet.has(String(key))) {
      return;
    }

    orderedKeys.push(key);
    keySet.delete(String(key));
  });

  return orderedKeys;
};

export const createRollingEqualAllocator = (stableOrder = []) => {
  const globalOrder = dedupeKeys(stableOrder);
  let roundingCursor = 0;

  return {
    allocate(amountCents, keys = []) {
      const normalizedAmount = normalizeInteger(amountCents);
      const orderedKeys = getOrderedKeys(keys, globalOrder);
      const allocation = Object.fromEntries(orderedKeys.map((key) => [key, 0]));

      if (normalizedAmount === 0 || orderedKeys.length === 0) {
        return allocation;
      }

      const baseShare = Math.floor(normalizedAmount / orderedKeys.length);
      const extraCents = normalizedAmount - baseShare * orderedKeys.length;

      orderedKeys.forEach((key) => {
        allocation[key] = baseShare;
      });

      if (extraCents === 0) {
        return allocation;
      }

      const traversalOrder = globalOrder.length > 0 ? globalOrder : orderedKeys;
      const involvedKeySet = new Set(orderedKeys.map((key) => String(key)));
      let offset = 0;
      let distributed = 0;

      while (distributed < extraCents) {
        const candidate =
          traversalOrder[(roundingCursor + offset) % traversalOrder.length];
        offset += 1;

        if (!involvedKeySet.has(String(candidate))) {
          continue;
        }

        allocation[candidate] += 1;
        distributed += 1;
      }

      roundingCursor =
        traversalOrder.length === 0
          ? 0
          : (roundingCursor + extraCents) % traversalOrder.length;

      return allocation;
    },
    getCursor() {
      return roundingCursor;
    },
  };
};

export const allocateProportionally = (
  amountCents,
  keys = [],
  weightByKey = {},
  stableOrder = []
) => {
  const normalizedAmount = normalizeInteger(amountCents);
  const orderedKeys = getOrderedKeys(keys, stableOrder);
  const emptyAllocation = Object.fromEntries(
    orderedKeys.map((key) => [key, 0])
  );

  if (normalizedAmount === 0 || orderedKeys.length === 0) {
    return emptyAllocation;
  }

  const weights = orderedKeys.map((key, index) => ({
    key,
    index,
    weight: Math.max(0, Number(weightByKey[key] || 0)),
  }));
  const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return emptyAllocation;
  }

  const allocation = {};
  let allocated = 0;

  const remainders = weights.map((entry) => {
    const exactShare = (normalizedAmount * entry.weight) / totalWeight;
    const flooredShare = Math.floor(exactShare);
    allocation[entry.key] = flooredShare;
    allocated += flooredShare;

    return {
      key: entry.key,
      index: entry.index,
      remainder: exactShare - flooredShare,
    };
  });

  remainders.sort((left, right) => {
    if (right.remainder !== left.remainder) {
      return right.remainder - left.remainder;
    }

    return left.index - right.index;
  });

  for (let index = 0; index < normalizedAmount - allocated; index += 1) {
    const target = remainders[index % remainders.length];
    allocation[target.key] += 1;
  }

  return {
    ...emptyAllocation,
    ...allocation,
  };
};
