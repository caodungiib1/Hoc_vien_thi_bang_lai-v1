import { getCurrentUser } from './authService';

const ORGANIZATION_CODE_REGEX = /^\d{6}$/;

export const getOrganizationCode = (user) => String(user?.organizationCode || '').trim();

export const isOrganizationCode = (value) => ORGANIZATION_CODE_REGEX.test(String(value || '').trim());

export const extractOrganizationCode = (pathname = '/') => {
  const match = String(pathname || '/').match(/^\/(\d{6})(?=\/|$)/);
  return match?.[1] || '';
};

export const stripOrganizationPrefix = (pathname = '/') => {
  const normalizedPath = String(pathname || '/');
  const organizationCode = extractOrganizationCode(normalizedPath);

  if (!organizationCode) return normalizedPath || '/';

  const restPath = normalizedPath.slice(`/${organizationCode}`.length);
  return restPath || '/';
};

const splitPathExtras = (value = '/') => {
  const normalizedValue = String(value || '/');
  const hashIndex = normalizedValue.indexOf('#');
  const pathAndSearch = hashIndex >= 0 ? normalizedValue.slice(0, hashIndex) : normalizedValue;
  const hash = hashIndex >= 0 ? normalizedValue.slice(hashIndex) : '';
  const searchIndex = pathAndSearch.indexOf('?');
  const pathname = searchIndex >= 0 ? pathAndSearch.slice(0, searchIndex) : pathAndSearch;
  const search = searchIndex >= 0 ? pathAndSearch.slice(searchIndex) : '';

  return {
    pathname: pathname || '/',
    search,
    hash,
  };
};

export const buildOrganizationPath = (userOrCode, rawPath = '/') => {
  const organizationCode = typeof userOrCode === 'string'
    ? String(userOrCode).trim()
    : getOrganizationCode(userOrCode);
  const { pathname, search, hash } = splitPathExtras(rawPath);
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (!organizationCode) {
    return `${normalizedPath}${search}${hash}`;
  }

  if (normalizedPath === `/${organizationCode}` || normalizedPath.startsWith(`/${organizationCode}/`)) {
    return `${normalizedPath}${search}${hash}`;
  }

  if (normalizedPath === '/') {
    return `/${organizationCode}${search}${hash}`;
  }

  return `/${organizationCode}${normalizedPath}${search}${hash}`;
};

export const buildPathForCurrentUser = (rawPath = '/') => buildOrganizationPath(getCurrentUser(), rawPath);
