import React from 'react';
import { useNavigate } from 'react-router-dom';
import { buildOrganizationPath } from '../services/orgRouteService';
import {
  getDefaultPathForUser,
  getModuleDefinition,
  getRoleDefinition,
} from '../services/permissionService';

const AccessDenied = ({ currentUser, moduleKey }) => {
  const navigate = useNavigate();
  const fallbackPath = buildOrganizationPath(currentUser, getDefaultPathForUser(currentUser));
  const moduleInfo = getModuleDefinition(moduleKey);
  const roleInfo = getRoleDefinition(currentUser?.role);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(239,68,68,0.16), rgba(245,158,11,0.16))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(239,68,68,0.2)',
      }}>
        <svg width="44" height="44" fill="none" stroke="#ef4444" strokeWidth="1.7" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.93 19h12.14c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L4.2 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
      </div>

      <div style={{
        fontSize: '3.8rem',
        fontWeight: 900,
        lineHeight: 1,
        color: '#ef4444',
        marginBottom: 12,
      }}>
        403
      </div>

      <h1 style={{
        fontSize: '1.35rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        Bạn không có quyền truy cập
      </h1>

      <p style={{
        fontSize: '0.92rem',
        color: 'var(--text-secondary)',
        maxWidth: 460,
        lineHeight: 1.6,
        marginBottom: 28,
      }}>
        Vai trò <strong>{roleInfo.label}</strong> không được phép truy cập module{' '}
        <strong>{moduleInfo?.title || 'này'}</strong>.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate(fallbackPath)}
        >
          Về màn hình được cấp quyền
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
