import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStudentById, updateStudent } from '../services/studentService';

// ─── Constants ────────────────────────────────────────────────────────────────
const LICENSE_TYPES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C', 'D', 'E', 'F'];
const STATUSES = [
  'Mới đăng ký', 'Chờ khám sức khỏe', 'Đã khám sức khỏe', 'Chờ nộp hồ sơ',
  'Đã nộp hồ sơ', 'Đang học', 'Chờ thi', 'Đã xếp lịch thi',
  'Đã đỗ', 'Thi lại', 'Tạm dừng', 'Hủy', 'Còn nợ học phí', 'Hoàn tất',
];

const BADGE = {
  'Mới đăng ký': 'blue', 'Chờ khám sức khỏe': 'orange', 'Đã khám sức khỏe': 'orange',
  'Chờ nộp hồ sơ': 'or', 'Đã nộp hồ sơ': 'green', 'Đang học': 'purple',
  'Chờ thi': 'neutral', 'Đã xếp lịch thi': 'blue',
  'Đã đỗ': 'green', 'Thi lại': 'red', 'Tạm dừng': 'neutral',
  'Hủy': 'red', 'Còn nợ học phí': 'orange', 'Hoàn tất': 'green',
};

// ─── Summary items ────────────────────────────────────────────────────────────
const summaryItems = (student) => [
  { label: 'Hạng bằng',       value: student.licenseType,       caption: student.packageName },
  { label: 'Ngày đăng ký',    value: student.registerDate,       caption: `Lớp ${student.className}` },
  { label: 'Công nợ',         value: student.tuition.debt,       caption: `Đã thu ${student.tuition.paid}` },
  { label: 'Lịch thi dự kiến',value: student.exam.expectedDate,  caption: student.exam.batch },
];

// ─── Editable Field ───────────────────────────────────────────────────────────
const EditField = ({ label, name, value, onChange, type = 'text', options = null, wide = false }) => (
  <div className={`detail-field${wide ? ' detail-field-wide' : ''}`}>
    <span className="detail-field-label">{label}</span>
    {options ? (
      <select
        className="settings-input"
        style={{ fontSize: '0.85rem', padding: '5px 8px', marginTop: '2px' }}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input
        type={type}
        className="settings-input"
        style={{ fontSize: '0.85rem', padding: '5px 8px', marginTop: '2px' }}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    )}
  </div>
);

// ─── StudentDetail ────────────────────────────────────────────────────────────
const StudentDetail = () => {
  const { id } = useParams();
  const [studentState, setStudentState] = useState({ id: null, profile: null });
  const [editMode, setEditMode]         = useState(false);
  const [editForm, setEditForm]         = useState({});
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  useEffect(() => {
    let mounted = true;
    getStudentById(id).then((profile) => {
      if (!mounted) return;
      setStudentState({ id, profile });
    });
    return () => { mounted = false; };
  }, [id]);

  const isLoading = studentState.id !== id;
  const student   = studentState.profile;

  // Bắt đầu chỉnh sửa
  const handleEditStart = () => {
    setEditForm({
      name:             student.name,
      phone:            student.phone,
      email:            student.email,
      birthDate:        student.birthDate,
      gender:           student.gender,
      cccd:             student.cccd,
      address:          student.address,
      emergencyContact: student.emergencyContact,
      licenseType:      student.licenseType,
      status:           student.status,
      consultant:       student.consultant,
      referredBy:       student.referredBy,
    });
    setEditMode(true);
  };

  const handleFieldChange = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Lưu thay đổi
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateStudent(id, editForm);
      setStudentState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updated },
      }));
      setEditMode(false);
      setSaveMsg('✓ Đã lưu thay đổi thành công!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('✗ Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditForm({});
  };

  // ── Loading / Not Found ──────────────────────────────────────────────────
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
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <Link to="/students" className="back-link"><span>←</span><span>Quay lại danh sách học viên</span></Link>
          <h1 className="page-title">{editMode ? editForm.name || student.name : student.name}</h1>
          <span className="page-subtitle">
            {student.packageName} • Nhân viên phụ trách: {student.consultant}
          </span>
        </div>
        <div className="page-actions">
          <span className={`badge ${BADGE[student.status] || 'neutral'}`}>{student.status}</span>
          <span className="badge neutral">Mã HV #{student.id}</span>
          {!editMode ? (
            <button className="secondary-button" type="button" onClick={handleEditStart}>
              ✎ Chỉnh sửa
            </button>
          ) : (
            <>
              <button className="secondary-button" type="button" onClick={handleCancel} disabled={saving}>
                Hủy
              </button>
              <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : '✓ Lưu thay đổi'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Thông báo lưu ── */}
      {saveMsg && (
        <div style={{
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
          background: saveMsg.startsWith('✓') ? 'var(--tone-green-bg)' : 'var(--tone-red-bg)',
          color: saveMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
          fontWeight: 600, fontSize: '0.875rem',
        }}>
          {saveMsg}
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="detail-summary-grid">
        {summaryItems(student).map((item) => (
          <div key={item.label} className="stat-card-small detail-summary-card">
            <span className="detail-summary-label">{item.label}</span>
            <span className="detail-summary-value">{item.value}</span>
            <span className="detail-summary-caption">{item.caption}</span>
          </div>
        ))}
        {/* Badge số lần thi */}
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

      {/* ── Detail Grid ── */}
      <div className="detail-page-grid">
        <div className="detail-stack">

          {/* Thông tin cá nhân */}
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
                  <EditField label="Họ và tên"        name="name"             value={editForm.name}             onChange={handleFieldChange} />
                  <EditField label="Số điện thoại"    name="phone"            value={editForm.phone}            onChange={handleFieldChange} />
                  <EditField label="Email"             name="email"            value={editForm.email}            onChange={handleFieldChange} type="email" />
                  <EditField label="Ngày sinh"         name="birthDate"        value={editForm.birthDate}        onChange={handleFieldChange} />
                  <EditField label="Giới tính"         name="gender"           value={editForm.gender}           onChange={handleFieldChange} options={['Nam', 'Nữ', 'Khác']} />
                  <EditField label="CCCD"              name="cccd"             value={editForm.cccd}             onChange={handleFieldChange} />
                  <EditField label="Địa chỉ"           name="address"          value={editForm.address}          onChange={handleFieldChange} wide />
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

          {/* Thông tin khóa học (edit) */}
          {editMode && (
            <section className="table-card detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Thông tin khóa học</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>✎ Đang chỉnh sửa</span>
              </div>
              <div className="detail-info-grid">
                <EditField label="Hạng bằng"         name="licenseType" value={editForm.licenseType} onChange={handleFieldChange} options={LICENSE_TYPES} />
                <EditField label="Trạng thái"         name="status"      value={editForm.status}      onChange={handleFieldChange} options={STATUSES} />
                <EditField label="Nhân viên phụ trách"name="consultant"  value={editForm.consultant}  onChange={handleFieldChange} />
                <EditField label="Người giới thiệu"   name="referredBy"  value={editForm.referredBy}  onChange={handleFieldChange} />
              </div>
            </section>
          )}

          {/* Lịch học và lịch thi */}
          <section className="table-card detail-card">
            <div className="detail-card-header">
              <div className="detail-card-title">Lịch học và lịch thi</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Link to="/classes" className="secondary-button compact table-action-link">Mở lớp học</Link>
                <Link to="/exams"   className="secondary-button compact table-action-link">Mở lịch thi</Link>
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

          {/* Ghi chú nội bộ */}
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
          {/* Hồ sơ và sức khỏe */}
          <section className="table-card detail-card">
            <div className="detail-card-header">
              <div className="detail-card-title">Hồ sơ và sức khỏe</div>
              <Link to="/documents" className="secondary-button compact table-action-link">Mở module hồ sơ</Link>
            </div>
            <div className="detail-list">
              {student.documents.map((doc) => (
                <div key={doc.label} className="detail-list-item">
                  <div className="detail-list-title">{doc.label}</div>
                  <span className={`badge ${doc.tone}`}>{doc.value}</span>
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
            <div className="detail-inline-note">{student.healthCheck.note}</div>
          </section>

          {/* Học phí và khóa học */}
          <section className="table-card detail-card">
            <div className="detail-card-header">
              <div className="detail-card-title">Học phí và khóa học</div>
            </div>
            <div className="detail-info-grid">
              <div className="detail-field"><span className="detail-field-label">Tổng học phí</span><span className="detail-field-value">{student.tuition.total}</span></div>
              <div className="detail-field"><span className="detail-field-label">Đã thanh toán</span><span className="detail-field-value" style={{ color: 'var(--success)', fontWeight: 700 }}>{student.tuition.paid}</span></div>
              <div className="detail-field">
                <span className="detail-field-label">Công nợ còn lại</span>
                <span className="detail-field-value" style={{ color: student.tuition.debt === '0đ' ? 'var(--success)' : '#ef4444', fontWeight: 700 }}>
                  {student.tuition.debt === '0đ' ? '✓ Đã thu đủ' : student.tuition.debt}
                </span>
              </div>
              <div className="detail-field"><span className="detail-field-label">Hạn đóng tiếp theo</span><span className="detail-field-value">{student.tuition.deadline}</span></div>
              <div className="detail-field"><span className="detail-field-label">Hình thức thanh toán</span><span className="detail-field-value">{student.tuition.paymentMethod}</span></div>
              <div className="detail-field"><span className="detail-field-label">Người thu tiền</span><span className="detail-field-value">{student.tuition.collector}</span></div>
            </div>
          </section>

          {/* Lịch sử chăm sóc */}
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
    </div>
  );
};

export default StudentDetail;
