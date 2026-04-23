import { describe, expect, it } from "vitest";
import { calculateBillSummary, RECEIPT_SPLIT_MODES } from "@/lib/bills";

const roundMoney = (value) => Number(value.toFixed(2));

describe("calculateBillSummary", () => {
  it("keeps receipt count at zero for an empty multi-receipt bill", () => {
    const summary = calculateBillSummary({
      members: [],
      receipts: [],
    });

    expect(summary.receiptCount).toBe(0);
    expect(summary.itemCount).toBe(0);
    expect(summary.total).toBe(0);
  });

  it("allocates receipt charges per receipt and reconciles to the bill total", () => {
    const members = [
      { id: "a", name: "Alex" },
      { id: "b", name: "Bea" },
      { id: "c", name: "Chris" },
    ];
    const summary = calculateBillSummary({
      members,
      receipts: [
        {
          id: "r1",
          label: "Dinner",
          gstRate: 10,
          serviceChargeAmount: 2,
          gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
          items: [
            { id: "i1", name: "Pasta", price: 10, assignedTo: ["a"] },
            { id: "i2", name: "Pizza", price: 20, assignedTo: ["a", "b"] },
          ],
        },
        {
          id: "r2",
          label: "Dessert",
          gstRate: 7,
          serviceChargeAmount: 1.01,
          gstSplitMode: RECEIPT_SPLIT_MODES.BY_ITEMS,
          items: [
            { id: "i3", name: "Cake", price: 9, assignedTo: ["c"] },
            { id: "i4", name: "Tea", price: 6, assignedTo: ["b", "c"] },
          ],
        },
      ],
    });

    expect(summary.receiptCount).toBe(2);
    expect(summary.itemCount).toBe(4);
    expect(summary.total).toBe(52.06);

    expect(summary.receipts.map((receipt) => ({
      gstRate: receipt.gstRate,
      gstAmount: receipt.gstAmount,
      serviceChargeAmount: receipt.serviceChargeAmount,
      total: receipt.total,
    }))).toEqual([
      { gstRate: 10, gstAmount: 3, serviceChargeAmount: 2, total: 35 },
      { gstRate: 7, gstAmount: 1.05, serviceChargeAmount: 1.01, total: 17.06 },
    ]);
    expect(summary.receipts.map((receipt) => receipt.unassignedTotal)).toEqual([0, 0]);

    expect(summary.members.map((member) => ({
      id: member.id,
      itemSubtotal: member.itemSubtotal,
      gstShare: member.gstShare,
      serviceChargeShare: member.serviceChargeShare,
      total: member.total,
    }))).toEqual([
      {
        id: "a",
        itemSubtotal: 20,
        gstShare: 1.5,
        serviceChargeShare: 1,
        total: 22.5,
      },
      {
        id: "b",
        itemSubtotal: 13,
        gstShare: 1.71,
        serviceChargeShare: 1.51,
        total: 16.22,
      },
      {
        id: "c",
        itemSubtotal: 12,
        gstShare: 0.84,
        serviceChargeShare: 0.5,
        total: 13.34,
      },
    ]);

    const allocatedTotal = roundMoney(
      summary.members.reduce((sum, member) => sum + member.total, 0)
    );

    expect(allocatedTotal).toBe(summary.total);
  });

  it("keeps unassigned receipt amounts out of participant totals", () => {
    const summary = calculateBillSummary({
      members: [{ id: "a", name: "Alex" }],
      receipts: [
        {
          id: "r1",
          label: "Empty assignments",
          gstRate: 10,
          serviceChargeAmount: 0.5,
          gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
          items: [{ id: "i1", name: "Fries", price: 5, assignedTo: [] }],
        },
      ],
    });

    expect(summary.total).toBe(6);
    expect(summary.unassignedTotal).toBe(6);
    expect(summary.members[0].total).toBe(0);
    expect(summary.receipts[0].members[0].gstShare).toBe(0);
    expect(summary.receipts[0].members[0].serviceChargeShare).toBe(0);
  });
});
