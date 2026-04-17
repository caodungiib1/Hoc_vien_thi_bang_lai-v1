// Mock data cho Module Kết quả Kinh doanh - Phase 10

// ── KPI Tổng quan ────────────────────────────────────────────────────────────
export const mockKpi = {
  totalStudents: 10,
  totalRevenue: 138_200_000,
  totalCollected: 112_700_000,
  totalDebt: 25_500_000,
  passRate: 67,        // %
  retakeRate: 20,      // %
  newThisMonth: 4,
};

// ── Doanh thu & Đăng ký theo tháng (6 tháng gần nhất) ───────────────────────
export const mockMonthlyStats = [
  { month: 'T11/25', enrolled: 3,  revenue: 39_000_000, collected: 39_000_000 },
  { month: 'T12/25', enrolled: 5,  revenue: 68_500_000, collected: 60_000_000 },
  { month: 'T1/26',  enrolled: 8,  revenue: 114_000_000, collected: 95_000_000 },
  { month: 'T2/26',  enrolled: 6,  revenue: 82_000_000, collected: 74_000_000 },
  { month: 'T3/26',  enrolled: 9,  revenue: 127_500_000, collected: 110_000_000 },
  { month: 'T4/26',  enrolled: 10, revenue: 138_200_000, collected: 112_700_000 },
];

// ── Thống kê theo Hạng bằng ──────────────────────────────────────────────────
export const mockByLicense = [
  { type: 'A1', count: 2, revenue: 1_700_000,   passRate: 100, color: 'bl' },
  { type: 'A2', count: 1, revenue: 2_500_000,   passRate: 100, color: 'bl' },
  { type: 'B1', count: 2, revenue: 29_000_000,  passRate: 50,  color: 'pu' },
  { type: 'B2', count: 3, revenue: 45_000_000,  passRate: 67,  color: 'pu' },
  { type: 'C',  count: 2, revenue: 36_000_000,  passRate: 0,   color: 're' },
];

// ── Thống kê theo Khu vực ────────────────────────────────────────────────────
export const mockByRegion = [
  { region: 'Quận 1',          count: 1, revenue: 15_000_000 },
  { region: 'Quận 3',          count: 1, revenue: 14_500_000 },
  { region: 'Quận 5',          count: 1, revenue: 2_500_000  },
  { region: 'Quận 7',          count: 1, revenue: 14_500_000 },
  { region: 'Quận 12',         count: 1, revenue: 18_000_000 },
  { region: 'Quận Gò Vấp',     count: 1, revenue: 15_000_000 },
  { region: 'Quận Tân Bình',   count: 1, revenue: 15_000_000 },
  { region: 'Quận Bình Thạnh', count: 1, revenue: 850_000    },
  { region: 'Quận Thủ Đức',    count: 1, revenue: 850_000    },
  { region: 'Huyện Củ Chi',    count: 1, revenue: 18_000_000 },
];

// ── Top Người giới thiệu ──────────────────────────────────────────────────────
export const mockReferrers = [
  { id: 1, name: 'Nguyễn Minh Tú',   phone: '0901111222', studentCount: 4, commission: 2_000_000 },
  { id: 2, name: 'Trần Thị Hương',   phone: '0902222333', studentCount: 3, commission: 1_500_000 },
  { id: 3, name: 'Lê Văn Bình',      phone: '0903333444', studentCount: 2, commission: 1_000_000 },
  { id: 4, name: 'Phạm Quốc Long',   phone: '0904444555', studentCount: 1, commission: 500_000   },
];
