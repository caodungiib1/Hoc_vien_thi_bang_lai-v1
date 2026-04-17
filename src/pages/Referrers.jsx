import React, { useEffect, useState } from 'react';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import {
  createReferrer,
  getRecentReferrals,
  getReferrers,
  getReferrerSummary,
  getSourcePerformance,
  resetReferrersToDefault,
} from '../services/referrerService';

const fmt = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
const fmtShort = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}Mđ`;
  return fmt(value);
};

const SOURCE_FILTERS = ['Tất cả', 'Cộng tác viên', 'Học viên cũ', 'Đại lý khu vực', 'Nội bộ'];
const EMPTY_REFERRER_FORM = {
  name: '',
  phone: '',
  source: 'Cộng tác viên',
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
      {sub && <span className="referrer-stat-sub">{sub}</span>}
    </div>
  </div>
);

const CreateReferrerModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_REFERRER_FORM);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Vui lòng nhập tên người giới thiệu.');
    if (!form.phone.trim()) return setError('Vui lòng nhập số điện thoại liên hệ.');

    const createdReferrer = await createReferrer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      source: form.source,
      note: form.note.trim() || 'Người giới thiệu mới, cần theo dõi chất lượng nguồn học viên.',
    });

    onCreated(createdReferrer);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">+ Thêm người giới thiệu</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="admin-form-group">
            <label className="admin-label">Tên người giới thiệu *</label>
            <input
              className="settings-input"
              value={form.name}
              onChange={event => set('name', event.target.value)}
              placeholder="VD: Nguyễn Minh Tú"
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Số điện thoại *</label>
              <input
                className="settings-input"
                value={form.phone}
                onChange={event => set('phone', event.target.value)}
                placeholder="VD: 0901234567"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Nguồn</label>
              <select
                className="settings-input"
                value={form.source}
                onChange={event => set('source', event.target.value)}
              >
                {SOURCE_FILTERS.filter(source => source !== 'Tất cả').map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Ghi chú</label>
            <textarea
              className="settings-input settings-textarea"
              value={form.note}
              onChange={event => set('note', event.target.value)}
              placeholder="Ghi chú về khu vực, nhóm khách hoặc chính sách hoa hồng..."
              rows={3}
            />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu người giới thiệu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Referrers = () => {
  const [summary, setSummary] = useState({
    totalReferrers: 0,
    totalStudents: 0,
    totalRevenue: 0,
    totalCommission: 0,
    bestSource: 'Chưa có',
    bestSourceStudents: 0,
  });
  const [referrers, setReferrers] = useState([]);
  const [sources, setSources] = useState([]);
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [activeSource, setActiveSource] = useState('Tất cả');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getReferrerSummary(),
      getReferrers(),
      getSourcePerformance(),
      getRecentReferrals(),
    ]).then(([referrerSummary, referrerList, sourceList, referralList]) => {
      if (!mounted) return;
      setSummary(referrerSummary);
      setReferrers(referrerList);
      setSources(sourceList);
      setRecentReferrals(referralList);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredReferrers = activeSource === 'Tất cả'
    ? referrers
    : referrers.filter((referrer) => referrer.source === activeSource);
  const referrerPagination = usePagination(filteredReferrers, {
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
    resetDeps: [activeSource],
  });
  const recentReferralPagination = usePagination(recentReferrals, {
    initialPageSize: 6,
    pageSizeOptions: [6, 12, 24],
  });

  const sourceCount = (source) => (
    source === 'Tất cả'
      ? referrers.length
      : referrers.filter((referrer) => referrer.source === source).length
  );

  const handleCreatedReferrer = (createdReferrer) => {
    setReferrers(prev => [createdReferrer, ...prev]);
    setSummary(prev => ({
      ...prev,
      totalReferrers: prev.totalReferrers + 1,
    }));
    if (activeSource !== 'Tất cả' && activeSource !== createdReferrer.source) {
      setActiveSource('Tất cả');
    }
    setSuccessMessage(`Đã thêm người giới thiệu "${createdReferrer.name}".`);
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const handleResetReferrers = async () => {
    const referrerList = await resetReferrersToDefault();
    const referrerSummary = await getReferrerSummary();

    setReferrers(referrerList);
    setSummary(referrerSummary);
    setActiveSource('Tất cả');
    setSuccessMessage('Đã khôi phục dữ liệu người giới thiệu mẫu.');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  return (
    <div>
      {showCreateModal && (
        <CreateReferrerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreatedReferrer}
        />
      )}

      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Người giới thiệu</h1>
          <span className="page-subtitle">
            Quản lý cộng tác viên, nguồn học viên và hoa hồng giới thiệu.
          </span>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button compact">↓ Xuất báo cáo</button>
          <button type="button" className="secondary-button compact" onClick={handleResetReferrers}>Khôi phục mẫu</button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Thêm người giới thiệu</button>
        </div>
      </div>

      {successMessage && <div className="page-success-message">{successMessage}</div>}

      <div className="dashboard-stat-grid referrer-stat-grid">
        <StatCard
          label="Người giới thiệu"
          value={summary.totalReferrers}
          sub="Đang theo dõi"
          tone="pu"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <StatCard
          label="Học viên mang về"
          value={summary.totalStudents}
          sub="Tổng đã ghi nhận"
          tone="bl"
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"
        />
        <StatCard
          label="Doanh thu mang về"
          value={fmtShort(summary.totalRevenue)}
          sub="Theo hợp đồng học phí"
          tone="gr"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M12 8V7m0 1v8"
        />
        <StatCard
          label="Hoa hồng ước tính"
          value={fmtShort(summary.totalCommission)}
          sub="Chưa bao gồm điều chỉnh"
          tone="or"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          label="Nguồn hiệu quả nhất"
          value={summary.bestSourceStudents}
          sub={summary.bestSource}
          tone="re"
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      <div className="referrer-layout">
        <div className="table-card referrer-main-card">
          <div className="table-card-header">
            <div>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Danh sách người giới thiệu</span>
            </div>
            <span className="badge neutral">{filteredReferrers.length} người</span>
          </div>

          <div className="fees-tabs referrer-tabs">
            {SOURCE_FILTERS.map((source) => (
              <button
                key={source}
                type="button"
                className={`fees-tab-btn ${activeSource === source ? 'active' : ''}`}
                onClick={() => setActiveSource(source)}
              >
                {source}
                <span className="fees-tab-count">{sourceCount(source)}</span>
              </button>
            ))}
          </div>

          <div className="table-container referrer-table-container">
            <table className="data-table referrer-table">
              <thead>
                <tr>
                  <th>NGƯỜI GIỚI THIỆU</th>
                  <th>NGUỒN</th>
                  <th>HỌC VIÊN</th>
                  <th>DOANH THU</th>
                  <th>HOA HỒNG</th>
                  <th>TRẠNG THÁI</th>
                  <th>GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {referrerPagination.pageItems.map((referrer) => (
                  <tr key={referrer.id}>
                    <td>
                      <div className="table-title">{referrer.name}</div>
                      <div className="detail-list-meta">{referrer.phone} • Lần cuối: {referrer.lastStudent}</div>
                    </td>
                    <td><span className="badge pu">{referrer.source}</span></td>
                    <td className="table-number">{referrer.studentCount}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(referrer.revenue)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 800 }}>{fmt(referrer.commission)}</td>
                    <td><span className={`badge ${referrer.statusTone}`}>{referrer.status}</span></td>
                    <td className="referrer-note-cell">{referrer.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              page={referrerPagination.page}
              totalPages={referrerPagination.totalPages}
              totalItems={referrerPagination.totalItems}
              pageSize={referrerPagination.pageSize}
              startItem={referrerPagination.startItem}
              endItem={referrerPagination.endItem}
              onPageChange={referrerPagination.setPage}
              onPageSizeChange={referrerPagination.setPageSize}
              pageSizeOptions={referrerPagination.pageSizeOptions}
              itemLabel="người giới thiệu"
            />
          </div>
        </div>

        <div className="referrer-side-stack">
          <div className="table-card">
            <div className="table-card-header">
              <div>Nguồn học viên</div>
              <span className="badge neutral">{sources.length} nguồn</span>
            </div>
            <div className="source-performance-list">
              {sources.map((source) => (
                <div key={source.id} className="source-performance-item">
                  <div className="source-performance-top">
                    <span className="source-performance-name">{source.name}</span>
                    <span className={`badge ${source.tone}`}>{source.conversionRate}%</span>
                  </div>
                  <div className="source-performance-meta">
                    <span>{source.studentCount} học viên</span>
                    <span>{fmtShort(source.revenue)}</span>
                  </div>
                  <div className="progress-track referrer-progress">
                    <div
                      className={`progress-fill progress-${source.conversionRate >= 50 ? 'green' : source.conversionRate >= 35 ? 'blue' : 'red'}`}
                      style={{ width: `${source.conversionRate}%` }}
                    />
                  </div>
                  <div className="source-performance-cost">Chi phí {fmtShort(source.cost)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <div>Giới thiệu gần đây</div>
              <span className="badge neutral">{recentReferrals.length} lượt</span>
            </div>
            <div className="recent-referral-list">
              {recentReferralPagination.pageItems.map((item) => (
                <div key={item.id} className="recent-referral-item">
                  <div>
                    <div className="table-title">{item.studentName}</div>
                    <div className="detail-list-meta">{item.referrer} • {item.date}</div>
                  </div>
                  <div className="recent-referral-value">
                    <span className="badge pu">{item.licenseType}</span>
                    <span>{fmtShort(item.commission)}</span>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={recentReferralPagination.page}
              totalPages={recentReferralPagination.totalPages}
              totalItems={recentReferralPagination.totalItems}
              pageSize={recentReferralPagination.pageSize}
              startItem={recentReferralPagination.startItem}
              endItem={recentReferralPagination.endItem}
              onPageChange={recentReferralPagination.setPage}
              onPageSizeChange={recentReferralPagination.setPageSize}
              pageSizeOptions={recentReferralPagination.pageSizeOptions}
              itemLabel="lượt giới thiệu"
              className="card"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrers;
