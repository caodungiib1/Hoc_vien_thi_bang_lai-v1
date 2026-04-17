import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRoleDefinition } from '../services/permissionService';

const pageNames = {
  '/': 'Tổng quan',
  '/students': 'Học viên',
  '/classes': 'Lớp học',
  '/exams': 'Lịch thi',
  '/fees': 'Học phí',
  '/documents': 'Hồ sơ học viên',
  '/referrers': 'Người giới thiệu',
  '/reports': 'Kết quả KD',
  '/notifications': 'BOT thông báo',
  '/settings': 'Cài đặt',
  '/admin': 'Admin',
  '/tasks': 'Nhắc việc',
};

const Header = ({ theme, onThemeChange, isSidebarCollapsed, onMenuToggle, currentUser, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeAccountModal, setActiveAccountModal] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const profileRef = useRef(null);

  const pageName = location.pathname.startsWith('/students/')
    ? 'Chi tiết học viên'
    : pageNames[location.pathname] || 'Tổng quan';

  const user = currentUser || { name: 'Quản trị viên', role: 'Quản trị viên' };
  const roleInfo = getRoleDefinition(user.role);
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : 'Q';

  const openAccountModal = (modalName) => {
    setIsProfileOpen(false);
    setPasswordMessage('');
    setActiveAccountModal(modalName);
  };

  const closeAccountModal = () => {
    setActiveAccountModal(null);
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordMessage('');
  };

  const handleChangePassword = (event) => {
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

    setPasswordMessage('Đã ghi nhận yêu cầu đổi mật khẩu. Bước sau sẽ nối API đổi mật khẩu thật.');
    setPasswordForm({ current: '', next: '', confirm: '' });
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
      <div className="header">
        <div className="header-left">
          <button
            type="button"
            className="icon-button header-nav-button"
            aria-label={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            onClick={onMenuToggle}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="header-breadcrumb">
            <span className="header-breadcrumb-label">{pageName}</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="theme-switch" role="group" aria-label="Chuyển giao diện">
            <button
              type="button"
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onThemeChange('light')}
              aria-pressed={theme === 'light'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="8" r="3" />
                <path strokeLinecap="round" d="M8 1.5v1.5M8 13v1.5M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M14.5 8h-1.5M3 8H1.5M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05" />
              </svg>
              <span>Sáng</span>
            </button>

            <button
              type="button"
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onThemeChange('dark')}
              aria-pressed={theme === 'dark'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5a6.5 6.5 0 108.5 8.5A7 7 0 0112 3.5z" />
              </svg>
              <span>Tối</span>
            </button>
          </div>

          <div className="header-profile-wrapper" ref={profileRef}>
            <button className="header-profile-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <div className="hp-avatar">{avatarLetter}</div>
              <div className="hp-info">
                <span className="hp-name">{user.name}</span>
                <span className="hp-role">{roleInfo.label}</span>
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
                <button type="button" className="hp-dropdown-item hp-dropdown-item--danger" onClick={() => { setIsProfileOpen(false); if (onLogout) onLogout(); else navigate('/auth'); }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
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
                    <strong>{user.name}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{user.email || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span>Vai trò</span>
                    <strong>{roleInfo.label}</strong>
                  </div>
                  <div>
                    <span>Trung tâm</span>
                    <strong>{user.centerName || 'Chưa cập nhật'}</strong>
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
                  <button type="submit" className="btn-primary">Lưu mật khẩu</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
