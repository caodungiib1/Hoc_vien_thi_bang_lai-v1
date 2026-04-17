import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMockStudentProfileById } from '../data/mockStudentProfiles';
import { getAccounts } from '../services/adminService';
import { exportXlsx } from '../services/exportService';
import { getBusinessReport } from '../services/reportService';
import { getStudentProfiles } from '../services/studentService';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const fmtM = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  return new Intl.NumberFormat('vi-VN').format(n);
};
const parseMoneyValue = (value) => Number(String(value ?? '').replace(/[^\d]/g, '')) || 0;
const fmtChartTick = (n) => {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  }
  return new Intl.NumberFormat('vi-VN').format(n);
};

// ─── StatCard ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, iconPath, colorClass }) => (
  <div className="stat-card-small">
    <div className={`stat-icon ${colorClass}`}>
      <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d={iconPath} />
      </svg>
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px' }}>{sub}</span>}
    </div>
  </div>
);

// ─── Bar Chart (CSS thuần) ───────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const [tooltip, setTooltip] = useState(null);
  if (!data.length) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>Đang tải dữ liệu biểu đồ...</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxEnrolled = Math.max(...data.map(d => d.enrolled), 1);

  return (
    <div className="bar-chart-wrap">
      {/* Y-axis labels */}
      <div className="bar-chart-ylabels">
        {[100, 75, 50, 25, 0].map(pct => (
          <span key={pct}>{fmtChartTick(maxRevenue * pct / 100)}</span>
        ))}
      </div>

      {/* Bars area */}
      <div className="bar-chart-area">
        {/* Gridlines */}
        <div className="bar-chart-grid">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="bar-grid-line" />)}
        </div>

        {/* Bars */}
        <div className="bar-chart-bars">
          {data.map((d, i) => (
            <div key={i} className="bar-group"
              onMouseEnter={() => setTooltip(i)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Tooltip */}
              {tooltip === i && (
                <div className="bar-tooltip">
                  <strong>{d.month}</strong>
                  <span>Đăng ký: {d.enrolled} HV</span>
                  <span>Doanh thu: {fmt(d.revenue)}</span>
                  <span>Đã thu: {fmt(d.collected)}</span>
                </div>
              )}
              {/* Revenue bar */}
              <div className="bar-item-wrap">
                <div
                  className="bar-fill bar-revenue"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                />
                <div
                  className="bar-fill bar-collected"
                  style={{ height: `${(d.collected / maxRevenue) * 100}%` }}
                />
              </div>
              {/* Enrolled dots */}
              <div className="bar-enrolled-dot" style={{ bottom: `${(d.enrolled / maxEnrolled) * 80}%` }}>
                <span className="bar-enrolled-label">{d.enrolled}</span>
              </div>
              <span className="bar-label">{d.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Progress Bar ────────────────────────────────────────────────────────────
const ProgressBar = ({ value, colorClass }) => (
  <div className="report-progress-wrap">
    <div className="progress-track report-progress-track">
      <div
        className={`progress-fill progress-${colorClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="report-progress-value">{value}%</span>
  </div>
);

// ─── Reports Page ────────────────────────────────────────────────────────────
const Reports = () => {
  const [chartPeriod, setChartPeriod] = useState('6M');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]   = useState('');
  const [profiles, setProfiles] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [report, setReport] = useState({
    kpi: {
      totalStudents: 0,
      totalRevenue: 0,
      totalCollected: 0,
      totalDebt: 0,
      passRate: 0,
      retakeRate: 0,
      newThisMonth: 0,
    },
    monthlyStats: [],
    byLicense: [],
    byRegion: [],
    referrers: [],
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getBusinessReport(chartPeriod),
      getStudentProfiles(),
      getAccounts().catch(() => []),
    ]).then(([businessReport, profileList, accountList]) => {
      if (!mounted) return;
      setReport(businessReport);
      setProfiles(profileList);
      setAccounts(accountList);
    });
    return () => { mounted = false; };
  }, [chartPeriod]);

  const validConsultantNames = useMemo(() => (
    new Set(
      accounts
        .map((account) => String(account.name || '').trim())
        .filter(Boolean),
    )
  ), [accounts]);

  const resolveConsultantName = (profile) => {
    const rawName = String(profile.consultant || '').trim();
    if (!rawName) return 'Chưa phân công';

    const defaultConsultant = getMockStudentProfileById(profile.id)?.consultant;
    const isSeededConsultant = rawName === defaultConsultant;

    if (validConsultantNames.size > 0) {
      return validConsultantNames.has(rawName) ? rawName : 'Chưa phân công';
    }

    return isSeededConsultant ? 'Chưa phân công' : rawName;
  };

  // ── Bảng theo Nhân viên tư vấn ───────────────────────────────────────────
  const byConsultant = useMemo(() => {
    const map = {};
    profiles.forEach((p) => {
      const name = p.consultant || 'Chưa phân công';
      const consultantName = resolveConsultantName(p);
      if (!map[consultantName]) map[consultantName] = { name: consultantName, count: 0, passed: 0, debt: 0 };
      map[name] = map[consultantName];
      map[name].count += 1;
      if (p.status === 'Đã đỗ') map[name].passed += 1;
      const debtNum = parseMoneyValue(p.tuition?.debt ?? p.debt);
      map[name].debt += debtNum;
    });
    return Array.from(new Map(Object.values(map).map((item) => [item.name, item])).values()).sort((a, b) => {
      if (a.name === 'Chưa phân công') return 1;
      if (b.name === 'Chưa phân công') return -1;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [profiles, validConsultantNames]);

  const consultantCount = useMemo(() => (
    byConsultant.filter((row) => row.name !== 'Chưa phân công').length
  ), [byConsultant]);

  const chartData = report.monthlyStats;
  const { kpi } = report;
  const reportRows = [
    { group: 'KPI', name: 'Tổng học viên', value1: kpi.totalStudents, value2: `+${kpi.newThisMonth} tháng này`, note: '' },
    { group: 'KPI', name: 'Tổng doanh thu', value1: fmt(kpi.totalRevenue), value2: '', note: 'Tổng học phí ký kết' },
    { group: 'KPI', name: 'Đã thu', value1: fmt(kpi.totalCollected), value2: `Còn nợ ${fmt(kpi.totalDebt)}`, note: '' },
    { group: 'KPI', name: 'Tỷ lệ đỗ', value1: `${kpi.passRate}%`, value2: '', note: 'Trong số đã thi' },
    { group: 'KPI', name: 'Tỷ lệ thi lại', value1: `${kpi.retakeRate}%`, value2: '', note: 'Cần theo dõi' },
    ...report.monthlyStats.map((item) => ({
      group: `Tháng ${chartPeriod}`,
      name: item.month,
      value1: fmt(item.revenue),
      value2: fmt(item.collected),
      note: `${item.enrolled} học viên đăng ký`,
    })),
    ...report.byLicense.map((item) => ({
      group: 'Theo hạng bằng',
      name: item.type,
      value1: `${item.count} học viên`,
      value2: fmt(item.revenue),
      note: `Tỷ lệ đỗ ${item.passRate}%`,
    })),
    ...report.byRegion.map((item) => ({
      group: 'Theo khu vực',
      name: item.region,
      value1: `${item.count} học viên`,
      value2: fmt(item.revenue),
      note: '',
    })),
    ...report.referrers.map((item) => ({
      group: 'Người giới thiệu',
      name: item.name,
      value1: item.phone,
      value2: `${item.studentCount} học viên`,
      note: `Hoa hồng ${fmt(item.commission)}`,
    })),
  ];

  const handleExportReport = () => {
    exportXlsx({
      fileName: `bao-cao-kinh-doanh-${chartPeriod}`,
      sheetName: 'Báo cáo KD',
      columns: [
        { label: 'Nhóm dữ liệu', value: (row) => row.group },
        { label: 'Chỉ tiêu',     value: (row) => row.name },
        { label: 'Giá trị 1',    value: (row) => String(row.value1) },
        { label: 'Giá trị 2',    value: (row) => String(row.value2) },
        { label: 'Ghi chú',      value: (row) => row.note },
      ],
      rows: reportRows,
    });
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Kết quả Kinh doanh</h1>
          <span className="page-subtitle">Tổng hợp hiệu quả tuyển sinh và doanh thu trung tâm</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Bộ lọc ngày */}
          <input
            type="date" className="filter-select"
            value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
            title="Từ ngày" style={{ maxWidth: '140px' }}
          />
          <input
            type="date" className="filter-select"
            value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
            title="Đến ngày" style={{ maxWidth: '140px' }}
          />
          {(filterDateFrom || filterDateTo) && (
            <button className="secondary-button compact" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}>
              ✕
            </button>
          )}
          <button type="button" className="secondary-button compact" onClick={handleExportReport}>↓ Xuất Excel</button>
        </div>
      </div>
      {(filterDateFrom || filterDateTo) && (
        <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '12px' }}>
          🗓 Đang lọc dữ liệu từ {filterDateFrom || '…'} đến {filterDateTo || '…'} (tính năng lọc sẽ tác động khi có real API)
        </div>
      )}

      {/* ── KPI StatCards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '22px' }}>
        <StatCard
          label="Tổng học viên"
          value={kpi.totalStudents}
          sub={`+${kpi.newThisMonth} tháng này`}
          iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          colorClass="bl"
        />
        <StatCard
          label="Tổng doanh thu"
          value={fmtM(kpi.totalRevenue) + 'đ'}
          sub="Tổng học phí ký kết"
          iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          colorClass="pu"
        />
        <StatCard
          label="Đã thu"
          value={fmtM(kpi.totalCollected) + 'đ'}
          sub={`Còn nợ: ${fmtM(kpi.totalDebt)}đ`}
          iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          colorClass="gr"
        />
        <StatCard
          label="Tỷ lệ đỗ"
          value={`${kpi.passRate}%`}
          sub="Trong số đã thi"
          iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          colorClass="gr"
        />
        <StatCard
          label="Tỷ lệ thi lại"
          value={`${kpi.retakeRate}%`}
          sub="Cần theo dõi"
          iconPath="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          colorClass="or"
        />
      </div>

      {/* ── Biểu đồ doanh thu ── */}
      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="table-card-header">
          <div>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Doanh thu & Đăng ký theo tháng
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['3M', '6M'].map(p => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-color)',
                  background: chartPeriod === p ? 'var(--accent-primary)' : 'var(--bg-surface-strong)',
                  color: chartPeriod === p ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="chart-legend">
          <span className="legend-dot legend-revenue" /> Doanh thu
          <span className="legend-dot legend-collected" style={{ marginLeft: '16px' }} /> Đã thu
          <span className="legend-dot legend-enrolled" style={{ marginLeft: '16px' }} /> Số HV đăng ký
        </div>

        <BarChart data={chartData} />
      </div>

      {/* ── Bảng thống kê ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Theo hạng bằng */}
        <div className="table-card">
          <div className="table-card-header">
            <div>Thống kê theo Hạng bằng</div>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>HẠNG</th>
                <th>SỐ HV</th>
                <th>DOANH THU</th>
                <th>TỶ LỆ ĐỖ</th>
              </tr>
            </thead>
            <tbody>
              {report.byLicense.map(r => (
                <tr key={r.type}>
                  <td><span className={`badge ${r.color}`} style={{ fontWeight: 800 }}>{r.type}</span></td>
                  <td style={{ fontWeight: 700 }}>{r.count} HV</td>
                  <td style={{ fontWeight: 600 }}>{fmtM(r.revenue)}đ</td>
                  <td style={{ minWidth: '120px' }}>
                    <ProgressBar
                      value={r.passRate}
                      colorClass={r.passRate >= 80 ? 'green' : r.passRate >= 50 ? 'blue' : 'red'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Theo khu vực */}
        <div className="table-card">
          <div className="table-card-header">
            <div>Thống kê theo Khu vực</div>
          </div>
          <table className="lite-table">
            <thead>
              <tr>
                <th>KHU VỰC</th>
                <th>SỐ HV</th>
                <th>DOANH THU</th>
              </tr>
            </thead>
            <tbody>
              {report.byRegion
                .sort((a, b) => b.count - a.count)
                .map(r => (
                  <tr key={r.region}>
                    <td style={{ fontWeight: 500 }}>{r.region}</td>
                    <td style={{ fontWeight: 700 }}>{r.count}</td>
                    <td style={{ fontWeight: 600 }}>{fmtM(r.revenue)}đ</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Báo cáo theo Nhân viên tư vấn ── */}
      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="table-card-header">
          <div>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Kết quả theo Nhân viên tư vấn</span>
          </div>
          <span className="badge neutral">{consultantCount} NVTV</span>
        </div>
        <table className="lite-table">
          <thead>
            <tr>
              <th>#</th><th>NHÂN VIÊN TƯ VẤN</th><th>SỐ HV</th><th>HV ĐÃ ĐỖ</th><th>TỶ LỆ ĐỖ</th><th>CÔNG NỢ CÒN LẠI</th>
            </tr>
          </thead>
          <tbody>
            {byConsultant.map((row, i) => (
              <tr key={row.name}>
                <td>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800,
                    background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : 'var(--bg-surface-strong)',
                    color: i < 2 ? '#fff' : 'var(--text-secondary)',
                  }}>{i + 1}</span>
                </td>
                <td style={{ fontWeight: 700 }}>{row.name}</td>
                <td><span className="badge bl">{row.count} HV</span></td>
                <td><span className="badge gr">{row.passed} HV</span></td>
                <td>
                  <ProgressBar
                    value={row.count > 0 ? Math.round(row.passed / row.count * 100) : 0}
                    colorClass={row.count > 0 && (row.passed / row.count) >= 0.7 ? 'green' : 'blue'}
                  />
                </td>
                <td style={{ color: row.debt > 0 ? '#ef4444' : 'var(--success)', fontWeight: 700 }}>
                  {row.debt > 0 ? new Intl.NumberFormat('vi-VN').format(row.debt) + 'đ' : '✓ Đủ'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Top Người giới thiệu ── */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Top Người giới thiệu
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            {report.referrers.length} người giới thiệu
          </span>
          <Link to="/referrers" className="secondary-button compact table-action-link">
            Quản lý chi tiết
          </Link>
        </div>
        <table className="lite-table">
          <thead>
            <tr>
              <th>#</th>
              <th>HỌ TÊN</th>
              <th>SỐ ĐIỆN THOẠI</th>
              <th>SỐ HỌC VIÊN</th>
              <th>HOA HỒNG ƯỚC TÍNH</th>
            </tr>
          </thead>
          <tbody>
            {report.referrers.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--tone-slate-bg)',
                    color: i < 3 ? '#fff' : 'var(--text-secondary)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800,
                  }}>
                    {i + 1}
                  </span>
                </td>
                <td style={{ fontWeight: 700 }}>{r.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{r.phone}</td>
                <td>
                  <span className="badge pu" style={{ fontWeight: 800 }}>{r.studentCount} HV</span>
                </td>
                <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(r.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
