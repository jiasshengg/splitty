import { getApiUrl } from '@/lib/api';

const BILL_BASE_URL = getApiUrl('/api/bills');

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const genericMessages = new Set([
      'Request failed.',
      'Failed to save bill',
      'Failed to fetch bills',
      'Failed to fetch bill',
      'Failed to delete bill',
    ]);
    const primaryMessage = payload?.message;
    const detailedError = payload?.error;
    const errorMessage =
      detailedError && genericMessages.has(primaryMessage)
        ? detailedError
        : primaryMessage || detailedError || 'Request failed.';
    throw new Error(errorMessage);
  }

  return payload;
};

export async function createBill({ billName, members, receipts, summary }) {
  const response = await fetch(`${BILL_BASE_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      billName,
      members,
      receipts,
      summary,
    }),
  });

  const payload = await parseResponse(response);
  return payload?.data ?? null;
}

export async function getBillHistory() {
  try {
    const response = await fetch(`${BILL_BASE_URL}/`, {
      method: 'GET',
      credentials: 'include',
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    if (error.message === 'Please register or login') {
      return [];
    }

    throw error;
  }
}

export async function deleteBill(billId) {
  const response = await fetch(`${BILL_BASE_URL}/${billId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await parseResponse(response);
}
