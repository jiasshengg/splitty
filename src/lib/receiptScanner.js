const baseUrl = 'http://localhost:3001';

export const scanReceiptImages = async (files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    return {
      items: [],
      scannedImages: 0,
      extractedCount: 0,
    };
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch(`${baseUrl}/scan/receipt`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to scan receipt images right now.');
  }

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    scannedImages: Number(payload?.scannedImages || files.length),
    extractedCount: Number(payload?.extractedCount || 0),
  };
};
