import { mockStudentProfiles } from '../data/mockStudentProfiles';
import { getStudentById, getStudentProfiles } from './studentService';
import { getUserScopedKey, readStorage, removeStorage, writeStorage } from './storageService';

const clone = (value) => JSON.parse(JSON.stringify(value));
const DOCUMENT_BASE_KEY = 'documents.v1';

const DOC_KEYS = {
  CCCD: 'cccd',
  'Ảnh thẻ': 'portrait',
  'Giấy khám sức khỏe': 'health',
  'Đơn đăng ký': 'registration',
};

const DOCUMENT_TYPES = [
  { key: 'cccd', label: 'CCCD' },
  { key: 'portrait', label: 'Ảnh thẻ' },
  { key: 'health', label: 'Giấy khám sức khỏe' },
  { key: 'registration', label: 'Đơn đăng ký' },
];

const getCurrentDate = () => new Date().toLocaleDateString('vi-VN');

const normalizeDocument = (student, document) => {
  const key = DOC_KEYS[document.label] || document.label.toLowerCase().replace(/\s+/g, '-');
  const isMissing = document.value.includes('Chưa') || document.value.includes('Chờ');

  return {
    key,
    label: document.label,
    status: document.value,
    tone: isMissing ? (document.value.includes('Chưa') ? 'red' : 'orange') : document.tone,
    fileName: isMissing ? 'Chưa có file' : `${key}-${student.id}.pdf`,
    updatedAt: isMissing ? 'Chờ cập nhật' : student.registerDate,
  };
};

const buildOverallStatus = (documents, studentStatus) => {
  const missingCount = documents.filter((document) => document.tone === 'red').length;
  const pendingCount = documents.filter((document) => document.tone === 'orange').length;

  if (missingCount > 0) return { label: 'Còn thiếu', tone: 'red' };
  if (pendingCount > 0) return { label: 'Chờ bổ sung', tone: 'orange' };
  if (studentStatus === 'Mới đăng ký' || studentStatus === 'Chờ khám sức khỏe') {
    return { label: 'Cần kiểm tra', tone: 'blue' };
  }

  return { label: 'Đủ hồ sơ', tone: 'green' };
};

const buildDocumentRecord = (student) => {
  const documents = (student.documents || []).map((document) => normalizeDocument(student, document));
  const overall = buildOverallStatus(documents, student.status);
  const missingCount = documents.filter((document) => ['red', 'orange'].includes(document.tone)).length;

  return {
    id: student.id,
    studentId: student.id,
    name: student.name,
    phone: student.phone,
    licenseType: student.licenseType,
    region: student.region,
    studentStatus: student.status,
    studentStatusTone: student.statusTone,
    consultant: student.consultant,
    updatedAt: student.registerDate,
    overallStatus: overall.label,
    overallTone: overall.tone,
    missingCount,
    documents,
    healthCheck: student.healthCheck,
    note: missingCount > 0
      ? `Cần bổ sung ${missingCount} giấy tờ trước khi xếp lịch thi.`
      : 'Hồ sơ đã sẵn sàng chuyển qua bước đào tạo / sát hạch.',
  };
};

const defaultDocumentRecords = mockStudentProfiles.map(buildDocumentRecord);

const getStoredDocumentRecords = () => readStorage(getUserScopedKey(DOCUMENT_BASE_KEY), defaultDocumentRecords);
const saveStoredDocumentRecords = (records) => writeStorage(getUserScopedKey(DOCUMENT_BASE_KEY), records);

const getDocumentTone = (status) => {
  if (status.includes('Chưa')) return 'red';
  if (status.includes('Chờ')) return 'orange';
  if (status.includes('Đã')) return 'green';
  return 'blue';
};

const buildOverallStatusFromRecord = (documents, record) => buildOverallStatus(documents, record.studentStatus);

const buildDocumentSummary = (records) => ({
  total: records.length,
  completed: records.filter((record) => record.overallStatus === 'Đủ hồ sơ').length,
  missing: records.filter((record) => record.overallStatus === 'Còn thiếu').length,
  pending: records.filter((record) => record.overallStatus === 'Chờ bổ sung').length,
  needReview: records.filter((record) => record.overallStatus === 'Cần kiểm tra').length,
});

const syncDocumentRecordWithStudent = (record, student) => {
  const documents = (record.documents || []).map((document) => ({
    ...document,
    label: document.label || DOCUMENT_TYPES.find((type) => type.key === document.key)?.label || document.key,
  }));
  const overall = buildOverallStatus(documents, student.status);
  const missingCount = documents.filter((document) => ['red', 'orange'].includes(document.tone)).length;

  return {
    ...record,
    id: student.id,
    studentId: student.id,
    name: student.name,
    phone: student.phone,
    licenseType: student.licenseType,
    region: student.region,
    studentStatus: student.status,
    studentStatusTone: student.statusTone,
    consultant: student.consultant,
    healthCheck: student.healthCheck,
    overallStatus: overall.label,
    overallTone: overall.tone,
    missingCount,
    note: record.note || (
      missingCount > 0
        ? `Cần bổ sung ${missingCount} giấy tờ trước khi xếp lịch thi.`
        : 'Hồ sơ đã sẵn sàng chuyển qua bước đào tạo / sát hạch.'
    ),
  };
};

const syncDocumentRecordsWithStudents = async () => {
  const students = await getStudentProfiles();
  const stored = getStoredDocumentRecords();
  const recordMap = new Map(stored.map((record) => [record.studentId, record]));

  const nextRecords = students.map((student) => {
    const existing = recordMap.get(student.id);
    return existing ? syncDocumentRecordWithStudent(existing, student) : buildDocumentRecord(student);
  });

  if (JSON.stringify(nextRecords) !== JSON.stringify(stored)) {
    saveStoredDocumentRecords(nextRecords);
  }

  return nextRecords;
};

export const getDocumentTypes = async () => clone(DOCUMENT_TYPES);

export const getDocumentRecords = async (status = 'Tất cả') => {
  const records = await syncDocumentRecordsWithStudents();
  if (status === 'Tất cả') return clone(records);
  return clone(records.filter((record) => record.overallStatus === status));
};

export const getDocumentRecordByStudentId = async (studentId) => {
  const records = await syncDocumentRecordsWithStudents();
  const record = records.find((item) => item.studentId === Number(studentId));
  return record ? clone(record) : null;
};

export const getDocumentSummary = async () => {
  return buildDocumentSummary(await syncDocumentRecordsWithStudents());
};

export const updateDocumentStatus = async (studentId, documentKey, payload) => {
  const normalizedStudentId = Number(studentId);
  let records = await syncDocumentRecordsWithStudents();

  if (!records.some((record) => record.studentId === normalizedStudentId)) {
    const student = await getStudentById(studentId);
    if (!student) return null;
    records = [...records, buildDocumentRecord(student)];
  }

  const today = getCurrentDate();
  const updatedDocument = {
    studentId: normalizedStudentId,
    documentKey,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  const nextRecords = records.map((record) => {
    if (record.studentId !== normalizedStudentId) return record;

    const documents = record.documents.map((document) => {
      if (document.key !== documentKey) return document;

      const tone = getDocumentTone(payload.status);
      return {
        ...document,
        status: payload.status,
        tone,
        fileName: tone === 'green' ? `${document.key}-${record.studentId}.pdf` : document.fileName,
        updatedAt: today,
      };
    });

    const overall = buildOverallStatusFromRecord(documents, record);
    const missingCount = documents.filter((document) => ['red', 'orange'].includes(document.tone)).length;

    return {
      ...record,
      documents,
      overallStatus: overall.label,
      overallTone: overall.tone,
      missingCount,
      updatedAt: today,
      note: payload.note || (
        missingCount > 0
          ? `Cần bổ sung ${missingCount} giấy tờ trước khi xếp lịch thi.`
          : 'Hồ sơ đã sẵn sàng chuyển qua bước đào tạo / sát hạch.'
      ),
    };
  });

  saveStoredDocumentRecords(nextRecords);
  return clone(updatedDocument);
};

export const uploadDocumentFile = async (studentId, documentKey, file) => {
  const normalizedStudentId = Number(studentId);
  let records = await syncDocumentRecordsWithStudents();

  if (!records.some((record) => record.studentId === normalizedStudentId)) {
    const student = await getStudentById(studentId);
    if (!student) return null;
    records = [...records, buildDocumentRecord(student)];
  }

  const today = getCurrentDate();
  const nextRecords = records.map((record) => {
    if (record.studentId !== normalizedStudentId) return record;

    const documents = record.documents.map((document) => {
      if (document.key !== documentKey) return document;
      const nextStatus = ['Chưa nộp', 'Chờ bổ sung'].some((text) => document.status.includes(text))
        ? 'Đã nhận bản sao'
        : document.status;

      return {
        ...document,
        status: nextStatus,
        tone: getDocumentTone(nextStatus),
        fileName: file.name,
        updatedAt: today,
      };
    });

    const overall = buildOverallStatusFromRecord(documents, record);
    const missingCount = documents.filter((document) => ['red', 'orange'].includes(document.tone)).length;

    return {
      ...record,
      documents,
      overallStatus: overall.label,
      overallTone: overall.tone,
      missingCount,
      updatedAt: today,
      note: missingCount > 0
        ? `Cần bổ sung ${missingCount} giấy tờ trước khi xếp lịch thi.`
        : 'Hồ sơ đã sẵn sàng chuyển qua bước đào tạo / sát hạch.',
    };
  });

  saveStoredDocumentRecords(nextRecords);
  return clone({ studentId: normalizedStudentId, documentKey, fileName: file.name, updatedAt: today });
};

export const resetDocumentRecordsToDefault = async () => {
  removeStorage(getUserScopedKey(DOCUMENT_BASE_KEY));
  return clone(defaultDocumentRecords);
};
