const rawApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

const getLocalApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3001`;
  }

  return '';
};

export const API_BASE_URL = rawApiBaseUrl
  ? normalizeBaseUrl(rawApiBaseUrl)
  : getLocalApiBaseUrl();

export const getApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
