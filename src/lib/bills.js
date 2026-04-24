import {
  allocateProportionally,
  createRollingEqualAllocator,
} from "@/lib/billAllocations";
import {
  calculateDiscountAmountCents,
  calculateItemsSubtotalCents,
  centsToAmount,
  DISCOUNT_TYPES,
  normalizeDiscountType,
  roundToCents,
  summarizeReceiptAmounts,
} from "@/lib/receiptMath";

const STORAGE_KEY = "splitpot_bills";

export const RECEIPT_SPLIT_MODES = {
  EQUALLY: "equally",
  BY_ITEMS: "byItems",
};

export { DISCOUNT_TYPES };

const hasLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

const isLegacySampleBill = (bill) =>
  String(bill?.id || "").startsWith("sample-");

const sortBillsNewestFirst = (bills) =>
  bills.sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );

const createLegacyReceipt = (items = [], billId) => ({
  id: `${billId || "bill"}-receipt-1`,
  label: "Receipt 1",
  discountType: DISCOUNT_TYPES.FIXED,
  discountValue: 0,
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
  const rawGstRate = Math.max(0, toNumber(receipt?.gstRate));
  const legacyGstAmountCents = roundToCents(receipt?.gstAmount ?? receipt?.gst);
  const inferredGstRate =
    subtotalCents > 0 && legacyGstAmountCents > 0
      ? Number(((legacyGstAmountCents * 100) / subtotalCents).toFixed(4))
      : 0;

  return {
    id: receiptId,
    label:
      String(receipt?.label || receipt?.name || "").trim() ||
      `Receipt ${index + 1}`,
    items,
    subtotal: centsToAmount(subtotalCents),
    discountType: normalizeDiscountType(
      receipt?.discountType ?? receipt?.discount_type
    ),
    discountValue: toNumber(receipt?.discountValue ?? receipt?.discount_value),
    gstRate: hasValue(receipt?.gstRate) ? rawGstRate : inferredGstRate,
    gstAmount: 0,
    serviceChargeAmount: centsToAmount(
      roundToCents(receipt?.serviceChargeAmount ?? receipt?.serviceCharge)
    ),
    total: centsToAmount(subtotalCents),
    gstSplitMode: normalizeSplitMode(receipt?.gstSplitMode),
  };
};

const distributeLegacyBillDiscount = (receipts = [], input = {}) => {
  const legacyDiscountValue = toNumber(
    input?.discountValue ?? input?.discount_value
  );
  const hasLegacyBillDiscount = legacyDiscountValue > 0;

  if (!hasLegacyBillDiscount || receipts.length === 0) {
    return receipts;
  }

  const hasReceiptLevelDiscount = receipts.some(
    (receipt) => toNumber(receipt.discountValue) > 0
  );

  if (hasReceiptLevelDiscount) {
    return receipts;
  }

  const totalSubtotalCents = receipts.reduce(
    (sum, receipt) => sum + calculateItemsSubtotalCents(receipt.items),
    0
  );
  const totalDiscountCents = calculateDiscountAmountCents(
    normalizeDiscountType(input?.discountType ?? input?.discount_type),
    legacyDiscountValue,
    totalSubtotalCents
  );

  if (totalDiscountCents <= 0) {
    return receipts;
  }

  const receiptKeys = receipts
    .filter((receipt) => calculateItemsSubtotalCents(receipt.items) > 0)
    .map((receipt) => receipt.id);
  const receiptWeights = Object.fromEntries(
    receiptKeys.map((receiptId) => {
      const receipt = receipts.find((entry) => entry.id === receiptId);
      return [receiptId, calculateItemsSubtotalCents(receipt?.items)];
    })
  );
  const discountAllocation = allocateProportionally(
    totalDiscountCents,
    receiptKeys,
    receiptWeights,
    receiptKeys
  );

  return receipts.map((receipt) => ({
    ...receipt,
    discountType: DISCOUNT_TYPES.FIXED,
    discountValue: centsToAmount(discountAllocation[receipt.id] || 0),
  }));
};

const normalizeBillInput = (input = {}, membersOverride = []) => {
  if (Array.isArray(input)) {
    return {
      members: normalizeMembers(membersOverride),
      receipts:
        input.length > 0 ? [normalizeReceipt(createLegacyReceipt(input), 0)] : [],
    };
  }

  const members = normalizeMembers(input?.members ?? membersOverride);
  const hasExplicitReceipts = Array.isArray(input?.receipts);
  const legacyItems = Array.isArray(input?.items) ? input.items : [];
  const sourceReceipts = hasExplicitReceipts
    ? input.receipts
    : legacyItems.length > 0
      ? [createLegacyReceipt(legacyItems, input?.id)]
      : [];

  return {
    members,
    receipts: distributeLegacyBillDiscount(
      sourceReceipts.map((receipt, index) =>
        normalizeReceipt(receipt, index, input?.id)
      ),
      input
    ),
  };
};

const summarizeBill = ({ receipts = [], members = [] }) => {
  const memberMap = new Map();
  const memberOrder = members.map((member) => member.id);
  const equalAllocator = createRollingEqualAllocator(memberOrder);

  members.forEach((member) => {
    memberMap.set(member.id, {
      ...member,
      itemSubtotal: 0,
      discountShare: 0,
      gstShare: 0,
      serviceChargeShare: 0,
      total: 0,
      receipts: [],
    });
  });

  const receiptStates = receipts.map((receipt) => {
    const memberItemCents = Object.fromEntries(
      members.map((member) => [member.id, 0])
    );
    const assignedCounts = Object.fromEntries(
      members.map((member) => [member.id, 0])
    );
    let unassignedItemCents = 0;

    const items = receipt.items.map((item) => {
      const priceCents = roundToCents(item.price);
      const assignedTo = dedupeIds(item.assignedTo).filter((memberId) =>
        memberMap.has(memberId)
      );

      if (assignedTo.length === 0) {
        unassignedItemCents += priceCents;

        return {
          ...item,
          assignedTo,
          price: centsToAmount(priceCents),
          splitByMember: [],
        };
      }

      const itemAllocation = equalAllocator.allocate(priceCents, assignedTo);

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
    const receiptAmounts = summarizeReceiptAmounts({
      items: receipt.items,
      discountType: receipt.discountType,
      discountValue: receipt.discountValue,
      gstRate: receipt.gstRate,
    });

    return {
      receipt,
      items,
      subtotalCents: receiptAmounts.subtotalCents,
      discountType: receiptAmounts.discountType,
      discountValue: receiptAmounts.discountValue,
      discountAmountCents: receiptAmounts.discountAmountCents,
      discountedSubtotalCents: receiptAmounts.discountedSubtotalCents,
      memberItemCents,
      involvedMemberIds,
      unassignedItemCents,
      serviceChargeAmountCents: roundToCents(receipt.serviceChargeAmount),
      gstRate: receiptAmounts.gstRate,
      gstAmountCents: receiptAmounts.gstAmountCents,
      gstSplitMode: normalizeSplitMode(receipt.gstSplitMode),
    };
  });

  const subtotalCents = receiptStates.reduce(
    (sum, receiptState) => sum + receiptState.subtotalCents,
    0
  );

  let gstTotalCents = 0;
  let serviceChargeTotalCents = 0;
  let unassignedTotalCents = 0;

  const receiptSummaries = receiptStates.map((receiptState) => {
    const receiptDiscountKeys = [];
    const receiptDiscountWeights = {};

    members.forEach((member) => {
      const weight = receiptState.memberItemCents[member.id] || 0;

      if (weight <= 0) {
        return;
      }

      receiptDiscountKeys.push(`member:${member.id}`);
      receiptDiscountWeights[`member:${member.id}`] = weight;
    });

    if (receiptState.unassignedItemCents > 0) {
      receiptDiscountKeys.push("unassigned");
      receiptDiscountWeights.unassigned = receiptState.unassignedItemCents;
    }

    const receiptDiscountAllocation = allocateProportionally(
      receiptState.discountAmountCents,
      receiptDiscountKeys,
      receiptDiscountWeights,
      receiptDiscountKeys
    );
    const receiptDiscountCents = receiptState.discountAmountCents;
    const receiptGstCents = receiptState.gstAmountCents;
    const receiptServiceChargeCents = receiptState.serviceChargeAmountCents;
    const memberNetSubtotalCents = Object.fromEntries(
      members.map((member) => {
        const discountShare =
          receiptDiscountAllocation[`member:${member.id}`] || 0;

        return [
          member.id,
          (receiptState.memberItemCents[member.id] || 0) - discountShare,
        ];
      })
    );
    const receiptUnassignedDiscountCents =
      receiptDiscountAllocation.unassigned || 0;
    let receiptUnassignedCents =
      receiptState.unassignedItemCents - receiptUnassignedDiscountCents;

    const gstAllocation =
      receiptState.gstSplitMode === RECEIPT_SPLIT_MODES.BY_ITEMS
        ? allocateProportionally(
            receiptGstCents,
            receiptState.involvedMemberIds,
            memberNetSubtotalCents,
            memberOrder
          )
        : equalAllocator.allocate(receiptGstCents, receiptState.involvedMemberIds);

    const serviceChargeAllocation = equalAllocator.allocate(
      receiptServiceChargeCents,
      receiptState.involvedMemberIds
    );

    if (receiptState.involvedMemberIds.length === 0) {
      receiptUnassignedCents += receiptGstCents + receiptServiceChargeCents;
    }

    const memberBreakdown = members.map((member) => {
      const discountShare = receiptDiscountAllocation[`member:${member.id}`] || 0;
      const itemSubtotal = memberNetSubtotalCents[member.id] || 0;
      const gstShare = gstAllocation[member.id] || 0;
      const serviceChargeShare = serviceChargeAllocation[member.id] || 0;
      const total = itemSubtotal + gstShare + serviceChargeShare;
      const memberSummary = memberMap.get(member.id);

      memberSummary.itemSubtotal += itemSubtotal;
      memberSummary.discountShare += discountShare;
      memberSummary.gstShare += gstShare;
      memberSummary.serviceChargeShare += serviceChargeShare;
      memberSummary.total += total;
      memberSummary.receipts.push({
        receiptId: receiptState.receipt.id,
        receiptLabel: receiptState.receipt.label,
        itemSubtotal: centsToAmount(itemSubtotal),
        discountShare: centsToAmount(discountShare),
        gstShare: centsToAmount(gstShare),
        serviceChargeShare: centsToAmount(serviceChargeShare),
        total: centsToAmount(total),
        isInvolved: receiptState.involvedMemberIds.includes(member.id),
      });

      return {
        id: member.id,
        name: member.name,
        color: member.color,
        itemSubtotal: centsToAmount(itemSubtotal),
        discountShare: centsToAmount(discountShare),
        gstShare: centsToAmount(gstShare),
        serviceChargeShare: centsToAmount(serviceChargeShare),
        total: centsToAmount(total),
        isInvolved: receiptState.involvedMemberIds.includes(member.id),
      };
    });

    gstTotalCents += receiptGstCents;
    serviceChargeTotalCents += receiptServiceChargeCents;
    unassignedTotalCents += receiptUnassignedCents;

    return {
      ...receiptState.receipt,
      items: receiptState.items,
      subtotal: centsToAmount(receiptState.subtotalCents),
      discountType: receiptState.discountType,
      discountValue: receiptState.discountValue,
      discountAmount: centsToAmount(receiptDiscountCents),
      discountedSubtotal: centsToAmount(receiptState.discountedSubtotalCents),
      gstRate: receiptState.gstRate,
      gstAmount: centsToAmount(receiptGstCents),
      serviceChargeAmount: centsToAmount(receiptServiceChargeCents),
      total: centsToAmount(
        receiptState.discountedSubtotalCents + receiptGstCents + receiptServiceChargeCents
      ),
      unassignedTotal: centsToAmount(receiptUnassignedCents),
      members: memberBreakdown,
      involvedMemberIds: receiptState.involvedMemberIds,
    };
  });

  const discountAmountCents = receiptStates.reduce(
    (sum, receiptState) => sum + receiptState.discountAmountCents,
    0
  );
  const discountedSubtotalCents = subtotalCents - discountAmountCents;
  const totalCents = discountedSubtotalCents + gstTotalCents + serviceChargeTotalCents;
  const flattenedItems = receiptSummaries.flatMap((receipt) => receipt.items);
  const memberSummaries = members.map((member) => {
    const summary = memberMap.get(member.id);

    return {
      ...summary,
      itemSubtotal: centsToAmount(summary.itemSubtotal),
      discountShare: centsToAmount(summary.discountShare),
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
    discountAmount: centsToAmount(discountAmountCents),
    discountedSubtotal: centsToAmount(discountedSubtotalCents),
    gstTotal: centsToAmount(gstTotalCents),
    serviceChargeTotal: centsToAmount(serviceChargeTotalCents),
    total: centsToAmount(totalCents),
    unassignedTotal: centsToAmount(unassignedTotalCents),
    receiptCount: receiptSummaries.length,
    itemCount: flattenedItems.length,
  };
};

const normaliseStoredBill = (bill) => {
  const {
    discountType: _legacyDiscountType,
    discountValue: _legacyDiscountValue,
    discount_type: _legacyDiscountTypeSnake,
    discount_value: _legacyDiscountValueSnake,
    ...restBill
  } = bill;
  const { members, receipts } = normalizeBillInput(bill);
  const summary = summarizeBill({
    members,
    receipts,
  });

  return {
    ...restBill,
    discountAmount: summary.discountAmount,
    discountedSubtotal: summary.discountedSubtotal,
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
      discountType: receipt.discountType,
      discountValue: receipt.discountValue,
      discount_type: receipt.discountType,
      discount_value: receipt.discountValue,
      discountAmount: receipt.discountAmount,
      discountedSubtotal: receipt.discountedSubtotal,
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

  return summarizeBill({
    members,
    receipts,
  });
};

export const calculateMemberTotals = (input = {}, membersOverride = []) =>
  calculateBillSummary(input, membersOverride).members;

export const calculateUnassignedTotal = (input = {}, membersOverride = []) =>
  calculateBillSummary(input, membersOverride).unassignedTotal;

export const getStoredBills = () => {
  if (!hasLocalStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    const nonSampleBills = parsed.filter((bill) => !isLegacySampleBill(bill));

    if (nonSampleBills.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nonSampleBills));
    }

    return sortBillsNewestFirst(nonSampleBills.map(normaliseStoredBill));
  } catch {
    return [];
  }
};

export const saveStoredBills = (bills) => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
};

export const saveBillToHistory = ({
  billName,
  members,
  receipts,
}) => {
  const normalizedInput = normalizeBillInput({
    receipts,
    members,
  });
  const normalizedMembers = normalizedInput.members;
  const summary = summarizeBill(normalizedInput);

  const newBill = {
    id: String(Date.now()),
    billName: billName.trim(),
    createdAt: new Date().toISOString(),
    discountAmount: summary.discountAmount,
    discountedSubtotal: summary.discountedSubtotal,
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
      discountType: receipt.discountType,
      discountValue: receipt.discountValue,
      discount_type: receipt.discountType,
      discount_value: receipt.discountValue,
      discountAmount: receipt.discountAmount,
      discountedSubtotal: receipt.discountedSubtotal,
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

  const existingBills = getStoredBills();
  const updatedBills = [newBill, ...existingBills];
  saveStoredBills(updatedBills);

  return newBill;
};
