import { apiRequest } from './apiClient';

const canUseSessionStorage = () => (
  typeof window !== 'undefined'
  && typeof window.sessionStorage !== 'undefined'
);

const canUseLocalStorage = () => (
  typeof window !== 'undefined'
  && typeof window.localStorage !== 'undefined'
);

const AUTH_TOKEN_KEY = 'qlhv.auth.token.v1';
const AUTH_USER_KEY = 'qlhv.auth.user.v1';

const readBrowserStorage = (storage, key, fallback) => {
  if (!storage) return fallback;

  try {
    const rawValue = storage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
};

const writeBrowserStorage = (storage, key, value) => {
  if (!storage) return value;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep auth flow working if browser storage is blocked.
  }

  return value;
};

const removeBrowserStorage = (storage, key) => {
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures so React state can still update.
  }
};

const getLocalStorage = () => (canUseLocalStorage() ? window.localStorage : null);
const getSessionStorage = () => (canUseSessionStorage() ? window.sessionStorage : null);

const readSessionStorage = (key, fallback) => {
  const sessionStorage = getSessionStorage();
  return readBrowserStorage(sessionStorage, key, fallback);
};

const readLocalStorage = (key, fallback) => {
  const localStorage = getLocalStorage();
  return readBrowserStorage(localStorage, key, fallback);
};

const writeSessionStorage = (key, value) => {
  const sessionStorage = getSessionStorage();
  return writeBrowserStorage(sessionStorage, key, value);
};

const writeLocalStorage = (key, value) => {
  const localStorage = getLocalStorage();
  return writeBrowserStorage(localStorage, key, value);
};

const removeSessionStorage = (key) => removeBrowserStorage(getSessionStorage(), key);
const removeLocalStorage = (key) => removeBrowserStorage(getLocalStorage(), key);
const clearAuthStorage = () => {
  removeLocalStorage(AUTH_USER_KEY);
  removeLocalStorage(AUTH_TOKEN_KEY);
  removeSessionStorage(AUTH_USER_KEY);
  removeSessionStorage(AUTH_TOKEN_KEY);
};

const persistAuth = ({ user, token }, remember = true) => {
  if (remember) {
    removeSessionStorage(AUTH_USER_KEY);
    removeSessionStorage(AUTH_TOKEN_KEY);
    writeLocalStorage(AUTH_USER_KEY, user);
    writeLocalStorage(AUTH_TOKEN_KEY, token);
  } else {
    removeLocalStorage(AUTH_USER_KEY);
    removeLocalStorage(AUTH_TOKEN_KEY);
    writeSessionStorage(AUTH_USER_KEY, user);
    writeSessionStorage(AUTH_TOKEN_KEY, token);
  }

  return user;
};

const persistCurrentUser = (user) => {
  if (user?.isSystemAdmin === true) {
    clearAuthStorage();
    return null;
  }

  const hasLocalToken = Boolean(readLocalStorage(AUTH_TOKEN_KEY, ''));
  const hasSessionToken = Boolean(readSessionStorage(AUTH_TOKEN_KEY, ''));

  if (hasLocalToken) {
    writeLocalStorage(AUTH_USER_KEY, user);
    return user;
  }

  if (hasSessionToken) {
    writeSessionStorage(AUTH_USER_KEY, user);
  }

  return user;
};

export const getAuthToken = () => (
  readLocalStorage(AUTH_TOKEN_KEY, '')
  || readSessionStorage(AUTH_TOKEN_KEY, '')
);

export const getCurrentUser = () => {
  const user = readLocalStorage(AUTH_USER_KEY, null)
    || readSessionStorage(AUTH_USER_KEY, null);

  if (user?.isSystemAdmin === true) {
    clearAuthStorage();
    return null;
  }

  return user;
};

export const login = async ({ email, password, remember = true }) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password, remember },
  });

  if (data.user?.isSystemAdmin === true) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      token: data.token,
    }).catch(() => null);

    clearAuthStorage();
    throw new Error('Tài khoản hệ thống vui lòng đăng nhập tại /businesses.');
  }

  return persistAuth(data, remember);
};

export const register = async ({ name, email, password, centerName }) => {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password, centerName, remember: true },
  });

  return persistAuth(data, true);
};

export const syncCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;

  const data = await apiRequest('/auth/me', { token });
  return persistCurrentUser(data.user);
};

export const forgotPassword = async (email) => apiRequest('/auth/forgot-password', {
  method: 'POST',
  body: { email },
});

export const changePassword = async ({ currentPassword, nextPassword }) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const data = await apiRequest('/auth/change-password', {
    method: 'POST',
    token,
    body: { currentPassword, nextPassword },
  });

  if (data.user) {
    persistCurrentUser(data.user);
  }

  return data;
};

export const logout = async () => {
  const token = getAuthToken();

  if (token) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      token,
    }).catch(() => null);
  }

  clearAuthStorage();
};
