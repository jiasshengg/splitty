const STORAGE_KEY = "splitpot_account";

const hasLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeAccount = (account = {}) => ({
  username: String(account.username || "").trim(),
  email: String(account.email || "").trim(),
  createdAt: account.createdAt ? String(account.createdAt) : null,
});

export const getStoredAccount = () => {
  if (!hasLocalStorage()) {
    return normalizeAccount();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return normalizeAccount();
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeAccount(parsed);
    return normalized;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return normalizeAccount();
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
    createdAt: existingAccount.createdAt || new Date().toISOString(),
  });
};

export const clearStoredAccount = () => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const getAccountDisplayName = (account = {}) =>
  String(account?.username || "").trim();

export const getAccountFullName = (account = {}) =>
  String(account?.username || "").trim();

export const getAccountInitials = (account = {}) => {
  const username = String(account?.username || "").trim();

  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return "U";
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
