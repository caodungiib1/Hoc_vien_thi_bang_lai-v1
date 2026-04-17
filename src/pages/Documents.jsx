import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportCsv } from '../services/exportService';
import {
  getDocumentRecords,
  getDocumentSummary,
  getDocumentTypes,
  resetDocumentRecordsToDefault,
  updateDocumentStatus,
} from '../services/documentService';

const FILTERS = ['Tất cả', 'Đủ hồ sơ', 'Còn thiếu', 'Chờ bổ sung', 'Cần kiểm tra'];

const statusBadge = {
  'Đủ hồ sơ': 'green',
  'Còn thiếu': 'red',
  'Chờ bổ sung': 'orange',
  'Cần kiểm tra': 'blue',
};

const DOCUMENT_STATUS_OPTIONS = ['Đã nhận', 'Đã cập nhật', 'Đã nhận bản sao', 'Chờ bổ sung', 'Chưa nộp'];

const getDefaultDocumentKey = (record, documentTypes) => (
  record?.documents.find((document) => ['red', 'orange'].includes(document.tone))?.key
  || record?.documents[0]?.key
  || documentTypes[0]?.key
  || ''
);

const getDocumentTone = (status) => {
  if (status.includes('Chưa')) return 'red';
  if (status.includes('Chờ')) return 'orange';
  if (status.includes('Đã')) return 'green';
  return 'blue';
};

const getCurrentDate = () => new Date().toLocaleDateString('vi-VN');

const resolveOverallStatus = (documents, record) => {
  const missingCount = documents.filter((document) => document.tone === 'red').length;
  const pendingCount = documents.filter((document) => document.tone === 'orange').length;

  if (missingCount > 0) return { label: 'Còn thiếu', tone: 'red' };
  if (pendingCount > 0) return { label: 'Chờ bổ sung', tone: 'orange' };
  if (record.studentStatus === 'Mới đăng ký' || record.studentStatus === 'Chờ khám sức khỏe') {
    return { label: 'Cần kiểm tra', tone: 'blue' };
  }

  return { label: 'Đủ hồ sơ', tone: 'green' };
};

const buildSummaryFromRecords = (records) => ({
  total: records.length,
  completed: records.filter((record) => record.overallStatus === 'Đủ hồ sơ').length,
  missing: records.filter((record) => record.overallStatus === 'Còn thiếu').length,
  pending: records.filter((record) => record.overallStatus === 'Chờ bổ sung').length,
  needReview: records.filter((record) => record.overallStatus === 'Cần kiểm tra').length,
});

const StatCard = ({ label, value, sub, tone, icon }) => (
  <div className="stat-card-small">
    <div className={`stat-icon ${tone}`}>
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="document-stat-sub">{sub}</span>}
    </div>
  </div>
);

const DocumentStatusPill = ({ document }) => (
  <div className={`document-pill ${document.tone}`}>
    <span className="document-pill-label">{document.label}</span>
    <span className="document-pill-status">{document.status}</span>
  </div>
);

const UpdateDocumentModal = ({ records, documentTypes, initialRecord, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    studentId: initialRecord?.studentId ? String(initialRecord.studentId) : String(records[0]?.studentId || ''),
    documentKey: getDefaultDocumentKey(initialRecord || records[0], documentTypes),
    status: 'Đã nhận',
    note: '',
  });
  const [error, setError] = useState('');
  const selectedRecord = records.find((record) => String(record.studentId) === String(form.studentId));
  const availableDocuments = selectedRecord?.documents || documentTypes;

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleStudentChange = (studentId) => {
    const nextRecord = records.find((record) => String(record.studentId) === String(studentId));
    setForm(prev => ({
      ...prev,
      studentId,
      documentKey: getDefaultDocumentKey(nextRecord, documentTypes),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.studentId) return setError('Vui lòng chọn học viên cần cập nhật.');
    if (!form.documentKey) return setError('Vui lòng chọn loại giấy tờ cần cập nhật.');

    const updatedDocument = await updateDocumentStatus(form.studentId, form.documentKey, {
      status: form.status,
      note: form.note.trim(),
    });

    onUpdated(updatedDocument);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">+ Cập nhật hồ sơ</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="admin-form-group">
            <label className="admin-label">Học viên</label>
            <select
              className="settings-input"
              value={form.studentId}
              onChange={event => handleStudentChange(event.target.value)}
            >
              {records.map((record) => (
                <option key={record.studentId} value={record.studentId}>
                  {record.name} - {record.licenseType}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Loại giấy tờ</label>
              <select
                className="settings-input"
                value={form.documentKey}
                onChange={event => set('documentKey', event.target.value)}
              >
                {availableDocuments.map((document) => (
                  <option key={document.key} value={document.key}>
                    {document.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Trạng thái mới</label>
              <select
                className="settings-input"
                value={form.status}
                onChange={event => set('status', event.target.value)}
              >
                {DOCUMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedRecord && (
            <div className="modal-helper-text">
              Hồ sơ hiện tại: {selectedRecord.overallStatus} - phụ trách {selectedRecord.consultant}.
            </div>
          )}
          <div className="admin-form-group">
            <label className="admin-label">Ghi chú sau cập nhật</label>
            <textarea
              className="settings-input settings-textarea"
              value={form.note}
              onChange={event => set('note', event.target.value)}
              placeholder="VD: Đã nhận CCCD bản rõ, chờ kiểm tra lại giấy khám sức khỏe."
              rows={3}
            />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu cập nhật</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── UploadFileModal ──────────────────────────────────────────────────────
const UploadFileModal = ({ records, documentTypes, onClose, onUploaded }) => {
  const [studentId, setStudentId] = useState(String(records[0]?.studentId || ''));
  const [docKey, setDocKey]       = useState(documentTypes[0]?.key || '');
  const [fileName, setFileName]   = useState('');
  const [error, setError]         = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId) return setError('Vui lòng chọn học viên.');
    if (!fileName)  return setError('Vui lòng chọn file.');
    onUploaded(Number(studentId), docKey, { name: fileName });
    onClose();
  };

  const selectedRec = records.find((r) => String(r.studentId) === studentId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📎 Upload giấy tờ học viên</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="admin-form-group">
            <label className="admin-label">Học viên *</label>
            <select className="settings-input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {records.map((r) => (
                <option key={r.studentId} value={r.studentId}>{r.name} — {r.licenseType}</option>
              ))}
            </select>
          </div>
          {selectedRec && (
            <div className="modal-helper-text" style={{ marginBottom: '12px' }}>
              Tình trạng: {selectedRec.overallStatus} — {selectedRec.missingCount} mục cần xử lý
            </div>
          )}
          <div className="admin-form-group">
            <label className="admin-label">Loại giấy tờ *</label>
            <select className="settings-input" value={docKey} onChange={(e) => setDocKey(e.target.value)}>
              {documentTypes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Chọn file *</label>
            <input
              type="file" accept="image/*,.pdf" onChange={handleFile}
              style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-primary)' }}
            />
            {fileName && (
              <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                📎 {fileName}
              </div>
            )}
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ⚠️ File được lưu local (mock). Kết nối cloud storage ở giai đoạn sau.
            </div>
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">📎 Xác nhận đính kèm</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Documents = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    total: 0, completed: 0, missing: 0, pending: 0, needReview: 0,
  });
  const [documentTypes, setDocumentTypes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [_uploadedFiles, setUploadedFiles] = useState({});   // { studentId_docKey: fileName }
  const [remindMsg, setRemindMsg] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([getDocumentRecords(), getDocumentSummary(), getDocumentTypes()]).then(
      ([documentRecords, documentSummary, types]) => {
        if (!mounted) return;
        setRecords(documentRecords);
        setSummary(documentSummary);
        setDocumentTypes(types);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRecords = activeFilter === 'Tất cả'
    ? records
    : records.filter((record) => record.overallStatus === activeFilter);

  const filterCount = (filter) => (
    filter === 'Tất cả'
      ? records.length
      : records.filter((record) => record.overallStatus === filter).length
  );

  const openUpdateModal = (record = null) => {
    setSelectedRecord(record);
    setShowUpdateModal(true);
  };

  const handleUpdatedDocument = (updatedDocument) => {
    setRecords(prev => {
      const today = getCurrentDate();
      const nextRecords = prev.map((record) => {
        if (record.studentId !== Number(updatedDocument.studentId)) return record;

        const documents = record.documents.map((document) => {
          if (document.key !== updatedDocument.documentKey) return document;

          const tone = getDocumentTone(updatedDocument.status);

          return {
            ...document,
            status: updatedDocument.status,
            tone,
            fileName: tone === 'green' ? `${document.key}-${record.studentId}.pdf` : document.fileName,
            updatedAt: today,
          };
        });
        const overall = resolveOverallStatus(documents, record);
        const missingCount = documents.filter((document) => ['red', 'orange'].includes(document.tone)).length;

        return {
          ...record,
          documents,
          overallStatus: overall.label,
          overallTone: overall.tone,
          missingCount,
          updatedAt: today,
          note: updatedDocument.note || (
            missingCount > 0
              ? `Cần bổ sung ${missingCount} giấy tờ trước khi xếp lịch thi.`
              : 'Hồ sơ đã sẵn sàng chuyển qua bước đào tạo / sát hạch.'
          ),
        };
      });

      setSummary(buildSummaryFromRecords(nextRecords));
      return nextRecords;
    });

    setSuccessMessage('Đã cập nhật tình trạng hồ sơ.');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const handleResetDocuments = async () => {
    const documentRecords = await resetDocumentRecordsToDefault();
    const documentSummary = await getDocumentSummary();

    setRecords(documentRecords);
    setSummary(documentSummary);
    setActiveFilter('Tất cả');
    setSelectedRecord(null);
    setSuccessMessage('Đã khôi phục dữ liệu hồ sơ mẫu.');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const handleExportDocuments = () => {
    exportCsv({
      fileName: 'danh-sach-ho-so-hoc-vien',
      columns: [
        { label: 'Học viên', value: (record) => record.name },
        { label: 'Số điện thoại', value: (record) => record.phone },
        { label: 'Hạng bằng', value: (record) => record.licenseType },
        { label: 'Khu vực', value: (record) => record.region },
        { label: 'Trạng thái hồ sơ', value: (record) => record.overallStatus },
        { label: 'Số mục cần xử lý', value: (record) => record.missingCount },
        { label: 'Giấy tờ', value: (record) => record.documents.map((document) => `${document.label}: ${document.status}`).join('; ') },
        { label: 'Phụ trách', value: (record) => record.consultant },
        { label: 'Cập nhật', value: (record) => record.updatedAt },
        { label: 'Ghi chú', value: (record) => record.note },
      ],
      rows: filteredRecords,
    });
  };

  // Upload file giả lập
  const handleFileUpload = (studentId, docKey, file) => {
    const key = `${studentId}_${docKey}`;
    setUploadedFiles((prev) => ({ ...prev, [key]: file.name }));
    setSuccessMessage(`📎 Đã đính kèm ${file.name} cho học viên.`);
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  // Mock nhắc nhở
  const handleRemind = (record) => {
    setRemindMsg(`✓ Đã gửi nhắc nhở đến ${record.name} về việc bổ sung hồ sơ còn thiếu!`);
    setTimeout(() => setRemindMsg(''), 2600);
  };

  // Danh sách HV còn thiếu hồ sơ (ít nhất 1 giấy tờ 'Chưa nộp')
  const missingRecords = records.filter((r) =>
    r.documents?.some((d) => d.tone === 'red')
  );

  return (
    <div>
      {showUpdateModal && (
        <UpdateDocumentModal
          records={records}
          documentTypes={documentTypes}
          initialRecord={selectedRecord}
          onClose={() => setShowUpdateModal(false)}
          onUpdated={handleUpdatedDocument}
        />
      )}
      {showUploadModal && (
        <UploadFileModal
          records={records}
          documentTypes={documentTypes}
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleFileUpload}
        />
      )}

      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Hồ sơ học viên</h1>
          <span className="page-subtitle">
            Theo dõi CCCD, giấy khám sức khỏe, ảnh thẻ và đơn đăng ký của từng học viên.
          </span>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button compact" onClick={handleExportDocuments}>↓ Xuất danh sách</button>
          <button type="button" className="secondary-button compact" onClick={handleResetDocuments}>Khôi phục mẫu</button>
          <button type="button" className="secondary-button" onClick={() => setShowUploadModal(true)}>📎 Upload hồ sơ</button>
          <button type="button" className="btn-primary" onClick={() => openUpdateModal()}>+ Cập nhật hồ sơ</button>
        </div>
      </div>

      {successMessage && <div className="page-success-message">{successMessage}</div>}
      {remindMsg && (
        <div style={{ background: 'var(--tone-blue-bg)', color: 'var(--accent-primary)', fontWeight: 600, padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.875rem' }}>
          {remindMsg}
        </div>
      )}

      {/* Banner cảnh báo thiếu hồ sơ */}
      {missingRecords.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '14px 18px', marginBottom: '20px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '8px', fontSize: '0.875rem' }}>
              {missingRecords.length} học viên chưa nộp đủ giấy tờ
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {missingRecords.map((r) => {
                const missing = r.documents.filter((d) => d.tone === 'red').map((d) => d.label).join(', ');
                return (
                  <div key={r.id} style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem' }}>
                    <strong>{r.name}</strong>
                    <span style={{ color: '#ef4444', marginLeft: '6px' }}>— {missing}</span>
                    <button
                      className="secondary-button compact"
                      style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px' }}
                      onClick={() => handleRemind(r)}
                    >
                      Nhắc nhở
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-stat-grid">
        <StatCard
          label="Tổng hồ sơ"
          value={summary.total}
          sub={`${documentTypes.length} loại giấy tờ`}
          tone="pu"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <StatCard
          label="Đủ hồ sơ"
          value={summary.completed}
          sub="Có thể chuyển đào tạo"
          tone="gr"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          label="Còn thiếu"
          value={summary.missing}
          sub="Cần xử lý trước"
          tone="re"
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
        <StatCard
          label="Chờ bổ sung"
          value={summary.pending}
          sub="Đã báo học viên"
          tone="or"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          label="Cần kiểm tra"
          value={summary.needReview}
          sub="Mới tiếp nhận"
          tone="bl"
          icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
        />
      </div>

      <div className="table-card document-overview-card">
        <div className="table-card-header">
          <div>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <span>Danh mục giấy tờ cần theo dõi</span>
          </div>
          <span className="badge neutral">{documentTypes.length} loại</span>
        </div>
        <div className="document-type-grid">
          {documentTypes.map((type) => (
            <div key={type.key} className="document-type-card">
              <span className="document-type-icon">✓</span>
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Tình trạng hồ sơ theo học viên</span>
          </div>
          <span className="badge neutral">{filteredRecords.length} hồ sơ</span>
        </div>

        <div className="fees-tabs document-tabs">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`fees-tab-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
              <span className="fees-tab-count">{filterCount(filter)}</span>
            </button>
          ))}
        </div>

        <div className="table-container document-table-container">
          <table className="data-table document-table">
            <thead>
              <tr>
                <th>HỌC VIÊN</th>
                <th>HẠNG</th>
                <th>TRẠNG THÁI HỒ SƠ</th>
                <th>GIẤY TỜ</th>
                <th>PHỤ TRÁCH</th>
                <th>GHI CHÚ</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <Link to={`/students/${record.studentId}`} className="table-link table-title">
                      {record.name}
                    </Link>
                    <div className="detail-list-meta">{record.phone} • {record.region}</div>
                  </td>
                  <td><span className="badge pu">{record.licenseType}</span></td>
                  <td>
                    <span className={`badge ${statusBadge[record.overallStatus] || record.overallTone}`}>
                      {record.overallStatus}
                    </span>
                    {record.missingCount > 0 && (
                      <div className="document-warning-text">{record.missingCount} mục cần xử lý</div>
                    )}
                  </td>
                  <td>
                    <div className="document-pill-grid">
                      {record.documents.map((document) => (
                        <DocumentStatusPill key={document.key} document={document} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="table-title">{record.consultant}</div>
                    <div className="detail-list-meta">Cập nhật: {record.updatedAt}</div>
                  </td>
                  <td className="document-note-cell">{record.note}</td>
                  <td>
                    <div className="document-action-group">
                      <Link to={`/students/${record.studentId}`} className="secondary-button compact table-action-link">
                        Mở hồ sơ
                      </Link>
                      <button type="button" className="btn-table-action" onClick={() => openUpdateModal(record)}>Cập nhật</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;
