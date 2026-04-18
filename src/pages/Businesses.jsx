import React, { useEffect, useMemo, useState } from 'react';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import { getOrganizationsOverview } from '../services/businessService';

const STATUS_FILTERS = ['Tất cả', 'Hoạt động', 'Offline', 'Chưa hoạt động'];

const fmtDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
};

const getStatusMeta = (status) => {
  switch (status) {
    case 'active':
      return { label: 'Hoạt động', tone: 'green' };
    case 'offline':
      return { label: 'Offline', tone: 'neutral' };
    default:
      return { label: 'Chưa hoạt động', tone: 'orange' };
  }
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

const BusinessAccountsModal = ({ business, onClose }) => {
  const accountPagination = usePagination(business?.accounts || [], {
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
    resetDeps: [business?.organizationId],
  });

  if (!business) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide business-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-title">Chi tiết doanh nghiệp #{business.organizationCode}</span>
            <div className="detail-list-meta">{business.centerName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="business-detail-grid">
            <div className="detail-field">
              <span className="detail-field-label">Trạng thái</span>
              <span className="detail-field-value">
                <span className={`badge ${getStatusMeta(business.status).tone}`}>{getStatusMeta(business.status).label}</span>
              </span>
            </div>
            <div className="detail-field">
              <span className="detail-field-label">Admin chính</span>
              <span className="detail-field-value">{business.primaryAdmin?.name || 'Chưa có'}</span>
            </div>
            <div className="detail-field">
              <span className="detail-field-label">Email admin</span>
              <span className="detail-field-value">{business.primaryAdmin?.email || '—'}</span>
            </div>
            <div className="detail-field">
              <span className="detail-field-label">Tài khoản đang hoạt động</span>
              <span className="detail-field-value">{business.activeAccounts}/{business.totalAccounts}</span>
            </div>
          </div>

          <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>TÀI KHOẢN</th>
                  <th>VAI TRÒ</th>
                  <th>TRẠNG THÁI</th>
                  <th>ĐĂNG NHẬP CUỐI</th>
                </tr>
              </thead>
              <tbody>
                {accountPagination.pageItems.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="table-title">{account.name}</div>
                      <div className="detail-list-meta">{account.email}</div>
                    </td>
                    <td>{account.role}</td>
                    <td><span className={`badge ${account.status === 'active' ? 'green' : 'neutral'}`}>{account.statusLabel}</span></td>
                    <td>{account.lastLoginAt ? fmtDateTime(account.lastLoginAt) : 'Chưa đăng nhập'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              page={accountPagination.page}
              totalPages={accountPagination.totalPages}
              totalItems={accountPagination.totalItems}
              pageSize={accountPagination.pageSize}
              startItem={accountPagination.startItem}
              endItem={accountPagination.endItem}
              onPageChange={accountPagination.setPage}
              onPageSizeChange={accountPagination.setPageSize}
              pageSizeOptions={accountPagination.pageSizeOptions}
              itemLabel="tài khoản"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Businesses = () => {
  const [organizations, setOrganizations] = useState([]);
  const [activeWindowMinutes, setActiveWindowMinutes] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    let mounted = true;

    getOrganizationsOverview().then((data) => {
      if (!mounted) return;
      setOrganizations(data.organizations || []);
      setActiveWindowMinutes(data.activeWindowMinutes || 15);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrganizations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return organizations.filter((organization) => {
      if (statusFilter !== 'Tất cả' && getStatusMeta(organization.status).label !== statusFilter) {
        return false;
      }

      if (!keyword) return true;

      return [
        organization.organizationCode,
        organization.centerName,
        organization.primaryAdmin?.name,
        organization.primaryAdmin?.email,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
    });
  }, [organizations, search, statusFilter]);

  const businessPagination = usePagination(filteredOrganizations, {
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
    resetDeps: [search, statusFilter],
  });

  const summary = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter((item) => item.status === 'active').length,
    offline: organizations.filter((item) => item.status === 'offline').length,
    idle: organizations.filter((item) => item.status === 'idle').length,
    accounts: organizations.reduce((sum, item) => sum + item.totalAccounts, 0),
  }), [organizations]);

  return (
    <div>
      {selectedBusiness && (
        <BusinessAccountsModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />
      )}

      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Doanh nghiệp</h1>
          <span className="page-subtitle">
            Giám sát toàn bộ doanh nghiệp trong tool. Doanh nghiệp được xem là hoạt động nếu có phiên dùng trong {activeWindowMinutes} phút gần nhất.
          </span>
        </div>
      </div>

      <div className="stats-grid businesses-stats-grid" style={{ marginBottom: '20px' }}>
        <StatCard label="Tổng doanh nghiệp" value={summary.total} tone="blue" icon="M4 7h16M4 12h16M4 17h10" />
        <StatCard label="Đang hoạt động" value={summary.active} tone="green" icon="M5 13l4 4L19 7" />
        <StatCard label="Offline" value={summary.offline} tone="neutral" icon="M18.364 5.636l-12.728 12.728M6.343 6.343l11.314 11.314" />
        <StatCard label="Chưa hoạt động" value={summary.idle} tone="orange" icon="M12 8v4l3 3" />
        <StatCard label="Tổng tài khoản" value={summary.accounts} tone="purple" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>Danh sách doanh nghiệp</div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {filteredOrganizations.length} doanh nghiệp
          </span>
        </div>

        <div className="student-filters" style={{ marginBottom: '16px' }}>
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
            </svg>
            <input
              className="search-input"
              placeholder="Tìm theo mã doanh nghiệp, trung tâm, email admin..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="fees-tabs" style={{ marginLeft: 'auto' }}>
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={`fees-tab-btn ${statusFilter === item ? 'active' : ''}`}
                onClick={() => setStatusFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID DOANH NGHIỆP</th>
                <th>TRUNG TÂM</th>
                <th>QUẢN TRỊ VIÊN</th>
                <th>QUẢN LÝ TT</th>
                <th>NV TUYỂN SINH</th>
                <th>KẾ TOÁN</th>
                <th>NV CHĂM SÓC</th>
                <th>TRẠNG THÁI</th>
                <th>HOẠT ĐỘNG GẦN NHẤT</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {businessPagination.pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Không có doanh nghiệp phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : businessPagination.pageItems.map((organization) => {
                const statusMeta = getStatusMeta(organization.status);
                const lastActivityText = organization.status === 'active'
                  ? `Đang online • ${fmtDateTime(organization.lastActivityAt)}`
                  : organization.status === 'offline'
                    ? `Offline từ ${fmtDateTime(organization.offlineSinceAt)}`
                    : 'Chưa có đăng nhập';

                return (
                  <tr key={organization.organizationId}>
                    <td className="table-strong">#{organization.organizationCode}</td>
                    <td>
                      <div className="table-title">{organization.centerName}</div>
                      <div className="detail-list-meta">
                        {organization.totalAccounts} tài khoản • Admin: {organization.primaryAdmin?.email || 'Chưa có'}
                      </div>
                    </td>
                    <td className="table-number">{organization.roleCounts.admin}</td>
                    <td className="table-number">{organization.roleCounts.manager}</td>
                    <td className="table-number">{organization.roleCounts.sales}</td>
                    <td className="table-number">{organization.roleCounts.acct}</td>
                    <td className="table-number">{organization.roleCounts.care}</td>
                    <td>
                      <span className={`badge ${statusMeta.tone}`}>{statusMeta.label}</span>
                    </td>
                    <td style={{ minWidth: '190px' }}>{lastActivityText}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary-button compact"
                        onClick={() => setSelectedBusiness(organization)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <PaginationControls
            page={businessPagination.page}
            totalPages={businessPagination.totalPages}
            totalItems={businessPagination.totalItems}
            pageSize={businessPagination.pageSize}
            startItem={businessPagination.startItem}
            endItem={businessPagination.endItem}
            onPageChange={businessPagination.setPage}
            onPageSizeChange={businessPagination.setPageSize}
            pageSizeOptions={businessPagination.pageSizeOptions}
            itemLabel="doanh nghiệp"
          />
        </div>
      </div>
    </div>
  );
};

export default Businesses;
