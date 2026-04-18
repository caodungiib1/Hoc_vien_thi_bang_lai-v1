import { apiRequest } from './apiClient';
import { getSystemAuthToken } from './systemAuthService';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const getOrganizationsOverview = async () => {
  const token = getSystemAuthToken();
  const data = await apiRequest('/system/organizations', { token });

  return {
    activeWindowMinutes: data.activeWindowMinutes || 15,
    organizations: clone(data.organizations || []),
  };
};
