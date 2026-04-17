import { mockFeeRecords } from '../data/mockFees';
import { getStudentById, getStudentProfiles, syncStudentTuitionFromFeeRecord } from './studentService';
import { getUserScopedKey, readStorage, writeStorage } from './storageService';

const clone = (value) => JSON.parse(JSON.stringify(value));

const FEE_RECORDS_KEY = 'feeRecords.v1';

const getStoredFeeRecords = () => readStorage(getUserScopedKey(FEE_RECORDS_KEY), mockFeeRecords);
const saveStoredFeeRecords = (records) => writeStorage(getUserScopedKey(FEE_RECORDS_KEY), records);

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return Number(String(value).replace(/\D/g, '')) || 0;
};

const resolvePaymentStatus = (debt, dueDate) => {
  if (debt <= 0) return 'Đã đóng đủ';
  if (!dueDate) return 'Còn nợ';
  const [day, month, year] = dueDate.split('/').map(Number);
  const due = new Date(year, month - 1, day);
  return due < new Date() ? 'Quá hạn' : 'Còn nợ';
};

const computeOverview = (records) => {
  const totalRequired = records.reduce((sum, record) => sum + (record.totalFee || 0), 0);
  const totalCollected = records.reduce((sum, record) => sum + (record.paid || 0), 0);
  const totalDebt = records.reduce((sum, record) => sum + (record.debt || 0), 0);
  const debtorCount = records.filter((record) => (record.debt || 0) > 0).length;
  return { totalRequired, totalCollected, totalDebt, debtorCount };
};

const buildFeeRecordFromStudent = (student) => {
  const totalFee = toNumber(student.tuition?.total || student.totalFee);
  const paid = toNumber(student.tuition?.paid || student.paid);
  const explicitDebt = student.tuition?.debt ?? student.debt;
  const debt = explicitDebt !== undefined && explicitDebt !== null
    ? toNumber(explicitDebt)
    : Math.max(totalFee - paid, 0);
  const dueDate = student.tuition?.deadline || null;

  return {
    id: student.id,
    studentId: student.id,
    name: student.name,
    phone: student.phone,
    licenseType: student.licenseType,
    totalFee,
    paid,
    debt,
    dueDate,
    paymentStatus: resolvePaymentStatus(debt, dueDate),
    payments: [],
  };
};

const syncRecordWithStudent = (record, student) => {
  const dueDate = record.dueDate ?? student.tuition?.deadline ?? null;
  const totalFee = record.totalFee || toNumber(student.tuition?.total || student.totalFee);
  const paid = record.paid || 0;
  const debt = Math.max(record.debt ?? Math.max(totalFee - paid, 0), 0);

  return {
    ...record,
    id: record.id || student.id,
    studentId: student.id,
    name: student.name,
    phone: student.phone,
    licenseType: student.licenseType,
    totalFee,
    paid,
    debt,
    dueDate,
    paymentStatus: resolvePaymentStatus(debt, dueDate),
    payments: clone(record.payments || []),
  };
};

const syncFeeRecordsWithStudents = async () => {
  const students = await getStudentProfiles();
  const stored = getStoredFeeRecords();
  const recordMap = new Map(stored.map((record) => [record.studentId, record]));

  const nextRecords = students.map((student) => {
    const existing = recordMap.get(student.id);
    return existing ? syncRecordWithStudent(existing, student) : buildFeeRecordFromStudent(student);
  });

  if (JSON.stringify(nextRecords) !== JSON.stringify(stored)) {
    saveStoredFeeRecords(nextRecords);
  }

  return nextRecords;
};

export const getFeeOverview = async () => {
  const records = await syncFeeRecordsWithStudents();
  return computeOverview(records);
};

export const getFeeRecords = async (status = 'Tất cả') => {
  const records = await syncFeeRecordsWithStudents();
  if (status === 'Tất cả') return clone(records);
  return clone(records.filter((record) => record.paymentStatus === status));
};

export const getFeeRecordByStudentId = async (studentId) => {
  const records = await syncFeeRecordsWithStudents();
  const record = records.find((item) => item.studentId === Number(studentId));
  return record ? clone(record) : null;
};

export const getPaymentHistory = async () => {
  const records = await syncFeeRecordsWithStudents();
  const parseDate = (dateText) => {
    if (!dateText) return new Date(0);
    const [day, month, year] = dateText.split('/');
    return new Date(year, month - 1, day);
  };

  return records
    .flatMap((record) =>
      (record.payments || []).map((payment) => ({
        ...payment,
        studentName: record.name,
        studentPhone: record.phone,
        studentId: record.studentId,
        licenseType: record.licenseType,
      })),
    )
    .sort((left, right) => parseDate(right.date) - parseDate(left.date));
};

export const collectFee = async (studentId, payment) => {
  const records = await syncFeeRecordsWithStudents();
  let index = records.findIndex((record) => record.studentId === Number(studentId));

  if (index === -1) {
    const student = await getStudentById(studentId);
    if (!student) return null;
    records.push(buildFeeRecordFromStudent(student));
    index = records.findIndex((record) => record.studentId === Number(studentId));
  }

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
  await syncStudentTuitionFromFeeRecord(studentId, updatedRecord);
  return clone(updatedRecord);
};
