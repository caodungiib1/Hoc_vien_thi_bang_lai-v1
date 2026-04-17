import { getUserScopedKey, readStorage, writeStorage } from './storageService';

const clone = (value) => JSON.parse(JSON.stringify(value));

// ── Default data ──────────────────────────────────────────────────────────────
const DEFAULT_CHANNELS = ['Zalo', 'SMS', 'Email'];

const DEFAULT_TEMPLATES = [
  { id: 1, name: 'Chào mừng đăng ký', content: 'Xin chào {ho_ten}, bạn đã đăng ký học lái xe hạng {hang_bang}. Trung tâm sẽ liên hệ sớm nhất!' },
  { id: 2, name: 'Nhắc khám sức khỏe', content: 'Kính gửi {ho_ten}, bạn cần hoàn thành giấy khám sức khỏe để tiếp tục đăng ký học. Liên hệ: 0909xxxxxx.' },
  { id: 3, name: 'Nhắc nộp hồ sơ', content: 'Kính gửi {ho_ten}, vui lòng nộp hồ sơ (CCCD + ảnh thẻ + giấy KSK) để hoàn tất thủ tục đăng ký.' },
  { id: 4, name: 'Nhắc đóng học phí', content: 'Kính gửi {ho_ten}, bạn còn nợ học phí. Vui lòng thanh toán sớm để tránh gián đoạn học tập.' },
  { id: 5, name: 'Thông báo lịch thi', content: 'Kính gửi {ho_ten}, bạn được xếp thi hạng {hang_bang}. Trung tâm sẽ gửi chi tiết lịch thi sớm.' },
  { id: 6, name: 'Chúc mừng đỗ bằng', content: 'Xin chúc mừng {ho_ten} đã đỗ bằng lái! Trung tâm rất vui được đồng hành cùng bạn.' },
];

const DEFAULT_HISTORY = [
  { id: 1, student: 'Nguyễn Văn An', channel: 'Zalo', template: 'Chào mừng đăng ký', status: 'sent', time: '15/04/2026 08:15' },
  { id: 2, student: 'Trần Thị Bình', channel: 'SMS', template: 'Nhắc khám sức khỏe', status: 'sent', time: '15/04/2026 08:00' },
  { id: 3, student: 'Lê Quang Cường', channel: 'Email', template: 'Nhắc nộp hồ sơ', status: 'error', time: '14/04/2026 17:30' },
  { id: 4, student: 'Phạm Thị Dung', channel: 'Zalo', template: 'Nhắc đóng học phí', status: 'sent', time: '14/04/2026 10:00' },
  { id: 5, student: 'Hoàng Minh Đức', channel: 'SMS', template: 'Thông báo lịch thi', status: 'sent', time: '13/04/2026 14:20' },
];

const DEFAULT_TRIGGERS = [
  { id: 1, name: 'Chào mừng đăng ký mới', desc: 'Gửi ngay khi tạo hồ sơ học viên mới', channel: 'Zalo', enabled: true, lastRun: '15/04/2026 08:15' },
  { id: 2, name: 'Nhắc khám sức khỏe', desc: 'Gửi 3 ngày sau khi đăng ký nếu chưa có KSK', channel: 'SMS', enabled: true, lastRun: '15/04/2026 08:00' },
  { id: 3, name: 'Nhắc nộp hồ sơ', desc: 'Gửi khi trạng thái chuyển sang Chờ nộp hồ sơ', channel: 'Zalo', enabled: true, lastRun: '14/04/2026 10:00' },
  { id: 4, name: 'Nhắc đóng học phí', desc: 'Gửi mỗi 7 ngày nếu còn nợ học phí', channel: 'SMS', enabled: true, lastRun: '14/04/2026 10:00' },
  { id: 5, name: 'Thông báo lịch thi', desc: 'Gửi khi được xếp lịch thi, trước 3 ngày', channel: 'Zalo', enabled: true, lastRun: '13/04/2026 14:20' },
  { id: 6, name: 'Nhắc trước ngày thi', desc: 'Gửi lúc 7:00 sáng ngày thi', channel: 'SMS', enabled: false, lastRun: '—' },
  { id: 7, name: 'Chúc mừng đỗ bằng', desc: 'Gửi ngay khi cập nhật kết quả Đã đỗ', channel: 'Zalo', enabled: true, lastRun: '12/04/2026 09:05' },
  { id: 8, name: 'Nhắc lấy bằng', desc: 'Gửi 7 ngày sau khi đỗ nếu chưa lấy bằng', channel: 'Email', enabled: false, lastRun: '—' },
];

// ── Storage helpers ───────────────────────────────────────────────────────────
const HISTORY_KEY  = 'notif.history.v1';
const TRIGGERS_KEY = 'notif.triggers.v1';

const getStoredHistory  = () => readStorage(getUserScopedKey(HISTORY_KEY), DEFAULT_HISTORY);
const saveStoredHistory = (h) => writeStorage(getUserScopedKey(HISTORY_KEY), h);

const getStoredTriggers  = () => readStorage(getUserScopedKey(TRIGGERS_KEY), DEFAULT_TRIGGERS);
const saveStoredTriggers = (t) => writeStorage(getUserScopedKey(TRIGGERS_KEY), t);

// ── API ───────────────────────────────────────────────────────────────────────
export const getNotificationChannels = async () => clone(DEFAULT_CHANNELS);

export const getNotificationTemplates = async () => clone(DEFAULT_TEMPLATES);

export const getNotificationHistory = async () => clone(getStoredHistory());

export const getNotificationTriggers = async () => clone(getStoredTriggers());

export const createNotificationRecord = async (payload) => {
  const history = getStoredHistory();
  const newRecord = {
    id: Date.now(),
    status: 'sent',
    time: new Date().toLocaleString('vi-VN'),
    ...payload,
  };
  saveStoredHistory([newRecord, ...history]);
  return clone(newRecord);
};

export const updateNotificationTrigger = async (id, payload) => {
  const triggers = getStoredTriggers();
  const index = triggers.findIndex((t) => t.id === Number(id));
  if (index === -1) return { id: Number(id), ...payload };
  triggers[index] = { ...triggers[index], ...payload, id: Number(id), updatedAt: new Date().toISOString() };
  saveStoredTriggers(triggers);
  return clone(triggers[index]);
};
