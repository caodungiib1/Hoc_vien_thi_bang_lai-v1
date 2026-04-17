import { apiRequest } from './apiClient';
import { getAuthToken } from './authService';
import { ROLE_DEFINITIONS, getPermissionMatrixData } from './permissionService';

const SYSTEM_LOGS = [
  { id: 'LOG-1008', time: '15/04/2026 10:22', actor: 'Nguyễn Văn Admin', action: 'Cập nhật kết quả thi', module: 'Lịch thi', target: 'Đợt thi A1 ngày 18/04', status: 'Thành công', tone: 'green' },
  { id: 'LOG-1007', time: '15/04/2026 09:48', actor: 'Phạm Thị Kế Toán', action: 'Ghi nhận thu tiền', module: 'Học phí', target: 'Nguyễn Văn Anh - 5,000,000đ', status: 'Thành công', tone: 'green' },
  { id: 'LOG-1006', time: '15/04/2026 09:15', actor: 'Lê Quang Hùng', action: 'Thêm học viên', module: 'Học viên', target: 'Võ Minh Khang - B2', status: 'Thành công', tone: 'green' },
  { id: 'LOG-1005', time: '14/04/2026 16:40', actor: 'Trần Thị Mai', action: 'Chuyển lịch thi', module: 'Lịch thi', target: 'Phan Thị Hương sang đợt 25/04', status: 'Thành công', tone: 'green' },
  { id: 'LOG-1004', time: '14/04/2026 15:05', actor: 'Hoàng Chăm Sóc', action: 'Gửi thông báo', module: 'Bot thông báo', target: 'Nhắc đóng học phí qua Zalo', status: 'Lỗi', tone: 'red' },
  { id: 'LOG-1003', time: '14/04/2026 11:28', actor: 'Nguyễn Văn Admin', action: 'Khóa tài khoản', module: 'Quản lý TK', target: 'Hoàng Chăm Sóc', status: 'Thành công', tone: 'green' },
  { id: 'LOG-1002', time: '14/04/2026 10:12', actor: 'Trần Thị Mai', action: 'Sửa trạng thái học viên', module: 'Học viên', target: 'Lê Quang Cường - Đang học', status: 'Thành công', tone: 'green' },
  { id: 'LOG-1001', time: '13/04/2026 17:36', actor: 'Phạm Thị Kế Toán', action: 'Xuất báo cáo', module: 'Kết quả KD', target: 'Báo cáo học phí tháng 04/2026', status: 'Thành công', tone: 'green' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const mapBackendUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || 'Quản trị viên',
  status: user.status === 'active' ? 'active' : 'locked',
  centerName: user.centerName || '',
  created: user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
    : '—',
  lastLogin: user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString('vi-VN')
    : '—',
});

export const getRoles = async () => clone(ROLE_DEFINITIONS);

export const getAccounts = async () => {
  const token = getAuthToken();
  const data = await apiRequest('/users', { token });
  return (data.users || []).map(mapBackendUser);
};

export const getPermissionMatrix = async () => clone(getPermissionMatrixData());

export const getSystemLogs = async () => clone(SYSTEM_LOGS);

export const createAccount = async (payload) => {
  const token = getAuthToken();
  const data = await apiRequest('/users', {
    method: 'POST',
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    },
    token,
  });
  return mapBackendUser(data.user);
};

export const toggleAccountLock = async (account) => {
  const token = getAuthToken();
  const nextStatus = account.status === 'active' ? 'locked' : 'active';
  const data = await apiRequest(`/users/${account.id}/status`, {
    method: 'PATCH',
    body: { status: nextStatus },
    token,
  });
  return mapBackendUser(data.user);
};

export const resetAccountPassword = async (id) => ({
  id: Number(id),
  resetAt: new Date().toISOString(),
});
