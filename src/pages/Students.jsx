import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import { createStudent, getStudents } from '../services/studentService';
import { exportXlsx } from '../services/exportService';

// ─── Constants ────────────────────────────────────────────────────────────────
const LICENSE_TYPES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C', 'D', 'E', 'F'];
const MOTORBIKE     = ['A1', 'A2', 'A3', 'A4'];

const BADGE = {
  'Mới đăng ký': 'blue', 'Chờ khám sức khỏe': 'orange', 'Đã khám sức khỏe': 'orange',
  'Chờ nộp hồ sơ': 'or', 'Đã nộp hồ sơ': 'green', 'Đang học': 'purple',
  'Chờ thi': 'neutral', 'Đã xếp lịch thi': 'blue',
  'Đã đỗ': 'green', 'Thi lại': 'red', 'Tạm dừng': 'neutral',
  'Hủy': 'red', 'Còn nợ học phí': 'orange', 'Hoàn tất': 'green',
};

const EMPTY_FORM = {
  name: '', phone: '', cccd: '', licenseType: 'B2',
  region: '', source: '', referrer: '', totalFee: '', status: 'Mới đăng ký',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseVNDate = (str) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  return new Date(+parts[2], +parts[1] - 1, +parts[0]);
};

const parseNum = (str) => parseFloat(String(str || '0').replace(/[^0-9.]/g, '')) || 0;
const fmtMoney = (str) => `${new Intl.NumberFormat('vi-VN').format(parseNum(str))}đ`;

const StudentQuickViewModal = ({ student, isLoading, onClose }) => {
  if (isLoading || !student) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box modal-box-wide student-quick-modal" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Xem nhanh học viên</span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <div className="student-quick-loading">Đang tải thông tin học viên...</div>
          </div>
        </div>
      </div>
    );
  }

  const debtValue = parseNum(student.tuition?.debt || student.debt);
  const totalFee = fmtMoney(student.tuition?.total || student.totalFee);
  const paidFee = fmtMoney(student.tuition?.paid || student.paid);
  const debtText = debtValue > 0 ? fmtMoney(student.tuition?.debt || student.debt) : 'Đã thu đủ';
  const documents = student.documents || [];
  const pendingDocuments = documents.filter((document) => (
    String(document.value).includes('Chưa') || String(document.value).includes('Chờ')
  ));
  const scheduleItems = student.schedule || [];
  const careHistory = student.careHistory || [];
  const notes = student.notes || [];
  const nextSchedule = scheduleItems[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide student-quick-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header student-quick-modal-header">
          <div>
            <div className="student-quick-kicker">Xem nhanh học viên</div>
            <span className="modal-title">Toàn bộ thông tin chính của học viên trên một popup</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body student-quick-body">
          <section className="student-quick-hero">
            <div className="student-quick-hero-top">
              <div className="student-quick-hero-main">
                <div className="student-quick-avatar">{student.name?.charAt(0) || 'H'}</div>
                <div className="student-quick-hero-copy">
                  <h2>{student.name}</h2>
                  <p>{student.packageName} • {student.region} • Phụ trách: {student.consultant || 'Chưa phân công'}</p>
                  <div className="student-quick-pill-row">
                    <span className="badge purple">#{student.id}</span>
                    <span className="badge blue">{student.licenseType}</span>
                    <span className={`badge ${BADGE[student.status] || 'neutral'}`}>{student.status}</span>
                  </div>
                </div>
              </div>
              <div className="student-quick-alerts">
                <div className={`student-quick-alert ${debtValue > 0 ? 'danger' : 'success'}`}>
                  <span className="student-quick-alert-label">Công nợ</span>
                  <strong>{debtText}</strong>
                </div>
                <div className={`student-quick-alert ${pendingDocuments.length > 0 ? 'warning' : 'success'}`}>
                  <span className="student-quick-alert-label">Hồ sơ</span>
                  <strong>{pendingDocuments.length > 0 ? `Thiếu ${pendingDocuments.length} mục` : 'Đủ hồ sơ'}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="student-quick-stats">
            <div className="student-quick-stat-card">
              <span className="student-quick-stat-label">Số điện thoại</span>
              <strong>{student.phone}</strong>
              <small>{student.email || 'Chưa có email'}</small>
            </div>
            <div className="student-quick-stat-card">
              <span className="student-quick-stat-label">Ngày đăng ký</span>
              <strong>{student.registerDate}</strong>
              <small>{student.className || 'Chưa xếp lớp'}</small>
            </div>
            <div className="student-quick-stat-card">
              <span className="student-quick-stat-label">Tổng học phí</span>
              <strong>{totalFee}</strong>
              <small>Đã thu {paidFee}</small>
            </div>
            <div className="student-quick-stat-card">
              <span className="student-quick-stat-label">Lịch thi dự kiến</span>
              <strong>{student.exam?.expectedDate || 'Chưa có'}</strong>
              <small>{student.exam?.batch || 'Chưa xếp đợt thi'}</small>
            </div>
          </section>

          <section className="student-quick-grid">
            <div className="student-quick-stack">
              <div className="student-quick-section">
                <div className="student-quick-section-header">
                  <h3>Thông tin cá nhân</h3>
                </div>
                <div className="student-quick-info-grid">
                  <div className="student-quick-info-item">
                    <span>CCCD</span>
                    <strong>{student.cccd || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="student-quick-info-item">
                    <span>Ngày sinh</span>
                    <strong>{student.birthDate || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="student-quick-info-item">
                    <span>Giới tính</span>
                    <strong>{student.gender || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="student-quick-info-item">
                    <span>Nguồn học viên</span>
                    <strong>{student.source || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="student-quick-info-item">
                    <span>Người giới thiệu</span>
                    <strong>{student.referredBy || 'Không có'}</strong>
                  </div>
                  <div className="student-quick-info-item">
                    <span>Phụ trách</span>
                    <strong>{student.consultant || 'Chưa phân công'}</strong>
                  </div>
                  <div className="student-quick-info-item wide">
                    <span>Địa chỉ</span>
                    <strong>{student.address || 'Chưa cập nhật địa chỉ'}</strong>
                  </div>
                  <div className="student-quick-info-item wide">
                    <span>Liên hệ khẩn cấp</span>
                    <strong>{student.emergencyContact || 'Chưa cập nhật'}</strong>
                  </div>
                </div>
              </div>

              <div className="student-quick-section">
                <div className="student-quick-section-header">
                  <h3>Khóa học và học phí</h3>
                </div>
                <div className="student-quick-detail-grid">
                  <div className="student-quick-detail-item">
                    <span>Gói học</span>
                    <strong>{student.packageName || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="student-quick-detail-item">
                    <span>Lớp học</span>
                    <strong>{student.className || 'Chưa xếp lớp'}</strong>
                  </div>
                  <div className="student-quick-detail-item">
                    <span>Tổng học phí</span>
                    <strong>{totalFee}</strong>
                  </div>
                  <div className="student-quick-detail-item">
                    <span>Đã thanh toán</span>
                    <strong>{paidFee}</strong>
                  </div>
                  <div className={`student-quick-detail-item ${debtValue > 0 ? 'danger' : 'success'}`}>
                    <span>Công nợ</span>
                    <strong>{debtText}</strong>
                  </div>
                  <div className="student-quick-detail-item">
                    <span>Hạn đóng tiếp theo</span>
                    <strong>{student.tuition?.deadline || 'Chưa có hạn'}</strong>
                  </div>
                  <div className="student-quick-detail-item">
                    <span>Thanh toán gần nhất</span>
                    <strong>{student.tuition?.paymentMethod || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="student-quick-detail-item">
                    <span>Người thu tiền</span>
                    <strong>{student.tuition?.collector || 'Chưa cập nhật'}</strong>
                  </div>
                </div>
              </div>

              <div className="student-quick-section">
                <div className="student-quick-section-header">
                  <h3>Ghi chú nội bộ</h3>
                </div>
                <div className="student-quick-note-list">
                  {notes.length > 0 ? notes.map((note) => (
                    <div key={note} className="student-quick-note-card">{note}</div>
                  )) : (
                    <div className="student-quick-note-card">Chưa có ghi chú nội bộ.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="student-quick-stack">
              <div className="student-quick-section">
                <div className="student-quick-section-header">
                  <h3>Lịch học và lịch thi</h3>
                </div>
                <div className="student-quick-list">
                  {scheduleItems.length > 0 ? scheduleItems.map((item) => (
                    <div key={`${item.title}-${item.time}`} className="student-quick-list-item">
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.time}</span>
                      </div>
                      <em>{item.location}</em>
                    </div>
                  )) : (
                    <div className="student-quick-list-item">
                      <div>
                        <strong>Chưa có lịch học</strong>
                        <span>Hệ thống chưa xếp buổi học cụ thể</span>
                      </div>
                      <em>—</em>
                    </div>
                  )}
                  <div className="student-quick-list-item highlight">
                    <div>
                      <strong>{student.exam?.batch || 'Chưa có đợt thi'}</strong>
                      <span>{student.exam?.location || 'Đang chờ phân bổ địa điểm'}</span>
                    </div>
                    <em>{student.exam?.expectedDate || 'Chưa có ngày thi'}</em>
                  </div>
                </div>
              </div>

              <div className="student-quick-section">
                <div className="student-quick-section-header">
                  <h3>Hồ sơ và sức khỏe</h3>
                </div>
                <div className="student-quick-document-list">
                  {documents.map((document) => (
                    <div key={document.label} className={`student-quick-document ${document.tone || 'neutral'}`}>
                      <span>{document.label}</span>
                      <strong>{document.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="student-quick-health-card">
                  <strong>{student.healthCheck?.status || 'Chưa cập nhật sức khỏe'}</strong>
                  <span>{student.healthCheck?.clinic || 'Chưa có phòng khám'}</span>
                  <em>{student.healthCheck?.appointment || 'Chưa có lịch khám'} • {student.healthCheck?.result || 'Chưa có kết quả'}</em>
                  <p>{student.healthCheck?.note || 'Chưa có ghi chú sức khỏe.'}</p>
                </div>
              </div>

              <div className="student-quick-section">
                <div className="student-quick-section-header">
                  <h3>Lịch sử chăm sóc</h3>
                </div>
                <div className="student-quick-timeline">
                  {careHistory.length > 0 ? careHistory.map((item) => (
                    <div key={`${item.time}-${item.title}`} className="student-quick-timeline-item">
                      <span>{item.time}</span>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                  )) : (
                    <div className="student-quick-timeline-item">
                      <span>Chưa phát sinh</span>
                      <strong>Chưa có lịch sử chăm sóc</strong>
                      <p>Hệ thống chưa ghi nhận lịch sử tương tác với học viên này.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="modal-footer student-quick-close-row">
            <button type="button" className="secondary-button" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sort Icon ────────────────────────────────────────────────────────────────
const SortIcon = ({ col, sortConfig }) => {
  if (sortConfig.col !== col) {
    return <span style={{ opacity: 0.25, marginLeft: '3px', fontSize: '0.65rem' }}>⇅</span>;
  }
  return (
    <span style={{ marginLeft: '3px', fontSize: '0.7rem', color: 'var(--accent-primary)' }}>
      {sortConfig.dir === 'asc' ? '↑' : '↓'}
    </span>
  );
};

// ─── Add Student Modal ────────────────────────────────────────────────────────
const AddStudentModal = ({ regions, onClose, onAdd }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Vui lòng nhập họ tên.');
    if (!form.phone.trim()) return setError('Vui lòng nhập số điện thoại.');
    if (!form.region) return setError('Vui lòng chọn khu vực.');
    onAdd({
      id: Date.now(),
      ...form,
      paid: '0',
      debt: form.totalFee || '0',
      registerDate: new Date().toLocaleDateString('vi-VN'),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">➕ Thêm học viên mới</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Họ và tên *</label>
              <input className="settings-input" placeholder="Nguyễn Văn A" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Số điện thoại *</label>
              <input className="settings-input" placeholder="09xxxxxxxx" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Số CCCD</label>
              <input className="settings-input" placeholder="001xxxxxxxxx" value={form.cccd} onChange={(e) => set('cccd', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Hạng bằng</label>
              <select className="settings-input" value={form.licenseType} onChange={(e) => set('licenseType', e.target.value)}>
                {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Khu vực *</label>
              <select className="settings-input" value={form.region} onChange={(e) => set('region', e.target.value)}>
                <option value="">— Chọn khu vực —</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                <option value="Tỉnh lân cận">Tỉnh lân cận</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Học phí (VD: 15,000,000)</label>
              <input className="settings-input" placeholder="15,000,000" value={form.totalFee} onChange={(e) => set('totalFee', e.target.value)} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Nguồn học viên</label>
              <select className="settings-input" value={form.source} onChange={(e) => set('source', e.target.value)}>
                <option value="">— Chọn nguồn —</option>
                {['Facebook', 'Website', 'Người giới thiệu', 'Quảng cáo ngoài trời', 'Zalo', 'Nhân viên tư vấn'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Người giới thiệu</label>
              <input className="settings-input" placeholder="Tên người giới thiệu" value={form.referrer} onChange={(e) => set('referrer', e.target.value)} />
            </div>
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu học viên</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Students Page ────────────────────────────────────────────────────────────
const Students = () => {
  const [students, setStudents]           = useState([]);
  const [activeTab, setActiveTab]         = useState('Tất cả');
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterLicense, setFilterLicense] = useState('');
  const [filterRegion, setFilterRegion]   = useState('');
  const [filterFee, setFilterFee]         = useState('');
  const [filterExam, setFilterExam]       = useState('');
  const [filterReferrer, setFilterReferrer] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]   = useState('');
  const [sortConfig, setSortConfig]       = useState({ col: null, dir: 'asc' });
  const [showModal, setShowModal]         = useState(false);

  useEffect(() => {
    let mounted = true;
    getStudents().then((list) => {
      if (mounted) setStudents(list);
    });
    return () => { mounted = false; };
  }, []);

  const regions   = useMemo(() => [...new Set(students.map((s) => s.region))].filter(Boolean).sort(), [students]);
  const statuses  = useMemo(() => [...new Set(students.map((s) => s.status))], [students]);
  const referrers = useMemo(() => [...new Set(students.map((s) => s.referrer).filter(Boolean))].sort(), [students]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      if (activeTab === 'Xe máy' && !MOTORBIKE.includes(s.licenseType)) return false;
      if (activeTab === 'Ô tô'   &&  MOTORBIKE.includes(s.licenseType)) return false;
      if (filterStatus   && s.status      !== filterStatus)   return false;
      if (filterLicense  && s.licenseType !== filterLicense)  return false;
      if (filterRegion   && s.region      !== filterRegion)   return false;
      if (filterReferrer && s.referrer    !== filterReferrer) return false;
      // Tình trạng học phí
      if (filterFee === 'paid' && s.debt && s.debt !== '0') return false;
      if (filterFee === 'debt' && (!s.debt || s.debt === '0')) return false;
      // Lịch thi
      if (filterExam === 'scheduled'   && s.status !== 'Đã xếp lịch thi') return false;
      if (filterExam === 'unscheduled' && s.status === 'Đã xếp lịch thi') return false;
      // Khoảng ngày đăng ký
      if (filterDateFrom || filterDateTo) {
        const d = parseVNDate(s.registerDate);
        if (!d) return false;
        if (filterDateFrom && d < new Date(filterDateFrom)) return false;
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59);
          if (d > to) return false;
        }
      }
      // Tìm kiếm văn bản
      if (q && !s.name.toLowerCase().includes(q) && !s.phone.includes(q) && !s.cccd.includes(q)) return false;
      return true;
    });
  }, [students, activeTab, search, filterStatus, filterLicense, filterRegion,
      filterFee, filterExam, filterReferrer, filterDateFrom, filterDateTo]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortConfig.col) return filtered;
    return [...filtered].sort((a, b) => {
      const col = sortConfig.col;
      if (col === 'registerDate') {
        const aD = parseVNDate(a.registerDate) || new Date(0);
        const bD = parseVNDate(b.registerDate) || new Date(0);
        return sortConfig.dir === 'asc' ? aD - bD : bD - aD;
      }
      if (col === 'totalFee' || col === 'debt') {
        const aV = parseNum(a[col]);
        const bV = parseNum(b[col]);
        return sortConfig.dir === 'asc' ? aV - bV : bV - aV;
      }
      const aV = String(a[col] || '').toLowerCase();
      const bV = String(b[col] || '').toLowerCase();
      if (aV < bV) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aV > bV) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const studentPagination = usePagination(sorted, {
    initialPageSize: 10,
    resetDeps: [
      activeTab,
      search,
      filterStatus,
      filterLicense,
      filterRegion,
      filterFee,
      filterExam,
      filterReferrer,
      filterDateFrom,
      filterDateTo,
    ],
  });

  const handleSort = (col) => {
    setSortConfig((prev) => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleAdd = async (newStudent) => {
    const created = await createStudent(newStudent);
    setStudents((prev) => [created, ...prev]);
  };

  const handleExport = () => {
    exportXlsx({
      fileName: 'danh-sach-hoc-vien',
      sheetName: 'Học viên',
      columns: [
        { label: 'Họ và tên',       value: (s) => s.name },
        { label: 'Số điện thoại',   value: (s) => s.phone },
        { label: 'CCCD',            value: (s) => s.cccd },
        { label: 'Hạng bằng',       value: (s) => s.licenseType },
        { label: 'Khu vực',         value: (s) => s.region },
        { label: 'Ngày đăng ký',    value: (s) => s.registerDate },
        { label: 'Người giới thiệu',value: (s) => s.referrer },
        { label: 'Nguồn HV',        value: (s) => s.source },
        { label: 'Tổng học phí',    value: (s) => s.totalFee },
        { label: 'Đã thanh toán',   value: (s) => s.paid },
        { label: 'Công nợ',         value: (s) => s.debt },
        { label: 'Trạng thái',      value: (s) => s.status },
      ],
      rows: sorted,
    });
  };

  const hasFilter = search || filterStatus || filterLicense || filterRegion ||
                   filterFee || filterExam || filterReferrer || filterDateFrom || filterDateTo || sortConfig.col;

  const clearAll = () => {
    setSearch(''); setFilterStatus(''); setFilterLicense(''); setFilterRegion('');
    setFilterFee(''); setFilterExam(''); setFilterReferrer('');
    setFilterDateFrom(''); setFilterDateTo('');
    setSortConfig({ col: null, dir: 'asc' });
  };


  return (
    <div>
      {showModal && <AddStudentModal regions={regions} onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Quản lý học viên</h1>
          <span className="page-subtitle">
            Hiển thị {sorted.length} / {students.length} học viên
            {hasFilter && (
              <>
                {' — '}
                <button
                  onClick={clearAll}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: 'inherit' }}
                >
                  Xóa bộ lọc ✕
                </button>
              </>
            )}
          </span>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={handleExport}>↓ Xuất Excel</button>
          <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>+ Thêm học viên</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-container">
        {['Tất cả', 'Xe máy', 'Ô tô'].map((tab) => (
          <button key={tab} type="button" className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-filters">
          {/* Hàng 1 */}
          <div className="search-input-wrap">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="search-icon">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input className="search-input" placeholder="Tìm tên, SĐT, CCCD..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Trạng thái (Tất cả)</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="filter-select" value={filterLicense} onChange={(e) => setFilterLicense(e.target.value)}>
            <option value="">Hạng bằng (Tất cả)</option>
            {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="filter-select" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            <option value="">Khu vực (Tất cả)</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Hàng 2 — bộ lọc mới */}
          <select className="filter-select" value={filterFee} onChange={(e) => setFilterFee(e.target.value)}>
            <option value="">Học phí (Tất cả)</option>
            <option value="paid">✓ Đã đóng đủ</option>
            <option value="debt">⚠ Còn nợ</option>
          </select>

          <select className="filter-select" value={filterExam} onChange={(e) => setFilterExam(e.target.value)}>
            <option value="">Lịch thi (Tất cả)</option>
            <option value="scheduled">Đã có lịch</option>
            <option value="unscheduled">Chưa có lịch</option>
          </select>

          {referrers.length > 0 && (
            <select className="filter-select" value={filterReferrer} onChange={(e) => setFilterReferrer(e.target.value)}>
              <option value="">Người GT (Tất cả)</option>
              {referrers.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          <input
            type="date"
            className="filter-select"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            title="Từ ngày đăng ký"
            style={{ maxWidth: '145px' }}
          />
          <input
            type="date"
            className="filter-select"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            title="Đến ngày đăng ký"
            style={{ maxWidth: '145px' }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                HỌ VÀ TÊN <SortIcon col="name" sortConfig={sortConfig} />
              </th>
              <th>SỐ ĐIỆN THOẠI</th>
              <th>CCCD</th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('licenseType')}>
                HẠNG <SortIcon col="licenseType" sortConfig={sortConfig} />
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('region')}>
                KHU VỰC <SortIcon col="region" sortConfig={sortConfig} />
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('registerDate')}>
                NGÀY ĐK <SortIcon col="registerDate" sortConfig={sortConfig} />
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('totalFee')}>
                TỔNG HỌC PHÍ <SortIcon col="totalFee" sortConfig={sortConfig} />
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('debt')}>
                CÔNG NỢ <SortIcon col="debt" sortConfig={sortConfig} />
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                TRẠNG THÁI <SortIcon col="status" sortConfig={sortConfig} />
              </th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Không tìm thấy học viên phù hợp với bộ lọc.
                </td>
              </tr>
            ) : studentPagination.pageItems.map((s) => (
              <tr key={s.id}>
                <td className="table-strong">
                  <Link to={`/students/${s.id}`} className="table-link">{s.name}</Link>
                </td>
                <td>{s.phone}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.cccd}</td>
                <td className="table-accent">{s.licenseType}</td>
                <td>{s.region}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.registerDate}</td>
                <td style={{ fontWeight: 600 }}>{s.totalFee}đ</td>
                <td className={(!s.debt || s.debt === '0') ? 'table-muted' : 'table-danger'}>
                  {(!s.debt || s.debt === '0') ? '✓ Đã thu đủ' : `${s.debt}đ`}
                </td>
                <td><span className={`badge ${BADGE[s.status] || 'neutral'}`}>{s.status}</span></td>
                <td>
                  <Link to={`/students/${s.id}`} className="secondary-button compact table-action-link">
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationControls
          page={studentPagination.page}
          totalPages={studentPagination.totalPages}
          totalItems={studentPagination.totalItems}
          pageSize={studentPagination.pageSize}
          startItem={studentPagination.startItem}
          endItem={studentPagination.endItem}
          onPageChange={studentPagination.setPage}
          onPageSizeChange={studentPagination.setPageSize}
          itemLabel="học viên"
        />
      </div>
    </div>
  );
};

export default Students;
