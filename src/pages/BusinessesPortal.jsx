import React, { useEffect, useRef, useState } from 'react';
import Businesses from './Businesses';
import {
  changeSystemPassword,
  getSystemCurrentUser,
  loginSystemAdmin,
  logoutSystemAdmin,
  syncSystemCurrentUser,
} from '../services/systemAuthService';

const INITIAL_FORM = {
  account: 'admin',
  password: 'admin',
};

const BusinessesLogin = ({ onAuthenticated }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await loginSystemAdmin(form);
      onAuthenticated(user);
    } catch (submitError) {
      setError(submitError.message || 'Không thể đăng nhập cổng quản trị hệ thống.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="system-auth-shell">
      <div className="system-auth-card">
        <div className="system-auth-card-head">
          <span className="system-auth-badge">Đăng nhập riêng</span>
          <h2>Đăng nhập cổng Businesses</h2>
          <p>Sử dụng tài khoản hệ thống để truy cập khu quản trị doanh nghiệp.</p>
        </div>

        {error && <div className="system-auth-error">{error}</div>}

        <form className="system-auth-form" onSubmit={handleSubmit}>
          <label className="system-auth-field">
            <span>Tài khoản</span>
            <input
              type="text"
              value={form.account}
              onChange={(event) => updateField('account', event.target.value)}
              placeholder="Nhập tài khoản hệ thống"
            />
          </label>

          <label className="system-auth-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </label>

          <button type="submit" className="system-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

const BusinessesShell = ({ currentUser, onLogout }) => {
  const avatarLetter = currentUser?.name?.charAt(0)?.toUpperCase() || 'A';
  const roleLabel = 'System admin';
  const profileRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeAccountModal, setActiveAccountModal] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const openAccountModal = (modalName) => {
    setIsProfileOpen(false);
    setPasswordMessage('');
    setActiveAccountModal(modalName);
  };

  const closeAccountModal = () => {
    setActiveAccountModal(null);
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordMessage('');
    setIsChangingPassword(false);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordMessage('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (passwordForm.next.length < 6) {
      setPasswordMessage('Mật khẩu mới cần có ít nhất 6 ký tự.');
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage('');

    try {
      const response = await changeSystemPassword({
        currentPassword: passwordForm.current,
        nextPassword: passwordForm.next,
      });

      setPasswordMessage(response.message || 'Đổi mật khẩu thành công.');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (error) {
      setPasswordMessage(error.message || 'Không thể đổi mật khẩu lúc này.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="system-shell">
        <header className="system-shell-header">
          <div className="system-shell-brand">
            <div className="system-shell-logo">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M9 14h.01M9 18h.01M15 10h.01M15 14h.01M15 18h.01" />
              </svg>
            </div>
            <div>
              <strong>QLHV System</strong>
              <span>Cổng quản trị doanh nghiệp</span>
            </div>
          </div>

          <div className="header-profile-wrapper" ref={profileRef}>
            <button className="header-profile-btn" onClick={() => setIsProfileOpen((prev) => !prev)}>
              <div className="hp-avatar">{avatarLetter}</div>
              <div className="hp-info">
                <span className="hp-name">{currentUser?.name || 'System Admin'}</span>
                <span className="hp-role">{currentUser?.email || 'admin'}</span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="header-profile-dropdown">
                <button type="button" className="hp-dropdown-item" onClick={() => openAccountModal('profile')}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Thông tin cá nhân
                </button>
                <button type="button" className="hp-dropdown-item" onClick={() => openAccountModal('password')}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Đổi mật khẩu
                </button>
                <button
                  type="button"
                  className="hp-dropdown-item hp-dropdown-item--danger"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="system-shell-main">
          <Businesses />
        </main>
      </div>

      {activeAccountModal && (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={closeAccountModal}>
          <div className="account-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-modal-header">
              <div>
                <span>Tài khoản</span>
                <h2>{activeAccountModal === 'profile' ? 'Thông tin cá nhân' : 'Đổi mật khẩu'}</h2>
              </div>
              <button type="button" className="account-modal-close" aria-label="Đóng" onClick={closeAccountModal}>
                ×
              </button>
            </div>

            {activeAccountModal === 'profile' ? (
              <div className="account-profile-card">
                <div className="account-profile-avatar">{avatarLetter}</div>
                <div className="account-profile-grid">
                  <div>
                    <span>Họ và tên</span>
                    <strong>{currentUser?.name || 'System Admin'}</strong>
                  </div>
                  <div>
                    <span>Email / tài khoản</span>
                    <strong>{currentUser?.email || 'admin'}</strong>
                  </div>
                  <div>
                    <span>Vai trò</span>
                    <strong>{roleLabel}</strong>
                  </div>
                  <div>
                    <span>Khu vực</span>
                    <strong>{currentUser?.centerName || 'Hệ thống'}</strong>
                  </div>
                  <div>
                    <span>Cổng truy cập</span>
                    <strong>/businesses</strong>
                  </div>
                </div>
              </div>
            ) : (
              <form className="account-password-form" onSubmit={handleChangePassword}>
                <label>
                  <span>Mật khẩu hiện tại</span>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </label>
                <label>
                  <span>Mật khẩu mới</span>
                  <input
                    type="password"
                    value={passwordForm.next}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </label>
                <label>
                  <span>Nhập lại mật khẩu mới</span>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </label>
                {passwordMessage && <div className="account-modal-message">{passwordMessage}</div>}
                <div className="account-modal-actions">
                  <button type="button" className="secondary-button" onClick={closeAccountModal}>Hủy</button>
                  <button type="submit" className="btn-primary" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Đang lưu...' : 'Lưu mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const BusinessesPortal = () => {
  const [currentUser, setCurrentUser] = useState(getSystemCurrentUser);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let mounted = true;

    syncSystemCurrentUser()
      .then((user) => {
        if (!mounted) return;
        setCurrentUser(user);
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setIsSyncing(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logoutSystemAdmin();
    setCurrentUser(null);
  };

  if (isSyncing) {
    return (
      <div className="system-portal">
        <div className="system-portal-loading">Đang kiểm tra phiên quản trị hệ thống...</div>
      </div>
    );
  }

  return (
    <div className="system-portal">
      {currentUser?.isSystemAdmin
        ? <BusinessesShell currentUser={currentUser} onLogout={handleLogout} />
        : <BusinessesLogin onAuthenticated={setCurrentUser} />}
    </div>
  );
};

export default BusinessesPortal;
