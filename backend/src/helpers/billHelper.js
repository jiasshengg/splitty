const adjustmentPrefixes = {
  discount: '__adj_d_',
  gst: '__adj_g_',
  service: '__adj_s_',
};

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundToCents(value) {
  return Math.round(toNumber(value) * 100);
}

function centsToAmount(value) {
  return Number((value / 100).toFixed(2));
}

function allocateEqually(totalCents, ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {};
  }

  const baseAmount = Math.floor(totalCents / ids.length);
  let remainder = totalCents - baseAmount * ids.length;

  return ids.reduce((accumulator, id) => {
    const extraCent = remainder > 0 ? 1 : 0;
    remainder -= extraCent;
    accumulator[id] = baseAmount + extraCent;
    return accumulator;
  }, {});
}

function buildAdjustmentItemName(type, index) {
  const prefix = adjustmentPrefixes[type];

  if (!prefix) {
    return '';
  }

  return `${prefix}${index + 1}`;
}

function getAdjustmentType(itemName) {
  const normalizedName = String(itemName || '');

  if (normalizedName.startsWith(adjustmentPrefixes.discount)) {
    return 'discount';
  }

  if (normalizedName.startsWith(adjustmentPrefixes.gst)) {
    return 'gst';
  }

  if (normalizedName.startsWith(adjustmentPrefixes.service)) {
    return 'service';
  }

  return null;
}

function buildBillPersistencePayload({ members = [], receipts = [], summary = {} }) {
  const summaryReceipts = Array.isArray(summary?.receipts) ? summary.receipts : [];
  const normalizedReceipts = (Array.isArray(receipts) ? receipts : []).map((receipt, receiptIndex) => {
    const summaryReceipt = summaryReceipts.find(
      (entry) => String(entry?.id || '') === String(receipt?.id || ''),
    );
    const visibleItems = (Array.isArray(receipt?.items) ? receipt.items : []).map((item) => ({
      clientId: String(item?.id || ''),
      name: String(item?.name || '').trim().slice(0, 255),
      price: toNumber(item?.price),
      assignedTo: Array.isArray(item?.assignedTo) ? item.assignedTo.map(String) : [],
    }));
    const adjustmentItems = (Array.isArray(summaryReceipt?.members) ? summaryReceipt.members : []).flatMap(
      (member, memberIndex) => {
        const memberId = String(member?.id || '');
        const nextItems = [];
        const discountShare = toNumber(member?.discountShare);
        const gstShare = toNumber(member?.gstShare);
        const serviceChargeShare = toNumber(member?.serviceChargeShare);

        if (discountShare > 0) {
          nextItems.push({
            clientId: `${receiptIndex}-${memberId}-discount`,
            name: buildAdjustmentItemName('discount', memberIndex),
            price: -discountShare,
            assignedTo: [memberId],
          });
        }

        if (gstShare > 0) {
          nextItems.push({
            clientId: `${receiptIndex}-${memberId}-gst`,
            name: buildAdjustmentItemName('gst', memberIndex),
            price: gstShare,
            assignedTo: [memberId],
          });
        }

        if (serviceChargeShare > 0) {
          nextItems.push({
            clientId: `${receiptIndex}-${memberId}-service`,
            name: buildAdjustmentItemName('service', memberIndex),
            price: serviceChargeShare,
            assignedTo: [memberId],
          });
        }

        return nextItems;
      },
    );

    return {
      clientId: String(receipt?.id || `receipt-${receiptIndex + 1}`),
      label: String(receipt?.label || `Receipt ${receiptIndex + 1}`).trim().slice(0, 255),
      gstRate: toNumber(receipt?.gstRate),
      serviceChargeAmount: toNumber(receipt?.serviceChargeAmount),
      discountType:
        String(receipt?.discountType || '').toLowerCase() === 'percentage'
          ? 'percentage'
          : 'fixed',
      discountValue: toNumber(receipt?.discountValue),
      items: [...visibleItems, ...adjustmentItems],
    };
  });

  return {
    members: (Array.isArray(members) ? members : []).map((member) => ({
      clientId: String(member?.id || ''),
      name: String(member?.name || '').trim(),
    })),
    receipts: normalizedReceipts,
    items: normalizedReceipts.flatMap((receipt) => receipt.items),
  };
}

function serializeBillRecord(billRecord) {
  const receiptRecords = [...(billRecord?.bill_receipts || [])].sort(
    (left, right) => left.id - right.id,
  );
  const participants = [...(billRecord?.bill_participants || [])].sort(
    (left, right) => left.id - right.id,
  );
  const participantMap = new Map(
    participants.map((participant) => [
      participant.id,
      {
        id: participant.id,
        name: participant.name,
        rawItemSubtotalCents: 0,
        discountShareCents: 0,
        gstShareCents: 0,
        serviceChargeShareCents: 0,
      },
    ]),
  );

  let subtotalCents = 0;
  let discountAmountCents = 0;
  let gstTotalCents = 0;
  let serviceChargeTotalCents = 0;
  let unassignedTotalCents = 0;

  const visibleItems = [];

  const serializedReceipts = receiptRecords.map((receiptRecord, receiptIndex) => {
    let receiptSubtotalCents = 0;
    let receiptDiscountAmountCents = 0;
    let receiptGstTotalCents = 0;
    let receiptServiceChargeTotalCents = 0;
    let receiptUnassignedTotalCents = 0;
    const receiptVisibleItems = [];

    (receiptRecord?.bill_items || []).forEach((itemRecord) => {
      const itemPriceCents = roundToCents(itemRecord.price);
      const assignedParticipantIds = (itemRecord.bill_item_assignments || [])
        .map((assignment) => assignment.participant_id)
        .filter((participantId, index, array) => array.indexOf(participantId) === index);
      const adjustmentType = getAdjustmentType(itemRecord.item_name);

      if (adjustmentType) {
        const participantId = assignedParticipantIds[0];
        const participantSummary = participantMap.get(participantId);
        const adjustmentAmountCents = Math.abs(itemPriceCents);

        if (!participantSummary) {
          return;
        }

        if (adjustmentType === 'discount') {
          participantSummary.discountShareCents += adjustmentAmountCents;
          discountAmountCents += adjustmentAmountCents;
          receiptDiscountAmountCents += adjustmentAmountCents;
          return;
        }

        if (adjustmentType === 'gst') {
          participantSummary.gstShareCents += adjustmentAmountCents;
          gstTotalCents += adjustmentAmountCents;
          receiptGstTotalCents += adjustmentAmountCents;
          return;
        }

        participantSummary.serviceChargeShareCents += adjustmentAmountCents;
        serviceChargeTotalCents += adjustmentAmountCents;
        receiptServiceChargeTotalCents += adjustmentAmountCents;
        return;
      }

      subtotalCents += itemPriceCents;
      receiptSubtotalCents += itemPriceCents;

      if (assignedParticipantIds.length === 0) {
        unassignedTotalCents += itemPriceCents;
        receiptUnassignedTotalCents += itemPriceCents;
      } else {
        const allocation = allocateEqually(itemPriceCents, assignedParticipantIds);

        assignedParticipantIds.forEach((participantId) => {
          const participantSummary = participantMap.get(participantId);

          if (!participantSummary) {
            return;
          }

          participantSummary.rawItemSubtotalCents += allocation[participantId] || 0;
        });
      }

      const serializedItem = {
        id: itemRecord.id,
        name: itemRecord.item_name,
        price: centsToAmount(itemPriceCents),
        receiptId: receiptRecord.id,
        assignedTo: assignedParticipantIds,
      };

      visibleItems.push(serializedItem);
      receiptVisibleItems.push(serializedItem);
    });

    return {
      id: receiptRecord.id,
      label: receiptRecord.receipt_name || `Receipt ${receiptIndex + 1}`,
      subtotal: centsToAmount(receiptSubtotalCents),
      discountType: receiptRecord.discount_type,
      discountValue: toNumber(receiptRecord.discount_value),
      discountAmount: centsToAmount(receiptDiscountAmountCents),
      discountedSubtotal: centsToAmount(receiptSubtotalCents - receiptDiscountAmountCents),
      gstRate: toNumber(receiptRecord.gst_rate),
      gstAmount: centsToAmount(receiptGstTotalCents),
      serviceChargeAmount: centsToAmount(receiptServiceChargeTotalCents),
      total: centsToAmount(
        receiptSubtotalCents -
          receiptDiscountAmountCents +
          receiptGstTotalCents +
          receiptServiceChargeTotalCents,
      ),
      unassignedTotal: centsToAmount(receiptUnassignedTotalCents),
      items: receiptVisibleItems,
    };
  });

  const memberBreakdown = participants.map((participant) => {
    const participantSummary = participantMap.get(participant.id);
    const netItemSubtotalCents =
      participantSummary.rawItemSubtotalCents - participantSummary.discountShareCents;
    const totalCents =
      netItemSubtotalCents +
      participantSummary.gstShareCents +
      participantSummary.serviceChargeShareCents;

    return {
      id: participant.id,
      name: participant.name,
      itemSubtotal: centsToAmount(netItemSubtotalCents),
      discountShare: centsToAmount(participantSummary.discountShareCents),
      gstShare: centsToAmount(participantSummary.gstShareCents),
      serviceChargeShare: centsToAmount(participantSummary.serviceChargeShareCents),
      total: centsToAmount(totalCents),
    };
  });

  const totalCents = roundToCents(billRecord?.total_amt);
  const discountedSubtotalCents = subtotalCents - discountAmountCents;

  return {
    id: billRecord.id,
    billName: billRecord.bill_name,
    createdAt: billRecord.created_at,
    subtotal: centsToAmount(subtotalCents),
    discountAmount: centsToAmount(discountAmountCents),
    discountedSubtotal: centsToAmount(discountedSubtotalCents),
    gstTotal: centsToAmount(gstTotalCents),
    serviceChargeTotal: centsToAmount(serviceChargeTotalCents),
    total: centsToAmount(totalCents),
    unassignedTotal: centsToAmount(unassignedTotalCents),
    peopleCount: participants.length,
    members: participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
    })),
    memberBreakdown,
    receipts: serializedReceipts,
    items: visibleItems,
  };
}

module.exports = {
  buildBillPersistencePayload,
  centsToAmount,
  roundToCents,
  serializeBillRecord,
  toNumber,
};
