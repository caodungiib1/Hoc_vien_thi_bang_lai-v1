import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  getDocumentRecordByStudentId,
  getDocumentTypes,
  updateDocumentStatus,
  uploadDocumentFile,
} from '../services/documentService';
import { collectFee, getFeeRecordByStudentId } from '../services/feeService';
import { getStudentById, updateStudent } from '../services/studentService';

const LICENSE_TYPES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C', 'D', 'E', 'F'];
const STATUSES = [
  'Mới đăng ký', 'Chờ khám sức khỏe', 'Đã khám sức khỏe', 'Chờ nộp hồ sơ',
  'Đã nộp hồ sơ', 'Đang học', 'Chờ thi', 'Đã xếp lịch thi',
  'Đã đỗ', 'Thi lại', 'Tạm dừng', 'Hủy', 'Còn nợ học phí', 'Hoàn tất',
];
const PAYMENT_METHODS = ['Tiền mặt', 'Chuyển khoản', 'Thẻ ngân hàng'];
const DOCUMENT_STATUS_OPTIONS = ['Đã nhận', 'Đã cập nhật', 'Đã nhận bản sao', 'Chờ bổ sung', 'Chưa nộp'];
const DETAIL_TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'fees', label: 'Học phí' },
  { id: 'documents', label: 'Hồ sơ' },
];

const BADGE = {
  'Mới đăng ký': 'blue',
  'Chờ khám sức khỏe': 'orange',
  'Đã khám sức khỏe': 'orange',
  'Chờ nộp hồ sơ': 'or',
  'Đã nộp hồ sơ': 'green',
  'Đang học': 'purple',
  'Chờ thi': 'neutral',
  'Đã xếp lịch thi': 'blue',
  'Đã đỗ': 'green',
  'Thi lại': 'red',
  'Tạm dừng': 'neutral',
  'Hủy': 'red',
  'Còn nợ học phí': 'orange',
  'Hoàn tất': 'green',
};

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return Number(String(value).replace(/\D/g, '')) || 0;
};

const fmtCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(toNumber(value))}đ`;

const parseDateValue = (value) => {
  if (!value) return new Date(0);
  const [day, month, year] = String(value).split('/');
  return new Date(year, month - 1, day);
};

const getFeeStatusBadge = (status) => {
  switch (status) {
    case 'Đã đóng đủ':
      return { cls: 'green', label: 'Đã đóng đủ' };
    case 'Quá hạn':
      return { cls: 'red', label: 'Quá hạn' };
    case 'Còn nợ':
      return { cls: 'orange', label: 'Còn nợ' };
    case 'Đóng một phần':
      return { cls: 'blue', label: 'Đóng 1 phần' };
    default:
      return { cls: 'neutral', label: status || 'Chưa xác định' };
  }
};

const getDefaultDocumentKey = (record, documentTypes) => (
  record?.documents.find((document) => ['red', 'orange'].includes(document.tone))?.key
  || record?.documents[0]?.key
  || documentTypes[0]?.key
  || ''
);

const summaryItems = (student, feeRecord) => [
  { label: 'Hạng bằng', value: student.licenseType, caption: student.packageName },
  { label: 'Ngày đăng ký', value: student.registerDate, caption: `Lớp ${student.className}` },
  {
    label: 'Công nợ',
    value: fmtCurrency(feeRecord?.debt ?? student.tuition?.debt),
    caption: `Đã thu ${fmtCurrency(feeRecord?.paid ?? student.tuition?.paid)}`,
  },
  { label: 'Lịch thi dự kiến', value: student.exam.expectedDate, caption: student.exam.batch },
];

const EditField = ({ label, name, value, onChange, type = 'text', options = null, wide = false }) => (
  <div className={`detail-field${wide ? ' detail-field-wide' : ''}`}>
    <span className="detail-field-label">{label}</span>
    {options ? (
      <select
        className="settings-input"
        style={{ fontSize: '0.85rem', padding: '5px 8px', marginTop: '2px' }}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    ) : (
      <input
        type={type}
        className="settings-input"
        style={{ fontSize: '0.85rem', padding: '5px 8px', marginTop: '2px' }}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    )}
  </div>
);

const PrintReceiptModal = ({ student, feeRecord, onClose }) => {
  if (!student || !feeRecord) return null;
  const today = new Date().toLocaleDateString('vi-VN');

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=600,height=700');
    win.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Phiếu thu học phí — ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #000; }
          h2 { text-align: center; text-transform: uppercase; margin-bottom: 4px; font-size: 16px; }
          .subtitle { text-align: center; font-size: 12px; margin-bottom: 24px; color: #555; }
          .divider { border-top: 1px solid #ccc; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
          .label { color: #555; }
          .value { font-weight: bold; }
          .total-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 15px; font-weight: bold; }
          .debt-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; color: #d00; font-weight: bold; }
          .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 12px; }
          .sign-box { text-align: center; }
          .sign-box div { margin-top: 48px; border-top: 1px solid #000; padding-top: 4px; font-size: 12px; }
          @media print { button { display: none !important; } body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h2>Trung tâm Đào tạo Lái xe</h2>
        <div class="subtitle">PHIẾU THU HỌC PHÍ</div>
        <div class="divider"></div>
        <div class="row"><span class="label">Học viên:</span><span class="value">${student.name}</span></div>
        <div class="row"><span class="label">Số điện thoại:</span><span>${student.phone}</span></div>
        <div class="row"><span class="label">Hạng bằng:</span><span class="value">${student.licenseType}</span></div>
        <div class="row"><span class="label">Ngày lập phiếu:</span><span>${today}</span></div>
        <div class="divider"></div>
        <div class="total-row"><span>Tổng học phí:</span><span>${fmtCurrency(feeRecord.totalFee)}</span></div>
        <div class="row"><span class="label">Đã thanh toán:</span><span style="color:#197a3b;font-weight:bold">${fmtCurrency(feeRecord.paid)}</span></div>
        ${feeRecord.debt > 0 ? `<div class="debt-row"><span>Còn nợ:</span><span>${fmtCurrency(feeRecord.debt)}</span></div>` : '<div class="row"><span class="label">Còn nợ:</span><span style="color:#197a3b">— Đã thu đủ —</span></div>'}
        ${feeRecord.dueDate ? `<div class="row"><span class="label">Hạn đóng tiếp theo:</span><span>${feeRecord.dueDate}</span></div>` : ''}
        <div class="divider"></div>
        <div class="footer">
          <div class="sign-box">
            <em>Học viên xác nhận</em>
            <div>${student.name}</div>
          </div>
          <div class="sign-box">
            <em>Kế toán / Nhân viên thu</em>
            <div>${feeRecord.payments?.[feeRecord.payments.length - 1]?.collector || 'Người thu tiền'}</div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🖨️ In phiếu thu học phí</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div
            style={{
              background: 'var(--bg-surface-strong)',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
              fontSize: '0.83rem',
            }}
          >
            <div style={{ fontWeight: 800, textAlign: 'center', fontSize: '0.9rem', marginBottom: '2px' }}>
              TRUNG TÂM ĐÀO TẠO LÁI XE
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '14px', fontSize: '0.78rem' }}>
              PHIẾU THU HỌC PHÍ • {today}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Học viên:</span>
              <strong>{student.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hạng bằng:</span>
              <strong>{student.licenseType}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tổng học phí:</span>
              <strong>{fmtCurrency(feeRecord.totalFee)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Đã thanh toán:</span>
              <strong style={{ color: 'var(--success)' }}>{fmtCurrency(feeRecord.paid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Còn nợ:</span>
              <strong style={{ color: feeRecord.debt > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {feeRecord.debt > 0 ? fmtCurrency(feeRecord.debt) : '— Đã thu đủ —'}
              </strong>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Phiếu thu sẽ mở trong tab mới và in tự động.
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Đóng</button>
            <button type="button" className="btn-primary" onClick={handlePrint}>Mở & In phiếu</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollectFeeModal = ({ student, feeRecord, onClose, onSave }) => {
  const [form, setForm] = useState({
    amount: '',
    method: 'Tiền mặt',
    collector: student?.consultant || 'Admin',
    note: '',
  });
  const [error, setError] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(String(form.amount).replace(/\D/g, ''));
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    onSave({
      amount,
      method: form.method,
      collector: form.collector,
      note: form.note,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">💰 Ghi nhận thu tiền</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="fees-collect-info">
            <span>Học viên: <strong>{student.name}</strong></span>
            <span>Tổng HP: <strong>{fmtCurrency(feeRecord?.totalFee)}</strong></span>
            <span>Đã đóng: <strong style={{ color: 'var(--success)' }}>{fmtCurrency(feeRecord?.paid)}</strong></span>
            <span>
              Còn nợ:{' '}
              <strong style={{ color: toNumber(feeRecord?.debt) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {toNumber(feeRecord?.debt) > 0 ? fmtCurrency(feeRecord?.debt) : 'Đã thu đủ'}
              </strong>
            </span>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Số tiền thu *</label>
              <input className="settings-input" placeholder="VD: 5000000" value={form.amount} onChange={(event) => set('amount', event.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Hình thức thanh toán</label>
              <select className="settings-input" value={form.method} onChange={(event) => set('method', event.target.value)}>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Người thu tiền</label>
              <input className="settings-input" value={form.collector} onChange={(event) => set('collector', event.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Ghi chú</label>
              <input className="settings-input" placeholder="Ghi chú tùy ý..." value={form.note} onChange={(event) => set('note', event.target.value)} />
            </div>
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Xác nhận thu tiền</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateDocumentModal = ({ record, documentTypes, onClose, onSave }) => {
  const [form, setForm] = useState({
    documentKey: getDefaultDocumentKey(record, documentTypes),
    status: 'Đã nhận',
    note: '',
  });
  const [error, setError] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.documentKey) {
      setError('Vui lòng chọn loại giấy tờ cần cập nhật.');
      return;
    }

    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">+ Cập nhật hồ sơ</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-helper-text" style={{ marginBottom: '12px' }}>
            Hồ sơ hiện tại: {record?.overallStatus || 'Chưa xác định'} - phụ trách {record?.consultant || 'Chưa gán'}.
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Loại giấy tờ</label>
              <select className="settings-input" value={form.documentKey} onChange={(event) => set('documentKey', event.target.value)}>
                {(record?.documents || documentTypes).map((document) => (
                  <option key={document.key} value={document.key}>{document.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Trạng thái mới</label>
              <select className="settings-input" value={form.status} onChange={(event) => set('status', event.target.value)}>
                {DOCUMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Ghi chú sau cập nhật</label>
            <textarea
              className="settings-input settings-textarea"
              value={form.note}
              onChange={(event) => set('note', event.target.value)}
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

const UploadDocumentModal = ({ record, documentTypes, onClose, onSave }) => {
  const [documentKey, setDocumentKey] = useState(getDefaultDocumentKey(record, documentTypes));
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!documentKey) {
      setError('Vui lòng chọn loại giấy tờ.');
      return;
    }
    if (!fileName) {
      setError('Vui lòng chọn file.');
      return;
    }

    onSave({ documentKey, file: { name: fileName } });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📎 Đính kèm hồ sơ</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-helper-text" style={{ marginBottom: '12px' }}>
            Học viên: <strong>{record?.name}</strong> - {record?.licenseType}
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Loại giấy tờ *</label>
            <select className="settings-input" value={documentKey} onChange={(event) => setDocumentKey(event.target.value)}>
              {(record?.documents || documentTypes).map((document) => (
                <option key={document.key} value={document.key}>{document.label}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Chọn file *</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFile}
              style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-primary)' }}
            />
            {fileName && (
              <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                📎 {fileName}
              </div>
            )}
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              File được lưu local dạng mock để theo dõi trong hồ sơ học viên.
            </div>
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Xác nhận đính kèm</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentState, setStudentState] = useState({ id: null, profile: null });
  const [feeRecord, setFeeRecord] = useState(null);
  const [documentRecord, setDocumentRecord] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [panelMsg, setPanelMsg] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showUpdateDocumentModal, setShowUpdateDocumentModal] = useState(false);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);

  const activeTab = DETAIL_TABS.some((tab) => tab.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'overview';

  const setActiveTab = (tabId) => {
    if (tabId === 'overview') {
      setSearchParams({});
      return;
    }
    setSearchParams({ tab: tabId });
  };

  const refreshStudentPanels = async () => {
    const [profile, nextFeeRecord, nextDocumentRecord, nextDocumentTypes] = await Promise.all([
      getStudentById(id),
      getFeeRecordByStudentId(id),
      getDocumentRecordByStudentId(id),
      getDocumentTypes(),
    ]);

    setStudentState({ id, profile });
    setFeeRecord(nextFeeRecord);
    setDocumentRecord(nextDocumentRecord);
    setDocumentTypes(nextDocumentTypes);
  };

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getStudentById(id),
      getFeeRecordByStudentId(id),
      getDocumentRecordByStudentId(id),
      getDocumentTypes(),
    ]).then(([profile, nextFeeRecord, nextDocumentRecord, nextDocumentTypes]) => {
      if (!mounted) return;
      setStudentState({ id, profile });
      setFeeRecord(nextFeeRecord);
      setDocumentRecord(nextDocumentRecord);
      setDocumentTypes(nextDocumentTypes);
    });

    return () => {
      mounted = false;
    };
  }, [id]);

  const student = studentState.profile;
  const isLoading = studentState.id !== id;

  const paymentHistory = useMemo(
    () => [...(feeRecord?.payments || [])].sort((left, right) => parseDateValue(right.date) - parseDateValue(left.date)),
    [feeRecord],
  );

  const latestPayment = paymentHistory[0] || null;
  const feeBadge = getFeeStatusBadge(feeRecord?.paymentStatus);

  const flashMessage = (message, setter = setPanelMsg) => {
    setter(message);
    window.clearTimeout(flashMessage.timer);
    flashMessage.timer = window.setTimeout(() => setter(''), 2800);
  };

  const handleEditStart = () => {
    setEditForm({
      name: student.name,
      phone: student.phone,
      email: student.email,
      birthDate: student.birthDate,
      gender: student.gender,
      cccd: student.cccd,
      address: student.address,
      emergencyContact: student.emergencyContact,
      licenseType: student.licenseType,
      status: student.status,
      consultant: student.consultant,
      referredBy: student.referredBy,
    });
    setEditMode(true);
  };

  const handleFieldChange = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateStudent(id, editForm);
      setStudentState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updated },
      }));
      const [nextFeeRecord, nextDocumentRecord] = await Promise.all([
        getFeeRecordByStudentId(id),
        getDocumentRecordByStudentId(id),
      ]);
      setFeeRecord(nextFeeRecord);
      setDocumentRecord(nextDocumentRecord);
      setEditMode(false);
      flashMessage('✓ Đã lưu thay đổi thành công!', setSaveMsg);
    } catch {
      flashMessage('✕ Lưu thất bại, vui lòng thử lại.', setSaveMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditForm({});
  };

  const handleCollectFee = async (payload) => {
    await collectFee(id, payload);
    await refreshStudentPanels();
    setShowCollectModal(false);
    flashMessage('Đã ghi nhận thu tiền cho học viên.');
  };

  const handleUpdateDocument = async (payload) => {
    await updateDocumentStatus(id, payload.documentKey, {
      status: payload.status,
      note: payload.note.trim(),
    });
    await refreshStudentPanels();
    setShowUpdateDocumentModal(false);
    flashMessage('Đã cập nhật hồ sơ học viên.');
  };

  const handleUploadDocument = async ({ documentKey, file }) => {
    await uploadDocumentFile(id, documentKey, file);
    await refreshStudentPanels();
    setShowUploadDocumentModal(false);
    flashMessage('Đã đính kèm file hồ sơ.');
  };

  if (isLoading) {
    return (
      <div className="table-card detail-card">
        <div className="page-title-block">
          <Link to="/students" className="back-link"><span>←</span><span>Quay lại danh sách học viên</span></Link>
          <h1 className="page-title">Đang tải hồ sơ học viên</h1>
          <span className="page-subtitle">Hệ thống đang lấy dữ liệu chi tiết...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="table-card detail-card">
        <div className="page-title-block">
          <Link to="/students" className="back-link"><span>←</span><span>Quay lại danh sách học viên</span></Link>
          <h1 className="page-title">Không tìm thấy học viên</h1>
          <span className="page-subtitle">Mã học viên bạn truy cập không tồn tại trong dữ liệu hiện tại.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showCollectModal && (
        <CollectFeeModal
          student={student}
          feeRecord={feeRecord}
          onClose={() => setShowCollectModal(false)}
          onSave={handleCollectFee}
        />
      )}
      {showPrintModal && (
        <PrintReceiptModal
          student={student}
          feeRecord={feeRecord}
          onClose={() => setShowPrintModal(false)}
        />
      )}
      {showUpdateDocumentModal && (
        <UpdateDocumentModal
          record={documentRecord}
          documentTypes={documentTypes}
          onClose={() => setShowUpdateDocumentModal(false)}
          onSave={handleUpdateDocument}
        />
      )}
      {showUploadDocumentModal && (
        <UploadDocumentModal
          record={documentRecord}
          documentTypes={documentTypes}
          onClose={() => setShowUploadDocumentModal(false)}
          onSave={handleUploadDocument}
        />
      )}

      <section className="detail-hero-card">
      <div className="page-header detail-hero-top">
        <div className="page-title-block detail-hero-main">
          <Link to="/students" className="back-link"><span>←</span><span>Quay lại danh sách học viên</span></Link>
          <h1 className="page-title">{editMode ? editForm.name || student.name : student.name}</h1>
          <span className="page-subtitle">
            {student.packageName} • Nhân viên phụ trách: {student.consultant}
          </span>
        </div>
        <div className="page-actions detail-hero-side">
          <span className={`badge ${BADGE[student.status] || 'neutral'}`}>{student.status}</span>
          <span className="badge neutral">Mã HV #{student.id}</span>
          {!editMode ? (
            <button className="secondary-button" type="button" onClick={handleEditStart}>✎ Chỉnh sửa</button>
          ) : (
            <>
              <button className="secondary-button" type="button" onClick={handleCancel} disabled={saving}>Hủy</button>
              <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : '✓ Lưu thay đổi'}
              </button>
            </>
          )}
        </div>
      </div>

      {saveMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: saveMsg.startsWith('✓') ? 'var(--tone-green-bg)' : 'var(--tone-red-bg)',
            color: saveMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          {saveMsg}
        </div>
      )}

      {panelMsg && <div className="page-success-message">{panelMsg}</div>}

      <div className="detail-summary-grid detail-summary-grid-five">
        {summaryItems(student, feeRecord).map((item) => (
          <div key={item.label} className="stat-card-small detail-summary-card">
            <span className="detail-summary-label">{item.label}</span>
            <span className="detail-summary-value">{item.value}</span>
            <span className="detail-summary-caption">{item.caption}</span>
          </div>
        ))}
        <div className="stat-card-small detail-summary-card">
          <span className="detail-summary-label">Số lần thi</span>
          <span className="detail-summary-value" style={{ color: student.exam.attempt?.includes('2') ? '#ef4444' : 'var(--accent-primary)' }}>
            {student.exam.attempt || '—'}
          </span>
          <span className="detail-summary-caption">
            {student.exam.theory} / {student.exam.practical}
          </span>
        </div>
      </div>
      </section>

      <div className="tabs-container" style={{ marginBottom: '18px' }}>
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="detail-page-grid">
          <div className="detail-stack">
            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Thông tin cá nhân</div>
                {editMode && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    ✎ Đang chỉnh sửa
                  </span>
                )}
              </div>
              <div className="detail-info-grid">
                {editMode ? (
                  <>
                    <EditField label="Họ và tên" name="name" value={editForm.name} onChange={handleFieldChange} />
                    <EditField label="Số điện thoại" name="phone" value={editForm.phone} onChange={handleFieldChange} />
                    <EditField label="Email" name="email" value={editForm.email} onChange={handleFieldChange} type="email" />
                    <EditField label="Ngày sinh" name="birthDate" value={editForm.birthDate} onChange={handleFieldChange} />
                    <EditField label="Giới tính" name="gender" value={editForm.gender} onChange={handleFieldChange} options={['Nam', 'Nữ', 'Khác']} />
                    <EditField label="CCCD" name="cccd" value={editForm.cccd} onChange={handleFieldChange} />
                    <EditField label="Địa chỉ" name="address" value={editForm.address} onChange={handleFieldChange} wide />
                    <EditField label="Liên hệ khẩn cấp" name="emergencyContact" value={editForm.emergencyContact} onChange={handleFieldChange} wide />
                  </>
                ) : (
                  <>
                    <div className="detail-field"><span className="detail-field-label">Số điện thoại</span><span className="detail-field-value">{student.phone}</span></div>
                    <div className="detail-field"><span className="detail-field-label">Email</span><span className="detail-field-value">{student.email}</span></div>
                    <div className="detail-field"><span className="detail-field-label">Ngày sinh</span><span className="detail-field-value">{student.birthDate}</span></div>
                    <div className="detail-field"><span className="detail-field-label">Giới tính</span><span className="detail-field-value">{student.gender}</span></div>
                    <div className="detail-field"><span className="detail-field-label">CCCD</span><span className="detail-field-value">{student.cccd}</span></div>
                    <div className="detail-field"><span className="detail-field-label">Người giới thiệu</span><span className="detail-field-value">{student.referredBy}</span></div>
                    <div className="detail-field detail-field-wide"><span className="detail-field-label">Địa chỉ</span><span className="detail-field-value">{student.address}</span></div>
                    <div className="detail-field detail-field-wide"><span className="detail-field-label">Liên hệ khẩn cấp</span><span className="detail-field-value">{student.emergencyContact}</span></div>
                  </>
                )}
              </div>
            </section>

            {editMode && (
              <section className="table-card detail-card">
                <div className="detail-card-header">
                  <div className="detail-card-title">Thông tin khóa học</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>✎ Đang chỉnh sửa</span>
                </div>
                <div className="detail-info-grid">
                  <EditField label="Hạng bằng" name="licenseType" value={editForm.licenseType} onChange={handleFieldChange} options={LICENSE_TYPES} />
                  <EditField label="Trạng thái" name="status" value={editForm.status} onChange={handleFieldChange} options={STATUSES} />
                  <EditField label="Nhân viên phụ trách" name="consultant" value={editForm.consultant} onChange={handleFieldChange} />
                  <EditField label="Người giới thiệu" name="referredBy" value={editForm.referredBy} onChange={handleFieldChange} />
                </div>
              </section>
            )}

            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Lịch học và lịch thi</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Link to="/classes" className="secondary-button compact table-action-link">Mở lớp học</Link>
                  <Link to="/exams" className="secondary-button compact table-action-link">Mở lịch thi</Link>
                </div>
              </div>
              <div className="detail-list">
                {student.schedule.map((item) => (
                  <div key={item.title} className="detail-list-item">
                    <div>
                      <div className="detail-list-title">{item.title}</div>
                      <div className="detail-list-meta">{item.time}</div>
                    </div>
                    <div className="detail-list-value">
                      <div>{item.value}</div>
                      <div className="detail-list-meta">{item.location}</div>
                    </div>
                  </div>
                ))}
                <div className="detail-list-item">
                  <div>
                    <div className="detail-list-title">{student.exam.batch}</div>
                    <div className="detail-list-meta">{student.exam.location}</div>
                  </div>
                  <div className="detail-list-value">
                    <div>{student.exam.expectedDate}</div>
                    <div className="detail-list-meta">
                      <span className={`badge ${student.exam.attempt?.includes('2') ? 'red' : 'blue'}`} style={{ fontSize: '0.7rem' }}>
                        {student.exam.attempt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Ghi chú nội bộ</div>
              </div>
              <div className="detail-note-list">
                {student.notes.map((note) => (
                  <div key={note} className="detail-note">{note}</div>
                ))}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Hồ sơ và sức khỏe</div>
                <button type="button" className="secondary-button compact table-action-link" onClick={() => setActiveTab('documents')}>
                  Mở tab hồ sơ
                </button>
              </div>
              <div className="detail-list">
                {(documentRecord?.documents || []).map((document) => (
                  <div key={document.key} className="detail-list-item">
                    <div>
                      <div className="detail-list-title">{document.label}</div>
                      <div className="detail-list-meta">{document.fileName}</div>
                    </div>
                    <div className="detail-list-value">
                      <span className={`badge ${document.tone}`}>{document.status}</span>
                      <div className="detail-list-meta">{document.updatedAt}</div>
                    </div>
                  </div>
                ))}
                <div className="detail-list-item">
                  <div>
                    <div className="detail-list-title">{student.healthCheck.status}</div>
                    <div className="detail-list-meta">{student.healthCheck.clinic}</div>
                  </div>
                  <div className="detail-list-value">
                    <div>{student.healthCheck.appointment}</div>
                    <div className="detail-list-meta">{student.healthCheck.result}</div>
                  </div>
                </div>
              </div>
              <div className="detail-inline-note">{documentRecord?.note || student.healthCheck.note}</div>
            </section>

            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Học phí và khóa học</div>
                <button type="button" className="secondary-button compact table-action-link" onClick={() => setActiveTab('fees')}>
                  Mở tab học phí
                </button>
              </div>
              <div className="detail-info-grid">
                <div className="detail-field"><span className="detail-field-label">Tổng học phí</span><span className="detail-field-value">{fmtCurrency(feeRecord?.totalFee ?? student.tuition.total)}</span></div>
                <div className="detail-field"><span className="detail-field-label">Đã thanh toán</span><span className="detail-field-value" style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtCurrency(feeRecord?.paid ?? student.tuition.paid)}</span></div>
                <div className="detail-field">
                  <span className="detail-field-label">Công nợ còn lại</span>
                  <span className="detail-field-value" style={{ color: toNumber(feeRecord?.debt ?? student.tuition.debt) === 0 ? 'var(--success)' : '#ef4444', fontWeight: 700 }}>
                    {toNumber(feeRecord?.debt ?? student.tuition.debt) === 0 ? '✓ Đã thu đủ' : fmtCurrency(feeRecord?.debt ?? student.tuition.debt)}
                  </span>
                </div>
                <div className="detail-field"><span className="detail-field-label">Hạn đóng tiếp theo</span><span className="detail-field-value">{feeRecord?.dueDate || student.tuition.deadline || '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Hình thức thanh toán gần nhất</span><span className="detail-field-value">{latestPayment?.method || student.tuition.paymentMethod || '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Người thu tiền gần nhất</span><span className="detail-field-value">{latestPayment?.collector || student.tuition.collector || '—'}</span></div>
              </div>
            </section>

            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Lịch sử chăm sóc</div>
              </div>
              <div className="timeline">
                {student.careHistory.map((item) => (
                  <div key={`${item.time}-${item.title}`} className="timeline-item">
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-text">{item.description}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="detail-page-grid">
          <div className="detail-stack">
            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Tổng quan học phí</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="secondary-button compact" onClick={() => setShowPrintModal(true)} disabled={!feeRecord}>
                    In phiếu
                  </button>
                  <button type="button" className="btn-primary" onClick={() => setShowCollectModal(true)} disabled={!feeRecord}>
                    Ghi nhận thu tiền
                  </button>
                </div>
              </div>
              <div className="detail-info-grid">
                <div className="detail-field"><span className="detail-field-label">Tổng học phí</span><span className="detail-field-value">{fmtCurrency(feeRecord?.totalFee)}</span></div>
                <div className="detail-field"><span className="detail-field-label">Đã thanh toán</span><span className="detail-field-value" style={{ color: 'var(--success)' }}>{fmtCurrency(feeRecord?.paid)}</span></div>
                <div className="detail-field"><span className="detail-field-label">Công nợ còn lại</span><span className="detail-field-value" style={{ color: toNumber(feeRecord?.debt) > 0 ? 'var(--danger)' : 'var(--success)' }}>{toNumber(feeRecord?.debt) > 0 ? fmtCurrency(feeRecord?.debt) : 'Đã thu đủ'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Trạng thái</span><span className="detail-field-value"><span className={`badge ${feeBadge.cls}`}>{feeBadge.label}</span></span></div>
                <div className="detail-field"><span className="detail-field-label">Hạn đóng tiếp theo</span><span className="detail-field-value">{feeRecord?.dueDate || '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Người thu gần nhất</span><span className="detail-field-value">{latestPayment?.collector || student.tuition.collector || '—'}</span></div>
              </div>
              {toNumber(feeRecord?.debt) > 0 && (
                <div className="detail-inline-note">
                  Học viên đang còn nợ {fmtCurrency(feeRecord?.debt)}. Bạn có thể ghi nhận thu tiền trực tiếp ngay trong tab này.
                </div>
              )}
            </section>

            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Lịch sử giao dịch</div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {paymentHistory.length} giao dịch
                </span>
              </div>
              <div className="detail-list">
                {paymentHistory.length > 0 ? paymentHistory.map((payment) => (
                  <div key={payment.id} className="detail-list-item">
                    <div>
                      <div className="detail-list-title">{fmtCurrency(payment.amount)}</div>
                      <div className="detail-list-meta">{payment.date} • {payment.method}</div>
                    </div>
                    <div className="detail-list-value">
                      <div>{payment.collector}</div>
                      <div className="detail-list-meta">{payment.note || 'Không có ghi chú'}</div>
                    </div>
                  </div>
                )) : (
                  <div className="detail-inline-note">Chưa có giao dịch nào cho học viên này.</div>
                )}
              </div>
            </section>
          </div>

        </div>
      )}

      {activeTab === 'documents' && (
        <div className="detail-page-grid">
          <div className="detail-stack">
            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Tình trạng hồ sơ</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="secondary-button compact" onClick={() => setShowUploadDocumentModal(true)} disabled={!documentRecord}>
                    Đính kèm hồ sơ
                  </button>
                  <button type="button" className="btn-primary" onClick={() => setShowUpdateDocumentModal(true)} disabled={!documentRecord}>
                    Cập nhật trạng thái
                  </button>
                </div>
              </div>
              <div className="detail-info-grid">
                <div className="detail-field"><span className="detail-field-label">Trạng thái tổng</span><span className="detail-field-value"><span className={`badge ${documentRecord?.overallTone || 'neutral'}`}>{documentRecord?.overallStatus || 'Chưa có dữ liệu'}</span></span></div>
                <div className="detail-field"><span className="detail-field-label">Số mục cần xử lý</span><span className="detail-field-value">{documentRecord?.missingCount || 0} mục</span></div>
                <div className="detail-field"><span className="detail-field-label">Nhân viên phụ trách</span><span className="detail-field-value">{documentRecord?.consultant || student.consultant}</span></div>
                <div className="detail-field"><span className="detail-field-label">Cập nhật gần nhất</span><span className="detail-field-value">{documentRecord?.updatedAt || '—'}</span></div>
              </div>
              <div className="detail-inline-note">{documentRecord?.note || 'Chưa có ghi chú hồ sơ.'}</div>
            </section>

            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Danh mục giấy tờ</div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {(documentRecord?.documents || []).length} mục
                </span>
              </div>
              <div className="document-pill-grid">
                {(documentRecord?.documents || []).map((document) => (
                  <div key={document.key} className={`document-pill ${document.tone}`}>
                    <span className="document-pill-label">{document.label}</span>
                    <span className="document-pill-status">{document.status}</span>
                    <span className="detail-list-meta" style={{ marginTop: '6px' }}>{document.fileName}</span>
                    <span className="detail-list-meta">Cập nhật: {document.updatedAt}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Sức khỏe và kiểm tra</div>
              </div>
              <div className="detail-list">
                <div className="detail-list-item">
                  <div>
                    <div className="detail-list-title">{student.healthCheck.status}</div>
                    <div className="detail-list-meta">{student.healthCheck.clinic}</div>
                  </div>
                  <div className="detail-list-value">
                    <div>{student.healthCheck.appointment}</div>
                    <div className="detail-list-meta">{student.healthCheck.result}</div>
                  </div>
                </div>
              </div>
              <div className="detail-inline-note">{student.healthCheck.note}</div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
