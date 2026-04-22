const STORAGE_KEY = "splitpot_bills";

export const RECEIPT_SPLIT_MODES = {
  EQUALLY: "equally",
  BY_ITEMS: "byItems",
};

const sampleBills = [
  {
    id: "sample-1",
    billName: "Msia Trip",
    createdAt: "2026-03-28T12:00:00.000Z",
    total: 124.5,
    unassignedTotal: 0,
    peopleCount: 4,
    status: "Settled",
    members: [
      { id: 1, name: "You" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Bob" },
      { id: 4, name: "Cara" },
    ],
    items: [
      { id: 1, name: "Petrol", price: 46.5, assignedTo: [1, 2, 3, 4] },
      { id: 2, name: "Toll", price: 18, assignedTo: [1, 2, 3, 4] },
      { id: 3, name: "Snacks", price: 24, assignedTo: [1, 2, 3] },
      { id: 4, name: "Dinner", price: 36, assignedTo: [1, 3, 4] },
    ],
  },
  {
    id: "sample-2",
    billName: "Sichuan Paradise",
    createdAt: "2026-03-15T12:00:00.000Z",
    total: 156.2,
    unassignedTotal: 0,
    peopleCount: 5,
    status: "Pending",
    members: [
      { id: 1, name: "You" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Bob" },
      { id: 4, name: "Cara" },
      { id: 5, name: "Dan" },
    ],
    items: [
      { id: 1, name: "Fish fillet", price: 38.2, assignedTo: [1, 2, 3, 4, 5] },
      { id: 2, name: "Hotpot base", price: 28, assignedTo: [1, 2, 3, 4, 5] },
      { id: 3, name: "Pork slices", price: 34, assignedTo: [2, 3, 4] },
      { id: 4, name: "Veg platter", price: 21, assignedTo: [1, 4, 5] },
      { id: 5, name: "Drinks", price: 35, assignedTo: [1, 2, 3, 4, 5] },
    ],
  },
  {
    id: "sample-3",
    billName: "Shabu-Shabu Zen",
    createdAt: "2026-03-08T12:00:00.000Z",
    total: 72,
    unassignedTotal: 0,
    peopleCount: 2,
    status: "Settled",
    members: [
      { id: 1, name: "You" },
      { id: 2, name: "Alice" },
    ],
    items: [
      { id: 1, name: "Set A", price: 32, assignedTo: [1] },
      { id: 2, name: "Set B", price: 28, assignedTo: [2] },
      { id: 3, name: "Drinks", price: 12, assignedTo: [1, 2] },
    ],
  },
];

const hasLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToCents = (value) => Math.round(toNumber(value) * 100);

const centsToAmount = (value) => toNumber(value) / 100;

const dedupeIds = (values = []) => {
  const seen = new Set();

  return values.filter((value) => {
    const key = String(value);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const normalizeMembers = (members = []) =>
  (Array.isArray(members) ? members : []).map((member) => ({
    ...member,
    id: member?.id,
    name: String(member?.name || "").trim(),
  }));

const normalizeSplitMode = (value) =>
  value === RECEIPT_SPLIT_MODES.BY_ITEMS
    ? RECEIPT_SPLIT_MODES.BY_ITEMS
    : RECEIPT_SPLIT_MODES.EQUALLY;

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const createLegacyReceipt = (items = [], billId) => ({
  id: `${billId || "bill"}-receipt-1`,
  label: "Receipt 1",
  gstRate: 0,
  gstAmount: 0,
  serviceChargeAmount: 0,
  gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
  items,
});

const normalizeItem = (item, index, receiptId) => ({
  id: item?.id ?? `${receiptId}-item-${index + 1}`,
  receiptId,
  name: String(item?.name || "").trim(),
  price: toNumber(item?.price),
  assignedTo: dedupeIds(
    Array.isArray(item?.assignedTo) ? item.assignedTo : []
  ),
});

const normalizeReceipt = (receipt, index, billId) => {
  const receiptId = receipt?.id ?? `${billId || "bill"}-receipt-${index + 1}`;
  const items = (Array.isArray(receipt?.items) ? receipt.items : []).map(
    (item, itemIndex) => normalizeItem(item, itemIndex, receiptId)
  );
  const subtotalCents = items.reduce(
    (sum, item) => sum + roundToCents(item.price),
    0
  );
  const rawGstRate = toNumber(receipt?.gstRate);
  const legacyGstAmountCents = roundToCents(receipt?.gstAmount ?? receipt?.gst);
  const gstAmountCents = hasValue(receipt?.gstRate)
    ? Math.round((subtotalCents * rawGstRate) / 100)
    : legacyGstAmountCents;
  const gstRate =
    hasValue(receipt?.gstRate)
      ? rawGstRate
      : subtotalCents > 0 && legacyGstAmountCents > 0
        ? Number(((legacyGstAmountCents * 100) / subtotalCents).toFixed(4))
        : 0;
  const serviceChargeAmountCents = roundToCents(
    receipt?.serviceChargeAmount ?? receipt?.serviceCharge
  );

  return {
    id: receiptId,
    label:
      String(receipt?.label || receipt?.name || "").trim() ||
      `Receipt ${index + 1}`,
    items,
    subtotal: centsToAmount(subtotalCents),
    gstRate,
    gstAmount: centsToAmount(gstAmountCents),
    serviceChargeAmount: centsToAmount(serviceChargeAmountCents),
    total: centsToAmount(
      subtotalCents + gstAmountCents + serviceChargeAmountCents
    ),
    gstSplitMode: normalizeSplitMode(receipt?.gstSplitMode),
  };
};

const normalizeBillInput = (input = {}, membersOverride = []) => {
  if (Array.isArray(input)) {
    return {
      members: normalizeMembers(membersOverride),
      receipts: [normalizeReceipt(createLegacyReceipt(input), 0)],
    };
  }

  const members = normalizeMembers(input?.members ?? membersOverride);
  const sourceReceipts =
    Array.isArray(input?.receipts) && input.receipts.length > 0
      ? input.receipts
      : [createLegacyReceipt(input?.items, input?.id)];

  return {
    members,
    receipts: sourceReceipts.map((receipt, index) =>
      normalizeReceipt(receipt, index, input?.id)
    ),
  };
};

const allocateCents = (amountCents, keys = [], weightByKey = {}) => {
  const normalizedAmount = Math.max(0, Math.round(toNumber(amountCents)));
  const normalizedKeys = dedupeIds(keys).filter((key) => key !== undefined);
  const emptyResult = Object.fromEntries(
    normalizedKeys.map((key) => [key, 0])
  );

  if (normalizedAmount === 0 || normalizedKeys.length === 0) {
    return emptyResult;
  }

  const weights = normalizedKeys.map((key, index) => ({
    key,
    index,
    weight: Math.max(0, toNumber(weightByKey[key] ?? 0)),
  }));
  const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return emptyResult;
  }

  const baseAllocation = {};
  let allocated = 0;

  const remainders = weights.map((entry) => {
    const exact = (normalizedAmount * entry.weight) / totalWeight;
    const floorValue = Math.floor(exact);
    allocated += floorValue;
    baseAllocation[entry.key] = floorValue;

    return {
      key: entry.key,
      index: entry.index,
      remainder: exact - floorValue,
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
    baseAllocation[target.key] += 1;
  }

  return {
    ...emptyResult,
    ...baseAllocation,
  };
};

const allocateEqually = (amountCents, keys = []) => {
  const weights = Object.fromEntries(
    dedupeIds(keys).map((key) => [key, 1])
  );
  return allocateCents(amountCents, keys, weights);
};

const summarizeBill = ({ receipts = [], members = [] }) => {
  const memberMap = new Map();

  members.forEach((member) => {
    memberMap.set(member.id, {
      ...member,
      itemSubtotal: 0,
      gstShare: 0,
      serviceChargeShare: 0,
      total: 0,
      receipts: [],
    });
  });

  let subtotalCents = 0;
  let gstTotalCents = 0;
  let serviceChargeTotalCents = 0;
  let unassignedTotalCents = 0;

  const receiptSummaries = receipts.map((receipt) => {
    const receiptSubtotalCents = receipt.items.reduce(
      (sum, item) => sum + roundToCents(item.price),
      0
    );
    const receiptGstCents = roundToCents(receipt.gstAmount);
    const receiptServiceChargeCents = roundToCents(
      receipt.serviceChargeAmount
    );
    const memberItemCents = Object.fromEntries(
      members.map((member) => [member.id, 0])
    );
    const assignedCounts = Object.fromEntries(
      members.map((member) => [member.id, 0])
    );
    let receiptUnassignedCents = 0;

    const items = receipt.items.map((item) => {
      const priceCents = roundToCents(item.price);
      const assignedTo = dedupeIds(item.assignedTo).filter((memberId) =>
        memberMap.has(memberId)
      );

      if (assignedTo.length === 0) {
        receiptUnassignedCents += priceCents;
      }

      const itemAllocation = allocateEqually(priceCents, assignedTo);

      assignedTo.forEach((memberId) => {
        memberItemCents[memberId] += itemAllocation[memberId] || 0;
        assignedCounts[memberId] += 1;
      });

      return {
        ...item,
        assignedTo,
        price: centsToAmount(priceCents),
        splitByMember: assignedTo.map((memberId) => ({
          memberId,
          amount: centsToAmount(itemAllocation[memberId] || 0),
        })),
      };
    });

    const involvedMemberIds = members
      .map((member) => member.id)
      .filter((memberId) => assignedCounts[memberId] > 0);

    const gstAllocation =
      receipt.gstSplitMode === RECEIPT_SPLIT_MODES.BY_ITEMS
        ? allocateCents(receiptGstCents, involvedMemberIds, memberItemCents)
        : allocateEqually(receiptGstCents, involvedMemberIds);

    const serviceChargeAllocation = allocateEqually(
      receiptServiceChargeCents,
      involvedMemberIds
    );

    if (involvedMemberIds.length === 0) {
      receiptUnassignedCents += receiptGstCents + receiptServiceChargeCents;
    }

    const memberBreakdown = members.map((member) => {
      const itemSubtotal = memberItemCents[member.id] || 0;
      const gstShare = gstAllocation[member.id] || 0;
      const serviceChargeShare = serviceChargeAllocation[member.id] || 0;
      const total = itemSubtotal + gstShare + serviceChargeShare;
      const memberSummary = memberMap.get(member.id);

      memberSummary.itemSubtotal += itemSubtotal;
      memberSummary.gstShare += gstShare;
      memberSummary.serviceChargeShare += serviceChargeShare;
      memberSummary.total += total;
      memberSummary.receipts.push({
        receiptId: receipt.id,
        receiptLabel: receipt.label,
        itemSubtotal: centsToAmount(itemSubtotal),
        gstShare: centsToAmount(gstShare),
        serviceChargeShare: centsToAmount(serviceChargeShare),
        total: centsToAmount(total),
        isInvolved: involvedMemberIds.includes(member.id),
      });

      return {
        id: member.id,
        name: member.name,
        color: member.color,
        itemSubtotal: centsToAmount(itemSubtotal),
        gstShare: centsToAmount(gstShare),
        serviceChargeShare: centsToAmount(serviceChargeShare),
        total: centsToAmount(total),
        isInvolved: involvedMemberIds.includes(member.id),
      };
    });

    subtotalCents += receiptSubtotalCents;
    gstTotalCents += receiptGstCents;
    serviceChargeTotalCents += receiptServiceChargeCents;
    unassignedTotalCents += receiptUnassignedCents;

    return {
      ...receipt,
      items,
      subtotal: centsToAmount(receiptSubtotalCents),
      gstAmount: centsToAmount(receiptGstCents),
      serviceChargeAmount: centsToAmount(receiptServiceChargeCents),
      total: centsToAmount(
        receiptSubtotalCents + receiptGstCents + receiptServiceChargeCents
      ),
      unassignedTotal: centsToAmount(receiptUnassignedCents),
      members: memberBreakdown,
      involvedMemberIds,
    };
  });

  const totalCents = subtotalCents + gstTotalCents + serviceChargeTotalCents;
  const flattenedItems = receiptSummaries.flatMap((receipt) => receipt.items);
  const memberSummaries = members.map((member) => {
    const summary = memberMap.get(member.id);

    return {
      ...summary,
      itemSubtotal: centsToAmount(summary.itemSubtotal),
      gstShare: centsToAmount(summary.gstShare),
      serviceChargeShare: centsToAmount(summary.serviceChargeShare),
      total: centsToAmount(summary.total),
    };
  });

  return {
    receipts: receiptSummaries,
    members: memberSummaries,
    items: flattenedItems,
    subtotal: centsToAmount(subtotalCents),
    gstTotal: centsToAmount(gstTotalCents),
    serviceChargeTotal: centsToAmount(serviceChargeTotalCents),
    total: centsToAmount(totalCents),
    unassignedTotal: centsToAmount(unassignedTotalCents),
    receiptCount: receiptSummaries.length,
    itemCount: flattenedItems.length,
  };
};

const normaliseStoredBill = (bill) => {
  const { members, receipts } = normalizeBillInput(bill);
  const summary = summarizeBill({ members, receipts });

  return {
    ...bill,
    subtotal: summary.subtotal,
    gstTotal: summary.gstTotal,
    serviceChargeTotal: summary.serviceChargeTotal,
    total: summary.total,
    unassignedTotal: summary.unassignedTotal,
    peopleCount: Number(bill?.peopleCount || members.length || 0),
    members,
    receipts: summary.receipts.map((receipt) => ({
      id: receipt.id,
      label: receipt.label,
      items: receipt.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        receiptId: item.receiptId,
        assignedTo: item.assignedTo,
      })),
      subtotal: receipt.subtotal,
      gstRate: receipt.gstRate,
      gstAmount: receipt.gstAmount,
      serviceChargeAmount: receipt.serviceChargeAmount,
      total: receipt.total,
      gstSplitMode: receipt.gstSplitMode,
    })),
    items: summary.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      receiptId: item.receiptId,
      assignedTo: item.assignedTo,
    })),
  };
};

export const formatCurrency = (value) => `$${toNumber(value).toFixed(2)}`;

export const formatBillDate = (value) => {
  try {
    return new Date(value).toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

export const calculateBillSummary = (input = {}, membersOverride = []) => {
  const { members, receipts } = normalizeBillInput(input, membersOverride);
  return summarizeBill({ members, receipts });
};

export const calculateMemberTotals = (input = {}, membersOverride = []) =>
  calculateBillSummary(input, membersOverride).members;

export const calculateUnassignedTotal = (input = {}, membersOverride = []) =>
  calculateBillSummary(input, membersOverride).unassignedTotal;

export const getStoredBills = () => {
  if (!hasLocalStorage()) {
    return sampleBills
      .map(normaliseStoredBill)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBills));

    return sampleBills
      .map(normaliseStoredBill)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBills));

      return sampleBills
        .map(normaliseStoredBill)
        .sort(
          (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
        );
    }

    return parsed
      .map(normaliseStoredBill)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBills));

    return sampleBills
      .map(normaliseStoredBill)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }
};

export const saveStoredBills = (bills) => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
};

export const saveBillToHistory = ({ billName, members, receipts }) => {
  const normalizedMembers = normalizeMembers(members);
  const normalizedReceipts = normalizeBillInput({ receipts, members }).receipts;
  const summary = summarizeBill({
    members: normalizedMembers,
    receipts: normalizedReceipts,
  });

  const newBill = {
    id: String(Date.now()),
    billName: billName.trim(),
    createdAt: new Date().toISOString(),
    subtotal: summary.subtotal,
    gstTotal: summary.gstTotal,
    serviceChargeTotal: summary.serviceChargeTotal,
    total: summary.total,
    unassignedTotal: summary.unassignedTotal,
    peopleCount: normalizedMembers.length,
    status: "Pending",
    members: normalizedMembers.map(({ id, name, color }) => ({
      id,
      name,
      color,
    })),
    receipts: summary.receipts.map((receipt) => ({
      id: receipt.id,
      label: receipt.label,
      items: receipt.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        receiptId: item.receiptId,
        assignedTo: item.assignedTo,
      })),
      subtotal: receipt.subtotal,
      gstRate: receipt.gstRate,
      gstAmount: receipt.gstAmount,
      serviceChargeAmount: receipt.serviceChargeAmount,
      total: receipt.total,
      gstSplitMode: receipt.gstSplitMode,
    })),
    items: summary.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      receiptId: item.receiptId,
      assignedTo: item.assignedTo,
    })),
  };

  const existingBills = getStoredBills().filter(
    (bill) =>
      !String(bill.id).startsWith("sample-") ||
      sampleBills.some((sample) => sample.id === bill.id)
  );
  const updatedBills = [newBill, ...existingBills];
  saveStoredBills(updatedBills);

  return newBill;
};
