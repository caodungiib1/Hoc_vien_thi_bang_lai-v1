import {
  mockByLicense,
  mockByRegion,
  mockKpi,
  mockMonthlyStats,
  mockReferrers,
} from '../data/mockReports';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const getReportKpi = async () => clone(mockKpi);

export const getMonthlyStats = async (period = '6M') => {
  const stats = period === '3M' ? mockMonthlyStats.slice(-3) : mockMonthlyStats;
  return clone(stats);
};

export const getLicenseReport = async () => clone(mockByLicense);

export const getRegionReport = async () => clone(mockByRegion);

export const getReferrerReport = async () => clone(mockReferrers);

export const getBusinessReport = async (period = '6M') => ({
  kpi: await getReportKpi(),
  monthlyStats: await getMonthlyStats(period),
  byLicense: await getLicenseReport(),
  byRegion: await getRegionReport(),
  referrers: await getReferrerReport(),
});
