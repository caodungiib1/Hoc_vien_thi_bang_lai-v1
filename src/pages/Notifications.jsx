import React, { useEffect, useState } from 'react';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import {
  createNotificationRecord,
  getNotificationChannels,
  getNotificationHistory,
  getNotificationTemplates,
  getNotificationTriggers,
  updateNotificationTrigger,
} from '../services/notificationService';
import { getStudents } from '../services/studentService';

const CHANNEL_COLORS = { Zalo: 'gr', SMS: 'or', Email: 'bl' };

// ─── Tab 1: Lịch sử ──────────────────────────────────────────────────────────
const TabHistory = ({ history, channels }) => {
  const [filterCh, setFilterCh] = useState('Tất cả');

  const filtered = filterCh === 'Tất cả' ? history : history.filter(h => h.channel === filterCh);
  const sent  = history.filter(h => h.status === 'sent').length;
  const error = history.filter(h => h.status === 'error').length;
  const historyPagination = usePagination(filtered, {
    initialPageSize: 10,
    resetDeps: [filterCh],
  });

  return (
    <div>
      {/* Stat row */}
      <div className="notif-stat-row">
        <div className="notif-stat">
          <span className="notif-stat-val">{history.length}</span>
          <span className="notif-stat-label">Tổng đã gửi</span>
        </div>
        <div className="notif-stat" style={{ borderColor: 'var(--tone-emerald-text)' }}>
          <span className="notif-stat-val" style={{ color: 'var(--success)' }}>{sent}</span>
          <span className="notif-stat-label">Thành công</span>
        </div>
        <div className="notif-stat" style={{ borderColor: 'var(--tone-red-text)' }}>
          <span className="notif-stat-val" style={{ color: 'var(--danger)' }}>{error}</span>
          <span className="notif-stat-label">Lỗi</span>
        </div>
      </div>

      {/* Channel filter */}
      <div className="fees-tabs" style={{ marginBottom: '14px' }}>
        {['Tất cả', ...channels].map(ch => (
          <button
            key={ch}
            className={`fees-tab-btn ${filterCh === ch ? 'active' : ''}`}
            onClick={() => setFilterCh(ch)}
          >
            {ch}
            <span className="fees-tab-count">
              {ch === 'Tất cả' ? history.length : history.filter(h => h.channel === ch).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>HỌC VIÊN</th>
              <th>KÊNH</th>
              <th>MẪU TIN</th>
              <th>THỜI GIAN</th>
              <th>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {historyPagination.pageItems.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.student}</td>
                <td><span className={`badge ${CHANNEL_COLORS[r.channel]}`}>{r.channel}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{r.template}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{r.time}</td>
                <td>
                  {r.status === 'sent'
                    ? <span className="badge green">✓ Đã gửi</span>
                    : <span className="badge red">✗ Lỗi</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationControls
          page={historyPagination.page}
          totalPages={historyPagination.totalPages}
          totalItems={historyPagination.totalItems}
          pageSize={historyPagination.pageSize}
          startItem={historyPagination.startItem}
          endItem={historyPagination.endItem}
          onPageChange={historyPagination.setPage}
          onPageSizeChange={historyPagination.setPageSize}
          itemLabel="thông báo"
        />
      </div>
    </div>
  );
};

// ─── Tab 2: Gửi thủ công ─────────────────────────────────────────────────────
const TabSend = ({ channels, templates, students, onSent }) => {
  const [form, setForm] = useState({ studentId: '', templateId: '', channel: 'Zalo' });
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const student = students.find(s => String(s.id) === form.studentId);
  const template = templates.find(t => String(t.id) === form.templateId);

  const preview = template
    ? template.content
        .replace('{ho_ten}', student?.name || '[Tên học viên]')
        .replace('{hang_bang}', student?.licenseType || '[Hạng bằng]')
    : null;

  const handleSend = () => {
    if (!form.studentId || !form.templateId) return;
    onSent({
      student: student?.name || 'Không rõ',
      channel: form.channel,
      template: template?.name || '',
    });
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ studentId: '', templateId: '', channel: 'Zalo' }); }, 2500);
  };

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Gửi thông báo thủ công</span>
      </div>

      <div className="notif-send-form">
        {/* Học viên */}
        <div className="admin-form-group">
          <label className="admin-label">Học viên</label>
          <select className="settings-input" value={form.studentId} onChange={e => set('studentId', e.target.value)}>
            <option value="">— Chọn học viên —</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.licenseType})</option>
            ))}
          </select>
        </div>

        {/* Mẫu thông báo */}
        <div className="admin-form-group">
          <label className="admin-label">Mẫu thông báo</label>
          <select className="settings-input" value={form.templateId} onChange={e => set('templateId', e.target.value)}>
            <option value="">— Chọn mẫu tin —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Kênh gửi */}
        <div className="admin-form-group">
          <label className="admin-label">Kênh gửi</label>
          <div className="notif-channel-group">
            {channels.map(ch => (
              <label key={ch} className={`notif-channel-opt ${form.channel === ch ? 'active' : ''}`}>
                <input type="radio" name="channel" value={ch} checked={form.channel === ch} onChange={() => set('channel', ch)} style={{ display: 'none' }} />
                <span className={`badge ${CHANNEL_COLORS[ch]}`}>{ch}</span>
              </label>
            ))}
            <label className={`notif-channel-opt ${form.channel === 'Tất cả' ? 'active' : ''}`}>
              <input type="radio" name="channel" value="Tất cả" checked={form.channel === 'Tất cả'} onChange={() => set('channel', 'Tất cả')} style={{ display: 'none' }} />
              <span className="badge neutral">Tất cả kênh</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="admin-form-group">
            <label className="admin-label">Xem trước nội dung</label>
            <div className="notif-preview-box">{preview}</div>
          </div>
        )}

        {/* Nút Gửi */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={!form.studentId || !form.templateId}
            style={{ opacity: (!form.studentId || !form.templateId) ? 0.5 : 1 }}
          >
            ✉ Gửi ngay
          </button>
          {sent && <span className="admin-success" style={{ padding: '7px 14px' }}>✓ Đã gửi thành công! Kiểm tra lịch sử.</span>}
        </div>
      </div>
    </div>
  );
};

// ─── Tab 3: Cấu hình tự động ─────────────────────────────────────────────────
const TabAutoConfig = ({ triggers, setTriggers }) => {
  const toggle = async (id) => {
    const trigger = triggers.find(t => t.id === id);
    if (!trigger) return;
    const updatedTrigger = await updateNotificationTrigger(id, { ...trigger, enabled: !trigger.enabled });
    setTriggers(p => p.map(t => t.id === id ? { ...t, enabled: updatedTrigger.enabled } : t));
  };
  const allOn  = triggers.every(t => t.enabled);
  const toggleAll = () => setTriggers(p => p.map(t => ({ ...t, enabled: !allOn })));

  return (
    <div>
      <div className="settings-section-header">
        <span className="settings-section-title">Cấu hình thông báo tự động ({triggers.filter(t => t.enabled).length}/{triggers.length} đang bật)</span>
        <button className="secondary-button compact" onClick={toggleAll}>
          {allOn ? 'Tắt tất cả' : 'Bật tất cả'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {triggers.map(t => (
          <div key={t.id} className={`notif-trigger-card ${t.enabled ? 'enabled' : ''}`}>
            <div className="notif-trigger-info">
              <span className="notif-trigger-name">{t.name}</span>
              <span className="notif-trigger-desc">{t.desc}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span className={`badge ${CHANNEL_COLORS[t.channel] || 'neutral'}`} style={{ fontSize: '0.62rem' }}>{t.channel}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lần gửi cuối: {t.lastRun}</span>
              </div>
            </div>
            <button
              className={`toggle-switch ${t.enabled ? 'on' : ''}`}
              onClick={() => toggle(t.id)}
              title={t.enabled ? 'Đang bật — Nhấn để tắt' : 'Đang tắt — Nhấn để bật'}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Notifications Page ───────────────────────────────────────────────────────
const TABS = [
  { id: 'history', label: '📋 Lịch sử thông báo' },
  { id: 'send',    label: '✉️ Gửi thủ công'       },
  { id: 'auto',    label: '⚙️ Cấu hình tự động'   },
];

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [channels, setChannels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getNotificationChannels(),
      getNotificationTemplates(),
      getNotificationHistory(),
      getNotificationTriggers(),
      getStudents(),
    ]).then(([channelList, templateList, historyList, triggerList, studentList]) => {
      if (!mounted) return;
      setChannels(channelList);
      setTemplates(templateList);
      setHistory(historyList);
      setTriggers(triggerList);
      setStudents(studentList);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSent = async (record) => {
    const createdRecord = await createNotificationRecord(record);
    setHistory(prev => [createdRecord, ...prev]);
    setActiveTab('history');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Bot Thông báo</h1>
          <span className="page-subtitle">Quản lý và cấu hình hệ thống thông báo tự động cho học viên</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge gr" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            {triggers.filter(t => t.enabled).length} trigger đang bật
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card wrapper */}
      <div className="table-card">
        {activeTab === 'history' && <TabHistory channels={channels} history={history} />}
        {activeTab === 'send'    && <TabSend channels={channels} templates={templates} students={students} onSent={handleSent} />}
        {activeTab === 'auto'    && <TabAutoConfig triggers={triggers} setTriggers={setTriggers} />}
      </div>
    </div>
  );
};

export default Notifications;
