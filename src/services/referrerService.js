import { getUserScopedKey, readStorage, removeStorage, writeStorage } from './storageService';

const REFERRERS = [
  {
    id: 1,
    name: 'Nguyễn Minh Tú',
    phone: '0901111222',
    source: 'Cộng tác viên',
    studentCount: 4,
    revenue: 47_500_000,
    commission: 2_000_000,
    status: 'Đang hợp tác',
    statusTone: 'green',
    lastStudent: '15/04/2026',
    note: 'Nguồn ổn định, chủ yếu giới thiệu học viên B1/B2.',
  },
  {
    id: 2,
    name: 'Trần Thị Hương',
    phone: '0902222333',
    source: 'Học viên cũ',
    studentCount: 3,
    revenue: 33_500_000,
    commission: 1_500_000,
    status: 'Đang hợp tác',
    statusTone: 'green',
    lastStudent: '12/04/2026',
    note: 'Tệp khách hàng gia đình, tỷ lệ chuyển đổi cao.',
  },
  {
    id: 3,
    name: 'Lê Văn Bình',
    phone: '0903333444',
    source: 'Đại lý khu vực',
    studentCount: 2,
    revenue: 20_500_000,
    commission: 1_000_000,
    status: 'Cần chăm sóc',
    statusTone: 'orange',
    lastStudent: '05/04/2026',
    note: 'Cần gọi lại để cập nhật chính sách hoa hồng tháng 4.',
  },
  {
    id: 4,
    name: 'Phạm Quốc Long',
    phone: '0904444555',
    source: 'Cộng tác viên',
    studentCount: 1,
    revenue: 15_000_000,
    commission: 500_000,
    status: 'Theo dõi',
    statusTone: 'blue',
    lastStudent: '02/04/2026',
    note: 'Mới phát sinh học viên đầu tiên, cần theo dõi thêm.',
  },
  {
    id: 5,
    name: 'Chị Hà kế toán',
    phone: '0905555666',
    source: 'Nội bộ',
    studentCount: 1,
    revenue: 2_500_000,
    commission: 250_000,
    status: 'Đang hợp tác',
    statusTone: 'green',
    lastStudent: '01/04/2026',
    note: 'Nguồn nội bộ, ưu tiên ghi nhận minh bạch.',
  },
];

const SOURCE_PERFORMANCE = [
  { id: 1, name: 'Người giới thiệu', studentCount: 11, revenue: 119_000_000, conversionRate: 72, cost: 5_250_000, tone: 'green' },
  { id: 2, name: 'Facebook Ads', studentCount: 9, revenue: 82_000_000, conversionRate: 38, cost: 12_000_000, tone: 'blue' },
  { id: 3, name: 'Fanpage trung tâm', studentCount: 7, revenue: 63_500_000, conversionRate: 44, cost: 4_200_000, tone: 'purple' },
  { id: 4, name: 'Website đăng ký', studentCount: 5, revenue: 48_000_000, conversionRate: 51, cost: 2_500_000, tone: 'orange' },
  { id: 5, name: 'TikTok Ads', studentCount: 4, revenue: 31_500_000, conversionRate: 29, cost: 7_800_000, tone: 'red' },
  { id: 6, name: 'Nhân viên tư vấn nội bộ', studentCount: 3, revenue: 26_500_000, conversionRate: 67, cost: 0, tone: 'neutral' },
];

const RECENT_REFERRALS = [
  { id: 1, studentName: 'Nguyễn Văn Anh', licenseType: 'B2', referrer: 'Nguyễn Minh Tú', date: '15/04/2026', revenue: 15_000_000, commission: 500_000 },
  { id: 2, studentName: 'Trần Thị Bảo', licenseType: 'A1', referrer: 'Trần Thị Hương', date: '12/04/2026', revenue: 850_000, commission: 100_000 },
  { id: 3, studentName: 'Lê Quang Cường', licenseType: 'B1', referrer: 'Lê Văn Bình', date: '08/04/2026', revenue: 14_500_000, commission: 500_000 },
  { id: 4, studentName: 'Hoàng Kim Êm', licenseType: 'B2', referrer: 'Nguyễn Minh Tú', date: '06/04/2026', revenue: 15_000_000, commission: 500_000 },
  { id: 5, studentName: 'Lý Quốc Mạnh', licenseType: 'A2', referrer: 'Chị Hà kế toán', date: '01/04/2026', revenue: 2_500_000, commission: 250_000 },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const REFERRER_BASE_KEY = 'referrers.v1';

const getStoredReferrers = () => readStorage(getUserScopedKey(REFERRER_BASE_KEY), REFERRERS);

const saveStoredReferrers = (referrerList) => writeStorage(getUserScopedKey(REFERRER_BASE_KEY), referrerList);

export const getReferrers = async () => getStoredReferrers();

export const getSourcePerformance = async () => clone(SOURCE_PERFORMANCE);

export const getRecentReferrals = async () => clone(RECENT_REFERRALS);

export const getReferrerSummary = async () => {
  const referrerList = getStoredReferrers();
  const totalReferrers = referrerList.length;
  const totalStudents = referrerList.reduce((sum, item) => sum + item.studentCount, 0);
  const totalRevenue = referrerList.reduce((sum, item) => sum + item.revenue, 0);
  const totalCommission = referrerList.reduce((sum, item) => sum + item.commission, 0);
  const bestSource = [...SOURCE_PERFORMANCE].sort((a, b) => b.studentCount - a.studentCount)[0];

  return {
    totalReferrers,
    totalStudents,
    totalRevenue,
    totalCommission,
    bestSource: bestSource?.name || 'Chưa có',
    bestSourceStudents: bestSource?.studentCount || 0,
  };
};

export const createReferrer = async (payload) => {
  const createdReferrer = {
    id: Date.now(),
    studentCount: 0,
    revenue: 0,
    commission: 0,
    status: 'Theo dõi',
    statusTone: 'blue',
    lastStudent: 'Chưa phát sinh',
    ...payload,
  };

  saveStoredReferrers([createdReferrer, ...getStoredReferrers()]);
  return clone(createdReferrer);
};

export const updateReferrer = async (id, payload) => {
  const updatedReferrer = {
    id: Number(id),
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  const nextReferrers = getStoredReferrers().map((referrer) => (
    referrer.id === Number(id) ? { ...referrer, ...updatedReferrer } : referrer
  ));

  saveStoredReferrers(nextReferrers);
  return clone(updatedReferrer);
};

export const resetReferrersToDefault = async () => {
  removeStorage(getUserScopedKey(REFERRER_BASE_KEY));
  return clone(REFERRERS);
};
