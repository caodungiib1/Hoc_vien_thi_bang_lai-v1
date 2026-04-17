const clone = (value) => JSON.parse(JSON.stringify(value));

// Trả về localStorage key có prefix theo organizationId, tránh dữ liệu bị dùng chung giữa các doanh nghiệp.
// Mỗi tài khoản đăng ký = 1 tổ chức riêng (organizationId = userId của người tạo).
export const getUserScopedKey = (baseKey) => {
  try {
    const AUTH_USER_KEY = 'qlhv.auth.user.v1';
    let user = null;

    if (typeof window !== 'undefined') {
      const rawLocal = window.localStorage?.getItem(AUTH_USER_KEY);
      const rawSession = window.sessionStorage?.getItem(AUTH_USER_KEY);
      const raw = rawLocal || rawSession;
      if (raw) user = JSON.parse(raw);
    }

    // Ưu tiên organizationId (multi-tenant), fallback về userId nếu chưa migrate.
    const scopeId = user?.organizationId || user?.id;
    return scopeId ? `qlhv.org.${scopeId}.${baseKey}` : `qlhv.${baseKey}`;
  } catch {
    return `qlhv.${baseKey}`;
  }
};

const canUseLocalStorage = () => (
  typeof window !== 'undefined'
  && typeof window.localStorage !== 'undefined'
);

export const readStorage = (key, fallback) => {
  const fallbackValue = clone(fallback);

  if (!canUseLocalStorage()) return fallbackValue;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

export const writeStorage = (key, value) => {
  const nextValue = clone(value);

  if (!canUseLocalStorage()) return nextValue;

  try {
    window.localStorage.setItem(key, JSON.stringify(nextValue));
  } catch {
    // If browser storage is full or blocked, keep the in-memory flow working.
  }

  return nextValue;
};

export const removeStorage = (key) => {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so the UI can continue with mock data.
  }
};
