const STORAGE_KEY = "splitpot_bills";

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

const hasLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

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

export const calculateMemberTotals = (items = [], members = []) => {
  return members.map((member) => {
    const total = items.reduce((sum, item) => {
      if (!Array.isArray(item.assignedTo) || item.assignedTo.length === 0) {
        return sum;
      }

      if (item.assignedTo.includes(member.id)) {
        return sum + Number(item.price || 0) / item.assignedTo.length;
      }

      return sum;
    }, 0);

    return {
      ...member,
      total,
    };
  });
};

export const calculateUnassignedTotal = (items = []) => {
  return items.reduce((sum, item) => {
    if (!Array.isArray(item.assignedTo) || item.assignedTo.length === 0) {
      return sum + Number(item.price || 0);
    }

    return sum;
  }, 0);
};

const normaliseStoredBill = (bill) => ({
  ...bill,
  total: Number(bill.total || 0),
  unassignedTotal: Number(bill.unassignedTotal || 0),
  peopleCount: Number(bill.peopleCount || bill.members?.length || 0),
  members: Array.isArray(bill.members) ? bill.members : [],
  items: Array.isArray(bill.items) ? bill.items : [],
});

export const getStoredBills = () => {
  if (!hasLocalStorage()) {
    return sampleBills;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBills));
    return sampleBills;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBills));
      return sampleBills;
    }

    return parsed.map(normaliseStoredBill).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBills));
    return sampleBills;
  }
};

export const saveStoredBills = (bills) => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
};

export const saveBillToHistory = ({ billName, members, items }) => {
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const newBill = {
    id: String(Date.now()),
    billName: billName.trim(),
    createdAt: new Date().toISOString(),
    total,
    unassignedTotal: calculateUnassignedTotal(items),
    peopleCount: members.length,
    status: "Pending",
    members: members.map(({ id, name }) => ({ id, name })),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      assignedTo: Array.isArray(item.assignedTo) ? item.assignedTo : [],
    })),
  };

  const existingBills = getStoredBills().filter((bill) => !String(bill.id).startsWith("sample-") || sampleBills.some((sample) => sample.id === bill.id));
  const updatedBills = [newBill, ...existingBills];
  saveStoredBills(updatedBills);

  return newBill;
};