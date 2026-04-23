import { clearStoredAccount, syncSessionAccount } from '@/lib/account';

const SESSION_BASE_URL = '/api/users';

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.message || payload?.error || 'Request failed.';
    throw new Error(errorMessage);
  }

  return payload;
};

export async function loginSession({ username, password }) {
  const response = await fetch(`${SESSION_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  const payload = await parseResponse(response);
  const user = payload?.data ?? null;

  if (user?.username) {
    syncSessionAccount(user);
  }

  return user;
}

export async function registerSession({ username, email, password }) {
  const response = await fetch(`${SESSION_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const payload = await parseResponse(response);
  return payload?.data ?? null;
}

export async function checkSession() {
  try {
    const response = await fetch(`${SESSION_BASE_URL}/is-logged-in`, {
      method: 'GET',
      credentials: 'include',
    });

    const payload = await parseResponse(response);
    const user = payload?.data ?? null;

    if (user?.username) {
      syncSessionAccount(user);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function logoutSession() {
  try {
    const response = await fetch(`${SESSION_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    await parseResponse(response);
    clearStoredAccount();
    return true;
  } catch {
    return false;
  }
}
