const STORAGE_KEY = "splitpot_bills";

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

    return parsed.map(normaliseStoredBill).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
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

  const existingBills = getStoredBills();
  const updatedBills = [newBill, ...existingBills];
  saveStoredBills(updatedBills);

  return newBill;
};
