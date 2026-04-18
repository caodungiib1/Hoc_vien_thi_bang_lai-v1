import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hashPassword, verifyPassword } from './password.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATABASE_FILE = path.join(DATA_DIR, 'database.json');
const SYSTEM_ADMIN_LOGIN = 'admin';
const SYSTEM_ADMIN_PASSWORD = 'admin';

const ORGANIZATION_CODE_REGEX = /^\d{6}$/;

export const isValidOrganizationCode = (value) => ORGANIZATION_CODE_REGEX.test(String(value || '').trim());

export const generateOrganizationCode = (usedCodes = new Set()) => {
  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      return code;
    }
  }

  throw new Error('Không thể tạo organizationCode duy nhất.');
};

const normalizeEmail = (email = '') => String(email || '').trim().toLowerCase();
const isSystemAdminLogin = (value = '') => normalizeEmail(value) === SYSTEM_ADMIN_LOGIN;
const shouldBeSystemAdmin = (user) => isSystemAdminLogin(user?.email);

const createSystemAdminUser = (usedCodes = new Set()) => ({
  id: randomUUID(),
  name: 'System Admin',
  email: SYSTEM_ADMIN_LOGIN,
  passwordHash: hashPassword(SYSTEM_ADMIN_PASSWORD),
  role: 'Quản trị viên',
  centerName: 'Hệ thống',
  organizationId: randomUUID(),
  organizationCode: generateOrganizationCode(usedCodes),
  isSystemAdmin: true,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createSeedBusinessAdmin = (usedCodes = new Set()) => {
  const adminId = randomUUID();
  const organizationId = randomUUID();

  return {
    id: adminId,
    name: 'Nguyễn Văn Admin',
    email: 'admin@trungcau.vn',
    passwordHash: hashPassword('admin123'),
    role: 'Quản trị viên',
    centerName: 'Trung Tâm A.Đức',
    organizationId,
    organizationCode: generateOrganizationCode(usedCodes),
    isSystemAdmin: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const createInitialDatabase = () => {
  const usedCodes = new Set();
  return {
    version: 5,
    users: [
      createSystemAdminUser(usedCodes),
      createSeedBusinessAdmin(usedCodes),
    ],
    sessions: [],
  };
};

const migrateDatabase = (database) => {
  const currentVersion = Number(database.version || 1);
  const sourceUsers = Array.isArray(database.users) ? database.users : [];
  const usersWithOrganizationId = sourceUsers.map((user) => ({
    ...user,
    organizationId: user.organizationId || user.id,
  }));

  const usedCodes = new Set();
  const organizationCodeByOrg = new Map();

  usersWithOrganizationId.forEach((user) => {
    const orgKey = user.organizationId || user.id;
    if (organizationCodeByOrg.has(orgKey)) return;

    const existingCode = usersWithOrganizationId.find((candidate) => (
      (candidate.organizationId || candidate.id) === orgKey
      && isValidOrganizationCode(candidate.organizationCode)
      && !usedCodes.has(String(candidate.organizationCode))
    ))?.organizationCode;

    const organizationCode = existingCode
      ? String(existingCode)
      : generateOrganizationCode(usedCodes);

    if (existingCode) {
      usedCodes.add(String(existingCode));
    }

    organizationCodeByOrg.set(orgKey, organizationCode);
  });

  const migratedUsers = usersWithOrganizationId.map((user) => ({
    ...user,
    organizationId: user.organizationId || user.id,
    organizationCode: organizationCodeByOrg.get(user.organizationId || user.id),
    isSystemAdmin: shouldBeSystemAdmin(user),
  }));

  const systemAdminIndex = migratedUsers.findIndex((user) => shouldBeSystemAdmin(user));

  if (systemAdminIndex >= 0) {
    const systemAdmin = migratedUsers[systemAdminIndex];
    migratedUsers[systemAdminIndex] = {
      ...systemAdmin,
      name: systemAdmin.name || 'System Admin',
      email: SYSTEM_ADMIN_LOGIN,
      role: systemAdmin.role || 'Quản trị viên',
      centerName: systemAdmin.centerName || 'Hệ thống',
      organizationId: systemAdmin.organizationId || randomUUID(),
      organizationCode: systemAdmin.organizationCode || generateOrganizationCode(usedCodes),
      isSystemAdmin: true,
      status: 'active',
      passwordHash: systemAdmin.passwordHash || hashPassword(SYSTEM_ADMIN_PASSWORD),
    };
  } else {
    migratedUsers.unshift(createSystemAdminUser(usedCodes));
  }

  return {
    ...database,
    version: Math.max(currentVersion, 5),
    users: migratedUsers,
  };
};

export const ensureDatabase = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATABASE_FILE)) {
    writeDatabase(createInitialDatabase());
  }
};

export const readDatabase = () => {
  ensureDatabase();

  try {
    const rawValue = fs.readFileSync(DATABASE_FILE, 'utf8');
    const database = JSON.parse(rawValue);
    // Tự động migrate nếu database cũ chưa có organizationId.
    const migrated = migrateDatabase(database);
    if (migrated !== database) {
      writeDatabase(migrated);
    }
    return migrated;
  } catch {
    const initialDatabase = createInitialDatabase();
    writeDatabase(initialDatabase);
    return initialDatabase;
  }
};

export const writeDatabase = (database) => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DATABASE_FILE}.tmp`;
  const serialized = JSON.stringify(database, null, 2);

  fs.writeFileSync(tempFile, serialized, 'utf8');

  try {
    fs.renameSync(tempFile, DATABASE_FILE);
  } catch (error) {
    if (!['EPERM', 'EACCES', 'EBUSY'].includes(error?.code)) {
      throw error;
    }

    fs.writeFileSync(DATABASE_FILE, serialized, 'utf8');
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }

  return database;
};
