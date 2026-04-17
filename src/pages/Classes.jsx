import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createClass, getClasses, getClassSummary, resetClassesToDefault } from '../services/classService';
import { exportCsv } from '../services/exportService';

const LICENSE_FILTERS = ['Tất cả', 'A1', 'B1', 'B2', 'C'];
const CLASS_STATUSES = [
  { label: 'Sắp khai giảng', tone: 'orange' },
  { label: 'Đang học', tone: 'green' },
];
const EMPTY_CLASS_FORM = {
  name: '',
  licenseType: 'B2',
  schedule: '',
  practiceSchedule: '',
  instructor: '',
  assistant: '',
  location: '',
  capacity: '16',
  status: 'Sắp khai giảng',
  lessonTitle: '',
  lessonTime: '',
  lessonType: 'Lý thuyết',
  lessonRoom: '',
  note: '',
};

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
      {sub && <span className="class-stat-sub">{sub}</span>}
    </div>
  </div>
);

const LessonItem = ({ lesson }) => (
  <div className="class-lesson-item">
    <div>
      <div className="table-title">{lesson.title}</div>
      <div className="detail-list-meta">{lesson.time}</div>
    </div>
    <div className="class-lesson-meta">
      <span className={`badge ${lesson.type === 'Thực hành' ? 'orange' : 'blue'}`}>{lesson.type}</span>
      <span>{lesson.room}</span>
    </div>
  </div>
);

const CreateClassModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_CLASS_FORM);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Vui lòng nhập tên lớp học.');
    if (!form.schedule.trim()) return setError('Vui lòng nhập lịch lý thuyết.');
    if (!form.instructor.trim()) return setError('Vui lòng nhập giảng viên phụ trách.');

    const statusMeta = CLASS_STATUSES.find(item => item.label === form.status) || CLASS_STATUSES[0];
    const nextLessons = form.lessonTitle.trim()
      ? [{
          id: Date.now(),
          title: form.lessonTitle.trim(),
          time: form.lessonTime || 'Chưa xác định',
          type: form.lessonType,
          room: form.lessonRoom || 'Chưa phân phòng',
        }]
      : [];

    const createdClass = await createClass({
      name: form.name.trim(),
      licenseType: form.licenseType,
      schedule: form.schedule.trim(),
      practiceSchedule: form.practiceSchedule.trim() || 'Chưa xếp lịch thực hành',
      instructor: form.instructor.trim(),
      assistant: form.assistant.trim() || 'Chưa phân công',
      location: form.location.trim() || 'Chưa phân phòng',
      capacity: Number(form.capacity) || 16,
      status: statusMeta.label,
      statusTone: statusMeta.tone,
      nextLessons,
      note: form.note.trim() || 'Lớp mới tạo, chờ cập nhật học viên và giáo trình chi tiết.',
    });

    onCreated(createdClass);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">+ Tạo lớp học mới</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Tên lớp *</label>
              <input className="settings-input" value={form.name} onChange={event => set('name', event.target.value)} placeholder="VD: Lớp B2 - Ca tối Quận 12" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Hạng bằng</label>
              <select className="settings-input" value={form.licenseType} onChange={event => set('licenseType', event.target.value)}>
                {LICENSE_FILTERS.filter(item => item !== 'Tất cả').map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Lịch lý thuyết *</label>
              <input className="settings-input" value={form.schedule} onChange={event => set('schedule', event.target.value)} placeholder="VD: Thứ 3, Thứ 5 - 19:00 đến 21:00" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Lịch thực hành</label>
              <input className="settings-input" value={form.practiceSchedule} onChange={event => set('practiceSchedule', event.target.value)} placeholder="VD: Chủ nhật - 07:30 đến 09:30" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Giảng viên *</label>
              <input className="settings-input" value={form.instructor} onChange={event => set('instructor', event.target.value)} placeholder="VD: Thầy Minh Đức" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Trợ giảng</label>
              <input className="settings-input" value={form.assistant} onChange={event => set('assistant', event.target.value)} placeholder="VD: Trợ giảng Khánh Linh" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Địa điểm</label>
              <input className="settings-input" value={form.location} onChange={event => set('location', event.target.value)} placeholder="VD: Phòng A2 và sân tập Quận 12" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Sĩ số tối đa</label>
              <input className="settings-input" value={form.capacity} onChange={event => set('capacity', event.target.value)} placeholder="VD: 16" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Trạng thái</label>
              <select className="settings-input" value={form.status} onChange={event => set('status', event.target.value)}>
                {CLASS_STATUSES.map(item => <option key={item.label} value={item.label}>{item.label}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Ghi chú</label>
              <input className="settings-input" value={form.note} onChange={event => set('note', event.target.value)} placeholder="Ghi chú đào tạo..." />
            </div>
          </div>

          <div className="settings-section-title">Buổi học đầu tiên</div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Tên buổi học</label>
              <input className="settings-input" value={form.lessonTitle} onChange={event => set('lessonTitle', event.target.value)} placeholder="VD: Khai giảng và phổ biến quy chế" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Thời gian</label>
              <input className="settings-input" value={form.lessonTime} onChange={event => set('lessonTime', event.target.value)} placeholder="VD: 20/04/2026 - 18:30" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Loại buổi học</label>
              <select className="settings-input" value={form.lessonType} onChange={event => set('lessonType', event.target.value)}>
                <option value="Lý thuyết">Lý thuyết</option>
                <option value="Thực hành">Thực hành</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Phòng / sân học</label>
              <input className="settings-input" value={form.lessonRoom} onChange={event => set('lessonRoom', event.target.value)} placeholder="VD: Phòng A2" />
            </div>
          </div>

          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu lớp học</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    activeClasses: 0,
    activeStudents: 0,
    weeklyLessons: 0,
  });
  const [activeLicense, setActiveLicense] = useState('Tất cả');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([getClasses(), getClassSummary()]).then(([classList, classSummary]) => {
      if (!mounted) return;
      setClasses(classList);
      setSummary(classSummary);
      setSelectedClassId((current) => current || classList[0]?.id || null);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredClasses = activeLicense === 'Tất cả'
    ? classes
    : classes.filter((item) => item.licenseType === activeLicense);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || classes[0],
    [classes, selectedClassId],
  );

  const filterCount = (license) => (
    license === 'Tất cả'
      ? classes.length
      : classes.filter((item) => item.licenseType === license).length
  );

  const handleCreatedClass = (createdClass) => {
    setClasses(prev => [createdClass, ...prev]);
    setSelectedClassId(createdClass.id);
    if (activeLicense !== 'Tất cả' && activeLicense !== createdClass.licenseType) {
      setActiveLicense('Tất cả');
    }
    setSummary(prev => ({
      totalClasses: prev.totalClasses + 1,
      activeClasses: prev.activeClasses + (createdClass.status === 'Đang học' ? 1 : 0),
      activeStudents: prev.activeStudents + createdClass.studentCount,
      weeklyLessons: prev.weeklyLessons + createdClass.nextLessons.length,
    }));
    setSuccessMessage(`Đã tạo lớp học "${createdClass.name}".`);
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const handleResetClasses = async () => {
    const classList = await resetClassesToDefault();
    const classSummary = await getClassSummary();

    setClasses(classList);
    setSummary(classSummary);
    setSelectedClassId(classList[0]?.id || null);
    setActiveLicense('Tất cả');
    setSuccessMessage('Đã khôi phục dữ liệu lớp học mẫu.');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const handleExportClasses = () => {
    exportCsv({
      fileName: 'lich-hoc-lop-hoc',
      columns: [
        { label: 'Tên lớp', value: (classItem) => classItem.name },
        { label: 'Hạng bằng', value: (classItem) => classItem.licenseType },
        { label: 'Trạng thái', value: (classItem) => classItem.status },
        { label: 'Giảng viên', value: (classItem) => classItem.instructor },
        { label: 'Trợ giảng', value: (classItem) => classItem.assistant },
        { label: 'Địa điểm', value: (classItem) => classItem.location },
        { label: 'Sĩ số', value: (classItem) => `${classItem.studentCount}/${classItem.capacity}` },
        { label: 'Lịch lý thuyết', value: (classItem) => classItem.schedule },
        { label: 'Lịch thực hành', value: (classItem) => classItem.practiceSchedule },
        { label: 'Buổi học sắp tới', value: (classItem) => classItem.nextLessons.map((lesson) => `${lesson.title} - ${lesson.time}`).join('; ') },
        { label: 'Ghi chú', value: (classItem) => classItem.note },
      ],
      rows: filteredClasses,
    });
  };

  return (
    <div>
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreatedClass}
        />
      )}

      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Lớp học</h1>
          <span className="page-subtitle">
            Quản lý lớp học, lịch học lý thuyết / thực hành và sĩ số từng lớp.
          </span>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button compact" onClick={handleExportClasses}>↓ Xuất lịch học</button>
          <button type="button" className="secondary-button compact" onClick={handleResetClasses}>Khôi phục mẫu</button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Tạo lớp học</button>
        </div>
      </div>

      {successMessage && <div className="page-success-message">{successMessage}</div>}

      <div className="dashboard-stat-grid class-stat-grid">
        <StatCard
          label="Tổng số lớp"
          value={summary.totalClasses}
          sub="Theo hạng bằng"
          tone="pu"
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253"
        />
        <StatCard
          label="Lớp đang học"
          value={summary.activeClasses}
          sub="Đang vận hành"
          tone="gr"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          label="Học viên đang học"
          value={summary.activeStudents}
          sub="Đã gán lớp"
          tone="bl"
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1"
        />
        <StatCard
          label="Buổi học tuần này"
          value={summary.weeklyLessons}
          sub="Lý thuyết và thực hành"
          tone="or"
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </div>

      <div className="classes-layout">
        <div className="table-card class-list-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
              </svg>
              <span>Danh sách lớp học</span>
            </div>
            <span className="badge neutral">{filteredClasses.length} lớp</span>
          </div>

          <div className="fees-tabs class-tabs">
            {LICENSE_FILTERS.map((license) => (
              <button
                key={license}
                type="button"
                className={`fees-tab-btn ${activeLicense === license ? 'active' : ''}`}
                onClick={() => setActiveLicense(license)}
              >
                {license}
                <span className="fees-tab-count">{filterCount(license)}</span>
              </button>
            ))}
          </div>

          <div className="class-card-list">
            {filteredClasses.map((classItem) => (
              <button
                key={classItem.id}
                type="button"
                className={`class-card ${selectedClass?.id === classItem.id ? 'active' : ''}`}
                onClick={() => setSelectedClassId(classItem.id)}
              >
                <div className="class-card-top">
                  <div>
                    <div className="class-card-title">{classItem.name}</div>
                    <div className="detail-list-meta">{classItem.location}</div>
                  </div>
                  <span className={`badge ${classItem.statusTone}`}>{classItem.status}</span>
                </div>
                <div className="class-card-meta">
                  <span><strong>{classItem.licenseType}</strong></span>
                  <span>{classItem.studentCount}/{classItem.capacity} học viên</span>
                  <span>{classItem.fillRate}% sĩ số</span>
                </div>
                <div className="progress-track class-fill-track">
                  <div
                    className={`progress-fill progress-${classItem.fillRate >= 70 ? 'green' : classItem.fillRate >= 40 ? 'blue' : 'red'}`}
                    style={{ width: `${classItem.fillRate}%` }}
                  />
                </div>
                <div className="class-card-schedule">{classItem.schedule}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="class-detail-stack">
          <div className="table-card">
            <div className="table-card-header">
              <div>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
                </svg>
                <span>{selectedClass?.name || 'Chưa chọn lớp'}</span>
              </div>
              {selectedClass && <span className={`badge ${selectedClass.statusTone}`}>{selectedClass.status}</span>}
            </div>

            {selectedClass && (
              <>
                <div className="class-info-grid">
                  <div className="detail-field">
                    <span className="detail-field-label">Hạng bằng</span>
                    <span className="detail-field-value">{selectedClass.licenseType}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-field-label">Giảng viên</span>
                    <span className="detail-field-value">{selectedClass.instructor}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-field-label">Trợ giảng</span>
                    <span className="detail-field-value">{selectedClass.assistant}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-field-label">Sĩ số</span>
                    <span className="detail-field-value">{selectedClass.studentCount}/{selectedClass.capacity}</span>
                  </div>
                  <div className="detail-field detail-field-wide">
                    <span className="detail-field-label">Lịch lý thuyết</span>
                    <span className="detail-field-value">{selectedClass.schedule}</span>
                  </div>
                  <div className="detail-field detail-field-wide">
                    <span className="detail-field-label">Lịch thực hành</span>
                    <span className="detail-field-value">{selectedClass.practiceSchedule}</span>
                  </div>
                </div>
                <div className="detail-inline-note">{selectedClass.note}</div>
              </>
            )}
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <div>Buổi học sắp tới</div>
              <span className="badge neutral">{selectedClass?.nextLessons.length || 0} buổi</span>
            </div>
            <div className="class-lesson-list">
              {selectedClass?.nextLessons.map((lesson) => (
                <LessonItem key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <div>Học viên trong lớp</div>
              <span className="badge neutral">{selectedClass?.students.length || 0} học viên</span>
            </div>
            <div className="table-container class-student-table">
              <table className="lite-table">
                <thead>
                  <tr>
                    <th>HỌC VIÊN</th>
                    <th>TRẠNG THÁI</th>
                    <th>HỒ SƠ</th>
                    <th>CÔNG NỢ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClass?.students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="table-title">{student.name}</div>
                        <div className="detail-list-meta">{student.phone}</div>
                      </td>
                      <td><span className={`badge ${student.statusTone}`}>{student.status}</span></td>
                      <td>
                        <span className={`badge ${student.documentStatus === 'Đủ hồ sơ' ? 'green' : 'orange'}`}>
                          {student.documentStatus}
                        </span>
                      </td>
                      <td>{student.tuitionDebt}</td>
                      <td>
                        <Link to={`/students/${student.id}`} className="secondary-button compact table-action-link">
                          Hồ sơ
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;
