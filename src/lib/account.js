const STORAGE_KEY = "splitpot_account";

const defaultAccount = {
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  email: "johndoe@email.com",
  createdAt: "2026-01-10T10:00:00.000Z",
};

const hasLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeAccount = (account = {}) => ({
  firstName: String(account.firstName || defaultAccount.firstName).trim(),
  lastName: String(account.lastName || defaultAccount.lastName).trim(),
  username: String(account.username || defaultAccount.username).trim(),
  email: String(account.email || defaultAccount.email).trim(),
  createdAt: String(account.createdAt || defaultAccount.createdAt),
});

export const getStoredAccount = () => {
  if (!hasLocalStorage()) {
    return defaultAccount;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccount));
    return defaultAccount;
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeAccount(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccount));
    return defaultAccount;
  }
};

export const saveStoredAccount = (account) => {
  if (!hasLocalStorage()) {
    return normalizeAccount(account);
  }

  const normalized = normalizeAccount(account);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const syncSessionAccount = (sessionUser = {}) => {
  const existingAccount = getStoredAccount();

  return saveStoredAccount({
    ...existingAccount,
    username: sessionUser.username || existingAccount.username,
  });
};

export const clearStoredAccount = () => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const getAccountDisplayName = (account = defaultAccount) =>
  String(account.username || "").trim() || `${account.firstName || ""} ${account.lastName || ""}`.trim() || defaultAccount.username;

export const getAccountFullName = (account = defaultAccount) =>
  `${account.firstName || ""} ${account.lastName || ""}`.trim() || defaultAccount.firstName;

export const getAccountInitials = (account = defaultAccount) => {
  const username = String(account.username || "").trim();

  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  const firstInitial = String(account.firstName || "").trim().charAt(0);
  const lastInitial = String(account.lastName || "").trim().charAt(0);
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "SP";
};

export const formatJoinedDate = (value) => {
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
