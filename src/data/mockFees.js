// Mock data cho Module Học phí - Phase 9

export const mockFeeOverview = {
  totalRequired: 138_200_000,   // Tổng học phí phải thu
  totalCollected: 112_700_000,  // Đã thu
  totalDebt: 25_500_000,        // Còn nợ
  debtorCount: 4,               // Số học viên còn nợ
};

export const mockFeeRecords = [
  {
    id: 1,
    studentId: 1,
    name: 'Nguyễn Văn Anh',
    phone: '0912345678',
    licenseType: 'B2',
    totalFee: 15_000_000,
    paid: 10_000_000,
    debt: 5_000_000,
    dueDate: '30/04/2026',
    paymentStatus: 'Còn nợ',
    payments: [
      { id: 101, date: '10/04/2026', amount: 5_000_000, method: 'Chuyển khoản', collector: 'Nguyễn NV', note: 'Đặt cọc lần 1' },
      { id: 102, date: '15/04/2026', amount: 5_000_000, method: 'Tiền mặt',     collector: 'Trần NV',   note: 'Đóng lần 2' },
    ],
  },
  {
    id: 2,
    studentId: 2,
    name: 'Trần Thị Bảo',
    phone: '0987654321',
    licenseType: 'A1',
    totalFee: 850_000,
    paid: 850_000,
    debt: 0,
    dueDate: null,
    paymentStatus: 'Đã đóng đủ',
    payments: [
      { id: 201, date: '09/04/2026', amount: 850_000, method: 'Tiền mặt', collector: 'Nguyễn NV', note: '' },
    ],
  },
  {
    id: 3,
    studentId: 3,
    name: 'Lê Quang Cường',
    phone: '0923456789',
    licenseType: 'B1',
    totalFee: 14_500_000,
    paid: 14_500_000,
    debt: 0,
    dueDate: null,
    paymentStatus: 'Đã đóng đủ',
    payments: [
      { id: 301, date: '08/04/2026', amount: 7_000_000,  method: 'Chuyển khoản', collector: 'Trần NV', note: 'Đợt 1' },
      { id: 302, date: '20/04/2026', amount: 7_500_000,  method: 'Chuyển khoản', collector: 'Trần NV', note: 'Đợt 2' },
    ],
  },
  {
    id: 4,
    studentId: 4,
    name: 'Phạm Hồng Duy',
    phone: '0934567890',
    licenseType: 'C',
    totalFee: 18_000_000,
    paid: 10_000_000,
    debt: 8_000_000,
    dueDate: '15/04/2026',
    paymentStatus: 'Quá hạn',
    payments: [
      { id: 401, date: '07/04/2026', amount: 10_000_000, method: 'Tiền mặt', collector: 'Nguyễn NV', note: 'Đặt cọc' },
    ],
  },
  {
    id: 5,
    studentId: 5,
    name: 'Hoàng Kim Êm',
    phone: '0945678901',
    licenseType: 'B2',
    totalFee: 15_000_000,
    paid: 15_000_000,
    debt: 0,
    dueDate: null,
    paymentStatus: 'Đã đóng đủ',
    payments: [
      { id: 501, date: '06/04/2026', amount: 15_000_000, method: 'Chuyển khoản', collector: 'Trần NV', note: 'Đóng 1 lần' },
    ],
  },
  {
    id: 6,
    studentId: 6,
    name: 'Phan Thị Phương',
    phone: '0956789012',
    licenseType: 'A1',
    totalFee: 850_000,
    paid: 0,
    debt: 850_000,
    dueDate: '20/04/2026',
    paymentStatus: 'Còn nợ',
    payments: [],
  },
  {
    id: 7,
    studentId: 7,
    name: 'Đỗ Tuấn Gia',
    phone: '0967890123',
    licenseType: 'B1',
    totalFee: 14_500_000,
    paid: 10_000_000,
    debt: 4_500_000,
    dueDate: '25/04/2026',
    paymentStatus: 'Còn nợ',
    payments: [
      { id: 701, date: '04/04/2026', amount: 10_000_000, method: 'Tiền mặt', collector: 'Nguyễn NV', note: '' },
    ],
  },
  {
    id: 8,
    studentId: 8,
    name: 'Vũ Hải Hải',
    phone: '0978901234',
    licenseType: 'B2',
    totalFee: 15_000_000,
    paid: 15_000_000,
    debt: 0,
    dueDate: null,
    paymentStatus: 'Đã đóng đủ',
    payments: [
      { id: 801, date: '03/04/2026', amount: 8_000_000,  method: 'Chuyển khoản', collector: 'Trần NV', note: '' },
      { id: 802, date: '10/04/2026', amount: 7_000_000,  method: 'Tiền mặt',     collector: 'Trần NV', note: '' },
    ],
  },
  {
    id: 9,
    studentId: 9,
    name: 'Bùi Đức Long',
    phone: '0989012345',
    licenseType: 'C',
    totalFee: 18_000_000,
    paid: 5_000_000,
    debt: 13_000_000,
    dueDate: '10/04/2026',
    paymentStatus: 'Quá hạn',
    payments: [
      { id: 901, date: '02/04/2026', amount: 5_000_000, method: 'Tiền mặt', collector: 'Nguyễn NV', note: 'Đặt cọc' },
    ],
  },
  {
    id: 10,
    studentId: 10,
    name: 'Lý Quốc Mạnh',
    phone: '0990123456',
    licenseType: 'A2',
    totalFee: 2_500_000,
    paid: 2_500_000,
    debt: 0,
    dueDate: null,
    paymentStatus: 'Đã đóng đủ',
    payments: [
      { id: 1001, date: '01/04/2026', amount: 2_500_000, method: 'Chuyển khoản', collector: 'Trần NV', note: '' },
    ],
  },
];

// Lịch sử tất cả giao dịch (flatten từ payments, sắp xếp mới nhất trước)
export const mockAllPayments = mockFeeRecords
  .flatMap(r =>
    r.payments.map(p => ({
      ...p,
      studentName: r.name,
      studentPhone: r.phone,
      licenseType: r.licenseType,
    }))
  )
  .sort((a, b) => {
    const parseDate = d => {
      const [day, month, year] = d.split('/');
      return new Date(year, month - 1, day);
    };
    return parseDate(b.date) - parseDate(a.date);
  });
