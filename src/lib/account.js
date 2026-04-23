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
  if (!value) {
    return "Unavailable";
  }

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
