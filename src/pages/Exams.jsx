import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import { buildPathForCurrentUser } from '../services/orgRouteService';
import {
  createExamBatch,
  getExamBatches,
  getExamSummary,
  getUnscheduledStudents,
  updateExamResult,
} from '../services/examService';
import { exportXlsx } from '../services/exportService';

const LICENSE_TYPES = ['A1', 'A2', 'B1', 'B2', 'B1/B2', 'C'];
const EXAM_TYPES = ['Thi sát hạch', 'Thi nâng hạng', 'Thi lại', 'Thi lý thuyết', 'Thi thực hành'];
const EXAM_STATUSES = [
  { label: 'Dự kiến',             tone: 'purple' },
  { label: 'Chờ duyệt',           tone: 'neutral' },
  { label: 'Đang chốt danh sách', tone: 'orange' },
  { label: 'Đã xác nhận',         tone: 'blue' },
];
const EMPTY_EXAM_FORM = {
  name: '', date: '', time: '', location: '',
  type: 'Thi sát hạch', licenseType: 'B2', status: 'Dự kiến', note: '',
};

const formatInputDate = (value) => {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

// ─── Modal nhập kết quả ───────────────────────────────────────────────────────
const ResultModal = ({ student, onClose, onSave }) => {
  const [lt, setLt] = useState(student.theory || '');
  const [th, setTh] = useState(student.practical || '');

  const handleSave = (e) => {
    e.preventDefault();
    onSave(student.id, lt, th);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📝 Nhập kết quả thi</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave} className="modal-body">
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{student.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Hạng bằng: <strong>{student.licenseType}</strong>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Kết quả Lý thuyết</label>
              <select className="settings-input" value={lt} onChange={(e) => setLt(e.target.value)}>
                <option value="">— Chưa có —</option>
                <option value="✓ Đỗ">✓ Đỗ</option>
                <option value="✗ Trượt">✗ Trượt</option>
                <option value="Vắng">Vắng</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Kết quả Thực hành</label>
              <select className="settings-input" value={th} onChange={(e) => setTh(e.target.value)}>
                <option value="">— Chưa có —</option>
                <option value="✓ Đỗ">✓ Đỗ</option>
                <option value="✗ Trượt">✗ Trượt</option>
                <option value="Vắng">Vắng</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu kết quả</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal chuyển học viên sang đợt thi khác ─────────────────────────────────
const TransferModal = ({ student, currentBatchId, batches, onClose, onTransfer }) => {
  const [targetId, setTargetId] = useState('');
  const available = batches.filter((b) => b.id !== currentBatchId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetId) return;
    onTransfer(student.id, currentBatchId, targetId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">↔ Chuyển học viên sang đợt thi khác</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 700 }}>{student.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Hạng {student.licenseType} • {student.phone}
            </div>
          </div>
          <div className="admin-form-group" style={{ marginBottom: '16px' }}>
            <label className="admin-label">Chọn đợt thi mới *</label>
            <select className="settings-input" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">— Chọn đợt thi —</option>
              {available.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.date} ({b.licenseType})
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Không có đợt thi nào khác để chuyển.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={!targetId || available.length === 0}>
              ↔ Xác nhận chuyển đợt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal gửi thông báo lịch thi ────────────────────────────────────────────
const NotifyModal = ({ batch, onClose }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const content =
    `📅 THÔNG BÁO LỊCH THI\n\n` +
    `Kính gửi Quý học viên,\n\n` +
    `Trung tâm xin thông báo lịch thi như sau:\n` +
    `• Đợt thi  : ${batch?.name}\n` +
    `• Hạng bằng: ${batch?.licenseType}\n` +
    `• Ngày thi : ${batch?.date}\n` +
    `• Giờ thi  : ${batch?.time}\n` +
    `• Địa điểm : ${batch?.location}\n\n` +
    `Quý học viên vui lòng có mặt trước 30 phút để làm thủ tục.\n` +
    `Mang theo CCCD gốc và các giấy tờ liên quan.\n\n` +
    `Trân trọng,\nBan Quản lý Trung tâm`;

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📣 Gửi thông báo lịch thi</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Thông báo sẽ gửi đến <strong>{batch?.studentCount} học viên</strong> trong đợt thi qua các kênh đã cấu hình.
          </div>
          <div style={{
            background: 'var(--bg-surface-strong)', borderRadius: '8px', padding: '14px 16px',
            fontSize: '0.8rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            fontFamily: 'monospace', color: 'var(--text-primary)',
            marginBottom: '12px', border: '1px solid var(--border-color)',
          }}>
            {content}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            ⚠️ Kết nối Zalo/SMS/Email thật sẽ được tích hợp ở giai đoạn tiếp theo.
          </div>
          {sent && (
            <div style={{
              background: 'var(--tone-green-bg)', color: 'var(--success)', fontWeight: 600,
              padding: '10px 14px', borderRadius: '6px', marginBottom: '8px',
            }}>
              ✓ Đã ghi nhận yêu cầu gửi thông báo đến {batch?.studentCount} học viên!
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Đóng</button>
            {!sent && (
              <button type="button" className="btn-primary" onClick={handleSend} disabled={sending}>
                {sending ? 'Đang xử lý...' : `📣 Gửi cho ${batch?.studentCount} học viên`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Modal tạo đợt thi ────────────────────────────────────────────────────────
const CreateExamBatchModal = ({ unscheduledStudents, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_EXAM_FORM);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const candidateStudents = unscheduledStudents.filter((student) => (
    form.licenseType === 'B1/B2'
      ? ['B1', 'B2'].includes(student.licenseType)
      : student.licenseType === form.licenseType
  ));

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => (
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    ));
  };

  const handleLicenseChange = (licenseType) => {
    set('licenseType', licenseType);
    setSelectedStudentIds([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Vui lòng nhập tên đợt thi.');
    if (!form.date) return setError('Vui lòng chọn ngày thi.');
    if (!form.time) return setError('Vui lòng nhập giờ thi.');
    if (!form.location.trim()) return setError('Vui lòng nhập địa điểm thi.');

    const statusMeta = EXAM_STATUSES.find((item) => item.label === form.status) || EXAM_STATUSES[0];
    const selectedStudents = unscheduledStudents.filter((s) => selectedStudentIds.includes(s.id));
    const createdBatch = await createExamBatch({
      ...form,
      name: form.name.trim(),
      date: formatInputDate(form.date),
      location: form.location.trim(),
      note: form.note.trim() || 'Đợt thi mới tạo, cần chốt danh sách và thông báo học viên trước ngày thi.',
      statusTone: statusMeta.tone,
      students: selectedStudents,
    });
    onCreated(createdBatch);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">+ Tạo đợt thi</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Tên đợt thi *</label>
              <input className="settings-input" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="VD: Đợt thi B2 - Tháng 5/2026" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Hạng bằng</label>
              <select className="settings-input" value={form.licenseType} onChange={(event) => handleLicenseChange(event.target.value)}>
                {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Ngày thi *</label>
              <input className="settings-input" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Giờ thi *</label>
              <input className="settings-input" type="time" value={form.time} onChange={(event) => set('time', event.target.value)} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Loại thi</label>
              <select className="settings-input" value={form.type} onChange={(event) => set('type', event.target.value)}>
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Trạng thái</label>
              <select className="settings-input" value={form.status} onChange={(event) => set('status', event.target.value)}>
                {EXAM_STATUSES.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Địa điểm thi *</label>
            <input className="settings-input" value={form.location} onChange={(event) => set('location', event.target.value)} placeholder="VD: Trung tâm sát hạch Quận 12" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Ghi chú</label>
            <textarea className="settings-input settings-textarea" value={form.note} onChange={(event) => set('note', event.target.value)} placeholder="Ghi chú về giờ tập trung, hồ sơ cần chuẩn bị..." rows={3} />
          </div>
          <div className="settings-section-title">Chọn học viên chưa có lịch thi</div>
          <div className="modal-helper-text">Đang hiển thị học viên hạng {form.licenseType}. Có thể tạo đợt thi trước rồi bổ sung học viên sau.</div>
          <div className="exam-student-picker">
            {candidateStudents.length === 0 ? (
              <div className="empty-state-inline">Không còn học viên chưa có lịch cho hạng bằng này.</div>
            ) : candidateStudents.map((student) => (
              <label key={student.id} className="exam-student-option">
                <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                <span>
                  <strong>{student.name}</strong>
                  <small>{student.phone} • {student.region} • dự kiến {student.expectedExam}</small>
                </span>
              </label>
            ))}
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu đợt thi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const buildSummaryCards = (summary) => [
  { value: summary.upcomingBatches, label: 'Đợt thi sắp tới', tone: 'pu', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { value: summary.assignedStudents, label: 'Học viên đã xếp lịch', tone: 'bl', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { value: summary.unassignedStudents, label: 'Chưa có lịch thi', tone: 'or', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: summary.retakeStudents, label: 'Học viên thi lại', tone: 're', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
];

// ─── Exams Page ───────────────────────────────────────────────────────────────
const Exams = () => {
  const [examBatches, setExamBatches]             = useState([]);
  const [unscheduledStudents, setUnscheduledStudents] = useState([]);
  const [summary, setSummary]                     = useState({ upcomingBatches: 0, assignedStudents: 0, unassignedStudents: 0, retakeStudents: 0 });
  const [selectedBatchId, setSelectedBatchId]     = useState(null);
  const [results, setResults]                     = useState({});
  const [modalStudent, setModalStudent]           = useState(null);    // ResultModal
  const [transferData, setTransferData]           = useState(null);    // TransferModal: { student, batchId }
  const [showNotify, setShowNotify]               = useState(false);   // NotifyModal
  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [successMessage, setSuccessMessage]       = useState('');
  const summaryCards = buildSummaryCards(summary);

  useEffect(() => {
    let mounted = true;
    Promise.all([getExamBatches(), getUnscheduledStudents(), getExamSummary()]).then(([batches, students, examStats]) => {
      if (!mounted) return;
      setExamBatches(batches);
      setUnscheduledStudents(students);
      setSummary(examStats);
      setSelectedBatchId((current) => current || batches[0]?.id || null);
    });
    return () => { mounted = false; };
  }, []);

  const selectedBatch = useMemo(
    () => examBatches.find((batch) => batch.id === selectedBatchId) || examBatches[0],
    [examBatches, selectedBatchId],
  );
  const batchPagination = usePagination(examBatches, {
    initialPageSize: 6,
    pageSizeOptions: [6, 12, 24],
  });
  const batchStudentPagination = usePagination(selectedBatch?.students || [], {
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
    resetDeps: [selectedBatch?.id],
  });
  const unscheduledPagination = usePagination(unscheduledStudents, {
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const saveResult = async (studentId, lt, th) => {
    await updateExamResult(studentId, { theory: lt, practical: th });
    setResults((prev) => ({ ...prev, [studentId]: { lt, th } }));
    setExamBatches((prev) => prev.map((batch) => ({
      ...batch,
      students: batch.students.map((student) => (
        student.id === studentId ? { ...student, theory: lt, practical: th } : student
      )),
    })));
  };

  const handleCreatedBatch = (createdBatch) => {
    const assignedIds = new Set(createdBatch.studentIds);
    setExamBatches((prev) => [createdBatch, ...prev]);
    setSelectedBatchId(createdBatch.id);
    setUnscheduledStudents((prev) => prev.filter((s) => !assignedIds.has(s.id)));
    setSummary((prev) => ({
      ...prev,
      totalBatches: (prev.totalBatches || examBatches.length) + 1,
      upcomingBatches: prev.upcomingBatches + (createdBatch.status !== 'Hoàn tất' ? 1 : 0),
      assignedStudents: prev.assignedStudents + createdBatch.studentCount,
      unassignedStudents: Math.max(0, prev.unassignedStudents - createdBatch.studentCount),
      retakeStudents: prev.retakeStudents + createdBatch.students.filter((s) => s.status === 'Thi lại').length,
    }));
    setSuccessMessage(`Đã tạo đợt thi "${createdBatch.name}".`);
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  // Chuyển học viên sang đợt thi khác
  const handleTransfer = (studentId, fromBatchId, toBatchId) => {
    setExamBatches((prev) => {
      const fromBatch = prev.find((b) => b.id === fromBatchId);
      const student   = fromBatch?.students.find((s) => s.id === studentId);
      if (!student) return prev;

      return prev.map((batch) => {
        if (batch.id === fromBatchId) {
          return {
            ...batch,
            students: batch.students.filter((s) => s.id !== studentId),
            studentCount: Math.max(0, batch.studentCount - 1),
          };
        }
        if (String(batch.id) === String(toBatchId)) {
          return {
            ...batch,
            students: [...batch.students, student],
            studentCount: batch.studentCount + 1,
          };
        }
        return batch;
      });
    });
    setSuccessMessage('Đã chuyển học viên sang đợt thi mới.');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  // Xuất Excel danh sách dự thi
  const handleExportBatch = () => {
    if (!selectedBatch) return;
    exportXlsx({
      fileName: `danh-sach-du-thi-${selectedBatch.name}`,
      sheetName: 'Danh sách dự thi',
      columns: [
        { label: 'Họ và tên',       value: (s) => s.name },
        { label: 'Số điện thoại',   value: (s) => s.phone },
        { label: 'Hạng bằng',       value: (s) => s.licenseType },
        { label: 'Khu vực',         value: (s) => s.region || '' },
        { label: 'Kết quả LT',      value: (s) => s.theory || 'Chưa thi' },
        { label: 'Kết quả TH',      value: (s) => s.practical || 'Chưa thi' },
        { label: 'Công nợ',         value: (s) => s.tuitionDebt || '0' },
      ],
      rows: selectedBatch.students || [],
    });
  };

  const getResultBadge = (val) => {
    if (!val) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>;
    if (val.includes('Đỗ'))    return <span className="badge green"   style={{ fontSize: '0.7rem' }}>{val}</span>;
    if (val.includes('Trượt')) return <span className="badge red"     style={{ fontSize: '0.7rem' }}>{val}</span>;
    return <span className="badge neutral" style={{ fontSize: '0.7rem' }}>{val}</span>;
  };

  return (
    <>
      <div>
        {/* ── Modals ── */}
        {showCreateModal && (
          <CreateExamBatchModal
            unscheduledStudents={unscheduledStudents}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleCreatedBatch}
          />
        )}
        {modalStudent && (
          <ResultModal
            student={modalStudent}
            onClose={() => setModalStudent(null)}
            onSave={saveResult}
          />
        )}
        {transferData && (
          <TransferModal
            student={transferData.student}
            currentBatchId={transferData.batchId}
            batches={examBatches}
            onClose={() => setTransferData(null)}
            onTransfer={handleTransfer}
          />
        )}
        {showNotify && (
          <NotifyModal
            batch={selectedBatch}
            onClose={() => setShowNotify(false)}
          />
        )}

        {/* ── Header ── */}
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title">Lịch thi</h1>
            <span className="page-subtitle">Quản lý các đợt thi sắp tới, danh sách học viên theo từng đợt và nhóm chưa được xếp lịch.</span>
          </div>
          <div className="page-actions">
            <button type="button" className="primary-button" onClick={() => setShowCreateModal(true)}>
              <span>+</span><span>Tạo đợt thi</span>
            </button>
          </div>
        </div>

        {successMessage && <div className="page-success-message">{successMessage}</div>}

        {/* ── Stat Cards ── */}
        <div className="dashboard-stat-grid">
          {summaryCards.map((item) => (
            <div key={item.label} className="stat-card-small">
              <div className={`stat-icon ${item.tone}`}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{item.value}</span>
                <span className="stat-label">{item.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Layout 2 cột ── */}
        <div className="exams-layout">
          {/* Cột trái: danh sách đợt */}
          <div className="table-card exams-batch-column">
            <div className="table-card-header">
              <div>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Đợt thi sắp tới</span>
              </div>
              <span className="badge neutral">{examBatches.length} đợt</span>
            </div>
            <div className="exam-batch-list">
              {batchPagination.pageItems.map((batch) => (
                <button
                  type="button" key={batch.id}
                  className={`exam-batch-card ${selectedBatch?.id === batch.id ? 'active' : ''}`}
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  <div className="exam-batch-top">
                    <div className="exam-batch-title">{batch.name}</div>
                    <span className={`badge ${batch.statusTone}`}>{batch.status}</span>
                  </div>
                  <div className="exam-batch-meta">{batch.date} • {batch.time}</div>
                  <div className="exam-batch-meta">{batch.location}</div>
                  <div className="exam-batch-footer">
                    <span className="badge pu">{batch.licenseType}</span>
                    <span>{batch.studentCount} học viên</span>
                  </div>
                </button>
              ))}
            </div>
            <PaginationControls
              page={batchPagination.page}
              totalPages={batchPagination.totalPages}
              totalItems={batchPagination.totalItems}
              pageSize={batchPagination.pageSize}
              startItem={batchPagination.startItem}
              endItem={batchPagination.endItem}
              onPageChange={batchPagination.setPage}
              onPageSizeChange={batchPagination.setPageSize}
              pageSizeOptions={batchPagination.pageSizeOptions}
              itemLabel="đợt thi"
              className="card"
            />
          </div>

          {/* Cột phải: chi tiết đợt */}
          <div className="exams-detail-column">
            {/* Info đợt thi */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{selectedBatch?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`badge ${selectedBatch?.statusTone || 'neutral'}`}>{selectedBatch?.status}</span>
                  {/* Nút Gửi thông báo */}
                  <button type="button" className="secondary-button compact" onClick={() => setShowNotify(true)}>
                    📣 Thông báo
                  </button>
                  {/* Nút Xuất Excel */}
                  <button type="button" className="secondary-button compact" onClick={handleExportBatch}>
                    ↓ Xuất Excel
                  </button>
                </div>
              </div>
              <div className="exam-meta-grid">
                <div className="detail-field"><span className="detail-field-label">Ngày thi</span><span className="detail-field-value">{selectedBatch?.date}</span></div>
                <div className="detail-field"><span className="detail-field-label">Giờ thi</span><span className="detail-field-value">{selectedBatch?.time}</span></div>
                <div className="detail-field"><span className="detail-field-label">Địa điểm</span><span className="detail-field-value">{selectedBatch?.location}</span></div>
                <div className="detail-field"><span className="detail-field-label">Loại thi</span><span className="detail-field-value">{selectedBatch?.type}</span></div>
              </div>
              <div className="detail-inline-note exam-note">{selectedBatch?.note}</div>
            </div>

            {/* Danh sách học viên trong đợt */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Học viên trong đợt thi</span>
                </div>
                <span className="badge neutral">{selectedBatch?.studentCount || 0} người</span>
              </div>
              <table className="lite-table">
                <thead>
                  <tr>
                    <th>HỌC VIÊN</th><th>HẠNG</th><th>KẾT QUẢ LT</th><th>KẾT QUẢ TH</th><th>CÔNG NỢ</th><th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {batchStudentPagination.pageItems.map((student) => {
                    const res = results[student.id] || {};
                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="table-title">{student.name}</div>
                          <div className="detail-list-meta">{student.phone}</div>
                        </td>
                        <td><span className="badge pu">{student.licenseType}</span></td>
                        <td>{getResultBadge(res.lt || student.theory)}</td>
                        <td>{getResultBadge(res.th || student.practical)}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{student.tuitionDebt}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                              className="btn-primary"
                              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                              onClick={() => setModalStudent(student)}
                            >
                              Nhập KQ
                            </button>
                            <button
                              className="secondary-button compact"
                              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                              onClick={() => setTransferData({ student, batchId: selectedBatch.id })}
                            >
                              ↔ Chuyển
                            </button>
                            <Link to={buildPathForCurrentUser(`/students/${student.id}`)} className="secondary-button compact table-action-link" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                              Hồ sơ
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <PaginationControls
                page={batchStudentPagination.page}
                totalPages={batchStudentPagination.totalPages}
                totalItems={batchStudentPagination.totalItems}
                pageSize={batchStudentPagination.pageSize}
                startItem={batchStudentPagination.startItem}
                endItem={batchStudentPagination.endItem}
                onPageChange={batchStudentPagination.setPage}
                onPageSizeChange={batchStudentPagination.setPageSize}
                pageSizeOptions={batchStudentPagination.pageSizeOptions}
                itemLabel="học viên"
              />
            </div>
          </div>
        </div>

        {/* ── Học viên chưa có lịch thi ── */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Học viên chưa có lịch thi</span>
            </div>
            <span className="badge orange">{unscheduledStudents.length} học viên</span>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>HỌC VIÊN</th><th>HẠNG</th><th>KHU VỰC</th><th>TRẠNG THÁI</th><th>DỰ KIẾN THI</th><th>PHỤ TRÁCH</th><th></th>
              </tr>
            </thead>
            <tbody>
              {unscheduledPagination.pageItems.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="table-title">{student.name}</div>
                    <div className="detail-list-meta">{student.phone}</div>
                  </td>
                  <td><span className="badge pu">{student.licenseType}</span></td>
                  <td>{student.region}</td>
                  <td><span className={`badge ${student.statusTone}`}>{student.status}</span></td>
                  <td>{student.expectedExam}</td>
                  <td>{student.consultant}</td>
                  <td>
                    <Link to={buildPathForCurrentUser(`/students/${student.id}`)} className="secondary-button compact table-action-link">Mở hồ sơ</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={unscheduledPagination.page}
            totalPages={unscheduledPagination.totalPages}
            totalItems={unscheduledPagination.totalItems}
            pageSize={unscheduledPagination.pageSize}
            startItem={unscheduledPagination.startItem}
            endItem={unscheduledPagination.endItem}
            onPageChange={unscheduledPagination.setPage}
            onPageSizeChange={unscheduledPagination.setPageSize}
            pageSizeOptions={unscheduledPagination.pageSizeOptions}
            itemLabel="học viên"
          />
        </div>
      </div>
    </>
  );
};

export default Exams;
