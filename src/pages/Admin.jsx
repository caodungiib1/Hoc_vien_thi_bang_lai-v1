import React, { useEffect, useState } from 'react';
import {
  createAccount,
  getAccounts,
  getPermissionMatrix,
  getRoles,
  getSystemLogs,
  resetAccountPassword,
  toggleAccountLock,
} from '../services/adminService';

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const initials = (name) => name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

// ─── Tab: Danh sách tài khoản ─────────────────────────────────────────────────
const TabAccounts = ({ accounts, roles, setAccounts }) => {
  const [confirmReset, setConfirmReset] = useState(null);
  // Backend có thể trả role dạng label ('Quản trị viên') hoặc id ('admin') — hỗ trợ cả hai.
  const roleMap = Object.fromEntries([
    ...roles.map(r => [r.id, r]),
    ...roles.map(r => [r.label, r]),
  ]);

  const toggleLock = async (id) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    const updatedAccount = await toggleAccountLock(account);
    setAccounts(prev => prev.map(a => a.id === id ? updatedAccount : a));
  };

  const handleReset = async (id) => {
    await resetAccountPassword(id);
    setConfirmReset(id);
    setTimeout(() => setConfirmReset(null), 2500);
  };

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Danh sách tài khoản ({accounts.length})</span>
      </div>
      <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>TÀI KHOẢN</th>
              <th>VAI TRÒ</th>
              <th>NGÀY TẠO</th>
              <th>ĐĂNG NHẬP CUỐI</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, idx) => {
              const role = roleMap[acc.role] || { label: acc.role, color: 'neutral' };
              const isActive = acc.status === 'active';
              return (
                <tr key={acc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="account-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                        {initials(acc.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{acc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${role.color}`}>{role.label}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{acc.created}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{acc.lastLogin}</td>
                  <td>
                    <span className={`badge ${isActive ? 'green' : 'neutral'}`}>
                      {isActive ? '● Hoạt động' : '● Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        className={isActive ? 'btn-danger-sm' : 'btn-table-action'}
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => toggleLock(acc.id)}
                        disabled={acc.role === 'admin' || acc.role === 'Quản trị viên'}
                        title={acc.role === 'admin' || acc.role === 'Quản trị viên' ? 'Không thể khóa tài khoản Admin' : ''}
                      >
                        {isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                      <button
                        className="secondary-button compact"
                        onClick={() => handleReset(acc.id)}
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                      >
                        {confirmReset === acc.id ? '✓ Đã gửi!' : 'Reset MK'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab: Tạo tài khoản mới ───────────────────────────────────────────────────
const TabCreateAccount = ({ roles, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', role: 'sales', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email) return setError('Vui lòng điền đầy đủ Họ tên và Email.');
    if (!form.password || form.password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    if (form.password !== form.confirm) return setError('Mật khẩu xác nhận không khớp.');
    
    try {
      await onCreated(form);
      setForm({ name: '', email: '', role: 'sales', password: '', confirm: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản.');
    }
  };

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Tạo tài khoản mới</span>
      </div>
      <form onSubmit={handleSubmit} className="admin-create-form">
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Họ và tên *</label>
            <input className="settings-input" placeholder="VD: Nguyễn Văn A" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Email *</label>
            <input className="settings-input" type="email" placeholder="VD: nhanvien@trungtam.vn" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Vai trò</label>
            <select className="settings-input filter-select" value={form.role} onChange={e => set('role', e.target.value)}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="admin-form-group" />
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Mật khẩu *</label>
            <input className="settings-input" type="password" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Xác nhận mật khẩu *</label>
            <input className="settings-input" type="password" placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">✓ Tạo tài khoản thành công! Tài khoản đã được thêm vào danh sách.</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button type="submit" className="btn-primary">Tạo tài khoản</button>
          <button type="button" className="secondary-button" onClick={() => setForm({ name: '', email: '', role: 'sales', password: '', confirm: '' })}>Đặt lại</button>
        </div>
      </form>
    </div>
  );
};

// ─── Permission Matrix ────────────────────────────────────────────────────────
const PermissionMatrix = ({ modules, permissions, roles }) => (
  <div>
    <div className="settings-section-header" style={{ marginTop: '24px' }}>
      <span className="settings-section-title">Bảng phân quyền theo vai trò</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Đang áp dụng theo vai trò đăng nhập</span>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table className="lite-table perm-table">
        <thead>
          <tr>
            <th style={{ minWidth: '130px' }}>MODULE</th>
            {roles.map(r => (
              <th key={r.id} style={{ textAlign: 'center', minWidth: '110px' }}>
                <span className={`badge ${r.color}`} style={{ fontSize: '0.62rem' }}>{r.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod, mi) => (
            <tr key={mod}>
              <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{mod}</td>
              {roles.map(r => (
                <td key={r.id} style={{ textAlign: 'center' }}>
                  {permissions[r.id]?.[mi]
                    ? <span className="perm-check">✓</span>
                    : <span className="perm-cross">✗</span>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Tab: Nhật ký hệ thống ───────────────────────────────────────────────────
const TabSystemLogs = ({ logs }) => {
  const successCount = logs.filter(log => log.status === 'Thành công').length;
  const errorCount = logs.length - successCount;
  const moduleCount = new Set(logs.map(log => log.module)).size;

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Nhật ký hệ thống ({logs.length})</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Theo dõi các thao tác thêm, sửa, xóa và cập nhật dữ liệu quan trọng
        </span>
      </div>

      <div className="system-log-summary">
        <div className="system-log-stat">
          <span className="system-log-value">{logs.length}</span>
          <span className="system-log-label">Tổng sự kiện</span>
        </div>
        <div className="system-log-stat">
          <span className="system-log-value">{successCount}</span>
          <span className="system-log-label">Thành công</span>
        </div>
        <div className="system-log-stat">
          <span className="system-log-value">{errorCount}</span>
          <span className="system-log-label">Cần kiểm tra</span>
        </div>
        <div className="system-log-stat">
          <span className="system-log-value">{moduleCount}</span>
          <span className="system-log-label">Module phát sinh</span>
        </div>
      </div>

      <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <table className="data-table system-log-table">
          <thead>
            <tr>
              <th>MÃ LOG</th>
              <th>THỜI GIAN</th>
              <th>NGƯỜI THAO TÁC</th>
              <th>HÀNH ĐỘNG</th>
              <th>MODULE</th>
              <th>ĐỐI TƯỢNG</th>
              <th>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td><span className="system-log-id">{log.id}</span></td>
                <td>{log.time}</td>
                <td>
                  <div className="system-log-actor">{log.actor}</div>
                </td>
                <td>{log.action}</td>
                <td><span className="badge pu">{log.module}</span></td>
                <td>{log.target}</td>
                <td><span className={`badge ${log.tone}`}>{log.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Admin Page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'list',   label: 'Danh sách tài khoản', icon: '👥' },
  { id: 'create', label: 'Tạo tài khoản mới',   icon: '➕' },
  { id: 'logs',   label: 'Nhật ký hệ thống',    icon: '🧾' },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [roles, setRoles] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [permissionMatrix, setPermissionMatrix] = useState({ modules: [], permissions: {} });

  useEffect(() => {
    let mounted = true;

    Promise.all([getRoles(), getAccounts(), getPermissionMatrix(), getSystemLogs()]).then(
      ([roleList, accountList, matrix, systemLogs]) => {
        if (!mounted) return;
        setRoles(roleList);
        setAccounts(accountList);
        setPermissionMatrix(matrix);
        setLogs(systemLogs);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreated = async (newAcc) => {
    const createdAccount = await createAccount(newAcc);
    setAccounts(prev => [...prev, createdAccount]);
    setActiveTab('list');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Quản lý Tài khoản</h1>
          <span className="page-subtitle">Quản lý tài khoản nhân viên và phân quyền truy cập hệ thống</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge gr" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            {accounts.filter(a => a.status === 'active').length} đang hoạt động
          </span>
          <span className="badge neutral" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            {accounts.filter(a => a.status === 'locked').length} đã khóa
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tabs-container" style={{ marginBottom: '20px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="table-card">
        {activeTab === 'list' && <TabAccounts accounts={accounts} roles={roles} setAccounts={setAccounts} />}
        {activeTab === 'create' && <TabCreateAccount roles={roles} onCreated={handleCreated} />}
        {activeTab === 'logs' && <TabSystemLogs logs={logs} />}
      </div>

      {/* Permission matrix */}
      {activeTab !== 'logs' && (
        <div className="table-card" style={{ marginTop: '20px' }}>
          <PermissionMatrix modules={permissionMatrix.modules} permissions={permissionMatrix.permissions} roles={roles} />
        </div>
      )}
    </div>
  );
};

export default Admin;
