import express from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  ensureDatabase,
  generateOrganizationCode,
  readDatabase,
  writeDatabase,
} from './database.js';
import { hashPassword, verifyPassword } from './password.js';

const app = express();
const PORT = Number(process.env.API_PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
// Cho phép mọi localhost port trong môi trường dev (5173, 5174, 5175...)
const LOCALHOST_REGEX = /^http:\/\/localhost:\d+$/;
const SESSION_KEY = 'qlhv-auth-session';
const ORGANIZATION_ACTIVE_WINDOW_MINUTES = 15;
const ORGANIZATION_ACTIVE_WINDOW_MS = ORGANIZATION_ACTIVE_WINDOW_MINUTES * 60 * 1000;

ensureDatabase();

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeRoleText = (role = '') => role
  .toString()
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');
const now = () => new Date().toISOString();
const addHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const getUsedOrganizationCodes = (database) => new Set(
  (database.users || [])
    .map((user) => String(user.organizationCode || '').trim())
    .filter(Boolean),
);
const toTimestamp = (value) => {
  const timestamp = new Date(value || '').getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};
const toIsoString = (timestamp) => (timestamp > 0 ? new Date(timestamp).toISOString() : '');

const getRoleId = (role = '') => {
  const normalizedRole = normalizeRoleText(role);

  if (['admin', 'quan tri vien'].includes(normalizedRole)) return 'admin';
  if (['manager', 'quan ly trung tam'].includes(normalizedRole)) return 'manager';
  if (['sales', 'nhan vien tuyen sinh'].includes(normalizedRole)) return 'sales';
  if (['acct', 'ke toan'].includes(normalizedRole)) return 'acct';
  if (['care', 'nhan vien cham soc'].includes(normalizedRole)) return 'care';

  return normalizedRole;
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  centerName: user.centerName,
  // organizationId là khóa nội bộ để phân tách dữ liệu theo doanh nghiệp.
  organizationId: user.organizationId || user.id,
  // organizationCode là mã doanh nghiệp dùng trên URL.
  organizationCode: user.organizationCode || '',
  isSystemAdmin: user.isSystemAdmin === true,
  status: user.status,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt || '',
  updatedAt: user.updatedAt,
});

const sendError = (res, status, message) => res.status(status).json({ message });

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  return type === 'Bearer' ? token : '';
};

const createSession = (database, user, remember = true) => {
  const token = randomBytes(32).toString('hex');
  const session = {
    id: randomUUID(),
    key: SESSION_KEY,
    userId: user.id,
    tokenHash: hashToken(token),
    remember: Boolean(remember),
    createdAt: now(),
    lastSeenAt: now(),
    expiresAt: remember ? addDays(30) : addHours(12),
  };

  database.sessions = [
    session,
    ...(database.sessions || []).filter((item) => (
      item.userId !== user.id || new Date(item.expiresAt).getTime() > Date.now()
    )),
  ];

  return { token, session };
};

const findSessionUser = (token) => {
  const database = readDatabase();
  const tokenHash = hashToken(token);
  const session = (database.sessions || []).find((item) => item.tokenHash === tokenHash);

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    return { database, session: null, user: null };
  }

  const user = database.users.find((item) => item.id === session.userId);
  return { database, session, user: user || null };
};

const requireAuth = (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    sendError(res, 401, 'Phiên đăng nhập không hợp lệ.');
    return;
  }

  const { database, session, user } = findSessionUser(token);

  if (!session || !user || user.status !== 'active') {
    sendError(res, 401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    return;
  }

  session.lastSeenAt = now();
  writeDatabase(database);
  req.auth = { token, session, user };
  next();
};

const requireRoles = (...allowedRoles) => (req, res, next) => {
  const currentRoleId = getRoleId(req.auth?.user?.role);

  if (!allowedRoles.includes(currentRoleId)) {
    sendError(res, 403, 'Bạn không có quyền truy cập chức năng này.');
    return;
  }

  next();
};

const requireSystemAdmin = (req, res, next) => {
  if (req.auth?.user?.isSystemAdmin !== true) {
    sendError(res, 403, 'Chức năng này chỉ dành cho quản trị hệ thống.');
    return;
  }

  next();
};

const buildOrganizationSummaries = (database) => {
  const users = Array.isArray(database.users)
    ? database.users.filter((user) => user.isSystemAdmin !== true)
    : [];
  const sessions = Array.isArray(database.sessions) ? database.sessions : [];
  const nowMs = Date.now();
  const orgMap = new Map();

  users.forEach((user) => {
    const organizationId = user.organizationId || user.id;

    if (!orgMap.has(organizationId)) {
      orgMap.set(organizationId, {
        organizationId,
        organizationCode: user.organizationCode || '',
        centerName: user.centerName || 'Chưa cập nhật',
        totalAccounts: 0,
        activeAccounts: 0,
        lockedAccounts: 0,
        roleCounts: { admin: 0, manager: 0, sales: 0, acct: 0, care: 0 },
        users: [],
        userIds: new Set(),
      });
    }

    const org = orgMap.get(organizationId);
    const roleId = getRoleId(user.role);

    org.organizationCode = org.organizationCode || user.organizationCode || '';
    org.centerName = org.centerName === 'Chưa cập nhật' && user.centerName
      ? user.centerName
      : org.centerName;
    org.totalAccounts += 1;
    org.activeAccounts += user.status === 'active' ? 1 : 0;
    org.lockedAccounts += user.status === 'locked' ? 1 : 0;

    if (Object.hasOwn(org.roleCounts, roleId)) {
      org.roleCounts[roleId] += 1;
    }

    org.userIds.add(user.id);
    org.users.push({
      ...sanitizeUser(user),
      lastActiveAt: user.lastLoginAt || '',
    });
  });

  return Array.from(orgMap.values()).map((org) => {
    const orgSessions = sessions.filter((session) => org.userIds.has(session.userId));
    const activeSessions = orgSessions.filter((session) => toTimestamp(session.expiresAt) > nowMs);
    const latestSeenAtMs = orgSessions.reduce(
      (latest, session) => Math.max(latest, toTimestamp(session.lastSeenAt || session.createdAt)),
      0,
    );
    const latestLoginAtMs = org.users.reduce(
      (latest, user) => Math.max(latest, toTimestamp(user.lastLoginAt)),
      0,
    );
    const lastActivityAtMs = Math.max(latestSeenAtMs, latestLoginAtMs);
    const isOnline = activeSessions.some((session) => (
      toTimestamp(session.lastSeenAt || session.createdAt) >= nowMs - ORGANIZATION_ACTIVE_WINDOW_MS
    ));
    const primaryAdmin = org.users.find((user) => getRoleId(user.role) === 'admin') || org.users[0] || null;

    return {
      organizationId: org.organizationId,
      organizationCode: org.organizationCode,
      centerName: org.centerName,
      totalAccounts: org.totalAccounts,
      activeAccounts: org.activeAccounts,
      lockedAccounts: org.lockedAccounts,
      primaryAdmin: primaryAdmin ? {
        id: primaryAdmin.id,
        name: primaryAdmin.name,
        email: primaryAdmin.email,
      } : null,
      roleCounts: org.roleCounts,
      status: isOnline ? 'active' : (lastActivityAtMs > 0 ? 'offline' : 'idle'),
      statusLabel: isOnline ? 'Hoạt động' : (lastActivityAtMs > 0 ? 'Offline' : 'Chưa hoạt động'),
      lastActivityAt: toIsoString(lastActivityAtMs),
      offlineSinceAt: !isOnline && lastActivityAtMs > 0 ? toIsoString(lastActivityAtMs) : '',
      accounts: org.users
        .map((user) => ({
          ...user,
          statusLabel: user.status === 'active' ? 'Hoạt động' : 'Đã khóa',
        }))
        .sort((left, right) => {
          const roleDiff = (getRoleId(left.role) === 'admin' ? 0 : 1) - (getRoleId(right.role) === 'admin' ? 0 : 1);
          if (roleDiff !== 0) return roleDiff;
          return left.name.localeCompare(right.name, 'vi');
        }),
    };
  }).sort((left, right) => {
    if (left.status !== right.status) {
      const priority = { active: 0, offline: 1, idle: 2 };
      return priority[left.status] - priority[right.status];
    }

    const activityDiff = toTimestamp(right.lastActivityAt) - toTimestamp(left.lastActivityAt);
    if (activityDiff !== 0) return activityDiff;

    return String(left.organizationCode).localeCompare(String(right.organizationCode), 'vi');
  });
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Trong dev: cho phép mọi localhost port. Trong production: dùng CLIENT_ORIGIN cụ thể.
  const isLocalhost = origin && LOCALHOST_REGEX.test(origin);
  const allowOrigin = isLocalhost ? origin : (CLIENT_ORIGIN === '*' ? origin : CLIENT_ORIGIN);

  if (allowOrigin) {
    res.header('Access-Control-Allow-Origin', allowOrigin);
  }

  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'QLHV Backend',
    time: now(),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, remember = true } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    sendError(res, 400, 'Vui lòng nhập email và mật khẩu.');
    return;
  }

  const database = readDatabase();
  const user = database.users.find((item) => normalizeEmail(item.email) === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    sendError(res, 401, 'Email hoặc mật khẩu chưa đúng.');
    return;
  }

  if (user.status !== 'active') {
    sendError(res, 403, 'Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.');
    return;
  }

  const { token, session } = createSession(database, user, remember);
  user.lastLoginAt = now();
  user.updatedAt = now();
  writeDatabase(database);

  res.json({
    user: sanitizeUser(user),
    token,
    remember: session.remember,
    expiresAt: session.expiresAt,
  });
});

app.post('/api/auth/system/login', (req, res) => {
  const { account, email, password, remember = true } = req.body || {};
  const normalizedAccount = normalizeEmail(account || email);

  if (!normalizedAccount || !password) {
    sendError(res, 400, 'Vui lòng nhập tài khoản và mật khẩu.');
    return;
  }

  const database = readDatabase();
  const user = database.users.find((item) => normalizeEmail(item.email) === normalizedAccount);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    sendError(res, 401, 'Tài khoản hoặc mật khẩu chưa đúng.');
    return;
  }

  if (user.status !== 'active') {
    sendError(res, 403, 'Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.');
    return;
  }

  if (user.isSystemAdmin !== true) {
    sendError(res, 403, 'Tài khoản này không có quyền truy cập cổng quản trị hệ thống.');
    return;
  }

  const { token, session } = createSession(database, user, remember);
  user.lastLoginAt = now();
  user.updatedAt = now();
  writeDatabase(database);

  res.json({
    user: sanitizeUser(user),
    token,
    remember: session.remember,
    expiresAt: session.expiresAt,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, centerName, remember = true } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!name?.trim()) {
    sendError(res, 400, 'Vui lòng nhập họ và tên.');
    return;
  }

  if (!normalizedEmail) {
    sendError(res, 400, 'Vui lòng nhập email.');
    return;
  }

  if (!password || password.length < 6) {
    sendError(res, 400, 'Mật khẩu cần có ít nhất 6 ký tự.');
    return;
  }

  const database = readDatabase();
  const existed = database.users.some((user) => normalizeEmail(user.email) === normalizedEmail);

  if (existed) {
    sendError(res, 409, 'Email này đã được đăng ký.');
    return;
  }

  const userId = randomUUID();
  const organizationId = randomUUID();
  const organizationCode = generateOrganizationCode(getUsedOrganizationCodes(database));
  const user = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'Quản trị viên',
    centerName: centerName?.trim() || 'Trung tâm lái xe',
    // Mỗi người đăng ký tạo ra một doanh nghiệp độc lập.
    organizationId,
    organizationCode,
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };

  database.users.unshift(user);
  const { token, session } = createSession(database, user, remember);
  writeDatabase(database);

  res.status(201).json({
    user: sanitizeUser(user),
    token,
    remember: session.remember,
    expiresAt: session.expiresAt,
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: sanitizeUser(req.auth.user),
    expiresAt: req.auth.session.expiresAt,
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const database = readDatabase();
  const tokenHash = hashToken(req.auth.token);

  database.sessions = (database.sessions || []).filter((session) => session.tokenHash !== tokenHash);
  writeDatabase(database);

  res.json({ ok: true });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};

  if (!normalizeEmail(email)) {
    sendError(res, 400, 'Vui lòng nhập email cần khôi phục mật khẩu.');
    return;
  }

  res.json({
    message: 'Nếu email tồn tại trong hệ thống, backend sẽ gửi hướng dẫn đặt lại mật khẩu khi cấu hình email được bật.',
  });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, nextPassword } = req.body || {};

  if (!currentPassword || !nextPassword) {
    sendError(res, 400, 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
    return;
  }

  if (!verifyPassword(currentPassword, req.auth.user.passwordHash)) {
    sendError(res, 400, 'Mật khẩu hiện tại chưa đúng.');
    return;
  }

  if (nextPassword.length < 6) {
    sendError(res, 400, 'Mật khẩu mới cần có ít nhất 6 ký tự.');
    return;
  }

  if (currentPassword === nextPassword) {
    sendError(res, 400, 'Mật khẩu mới cần khác mật khẩu hiện tại.');
    return;
  }

  const database = readDatabase();
  const user = database.users.find((item) => item.id === req.auth.user.id);

  if (!user) {
    sendError(res, 404, 'Không tìm thấy tài khoản.');
    return;
  }

  user.passwordHash = hashPassword(nextPassword);
  user.updatedAt = now();
  writeDatabase(database);

  res.json({
    message: 'Đổi mật khẩu thành công.',
    user: sanitizeUser(user),
  });
});

app.get('/api/users', requireAuth, requireRoles('admin'), (req, res) => {
  const database = readDatabase();
  const currentOrgId = req.auth.user.organizationId || req.auth.user.id;
  // Chỉ trả về users thuộc cùng tổ chức với người đăng nhập.
  const users = (database.users || [])
    .filter((u) => (u.organizationId || u.id) === currentOrgId)
    .map(sanitizeUser);
  res.json({ users });
});

app.get('/api/system/organizations', requireAuth, requireSystemAdmin, (req, res) => {
  const database = readDatabase();
  res.json({
    organizations: buildOrganizationSummaries(database),
    activeWindowMinutes: ORGANIZATION_ACTIVE_WINDOW_MINUTES,
  });
});

// Admin tạo tài khoản nhân viên mới trong cùng tổ chức.
// Khác register: không tạo org mới mà dùng chung organizationId của admin.
app.post('/api/users', requireAuth, requireRoles('admin'), (req, res) => {
  const { name, email, password, role, centerName } = req.body || {};

  if (!name?.trim() || !email?.trim() || !password) {
    sendError(res, 400, 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.');
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const database = readDatabase();
  const existingUser = database.users.find((u) => (u.email || '').trim().toLowerCase() === normalizedEmail);

  if (existingUser) {
    sendError(res, 409, 'Email này đã được sử dụng trong hệ thống.');
    return;
  }

  const currentOrgId = req.auth.user.organizationId || req.auth.user.id;

  const newUser = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: role || 'Nhân viên',
    centerName: centerName?.trim() || req.auth.user.centerName || '',
    // Dùng cùng organizationId và organizationCode → thuộc cùng doanh nghiệp với admin tạo.
    organizationId: currentOrgId,
    organizationCode: req.auth.user.organizationCode || '',
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };

  database.users.push(newUser);
  writeDatabase(database);

  res.status(201).json({ user: sanitizeUser(newUser) });
});

app.patch('/api/users/:id/status', requireAuth, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (status !== 'active' && status !== 'locked') {
    sendError(res, 400, 'Trạng thái không hợp lệ. Chỉ chấp nhận \'active\' hoặc \'locked\'.');
    return;
  }

  const database = readDatabase();
  const currentOrgId = req.auth.user.organizationId || req.auth.user.id;
  // Chỉ cho phép thao tác với user cùng tổ chức.
  const user = database.users.find(
    (item) => item.id === id && (item.organizationId || item.id) === currentOrgId,
  );

  if (!user) {
    sendError(res, 404, 'Không tìm thấy tài khoản.');
    return;
  }

  if (user.id === req.auth.user.id) {
    sendError(res, 403, 'Không thể tự khóa tài khoản đang đăng nhập.');
    return;
  }

  user.status = status;
  user.updatedAt = now();
  writeDatabase(database);

  res.json({ user: sanitizeUser(user) });
});

app.use((req, res) => {
  sendError(res, 404, 'Không tìm thấy API.');
});

app.listen(PORT, () => {
  console.log(`QLHV backend đang chạy tại http://localhost:${PORT}/api`);
});
