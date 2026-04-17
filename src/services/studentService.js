import { mockStudentProfiles } from '../data/mockStudentProfiles';
import { mockStudents } from '../data/mockStudents';
import { getUserScopedKey, readStorage, writeStorage } from './storageService';

const clone = (value) => JSON.parse(JSON.stringify(value));

// ── Storage key ──────────────────────────────────────────────────────────────
const STUDENTS_BASE_KEY = 'students.v1';

// mockStudentProfiles đã chứa toàn bộ thông tin (bao gồm cả field của mockStudents).
// Dùng đây làm default data — 1 store duy nhất cho cả danh sách lẫn chi tiết.
const getDefaultStudents = () => clone(mockStudentProfiles);

const getStoredStudents = () => readStorage(getUserScopedKey(STUDENTS_BASE_KEY), getDefaultStudents());

const saveStoredStudents = (students) => writeStorage(getUserScopedKey(STUDENTS_BASE_KEY), students);

// ── API ───────────────────────────────────────────────────────────────────────

export const getStudents = async (filters = {}) => {
  const all = getStoredStudents();
  const keyword = filters.keyword?.trim().toLowerCase();

  const result = all.filter((student) => {
    if (filters.licenseType && filters.licenseType !== 'Tất cả' && student.licenseType !== filters.licenseType) {
      return false;
    }
    if (filters.status && filters.status !== 'Tất cả' && student.status !== filters.status) {
      return false;
    }
    if (filters.region && filters.region !== 'Tất cả' && student.region !== filters.region) {
      return false;
    }
    if (keyword) {
      const haystack = `${student.name} ${student.phone} ${student.cccd}`.toLowerCase();
      return haystack.includes(keyword);
    }
    return true;
  });

  // Trả về dạng tóm tắt giống mockStudents (tương thích với Students.jsx)
  return clone(result).map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    cccd: s.cccd,
    licenseType: s.licenseType,
    region: s.region,
    registerDate: s.registerDate,
    referrer: s.referredBy,
    source: s.source || '',
    totalFee: s.tuition?.total?.replace('đ', '').replace(/\./g, ',') || s.totalFee || '0',
    paid: s.tuition?.paid?.replace('đ', '').replace(/\./g, ',') || s.paid || '0',
    debt: s.tuition?.debt?.replace('đ', '').replace(/\./g, ',') || s.debt || '0',
    status: s.status,
  }));
};

export const getStudentProfiles = async () => clone(getStoredStudents());

export const getStudentById = async (id) => {
  const students = getStoredStudents();
  const student = students.find((s) => String(s.id) === String(id));
  return student ? clone(student) : null;
};

export const createStudent = async (payload) => {
  const students = getStoredStudents();
  const newId = Date.now();

  const toMoney = (str) => str ? `${str.replace(/,/g, '.')}đ` : '0đ';

  const newStudent = {
    id: newId,
    name: payload.name,
    phone: payload.phone,
    cccd: payload.cccd || '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    region: payload.region || '',
    referredBy: payload.referrer || '',
    source: payload.source || '',
    consultant: '',
    emergencyContact: '',
    licenseType: payload.licenseType || 'B2',
    packageName: `Khóa ${payload.licenseType || 'B2'} tiêu chuẩn`,
    className: `${payload.licenseType || 'B2'} - Ca tối`,
    registerDate: payload.registerDate || new Date().toLocaleDateString('vi-VN'),
    status: payload.status || 'Mới đăng ký',
    statusTone: 'blue',
    totalFee: payload.totalFee || '0',
    paid: payload.paid || '0',
    debt: payload.debt || payload.totalFee || '0',
    tuition: {
      total: toMoney(payload.totalFee || '0'),
      paid: toMoney(payload.paid || '0'),
      debt: toMoney(payload.debt || payload.totalFee || '0'),
      paymentMethod: 'Tiền mặt',
      collector: '',
      deadline: '',
    },
    documents: [],
    healthCheck: { status: 'Chưa khám', result: '', appointment: '', clinic: '', note: '' },
    exam: { batch: '', expectedDate: '', location: '', theory: 'Chưa thi', practical: 'Chưa thi', attempt: '' },
    schedule: [],
    notes: [],
    careHistory: [{ time: new Date().toLocaleString('vi-VN'), title: 'Tạo hồ sơ học viên', description: 'Tiếp nhận thông tin ban đầu.' }],
    createdAt: new Date().toISOString(),
  };

  saveStoredStudents([newStudent, ...students]);
  return clone(newStudent);
};

export const updateStudent = async (id, payload) => {
  const students = getStoredStudents();
  const index = students.findIndex((s) => String(s.id) === String(id));

  if (index === -1) {
    return { id: Number(id), ...payload, updatedAt: new Date().toISOString() };
  }

  const updated = {
    ...students[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  students[index] = updated;
  saveStoredStudents(students);
  return clone(updated);
};

export const deleteStudent = async (id) => {
  const students = getStoredStudents();
  saveStoredStudents(students.filter((s) => String(s.id) !== String(id)));
  return { id: Number(id), deleted: true, deletedAt: new Date().toISOString() };
};
