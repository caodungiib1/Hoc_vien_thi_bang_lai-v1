import express from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ensureDatabase, readDatabase, writeDatabase } from './database.js';
import { hashPassword, verifyPassword } from './password.js';

const app = express();
const PORT = Number(process.env.API_PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
// Cho phép mọi localhost port trong môi trường dev (5173, 5174, 5175...)
const LOCALHOST_REGEX = /^http:\/\/localhost:\d+$/;
const SESSION_KEY = 'qlhv-auth-session';

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
  // organizationId dùng để phân tách dữ liệu — mỗi user đăng ký = 1 tổ chức riêng.
  organizationId: user.organizationId || user.id,
  status: user.status,
  createdAt: user.createdAt,
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
  const user = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'Quản trị viên',
    centerName: centerName?.trim() || 'Trung tâm lái xe',
    // Mỗi người đăng ký tạo ra 1 tổ chức (organization) độc lập.
    // organizationId = id của chính user → họ là chủ tổ chức đó.
    organizationId: userId,
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

app.get('/api/users', requireAuth, requireRoles('admin'), (req, res) => {
  const database = readDatabase();
  const currentOrgId = req.auth.user.organizationId || req.auth.user.id;
  // Chỉ trả về users thuộc cùng tổ chức với người đăng nhập.
  const users = (database.users || [])
    .filter((u) => (u.organizationId || u.id) === currentOrgId)
    .map(sanitizeUser);
  res.json({ users });
});

// Admin tạo tài khoản nhân viên mới trong cùng tổ chức.
// Khác register: không tạo org mới mà dùng chung organizationId của admin.
app.post('/api/users', requireAuth, requireRoles('admin'), (req, res) => {
  const { name, email, password, role, centerName } = req.body || {};

  if (!name?.trim() || !email?.trim() || !password) {
    sendError(res, 400, 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.');
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
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
    // Dùng cùng organizationId → thuộc cùng tổ chức với admin tạo.
    organizationId: currentOrgId,
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
