import { describe, expect, it } from "vitest";
import { calculateBillSummary, RECEIPT_SPLIT_MODES } from "@/lib/bills";

const roundMoney = (value) => Number(value.toFixed(2));

describe("calculateBillSummary", () => {
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
          gst: 3.01,
          serviceCharge: 2,
          gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
          items: [
            { id: "i1", name: "Pasta", price: 10, assignedTo: ["a"] },
            { id: "i2", name: "Pizza", price: 20, assignedTo: ["a", "b"] },
          ],
        },
        {
          id: "r2",
          label: "Dessert",
          gst: 0.99,
          serviceCharge: 1.01,
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
    expect(summary.total).toBe(52.01);

    expect(summary.receipts.map((receipt) => receipt.total)).toEqual([35.01, 17]);
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
        gstShare: 1.51,
        serviceChargeShare: 1,
        total: 22.51,
      },
      {
        id: "b",
        itemSubtotal: 13,
        gstShare: 1.7,
        serviceChargeShare: 1.51,
        total: 16.21,
      },
      {
        id: "c",
        itemSubtotal: 12,
        gstShare: 0.79,
        serviceChargeShare: 0.5,
        total: 13.29,
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
          gst: 0.5,
          serviceCharge: 0.5,
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
