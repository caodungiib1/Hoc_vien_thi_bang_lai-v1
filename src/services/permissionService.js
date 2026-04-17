export const ROLE_DEFINITIONS = [
  { id: 'admin', label: 'Quản trị viên', color: 're' },
  { id: 'manager', label: 'Quản lý trung tâm', color: 'pu' },
  { id: 'sales', label: 'Nhân viên tuyển sinh', color: 'bl' },
  { id: 'acct', label: 'Kế toán', color: 'gr' },
  { id: 'care', label: 'Nhân viên chăm sóc', color: 'or' },
];

export const MODULE_DEFINITIONS = [
  { key: 'dashboard', label: 'Dashboard', title: 'Tổng quan', path: '/' },
  { key: 'students', label: 'Học viên', title: 'Học viên', path: '/students' },
  { key: 'classes', label: 'Lớp học', title: 'Lớp học', path: '/classes' },
  { key: 'exams', label: 'Lịch thi', title: 'Lịch thi', path: '/exams' },
  { key: 'fees', label: 'Học phí', title: 'Học phí', path: '/fees' },
  { key: 'documents', label: 'Hồ sơ', title: 'Hồ sơ', path: '/documents' },
  { key: 'reports', label: 'Báo cáo KD', title: 'Kết quả KD', path: '/reports' },
  { key: 'referrers', label: 'Người giới thiệu', title: 'Người giới thiệu', path: '/referrers' },
  { key: 'notifications', label: 'BOT thông báo', title: 'BOT thông báo', path: '/notifications' },
  { key: 'settings', label: 'Cài đặt', title: 'Cài đặt', path: '/settings' },
  { key: 'admin', label: 'Quản lý TK', title: 'Admin', path: '/admin' },
  { key: 'tasks', label: 'Nhắc việc', title: 'Nhắc việc', path: '/tasks' },
];

export const MODULE_PERMISSIONS = {
  admin: {
    dashboard: true,
    students: true,
    classes: true,
    exams: true,
    fees: true,
    documents: true,
    reports: true,
    referrers: true,
    notifications: true,
    settings: true,
    admin: true,
    tasks: true,
  },
  manager: {
    dashboard: true,
    students: true,
    classes: true,
    exams: true,
    fees: true,
    documents: true,
    reports: true,
    referrers: true,
    notifications: true,
    settings: false,
    admin: false,
    tasks: true,
  },
  sales: {
    dashboard: true,
    students: true,
    classes: true,
    exams: true,
    fees: false,
    documents: true,
    reports: false,
    referrers: true,
    notifications: true,
    settings: false,
    admin: false,
    tasks: true,
  },
  acct: {
    dashboard: true,
    students: false,
    classes: false,
    exams: false,
    fees: true,
    documents: false,
    reports: true,
    referrers: false,
    notifications: true,
    settings: false,
    admin: false,
    tasks: true,
  },
  care: {
    dashboard: true,
    students: true,
    classes: false,
    exams: false,
    fees: false,
    documents: true,
    reports: false,
    referrers: false,
    notifications: true,
    settings: false,
    admin: false,
    tasks: true,
  },
};

const ROLE_ALIASES = {
  admin: ['admin', 'quan tri vien'],
  manager: ['manager', 'quan ly trung tam'],
  sales: ['sales', 'nhan vien tuyen sinh'],
  acct: ['acct', 'ke toan'],
  care: ['care', 'nhan vien cham soc'],
};

const normalizeText = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

export const normalizeRoleId = (role) => {
  const normalizedRole = normalizeText(role);

  for (const [roleId, aliases] of Object.entries(ROLE_ALIASES)) {
    if (aliases.includes(normalizedRole)) {
      return roleId;
    }
  }

  return normalizedRole || '';
};

export const getRoleDefinition = (role) => {
  const roleId = normalizeRoleId(role);
  return ROLE_DEFINITIONS.find((item) => item.id === roleId)
    || { id: roleId || 'unknown', label: role || 'Không xác định', color: 'neutral' };
};

export const getModuleDefinition = (moduleKey) => (
  MODULE_DEFINITIONS.find((item) => item.key === moduleKey)
);

export const canAccessModule = (userOrRole, moduleKey) => {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const roleId = normalizeRoleId(role);
  return Boolean(MODULE_PERMISSIONS[roleId]?.[moduleKey]);
};

export const getDefaultPathForUser = (userOrRole) => {
  const firstAllowedModule = MODULE_DEFINITIONS.find((item) => canAccessModule(userOrRole, item.key));
  return firstAllowedModule?.path || '/';
};

export const getPermissionMatrixData = () => ({
  modules: MODULE_DEFINITIONS.map((item) => item.label),
  permissions: Object.fromEntries(
    ROLE_DEFINITIONS.map((role) => [
      role.id,
      MODULE_DEFINITIONS.map((module) => Boolean(MODULE_PERMISSIONS[role.id]?.[module.key])),
    ]),
  ),
});
