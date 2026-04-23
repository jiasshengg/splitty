import { describe, expect, it } from "vitest";
import {
  calculateBillSummary,
  DISCOUNT_TYPES,
  RECEIPT_SPLIT_MODES,
} from "@/lib/bills";

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

  it("calculates each receipt discount before GST and allocates receipt discount proportionally", () => {
    const summary = calculateBillSummary({
      members: [
        { id: "a", name: "Alex" },
        { id: "b", name: "Bea" },
      ],
      receipts: [
        {
          id: "r1",
          label: "Lunch",
          discountType: DISCOUNT_TYPES.PERCENTAGE,
          discountValue: 10,
          gstRate: 9,
          serviceChargeAmount: 0,
          gstSplitMode: RECEIPT_SPLIT_MODES.BY_ITEMS,
          items: [
            { id: "i1", name: "Main", price: 60, assignedTo: ["a"] },
            { id: "i2", name: "Sides", price: 40, assignedTo: ["b"] },
          ],
        },
        {
          id: "r2",
          label: "Dessert",
          gstRate: 9,
          serviceChargeAmount: 0,
          gstSplitMode: RECEIPT_SPLIT_MODES.BY_ITEMS,
          items: [{ id: "i3", name: "Cake", price: 50, assignedTo: ["a"] }],
        },
      ],
    });

    expect(summary.subtotal).toBe(150);
    expect(summary.discountAmount).toBe(10);
    expect(summary.discountedSubtotal).toBe(140);
    expect(summary.gstTotal).toBe(12.6);
    expect(summary.total).toBe(152.6);

    expect(summary.receipts[0]).toMatchObject({
      subtotal: 100,
      discountAmount: 10,
      discountedSubtotal: 90,
      gstAmount: 8.1,
      total: 98.1,
    });
    expect(summary.receipts[1]).toMatchObject({
      subtotal: 50,
      discountAmount: 0,
      discountedSubtotal: 50,
      gstAmount: 4.5,
      total: 54.5,
    });

    expect(summary.members.map((member) => ({
      id: member.id,
      itemSubtotal: member.itemSubtotal,
      discountShare: member.discountShare,
      gstShare: member.gstShare,
      total: member.total,
    }))).toEqual([
      {
        id: "a",
        itemSubtotal: 104,
        discountShare: 6,
        gstShare: 9.36,
        total: 113.36,
      },
      {
        id: "b",
        itemSubtotal: 36,
        discountShare: 4,
        gstShare: 3.24,
        total: 39.24,
      },
    ]);
  });

  it("rotates extra cents across bill-wide equal splits in calculation order", () => {
    const summary = calculateBillSummary({
      members: [
        { id: "1", name: "One" },
        { id: "2", name: "Two" },
        { id: "3", name: "Three" },
      ],
      receipts: [
        {
          id: "r1",
          label: "Shared meal",
          gstRate: 0,
          serviceChargeAmount: 10,
          gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
          items: [
            { id: "i1", name: "Dish 1", price: 10, assignedTo: ["1", "2", "3"] },
            { id: "i2", name: "Dish 2", price: 10, assignedTo: ["1", "2", "3"] },
            { id: "i3", name: "Dish 3", price: 10, assignedTo: ["1", "2", "3"] },
          ],
        },
      ],
    });

    expect(summary.members.map((member) => ({
      id: member.id,
      itemSubtotal: member.itemSubtotal,
      serviceChargeShare: member.serviceChargeShare,
      total: member.total,
    }))).toEqual([
      {
        id: "1",
        itemSubtotal: 10,
        serviceChargeShare: 3.34,
        total: 13.34,
      },
      {
        id: "2",
        itemSubtotal: 10,
        serviceChargeShare: 3.33,
        total: 13.33,
      },
      {
        id: "3",
        itemSubtotal: 10,
        serviceChargeShare: 3.33,
        total: 13.33,
      },
    ]);
  });
});
