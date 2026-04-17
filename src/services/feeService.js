import { mockFeeRecords, mockFeeOverview } from '../data/mockFees';
import { getUserScopedKey, readStorage, writeStorage } from './storageService';

const clone = (value) => JSON.parse(JSON.stringify(value));

// ── Storage keys ──────────────────────────────────────────────────────────────
const FEE_RECORDS_KEY = 'feeRecords.v1';
const FEE_PAYMENTS_KEY = 'feePayments.v1';

const getStoredFeeRecords = () => readStorage(getUserScopedKey(FEE_RECORDS_KEY), mockFeeRecords);
const saveStoredFeeRecords = (records) => writeStorage(getUserScopedKey(FEE_RECORDS_KEY), records);

// ── Helpers ───────────────────────────────────────────────────────────────────
const resolvePaymentStatus = (debt, dueDate) => {
  if (debt <= 0) return 'Đã đóng đủ';
  if (!dueDate) return 'Còn nợ';
  const [day, month, year] = dueDate.split('/').map(Number);
  const due = new Date(year, month - 1, day);
  return due < new Date() ? 'Quá hạn' : 'Còn nợ';
};

// Tính lại FeeOverview từ records thực tế.
const computeOverview = (records) => {
  const totalRequired = records.reduce((sum, r) => sum + (r.totalFee || 0), 0);
  const totalCollected = records.reduce((sum, r) => sum + (r.paid || 0), 0);
  const totalDebt = records.reduce((sum, r) => sum + (r.debt || 0), 0);
  const debtorCount = records.filter((r) => (r.debt || 0) > 0).length;
  return { totalRequired, totalCollected, totalDebt, debtorCount };
};

// ── API ───────────────────────────────────────────────────────────────────────
export const getFeeOverview = async () => {
  const records = getStoredFeeRecords();
  return computeOverview(records);
};

export const getFeeRecords = async (status = 'Tất cả') => {
  const records = getStoredFeeRecords();
  if (status === 'Tất cả') return clone(records);
  return clone(records.filter((r) => r.paymentStatus === status));
};

export const getFeeRecordByStudentId = async (studentId) => {
  const records = getStoredFeeRecords();
  const record = records.find((r) => r.studentId === Number(studentId));
  return record ? clone(record) : null;
};

export const getPaymentHistory = async () => {
  const records = getStoredFeeRecords();
  const parseDate = (d) => {
    if (!d) return new Date(0);
    const [day, month, year] = d.split('/');
    return new Date(year, month - 1, day);
  };
  return records
    .flatMap((r) =>
      (r.payments || []).map((p) => ({
        ...p,
        studentName: r.name,
        studentPhone: r.phone,
        licenseType: r.licenseType,
      })),
    )
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));
};

export const collectFee = async (studentId, payment) => {
  const records = getStoredFeeRecords();
  const index = records.findIndex((r) => r.studentId === Number(studentId));

  if (index === -1) return null;

  const record = records[index];
  const amount = Number(payment.amount) || 0;
  const paid = Math.min(record.totalFee, record.paid + amount);
  const debt = Math.max(record.totalFee - paid, 0);

  const updatedRecord = {
    ...clone(record),
    paid,
    debt,
    paymentStatus: resolvePaymentStatus(debt, record.dueDate),
    payments: [
      ...clone(record.payments || []),
      {
        id: Date.now(),
        date: new Date().toLocaleDateString('vi-VN'),
        amount,
        method: payment.method || 'Tiền mặt',
        collector: payment.collector || 'Admin',
        note: payment.note || '',
      },
    ],
  };

  records[index] = updatedRecord;
  saveStoredFeeRecords(records);
  return clone(updatedRecord);
};
