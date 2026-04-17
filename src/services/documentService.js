import { mockStudentProfiles } from '../data/mockStudentProfiles';
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

const buildOverallStatus = (documents, student) => {
  const missingCount = documents.filter((document) => document.tone === 'red').length;
  const pendingCount = documents.filter((document) => document.tone === 'orange').length;

  if (missingCount > 0) {
    return { label: 'Còn thiếu', tone: 'red' };
  }

  if (pendingCount > 0) {
    return { label: 'Chờ bổ sung', tone: 'orange' };
  }

  if (student.status === 'Mới đăng ký' || student.status === 'Chờ khám sức khỏe') {
    return { label: 'Cần kiểm tra', tone: 'blue' };
  }

  return { label: 'Đủ hồ sơ', tone: 'green' };
};

const buildDocumentRecord = (student) => {
  const documents = student.documents.map((document) => normalizeDocument(student, document));
  const overall = buildOverallStatus(documents, student);
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

const documentRecords = mockStudentProfiles.map(buildDocumentRecord);

const getStoredDocumentRecords = () => readStorage(getUserScopedKey(DOCUMENT_BASE_KEY), documentRecords);

const saveStoredDocumentRecords = (records) => writeStorage(getUserScopedKey(DOCUMENT_BASE_KEY), records);

const getDocumentTone = (status) => {
  if (status.includes('Chưa')) return 'red';
  if (status.includes('Chờ')) return 'orange';
  if (status.includes('Đã')) return 'green';
  return 'blue';
};

const getCurrentDate = () => new Date().toLocaleDateString('vi-VN');

const buildOverallStatusFromRecord = (documents, record) => {
  const missingCount = documents.filter((document) => document.tone === 'red').length;
  const pendingCount = documents.filter((document) => document.tone === 'orange').length;

  if (missingCount > 0) return { label: 'Còn thiếu', tone: 'red' };
  if (pendingCount > 0) return { label: 'Chờ bổ sung', tone: 'orange' };
  if (record.studentStatus === 'Mới đăng ký' || record.studentStatus === 'Chờ khám sức khỏe') {
    return { label: 'Cần kiểm tra', tone: 'blue' };
  }

  return { label: 'Đủ hồ sơ', tone: 'green' };
};

const buildDocumentSummary = (records) => ({
  total: records.length,
  completed: records.filter((record) => record.overallStatus === 'Đủ hồ sơ').length,
  missing: records.filter((record) => record.overallStatus === 'Còn thiếu').length,
  pending: records.filter((record) => record.overallStatus === 'Chờ bổ sung').length,
  needReview: records.filter((record) => record.overallStatus === 'Cần kiểm tra').length,
});

export const getDocumentTypes = async () => clone(DOCUMENT_TYPES);

export const getDocumentRecords = async (status = 'Tất cả') => {
  const storedRecords = getStoredDocumentRecords();
  const records = status === 'Tất cả'
    ? storedRecords
    : storedRecords.filter((record) => record.overallStatus === status);

  return clone(records);
};

export const getDocumentRecordByStudentId = async (studentId) => {
  const record = getStoredDocumentRecords().find((item) => item.studentId === Number(studentId));
  return record ? clone(record) : null;
};

export const getDocumentSummary = async () => {
  return buildDocumentSummary(getStoredDocumentRecords());
};

export const updateDocumentStatus = async (studentId, documentKey, payload) => {
  const normalizedStudentId = Number(studentId);
  const today = getCurrentDate();
  const updatedDocument = {
    studentId: normalizedStudentId,
    documentKey,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  const nextRecords = getStoredDocumentRecords().map((record) => {
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

export const resetDocumentRecordsToDefault = async () => {
  removeStorage(getUserScopedKey(DOCUMENT_BASE_KEY));
  return clone(documentRecords);
};
