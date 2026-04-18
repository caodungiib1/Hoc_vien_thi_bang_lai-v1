import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../services/studentService';
import { getExamBatches } from '../services/examService';
import { buildPathForCurrentUser } from '../services/orgRouteService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const count = (students, status) => students.filter((s) => s.status === status).length;
const hasDebt = (s) => s.debt && s.debt !== '0';

const parseVNDate = (str) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  return new Date(+parts[2], +parts[1] - 1, +parts[0]);
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const buildStats = (students, examBatches) => {
  const now = new Date();

  const upcomingCount = examBatches.filter((b) => {
    const d = parseVNDate(b.date);
    if (!d) return false;
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const recentCount = students.filter((s) => {
    const d = parseVNDate(s.registerDate);
    if (!d) return false;
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  return [
    { value: String(students.length),                          label: 'Tổng học viên',      tone: 'pu', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { value: String(count(students, 'Chờ khám sức khỏe')),     label: 'Chờ KSK',            tone: 'or', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: String(count(students, 'Đã khám sức khỏe')),      label: 'Đã KSK',             tone: 'gr', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: String(count(students, 'Đã nộp hồ sơ')),          label: 'Đã nộp hồ sơ',      tone: 'bl', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
    { value: String(count(students, 'Đang học')),               label: 'Đang học',           tone: 'bl', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: String(count(students, 'Chờ thi')),                label: 'Chờ thi',            tone: 'pu', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { value: String(count(students, 'Đã đỗ')),                  label: 'Đã đỗ',              tone: 'gr', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { value: String(count(students, 'Thi lại')),                label: 'Thi lại',            tone: 're', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { value: String(students.filter(hasDebt).length),           label: 'Còn nợ học phí',     tone: 'or', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: String(upcomingCount),                             label: 'Lịch thi (7 ngày)',  tone: 'pu', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { value: String(recentCount),                               label: 'Đăng ký gần đây',    tone: 'bl', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  ];
};

const buildUpcomingExams = (batches) =>
  batches.slice(0, 3).map((batch) => ({
    name: batch.name,
    status: batch.status,
    statusTone:
      batch.statusTone === 'orange' ? 'or'
      : batch.statusTone === 'blue' ? 'bl'
      : batch.statusTone,
    license: batch.licenseType,
    date: batch.date,
    students: String(batch.studentCount),
  }));

const BADGE = {
  'Mới đăng ký': 'blue', 'Chờ khám sức khỏe': 'orange', 'Đã khám sức khỏe': 'orange',
  'Chờ nộp hồ sơ': 'or', 'Đã nộp hồ sơ': 'green', 'Đang học': 'purple',
  'Chờ thi': 'neutral', 'Đã xếp lịch thi': 'blue',
  'Đã đỗ': 'green', 'Thi lại': 'red', 'Hủy': 'red', 'Tạm dừng': 'neutral',
  'Còn nợ học phí': 'orange', 'Hoàn tất': 'green',
};

const MISSING_DOC_STATUSES = ['Mới đăng ký', 'Chờ nộp hồ sơ', 'Chờ khám sức khỏe'];

const formatToday = () => {
  const formatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// ─── Mini chart phân bố theo hạng bằng ───────────────────────────────────────
const LicenseChart = ({ students }) => {
  const counts = useMemo(() => {
    const map = {};
    students.forEach((s) => { map[s.licenseType] = (map[s.licenseType] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const max = counts[0]?.[1] || 1;

  if (!counts.length) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px 0' }}>
        Chưa có dữ liệu học viên.
      </div>
    );
  }

  const getColor = (type) => {
    if (type === 'B2') return 'var(--accent-primary)';
    if (type === 'B1') return '#60a5fa';
    if (type.startsWith('A')) return '#34d399';
    return '#a78bfa';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
      {counts.map(([type, cnt]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
          <span style={{ width: '30px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
            {type}
          </span>
          <div style={{
            flex: 1, background: 'var(--bg-surface-strong)',
            borderRadius: '4px', height: '14px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${(cnt / max) * 100}%`, height: '100%',
              background: getColor(type), borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ width: '28px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
            {cnt}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [examBatches, setExamBatches] = useState([]);
  const todayLabel = formatToday();

  const stats          = buildStats(students, examBatches);
  const upcomingExams  = buildUpcomingExams(examBatches);
  const recentStudents = useMemo(() => [...students].sort((a, b) => b.id - a.id).slice(0, 5), [students]);
  const debtors        = useMemo(() => students.filter(hasDebt).slice(0, 5), [students]);
  const missingDocs    = useMemo(() => students.filter((s) => MISSING_DOC_STATUSES.includes(s.status)).slice(0, 5), [students]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getStudents(), getExamBatches()]).then(([studentList, batches]) => {
      if (!mounted) return;
      setStudents(studentList);
      setExamBatches(batches);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Tổng quan</h1>
          <span className="page-subtitle">Hôm nay: {todayLabel}</span>
        </div>
      </div>

      {/* ── Stat Cards (11 cards) ── */}
      <div className="dashboard-stat-grid">
        {stats.map((item) => (
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

      {/* ── Row 1: Lịch thi & Đăng ký gần đây ── */}
      <div className="dashboard-bottom-grid">
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Lịch thi sắp tới (7 ngày)</span>
            </div>
            <Link to={buildPathForCurrentUser('/exams')} className="secondary-button compact table-action-link">Xem tất cả</Link>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>ĐỢT THI</th><th>HẠNG</th><th>NGÀY THI</th><th>HV</th>
              </tr>
            </thead>
            <tbody>
              {upcomingExams.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Không có đợt thi nào trong 7 ngày tới.</td></tr>
              ) : upcomingExams.map((exam) => (
                <tr key={exam.name}>
                  <td>
                    <div className="table-title">{exam.name}</div>
                    <div className={`status-inline ${exam.statusTone}`}>
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d={exam.statusTone === 'or'
                            ? 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                            : 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'}
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{exam.status}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${exam.licenseTone || 'pu'}`}>{exam.license}</span></td>
                  <td>{exam.date}</td>
                  <td className="table-number">{exam.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Đăng ký gần đây</span>
            </div>
            <Link to={buildPathForCurrentUser('/students')} className="secondary-button compact table-action-link">Xem tất cả</Link>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>HỌ TÊN</th><th>HẠNG</th><th>KHU VỰC</th><th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={buildPathForCurrentUser(`/students/${s.id}`)} className="table-link" style={{ fontWeight: 600 }}>{s.name}</Link>
                  </td>
                  <td><span className="badge pu" style={{ fontWeight: 700, fontSize: '0.72rem' }}>{s.licenseType}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.region}</td>
                  <td><span className={`badge ${BADGE[s.status] || 'neutral'}`} style={{ fontSize: '0.72rem' }}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 2: Nợ học phí & Thiếu hồ sơ ── */}
      <div className="dashboard-bottom-grid" style={{ marginTop: '20px' }}>
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Học viên còn nợ học phí</span>
            </div>
            <Link to={buildPathForCurrentUser('/fees')} className="secondary-button compact table-action-link">Xem tất cả</Link>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>HỌ TÊN</th><th>HẠNG</th><th>CÔNG NỢ</th><th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {debtors.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>✓ Không có học viên nào còn nợ điều tốt 🎉</td></tr>
              ) : debtors.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={buildPathForCurrentUser(`/students/${s.id}`)} className="table-link" style={{ fontWeight: 600 }}>{s.name}</Link>
                  </td>
                  <td><span className="badge pu" style={{ fontSize: '0.72rem' }}>{s.licenseType}</span></td>
                  <td style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>{s.debt}đ</td>
                  <td><span className={`badge ${BADGE[s.status] || 'neutral'}`} style={{ fontSize: '0.72rem' }}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Học viên còn thiếu hồ sơ</span>
            </div>
            <Link to={buildPathForCurrentUser('/documents')} className="secondary-button compact table-action-link">Xem tất cả</Link>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>HỌ TÊN</th><th>HẠNG</th><th>TRẠNG THÁI</th><th></th>
              </tr>
            </thead>
            <tbody>
              {missingDocs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>✓ Tất cả học viên đã đủ hồ sơ.</td></tr>
              ) : missingDocs.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={buildPathForCurrentUser(`/students/${s.id}`)} className="table-link" style={{ fontWeight: 600 }}>{s.name}</Link>
                  </td>
                  <td><span className="badge pu" style={{ fontSize: '0.72rem' }}>{s.licenseType}</span></td>
                  <td><span className={`badge ${BADGE[s.status] || 'neutral'}`} style={{ fontSize: '0.72rem' }}>{s.status}</span></td>
                  <td>
                    <Link to={buildPathForCurrentUser(`/students/${s.id}`)} className="secondary-button compact table-action-link">Xử lý</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 3: Phân bố theo hạng bằng ── */}
      <div style={{ marginTop: '20px', marginBottom: '8px' }}>
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Phân bố học viên theo hạng bằng</span>
            </div>
            <Link to={buildPathForCurrentUser('/reports')} className="secondary-button compact table-action-link">Xem báo cáo</Link>
          </div>
          <div style={{ padding: '8px 16px 16px' }}>
            <LicenseChart students={students} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
