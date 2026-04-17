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

export const getAuthToken = () => (
  readLocalStorage(AUTH_TOKEN_KEY, '')
  || readSessionStorage(AUTH_TOKEN_KEY, '')
);

export const getCurrentUser = () => (
  readLocalStorage(AUTH_USER_KEY, null)
  || readSessionStorage(AUTH_USER_KEY, null)
);

export const login = async ({ email, password, remember = true }) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password, remember },
  });

  return persistAuth(data, remember);
};

export const register = async ({ name, email, password, centerName }) => {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password, centerName, remember: true },
  });

  return persistAuth(data, true);
};

export const forgotPassword = async (email) => apiRequest('/auth/forgot-password', {
  method: 'POST',
  body: { email },
});

export const logout = async () => {
  const token = getAuthToken();

  if (token) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      token,
    }).catch(() => null);
  }

  removeLocalStorage(AUTH_USER_KEY);
  removeLocalStorage(AUTH_TOKEN_KEY);
  removeSessionStorage(AUTH_USER_KEY);
  removeSessionStorage(AUTH_TOKEN_KEY);
};
