import React, { useEffect, useState } from 'react';
import {
  createLicenseItem,
  createRegionItem,
  createSourceItem,
  deleteLicenseItem,
  deleteRegionItem,
  deleteSourceItem,
  getLicenseSettings,
  getRegionSettings,
  getSourceSettings,
  getStatusSettings,
  getTemplateSettings,
  updateTemplateItem,
} from '../services/settingsService';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (
  Number.isFinite(Number(n))
    ? `${new Intl.NumberFormat('vi-VN').format(Number(n))}đ`
    : '—'
);

const BADGE_COLORS = {
  blue: '#2563eb', green: '#059669', orange: '#d97706',
  red: '#dc2626', purple: '#7c3aed', neutral: '#475569',
};

// ─── Reusable Components ─────────────────────────────────────────────────────

const SectionHeader = ({ title, onAdd, addLabel = '+ Thêm mới' }) => (
  <div className="settings-section-header">
    <span className="settings-section-title">{title}</span>
    <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '7px 14px' }} onClick={onAdd}>
      {addLabel}
    </button>
  </div>
);

const DeleteBtn = ({ onClick }) => (
  <button className="btn-danger-sm" onClick={onClick}>Xóa</button>
);

// ─── Tab: Hạng bằng ──────────────────────────────────────────────────────────
const TabLicenses = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: '', name: '', fee: '', duration: '' });

  useEffect(() => {
    let mounted = true;

    getLicenseSettings().then((licenses) => {
      if (mounted) {
        setItems(licenses);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAdd = async () => {
    if (!form.type || !form.name) return;
    const createdItem = await createLicenseItem({ ...form, fee: Number(String(form.fee).replace(/\D/g, '')) });
    setItems(prev => [...prev, createdItem]);
    setForm({ type: '', name: '', fee: '', duration: '' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await deleteLicenseItem(id);
    setItems(p => p.filter(x => x.id !== id));
  };

  return (
    <div>
      <SectionHeader title={`Danh mục Hạng bằng (${items.length})`} onAdd={() => setShowForm(v => !v)} />
      {showForm && (
        <div className="settings-form-inline">
          <input className="settings-input" placeholder="Hạng (VD: B2)" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} />
          <input className="settings-input" placeholder="Tên hạng bằng" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={{ flex: 2 }} />
          <input className="settings-input" placeholder="Học phí (VD: 15000000)" value={form.fee} onChange={e => setForm(f => ({...f, fee: e.target.value}))} />
          <input className="settings-input" placeholder="Thời gian (VD: 6 tháng)" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} />
          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '7px 14px', whiteSpace: 'nowrap' }} onClick={handleAdd}>Lưu</button>
          <button className="secondary-button" style={{ fontSize: '0.8rem', padding: '7px 14px', whiteSpace: 'nowrap' }} onClick={() => setShowForm(false)}>Hủy</button>
        </div>
      )}
      <table className="lite-table settings-table">
        <thead><tr><th>HẠNG</th><th>TÊN ĐẦY ĐỦ</th><th>HỌC PHÍ MẶC ĐỊNH</th><th>THỜI GIAN</th><th></th></tr></thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id}>
              <td><span className="badge pu" style={{ fontWeight: 800 }}>{r.type}</span></td>
              <td style={{ fontWeight: 500 }}>{r.name}</td>
              <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{fmt(r.fee)}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{r.duration}</td>
              <td><DeleteBtn onClick={() => handleDelete(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Tab: Khu vực ────────────────────────────────────────────────────────────
const TabRegions = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [val, setVal] = useState('');

  useEffect(() => {
    let mounted = true;

    getRegionSettings().then((regions) => {
      if (mounted) {
        setItems(regions);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAdd = async () => {
    if (!val.trim()) return;
    const createdItem = await createRegionItem({ name: val.trim() });
    setItems(prev => [...prev, createdItem]);
    setVal(''); setShowForm(false);
  };

  const handleDelete = async (id) => {
    await deleteRegionItem(id);
    setItems(p => p.filter(x => x.id !== id));
  };

  return (
    <div>
      <SectionHeader title={`Danh mục Khu vực (${items.length})`} onAdd={() => setShowForm(v => !v)} />
      {showForm && (
        <div className="settings-form-inline">
          <input className="settings-input" placeholder="Tên khu vực (VD: Quận Phú Nhuận)" value={val} onChange={e => setVal(e.target.value)} style={{ flex: 2 }} />
          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '7px 14px', whiteSpace: 'nowrap' }} onClick={handleAdd}>Lưu</button>
          <button className="secondary-button" style={{ fontSize: '0.8rem', padding: '7px 14px', whiteSpace: 'nowrap' }} onClick={() => setShowForm(false)}>Hủy</button>
        </div>
      )}
      <div className="settings-tag-grid">
        {items.map(r => (
          <div key={r.id} className="settings-tag">
            <span>{r.name}</span>
            <button className="settings-tag-del" onClick={() => handleDelete(r.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab: Trạng thái ─────────────────────────────────────────────────────────
const TabStatuses = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;

    getStatusSettings().then((statuses) => {
      if (mounted) {
        setItems(statuses);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Trạng thái học viên ({items.length})</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Chuẩn hoá theo tài liệu thiết kế</span>
      </div>
      <div className="settings-status-grid">
        {items.map(s => (
          <div key={s.id} className="settings-status-card">
            <span className="settings-status-dot" style={{ background: BADGE_COLORS[s.color] || '#94a3b8' }} />
            <span className="settings-status-label">{s.label}</span>
            <span className={`badge ${s.color}`} style={{ marginLeft: 'auto', fontSize: '0.62rem' }}>{s.color}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab: Mẫu thông báo ──────────────────────────────────────────────────────
const TabTemplates = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    let mounted = true;

    getTemplateSettings().then((templates) => {
      if (mounted) {
        setItems(templates);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const startEdit = (item) => { setEditing(item.id); setEditContent(item.content); };
  const saveEdit = async (id) => {
    const updatedItem = await updateTemplateItem(id, { content: editContent });
    setItems(p => p.map(x => x.id === id ? { ...x, content: updatedItem.content } : x));
    setEditing(null);
  };

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Mẫu thông báo tự động ({items.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(t => (
          <div key={t.id} className="settings-template-card">
            <div className="settings-template-header">
              <div>
                <span className="settings-template-name">{t.name}</span>
                <span className="settings-template-trigger">Kích hoạt: <strong>{t.trigger}</strong></span>
              </div>
              {editing === t.id
                ? <div style={{ display:'flex', gap:'6px' }}>
                    <button className="btn-primary" style={{ fontSize:'0.75rem', padding:'5px 12px' }} onClick={() => saveEdit(t.id)}>Lưu</button>
                    <button className="secondary-button" style={{ fontSize:'0.75rem', padding:'5px 12px' }} onClick={() => setEditing(null)}>Hủy</button>
                  </div>
                : <button className="secondary-button compact" onClick={() => startEdit(t)}>Sửa nội dung</button>
              }
            </div>
            {editing === t.id
              ? <textarea className="settings-textarea" value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
              : <p className="settings-template-content">{t.content}</p>
            }
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab: Nguồn học viên ─────────────────────────────────────────────────────
const TabSources = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    let mounted = true;

    getSourceSettings().then((sources) => {
      if (mounted) {
        setItems(sources);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const createdItem = await createSourceItem(form);
    setItems(prev => [...prev, createdItem]);
    setForm({ name: '', description: '' }); setShowForm(false);
  };

  const handleDelete = async (id) => {
    await deleteSourceItem(id);
    setItems(p => p.filter(x => x.id !== id));
  };

  return (
    <div>
      <SectionHeader title={`Nguồn học viên (${items.length})`} onAdd={() => setShowForm(v => !v)} />
      {showForm && (
        <div className="settings-form-inline">
          <input className="settings-input" placeholder="Tên nguồn (VD: TikTok)" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <input className="settings-input" placeholder="Mô tả" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ flex: 2 }} />
          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '7px 14px', whiteSpace: 'nowrap' }} onClick={handleAdd}>Lưu</button>
          <button className="secondary-button" style={{ fontSize: '0.8rem', padding: '7px 14px', whiteSpace: 'nowrap' }} onClick={() => setShowForm(false)}>Hủy</button>
        </div>
      )}
      <table className="lite-table settings-table">
        <thead><tr><th>NGUỒN</th><th>MÔ TẢ</th><th></th></tr></thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id}>
              <td style={{ fontWeight: 600 }}>{r.name}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{r.description}</td>
              <td><DeleteBtn onClick={() => handleDelete(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Settings Tabs Definition ────────────────────────────────────────────────
const TABS = [
  { id: 'licenses',  icon: '🎓', label: 'Hạng bằng',            sub: 'Danh mục & học phí',    Component: TabLicenses },
  { id: 'regions',   icon: '📍', label: 'Khu vực',              sub: 'Vùng tuyển sinh',       Component: TabRegions  },
  { id: 'statuses',  icon: '🔁', label: 'Trạng thái học viên',  sub: '14 trạng thái chuẩn',  Component: TabStatuses },
  { id: 'templates', icon: '📢', label: 'Mẫu thông báo',        sub: 'Tin nhắn tự động',      Component: TabTemplates},
  { id: 'sources',   icon: '📣', label: 'Nguồn học viên',       sub: 'Kênh tuyển sinh',       Component: TabSources  },
];

const EmptySettingsTab = () => null;

// ─── Settings Page ───────────────────────────────────────────────────────────
const Settings = () => {
  const [activeTab, setActiveTab] = useState('licenses');
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.Component ?? EmptySettingsTab;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Cài đặt hệ thống</h1>
          <span className="page-subtitle">Quản lý cấu hình danh mục và tham số vận hành trung tâm</span>
        </div>
      </div>

      <div className="settings-layout">
        {/* Side nav */}
        <div className="settings-sidenav">
          <p className="settings-nav-group-label">CẤU HÌNH CHUNG</p>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="settings-nav-icon">{tab.icon}</span>
              <span className="settings-nav-text">
                <span className="settings-nav-label">{tab.label}</span>
                <span className="settings-nav-sub">{tab.sub}</span>
              </span>
              {activeTab === tab.id && <span className="settings-nav-arrow">›</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Settings;
