const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SESSION_BASE_URL = `${API_BASE_URL}/api/users`;

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
  return payload?.data ?? null;
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

export async function getSessionUser() {
  try {
    const response = await fetch(`${SESSION_BASE_URL}/is-logged-in`, {
      method: 'GET',
      credentials: 'include',
    });

    const payload = await parseResponse(response);
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUserDetails() {
  const sessionUser = await getSessionUser();

  if (!sessionUser?.id) {
    return null;
  }

  try {
    const response = await fetch(`${SESSION_BASE_URL}/${sessionUser.id}`, {
      method: 'GET',
      credentials: 'include',
    });

    const payload = await parseResponse(response);
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function updateCurrentUserDetails({ username, email }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser?.id) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SESSION_BASE_URL}/${sessionUser.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      username,
      email,
    }),
  });

  const payload = await parseResponse(response);
  return payload?.data ?? null;
}

export async function updateCurrentUserPassword({ currentPassword, newPassword }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser?.id) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SESSION_BASE_URL}/${sessionUser.id}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  const payload = await parseResponse(response);
  return payload?.data ?? null;
}

export async function requestPasswordReset({ email }) {
  const response = await fetch(`${SESSION_BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  const payload = await parseResponse(response);
  return payload?.data ?? null;
}

export async function resetPassword({ token, password }) {
  const response = await fetch(`${SESSION_BASE_URL}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      password,
    }),
  });

  const payload = await parseResponse(response);
  return payload?.data ?? null;
}

export async function checkSession() {
  const user = await getSessionUser();
  return Boolean(user?.username);
}

export async function logoutSession() {
  try {
    const response = await fetch(`${SESSION_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    await parseResponse(response);
    return true;
  } catch {
    return false;
  }
}
