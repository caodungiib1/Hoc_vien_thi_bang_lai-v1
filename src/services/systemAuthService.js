import { apiRequest } from './apiClient';

const SYSTEM_AUTH_TOKEN_KEY = 'qlhv.system.auth.token.v1';
const SYSTEM_AUTH_USER_KEY = 'qlhv.system.auth.user.v1';

const canUseLocalStorage = () => (
  typeof window !== 'undefined'
  && typeof window.localStorage !== 'undefined'
);

const getLocalStorage = () => (canUseLocalStorage() ? window.localStorage : null);

const readLocalStorage = (key, fallback) => {
  const storage = getLocalStorage();
  if (!storage) return fallback;

  try {
    const rawValue = storage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = (key, value) => {
  const storage = getLocalStorage();
  if (!storage) return value;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage issues to keep auth usable.
  }

  return value;
};

const removeLocalStorage = (key) => {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage issues to keep auth usable.
  }
};

const clearSystemAuth = () => {
  removeLocalStorage(SYSTEM_AUTH_TOKEN_KEY);
  removeLocalStorage(SYSTEM_AUTH_USER_KEY);
};

const persistSystemAuth = ({ user, token }) => {
  writeLocalStorage(SYSTEM_AUTH_USER_KEY, user);
  writeLocalStorage(SYSTEM_AUTH_TOKEN_KEY, token);
  return user;
};

export const getSystemAuthToken = () => (
  readLocalStorage(SYSTEM_AUTH_TOKEN_KEY, '')
);

export const getSystemCurrentUser = () => {
  const user = readLocalStorage(SYSTEM_AUTH_USER_KEY, null);

  if (user?.isSystemAdmin === true) {
    return user;
  }

  if (user) {
    clearSystemAuth();
  }

  return null;
};

export const loginSystemAdmin = async ({ account, password }) => {
  const data = await apiRequest('/auth/system/login', {
    method: 'POST',
    body: { account, password, remember: true },
  });

  if (data.user?.isSystemAdmin !== true) {
    clearSystemAuth();
    throw new Error('Tài khoản này không có quyền truy cập cổng quản trị hệ thống.');
  }

  return persistSystemAuth(data);
};

export const syncSystemCurrentUser = async () => {
  const token = getSystemAuthToken();
  if (!token) return null;

  const data = await apiRequest('/auth/me', { token }).catch(() => null);

  if (!data?.user || data.user.isSystemAdmin !== true) {
    if (token) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token,
      }).catch(() => null);
    }

    clearSystemAuth();
    return null;
  }

  return persistSystemAuth({ user: data.user, token });
};

export const changeSystemPassword = async ({ currentPassword, nextPassword }) => {
  const token = getSystemAuthToken();

  if (!token) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const data = await apiRequest('/auth/change-password', {
    method: 'POST',
    token,
    body: { currentPassword, nextPassword },
  });

  if (!data.user || data.user.isSystemAdmin !== true) {
    clearSystemAuth();
    throw new Error('Không thể cập nhật thông tin tài khoản hệ thống.');
  }

  persistSystemAuth({ user: data.user, token });
  return data;
};

export const logoutSystemAdmin = async () => {
  const token = getSystemAuthToken();

  if (token) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      token,
    }).catch(() => null);
  }

  clearSystemAuth();
};
