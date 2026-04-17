import React, { useEffect, useMemo, useState } from 'react';
import { collectFee, getFeeOverview, getFeeRecords, getPaymentHistory } from '../services/feeService';
import { getStudents } from '../services/studentService';
import { exportXlsx } from '../services/exportService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const parseVNDate = (str) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  return new Date(+parts[2], +parts[1] - 1, +parts[0]);
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Đã đóng đủ':    return { cls: 'green',   label: 'Đã đóng đủ' };
    case 'Còn nợ':        return { cls: 'orange',  label: 'Còn nợ' };
    case 'Quá hạn':       return { cls: 'red',     label: 'Quá hạn' };
    case 'Đóng một phần': return { cls: 'blue',    label: 'Đóng 1 phần' };
    default:              return { cls: 'neutral',  label: status };
  }
};

const TABS = ['Tất cả', 'Đã đóng đủ', 'Đóng một phần', 'Còn nợ', 'Quá hạn'];
const PAYMENT_METHODS = ['Tiền mặt', 'Chuyển khoản', 'Thẻ ngân hàng'];

// ─── StatCard ─────────────────────────────────────────────────────────────────
const FeeStatCard = ({ label, value, iconPath, colorClass, sub }) => (
  <div className="stat-card-small">
    <div className={`stat-icon ${colorClass}`}>
      <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d={iconPath} />
      </svg>
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub}</span>}
    </div>
  </div>
);

// ─── PrintReceiptModal ────────────────────────────────────────────────────────
const PrintReceiptModal = ({ record, onClose }) => {
  const today = new Date().toLocaleDateString('vi-VN');

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=600,height=700');
    win.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Phiếu thu học phí — ${record.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #000; }
          h2 { text-align: center; text-transform: uppercase; margin-bottom: 4px; font-size: 16px; }
          .center { text-align: center; }
          .subtitle { text-align: center; font-size: 12px; margin-bottom: 24px; color: #555; }
          .divider { border-top: 1px solid #ccc; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
          .label { color: #555; }
          .value { font-weight: bold; }
          .total-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 15px; font-weight: bold; }
          .debt-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; color: #d00; font-weight: bold; }
          .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 12px; }
          .sign-box { text-align: center; }
          .sign-box div { margin-top: 48px; border-top: 1px solid #000; padding-top: 4px; font-size: 12px; }
          @media print { button { display: none !important; } body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h2>Trung tâm Đào tạo Lái xe</h2>
        <div class="subtitle">PHIẾU THU HỌC PHÍ</div>
        <div class="divider"></div>
        <div class="row"><span class="label">Họ và tên học viên:</span><span class="value">${record.name}</span></div>
        <div class="row"><span class="label">Số điện thoại:</span><span>${record.phone}</span></div>
        <div class="row"><span class="label">Hạng bằng đăng ký:</span><span class="value">${record.licenseType}</span></div>
        <div class="row"><span class="label">Ngày lập phiếu:</span><span>${today}</span></div>
        <div class="divider"></div>
        <div class="total-row"><span>Tổng học phí:</span><span>${fmt(record.totalFee)}</span></div>
        <div class="row"><span class="label">Đã thanh toán:</span><span style="color:#197a3b;font-weight:bold">${fmt(record.paid)}</span></div>
        ${record.debt > 0 ? `<div class="debt-row"><span>Còn nợ:</span><span>${fmt(record.debt)}</span></div>` : '<div class="row"><span class="label">Còn nợ:</span><span style="color:#197a3b">— Đã thu đủ —</span></div>'}
        ${record.dueDate ? `<div class="row"><span class="label">Hạn đóng tiếp theo:</span><span>${record.dueDate}</span></div>` : ''}
        <div class="divider"></div>
        <div class="footer">
          <div class="sign-box">
            <em>Học viên xác nhận</em>
            <div>${record.name}</div>
          </div>
          <div class="sign-box">
            <em>Kế toán / Nhân viên thu</em>
            <div>Người thu tiền</div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🖨️ In phiếu thu học phí</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Preview */}
          <div style={{
            background: 'var(--bg-surface-strong)', borderRadius: '8px', padding: '20px',
            border: '1px solid var(--border-color)', marginBottom: '16px', fontSize: '0.83rem',
          }}>
            <div style={{ fontWeight: 800, textAlign: 'center', fontSize: '0.9rem', marginBottom: '2px' }}>
              TRUNG TÂM ĐÀO TẠO LÁI XE
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '14px', fontSize: '0.78rem' }}>
              PHIẾU THU HỌC PHÍ • {today}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Học viên:</span>
              <strong>{record.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hạng bằng:</span>
              <strong>{record.licenseType}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tổng học phí:</span>
              <strong>{fmt(record.totalFee)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Đã thanh toán:</span>
              <strong style={{ color: 'var(--success)' }}>{fmt(record.paid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Còn nợ:</span>
              <strong style={{ color: record.debt > 0 ? '#ef4444' : 'var(--success)' }}>
                {record.debt > 0 ? fmt(record.debt) : '— Đã thu đủ —'}
              </strong>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            💡 Phiếu thu sẽ mở trong tab mới và in tự động.
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Đóng</button>
            <button type="button" className="btn-primary" onClick={handlePrint}>🖨️ Mở & In phiếu</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CollectModal ─────────────────────────────────────────────────────────────
const CollectModal = ({ preStudent, students, onClose, onSave }) => {
  const [form, setForm] = useState({
    studentId: preStudent?.id ? String(preStudent.id) : '',
    amount: '',
    method: 'Tiền mặt',
    collector: 'Admin',
    note: '',
  });
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selStudent = students.find((s) => String(s.id) === form.studentId);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.studentId) return setError('Vui lòng chọn học viên.');
    const amt = Number(String(form.amount).replace(/\D/g, ''));
    if (!amt || amt <= 0) return setError('Vui lòng nhập số tiền hợp lệ.');
    onSave({
      id: Date.now(),
      studentId: Number(form.studentId),
      date: new Date().toLocaleDateString('vi-VN'),
      studentName: selStudent?.name || '—',
      licenseType: selStudent?.licenseType || '—',
      amount: amt,
      method: form.method,
      collector: form.collector,
      note: form.note,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">💰 Ghi nhận thu tiền</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave} className="modal-body">
          <div className="admin-form-group">
            <label className="admin-label">Học viên *</label>
            <select className="settings-input" value={form.studentId} onChange={(e) => set('studentId', e.target.value)}>
              <option value="">— Chọn học viên —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.licenseType} — Còn nợ: {s.debt !== '0' ? s.debt + 'đ' : 'Đã đủ'}</option>
              ))}
            </select>
          </div>
          {selStudent && (
            <div className="fees-collect-info">
              <span>Tổng HP: <strong>{selStudent.totalFee}đ</strong></span>
              <span>Đã đóng: <strong style={{ color: 'var(--success)' }}>{selStudent.paid}đ</strong></span>
              <span>Còn nợ: <strong style={{ color: selStudent.debt !== '0' ? 'var(--danger)' : 'var(--success)' }}>
                {selStudent.debt !== '0' ? selStudent.debt + 'đ' : 'Đã thu đủ'}
              </strong></span>
            </div>
          )}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Số tiền thu *</label>
              <input className="settings-input" placeholder="VD: 5000000" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Hình thức thanh toán</label>
              <select className="settings-input" value={form.method} onChange={(e) => set('method', e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Người thu tiền</label>
              <input className="settings-input" value={form.collector} onChange={(e) => set('collector', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Ghi chú</label>
              <input className="settings-input" placeholder="Ghi chú tuỳ ý..." value={form.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Xác nhận thu tiền</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Fees Page ────────────────────────────────────────────────────────────────
const Fees = () => {
  const [activeTab, setActiveTab]       = useState('Tất cả');
  const [feeOverview, setFeeOverview]   = useState({ totalRequired: 0, totalCollected: 0, totalDebt: 0, debtorCount: 0 });
  const [feeRecords, setFeeRecords]     = useState([]);
  const [payments, setPayments]         = useState([]);
  const [students, setStudents]         = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [modalStudent, setModalStudent] = useState(null);
  const [printRecord, setPrintRecord]   = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getFeeOverview(), getFeeRecords(), getPaymentHistory(), getStudents()]).then(
      ([overview, records, history, studentList]) => {
        if (!mounted) return;
        setFeeOverview(overview);
        setFeeRecords(records);
        setPayments(history);
        setStudents(studentList);
      },
    );
    return () => { mounted = false; };
  }, []);

  const openCollect = (student = null) => { setModalStudent(student); setShowModal(true); };

  const handleNewPayment = async (p) => {
    const updatedRecord = await collectFee(p.studentId, p);
    setPayments((prev) => [p, ...prev]);
    if (updatedRecord) {
      setFeeRecords((prev) => prev.map((r) => (r.studentId === updatedRecord.studentId ? updatedRecord : r)));
      setFeeOverview((prev) => ({
        ...prev,
        totalCollected: prev.totalCollected + p.amount,
        totalDebt: Math.max(prev.totalDebt - p.amount, 0),
        debtorCount: feeRecords.filter((r) => (
          r.studentId === updatedRecord.studentId ? updatedRecord.debt > 0 : r.debt > 0
        )).length,
      }));
    }
  };

  // ── Học viên quá hạn thanh toán ─────────────────────────────────────────
  const overdueRecords = useMemo(() => {
    const today = new Date();
    return feeRecords.filter((r) => {
      if (!r.debt || r.debt <= 0) return false;
      const due = parseVNDate(r.dueDate);
      return due && due < today;
    });
  }, [feeRecords]);

  // ── Xuất báo cáo Excel ──────────────────────────────────────────────────
  const handleExportFees = () => {
    const rows = activeTab === 'Tất cả' ? feeRecords : feeRecords.filter((r) => r.paymentStatus === activeTab);
    exportXlsx({
      fileName: 'bao-cao-hoc-phi',
      sheetName: 'Học phí',
      columns: [
        { label: 'Họ và tên',     value: (r) => r.name },
        { label: 'Số điện thoại', value: (r) => r.phone },
        { label: 'Hạng bằng',     value: (r) => r.licenseType },
        { label: 'Tổng học phí',  value: (r) => fmt(r.totalFee) },
        { label: 'Đã thanh toán', value: (r) => fmt(r.paid) },
        { label: 'Còn nợ',        value: (r) => r.debt > 0 ? fmt(r.debt) : '— Đã thu đủ —' },
        { label: 'Hạn đóng',      value: (r) => r.dueDate || '—' },
        { label: 'Trạng thái',    value: (r) => r.paymentStatus },
      ],
      rows,
    });
  };

  const filtered = feeRecords.filter((r) => activeTab === 'Tất cả' || r.paymentStatus === activeTab);

  return (
    <div>
      {showModal && (
        <CollectModal
          preStudent={modalStudent}
          students={students}
          onClose={() => setShowModal(false)}
          onSave={handleNewPayment}
        />
      )}
      {printRecord && (
        <PrintReceiptModal
          record={printRecord}
          onClose={() => setPrintRecord(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Quản lý Học phí</h1>
          <span className="page-subtitle">Theo dõi công nợ và lịch sử thanh toán của học viên</span>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={handleExportFees}>
            ↓ Xuất Excel
          </button>
          <button className="btn-primary" type="button" onClick={() => openCollect()}>
            💰 Ghi nhận thu tiền
          </button>
        </div>
      </div>

      {/* ── Banner cảnh báo quá hạn ── */}
      {overdueRecords.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '14px 18px', marginBottom: '20px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '8px', fontSize: '0.875rem' }}>
              {overdueRecords.length} học viên quá hạn thanh toán học phí
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {overdueRecords.map((r) => (
                <div key={r.id} style={{
                  background: 'rgba(239,68,68,0.1)', borderRadius: '6px',
                  padding: '6px 10px', fontSize: '0.78rem',
                }}>
                  <strong>{r.name}</strong>
                  <span style={{ color: '#ef4444', marginLeft: '6px' }}>— {fmt(r.debt)}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>hạn: {r.dueDate}</span>
                  <button
                    className="secondary-button compact"
                    style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px' }}
                    onClick={() => openCollect(r)}
                  >
                    Thu tiền
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <FeeStatCard
          label="Tổng học phí phải thu" value={fmt(feeOverview.totalRequired)}
          iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          colorClass="bl"
        />
        <FeeStatCard
          label="Đã thu" value={fmt(feeOverview.totalCollected)}
          sub={`${feeOverview.totalRequired ? Math.round(feeOverview.totalCollected / feeOverview.totalRequired * 100) : 0}% tổng hợp đồng`}
          iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          colorClass="gr"
        />
        <FeeStatCard
          label="Còn nợ" value={fmt(feeOverview.totalDebt)}
          iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          colorClass="or"
        />
        <FeeStatCard
          label="HV còn nợ" value={`${feeOverview.debtorCount} học viên`}
          iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          colorClass="re"
        />
      </div>

      {/* ── Danh sách công nợ ── */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">
          <span>Danh sách học phí theo học viên</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {overdueRecords.length > 0 && (
              <span className="badge red" style={{ fontSize: '0.72rem' }}>⚠️ {overdueRecords.length} quá hạn</span>
            )}
          </div>
        </div>
        <div className="fees-tabs">
          {TABS.map((tab) => (
            <button key={tab} className={`fees-tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
              {tab !== 'Tất cả' && (
                <span className="fees-tab-count">{feeRecords.filter((r) => r.paymentStatus === tab).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="table-container" style={{ borderRadius: '0 0 12px 12px', boxShadow: 'none', border: 'none', borderTop: '1px solid var(--border-color)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>HỌ VÀ TÊN</th><th>SỐ ĐIỆN THOẠI</th><th>HẠNG BẰNG</th>
                <th>TỔNG HỌC PHÍ</th><th>ĐÃ ĐÓNG</th><th>CÒN NỢ</th>
                <th>HẠN NỘP</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const badge     = getStatusBadge(r.paymentStatus);
                const isDebt    = r.debt > 0;
                const isOverdue = r.paymentStatus === 'Quá hạn';
                return (
                  <tr key={r.id} style={isOverdue ? { backgroundColor: 'rgba(239,68,68,0.03)' } : {}}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>{r.phone}</td>
                    <td><span className="badge purple" style={{ fontWeight: 700, fontSize: '0.75rem' }}>{r.licenseType}</span></td>
                    <td style={{ fontWeight: 600 }}>{fmt(r.totalFee)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(r.paid)}</td>
                    <td style={{ color: isDebt ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isDebt ? 700 : 400 }}>
                      {isDebt ? fmt(r.debt) : '—'}
                    </td>
                    <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                      {r.dueDate || '—'}
                    </td>
                    <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button className="btn-table-action" onClick={() => openCollect(r)}>
                          + Thu tiền
                        </button>
                        <button
                          className="secondary-button compact"
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          onClick={() => setPrintRecord(r)}
                        >
                          🖨️ In phiếu
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

      {/* ── Lịch sử giao dịch ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span>Lịch sử giao dịch gần đây</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Tổng {payments.length} giao dịch
          </span>
        </div>
        <div className="table-container" style={{ borderRadius: '0 0 12px 12px', boxShadow: 'none', border: 'none', borderTop: '1px solid var(--border-color)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>NGÀY</th><th>HỌC VIÊN</th><th>HẠNG BẰNG</th>
                <th>SỐ TIỀN</th><th>HÌNH THỨC</th><th>NGƯỜI THU</th><th>GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{p.date}</td>
                  <td style={{ fontWeight: 600 }}>{p.studentName}</td>
                  <td><span className="badge purple" style={{ fontWeight: 700, fontSize: '0.75rem' }}>{p.licenseType}</span></td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(p.amount)}</td>
                  <td><span className={`badge ${p.method === 'Chuyển khoản' ? 'blue' : 'neutral'}`}>{p.method}</span></td>
                  <td>{p.collector}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Fees;
