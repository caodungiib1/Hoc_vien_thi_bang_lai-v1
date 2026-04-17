import {
  mockExamBatches,
  mockUnscheduledStudents,
} from '../data/mockExams';
import { getUserScopedKey, readStorage, writeStorage } from './storageService';

const clone = (value) => JSON.parse(JSON.stringify(value));
const EXAM_BASE_KEY = 'examBatches.v1';

const getStoredExamBatches = () => readStorage(getUserScopedKey(EXAM_BASE_KEY), mockExamBatches);

const saveStoredExamBatches = (batches) => writeStorage(getUserScopedKey(EXAM_BASE_KEY), batches);

const getAssignedStudentIds = (batches) => new Set(
  batches.flatMap((batch) => batch.students?.map((student) => student.id) || []),
);

const buildExamSummary = (batches, unscheduledStudents) => ({
  totalBatches: batches.length,
  upcomingBatches: batches.filter((batch) => batch.status !== 'Hoàn tất').length,
  assignedStudents: batches.reduce((sum, batch) => sum + batch.studentCount, 0),
  unassignedStudents: unscheduledStudents.length,
  retakeStudents: batches
    .flatMap((batch) => batch.students || [])
    .filter((student) => student.status === 'Thi lại').length,
});

export const getExamSummary = async () => {
  const batches = getStoredExamBatches();
  const unscheduledStudents = await getUnscheduledStudents();

  return buildExamSummary(batches, unscheduledStudents);
};

export const getExamBatches = async (status = 'Tất cả') => {
  const storedBatches = getStoredExamBatches();
  const batches = status === 'Tất cả'
    ? storedBatches
    : storedBatches.filter((batch) => batch.status === status);

  return clone(batches);
};

export const getExamBatchById = async (id) => {
  const batch = getStoredExamBatches().find((item) => item.id === id);
  return batch ? clone(batch) : null;
};

export const getUnscheduledStudents = async () => {
  const assignedStudentIds = getAssignedStudentIds(getStoredExamBatches());
  const students = mockUnscheduledStudents.filter((student) => !assignedStudentIds.has(student.id));

  return clone(students);
};

export const createExamBatch = async (payload) => {
  const selectedStudents = (payload.students || []).map((student) => ({
    id: student.id,
    name: student.name,
    phone: student.phone,
    licenseType: student.licenseType,
    status: student.status,
    statusTone: student.statusTone,
    tuitionDebt: student.tuitionDebt || '0',
    theory: student.theory || '',
    practical: student.practical || '',
    consultant: student.consultant,
  }));
  const createdBatch = {
    id: `exam-${Date.now()}`,
    name: payload.name,
    date: payload.date,
    time: payload.time,
    location: payload.location,
    type: payload.type,
    licenseType: payload.licenseType,
    status: payload.status,
    statusTone: payload.statusTone,
    note: payload.note,
    studentIds: selectedStudents.map((student) => student.id),
    students: selectedStudents,
    studentCount: selectedStudents.length,
  };

  saveStoredExamBatches([createdBatch, ...getStoredExamBatches()]);
  return clone(createdBatch);
};

export const assignStudentToExam = async (batchId, studentId) => ({
  batchId,
  studentId: Number(studentId),
  assignedAt: new Date().toISOString(),
});

export const updateExamResult = async (studentId, result) => {
  const normalizedStudentId = Number(studentId);
  const updatedResult = {
    studentId: normalizedStudentId,
    theory: result.theory || '',
    practical: result.practical || '',
    updatedAt: new Date().toISOString(),
  };
  const nextBatches = getStoredExamBatches().map((batch) => ({
    ...batch,
    students: (batch.students || []).map((student) => (
      student.id === normalizedStudentId
        ? { ...student, theory: updatedResult.theory, practical: updatedResult.practical }
        : student
    )),
  }));

  saveStoredExamBatches(nextBatches);
  return clone(updatedResult);
};
