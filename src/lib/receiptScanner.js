
export const scanReceiptImages = async (files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    return {
      receipts: [],
      scannedImages: 0,
      extractedCount: 0,
    };
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/scan/receipt', {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to scan receipt images right now.');
  }

  const receipts = Array.isArray(payload?.receipts)
    ? payload.receipts
    : Array.isArray(payload?.items)
      ? [
          {
            label: 'Receipt 1',
            items: payload.items,
            gstRate: 0,
            serviceChargeAmount: 0,
          },
        ]
      : [];

  return {
    receipts,
    scannedImages: Number(payload?.scannedImages || files.length),
    extractedCount: Number(payload?.extractedCount || 0),
  };
};
