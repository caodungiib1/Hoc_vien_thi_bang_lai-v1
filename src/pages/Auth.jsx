import React, { useState } from 'react';
import { forgotPassword, login, register } from '../services/authService';

const REMEMBER_EMAIL_KEY = 'qlhv.auth.remember.email';

const getSavedEmail = () => {
  try { return window.localStorage.getItem(REMEMBER_EMAIL_KEY) || ''; }
  catch { return ''; }
};

const buildInitialLoginForm = () => {
  const savedEmail = getSavedEmail();
  return {
    email: savedEmail,
    password: '',
    remember: Boolean(savedEmail),
  };
};

const REGISTER_FORM = {
  name: '',
  email: '',
  phone: '',
  centerName: '',
  password: '',
  confirmPassword: '',
};

const Auth = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState(buildInitialLoginForm);
  const [registerForm, setRegisterForm] = useState(REGISTER_FORM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setL = (k, v) => setLoginForm((p) => ({ ...p, [k]: v }));
  const setR = (k, v) => setRegisterForm((p) => ({ ...p, [k]: v }));
  const switchMode = () => { setIsLogin((p) => !p); setError(''); setNotice(''); };

  /* ── handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setNotice(''); setIsSubmitting(true);
    try {
      onAuthenticated(await login(loginForm));
      // Ghi nhớ hoặc xóa email tùy theo checkbox
      try {
        if (loginForm.remember) {
          window.localStorage.setItem(REMEMBER_EMAIL_KEY, loginForm.email);
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch { /* bỏ qua nếu storage bị chặn */ }
    }
    catch (err) { setError(err.message || 'Không thể đăng nhập.'); }
    finally { setIsSubmitting(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setNotice('');
    if (!registerForm.name.trim()) return setError('Vui lòng nhập họ và tên.');
    if (!registerForm.email.trim()) return setError('Vui lòng nhập email.');
    if (!registerForm.phone.trim()) return setError('Vui lòng nhập số điện thoại.');
    if (!/^0\d{9}$/.test(registerForm.phone.trim())) return setError('SĐT không hợp lệ (10 số, bắt đầu bằng 0).');
    if (registerForm.password.length < 6) return setError('Mật khẩu cần ít nhất 6 ký tự.');
    if (registerForm.password !== registerForm.confirmPassword) return setError('Mật khẩu xác nhận chưa khớp.');
    setIsSubmitting(true);
    try { onAuthenticated(await register(registerForm)); }
    catch (err) { setError(err.message || 'Không thể đăng ký.'); }
    finally { setIsSubmitting(false); }
  };

  const handleForgot = async () => {
    setError(''); setNotice('');
    try { const d = await forgotPassword(loginForm.email); setNotice(d.message); }
    catch (err) { setError(err.message || 'Không thể gửi yêu cầu.'); }
  };

  return (
    <div className="sp-page">
      <div className={`sp-card ${isLogin ? '' : 'sp-card--reg'}`}>

        {/* ─── NỬA TRÁI ────────────────────────────────── */}
        <div className="sp-left">
          {/* Form Login (hiển thị khi isLogin) */}
          <div className={`sp-form-wrap ${isLogin ? 'sp-visible' : 'sp-hidden'}`}>
            <div className="sp-form-inner">
              <div className="sp-icon sp-icon--purple">
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2>Đăng nhập</h2>
              <p className="sp-subtitle">Chào mừng bạn quay trở lại!</p>

              {error && isLogin && <div className="sp-error">{error}</div>}
              {notice && isLogin && <div className="sp-notice">{notice}</div>}

              <form onSubmit={handleLogin} className="sp-fields">
                <label className="sp-label">
                  <span>Email</span>
                  <input type="email" className="sp-input" value={loginForm.email}
                    onChange={(e) => setL('email', e.target.value)} placeholder="Nhập địa chỉ email" />
                </label>
                <label className="sp-label">
                  <span>Mật khẩu</span>
                  <input type="password" className="sp-input" value={loginForm.password}
                    onChange={(e) => setL('password', e.target.value)} placeholder="Nhập mật khẩu" />
                </label>
                <div className="sp-options">
                  <label className="sp-remember">
                    <input type="checkbox" checked={loginForm.remember}
                      onChange={(e) => setL('remember', e.target.checked)} />
                    <span>Ghi nhớ</span>
                  </label>
                  <button type="button" className="sp-forgot" onClick={handleForgot}>Quên mật khẩu?</button>
                </div>
                <button type="submit" className="sp-btn sp-btn--purple" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang đăng nhập...' : '🔑 Đăng nhập'}
                </button>
              </form>
              <p className="sp-alt">Chưa có tài khoản? <button type="button" onClick={switchMode} className="sp-link">Đăng ký ngay</button></p>
            </div>
          </div>

          {/* Panel xanh lá (hiển thị khi !isLogin) */}
          <div className={`sp-panel sp-panel--green ${!isLogin ? 'sp-visible' : 'sp-hidden'}`}>
            <div className="sp-panel-inner">
              <div className="sp-panel-circle">
                <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3>Đã có tài khoản?</h3>
              <p>Đăng nhập để tiếp tục sử dụng<br />hệ thống quản lý lái xe</p>
              <button type="button" className="sp-panel-btn" onClick={switchMode}>→ Đăng nhập</button>
            </div>
          </div>
        </div>

        {/* ─── NỬA PHẢI ────────────────────────────────── */}
        <div className="sp-right">
          {/* Panel tím (hiển thị khi isLogin) */}
          <div className={`sp-panel sp-panel--purple ${isLogin ? 'sp-visible' : 'sp-hidden'}`}>
            <div className="sp-panel-inner">
              <div className="sp-panel-circle">
                <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3>Chưa có tài khoản?</h3>
              <p>Đăng ký ngay để trải nghiệm<br />hệ thống quản lý chuyên nghiệp</p>
              <button type="button" className="sp-panel-btn" onClick={switchMode}>→ Đăng ký ngay</button>
            </div>
          </div>

          {/* Form Register (hiển thị khi !isLogin) */}
          <div className={`sp-form-wrap ${!isLogin ? 'sp-visible' : 'sp-hidden'}`}>
            <div className="sp-form-inner">
              <div className="sp-icon sp-icon--green">
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2>Tạo tài khoản</h2>
              <p className="sp-subtitle">Đăng ký để bắt đầu sử dụng</p>

              {error && !isLogin && <div className="sp-error">{error}</div>}

              <form onSubmit={handleRegister} className="sp-fields">
                <div className="sp-row">
                  <label className="sp-label">
                    <span>Họ và tên</span>
                    <input className="sp-input" value={registerForm.name}
                      onChange={(e) => setR('name', e.target.value)} placeholder="Nguyễn Văn A" />
                  </label>
                  <label className="sp-label">
                    <span>Số điện thoại</span>
                    <input type="tel" className="sp-input" value={registerForm.phone}
                      onChange={(e) => setR('phone', e.target.value)} placeholder="0912345678" maxLength={11} />
                  </label>
                </div>
                <label className="sp-label">
                  <span>Email</span>
                  <input type="email" className="sp-input" value={registerForm.email}
                    onChange={(e) => setR('email', e.target.value)} placeholder="email@example.com" />
                </label>
                <label className="sp-label">
                  <span>Tên trung tâm</span>
                  <input className="sp-input" value={registerForm.centerName}
                    onChange={(e) => setR('centerName', e.target.value)} placeholder="VD: Trung tâm lái xe An Đức" />
                </label>
                <div className="sp-row">
                  <label className="sp-label">
                    <span>Mật khẩu</span>
                    <input type="password" className="sp-input" value={registerForm.password}
                      onChange={(e) => setR('password', e.target.value)} placeholder="Tối thiểu 6 ký tự" />
                  </label>
                  <label className="sp-label">
                    <span>Xác nhận</span>
                    <input type="password" className="sp-input" value={registerForm.confirmPassword}
                      onChange={(e) => setR('confirmPassword', e.target.value)} placeholder="Nhập lại" />
                  </label>
                </div>
                <button type="submit" className="sp-btn sp-btn--green" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang tạo tài khoản...' : '✨ Đăng ký tài khoản'}
                </button>
              </form>
              <p className="sp-alt">Đã có tài khoản? <button type="button" onClick={switchMode} className="sp-link">Đăng nhập</button></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
