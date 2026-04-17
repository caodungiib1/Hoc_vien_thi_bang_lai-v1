import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '40px 20px',
    }}>
      {/* Icon lớn */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%', marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid rgba(99,102,241,0.2)',
      }}>
        <svg width="44" height="44" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Số 404 */}
      <div style={{
        fontSize: '5rem', fontWeight: 900, lineHeight: 1,
        background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 12,
      }}>
        404
      </div>

      <h1 style={{
        fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        Trang không tồn tại
      </h1>

      <p style={{
        fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 380,
        lineHeight: 1.6, marginBottom: 32,
      }}>
        Địa chỉ bạn truy cập không có trong hệ thống hoặc đã bị xóa.
        Kiểm tra lại URL hoặc quay về trang chủ.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate(-1)}
        >
          ← Quay lại
        </button>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
          🏠 Về trang chủ
        </Link>
      </div>

      {/* Quick links */}
      <div style={{ marginTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { to: '/students',     label: 'Học viên' },
          { to: '/exams',        label: 'Lịch thi' },
          { to: '/fees',         label: 'Học phí' },
          { to: '/reports',      label: 'Báo cáo' },
          { to: '/documents',    label: 'Hồ sơ' },
          { to: '/notifications',label: 'Thông báo' },
        ].map((link) => (
          <Link
            key={link.to} to={link.to}
            style={{
              fontSize: '0.8rem', color: 'var(--accent-primary)',
              textDecoration: 'none', padding: '4px 10px',
              borderRadius: 6, border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-strong)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NotFound;
