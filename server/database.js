import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './password.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATABASE_FILE = path.join(DATA_DIR, 'database.json');

const createInitialDatabase = () => {
  const adminId = randomUUID();
  return {
    version: 2,
    users: [
      {
        id: adminId,
        name: 'Nguyễn Văn Admin',
        email: 'admin@trungcau.vn',
        passwordHash: hashPassword('admin123'),
        role: 'Quản trị viên',
        centerName: 'Trung Tâm A.Đức',
        // organizationId = id của chính user khi đăng ký → mỗi user là chủ 1 tổ chức riêng.
        organizationId: adminId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    sessions: [],
  };
};

// Migration: đảm bảo tất cả user cũ (version 1) đều có organizationId.
// User cũ không có organizationId → tự gán id của chính họ làm organizationId.
const migrateDatabase = (database) => {
  if (database.version >= 2) return database;

  const migratedUsers = (database.users || []).map((user) => ({
    ...user,
    organizationId: user.organizationId || user.id,
  }));

  return {
    ...database,
    version: 2,
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
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2), 'utf8');
  fs.renameSync(tempFile, DATABASE_FILE);
  return database;
};
