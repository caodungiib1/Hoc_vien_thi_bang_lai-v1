import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const HASH_PREFIX = 'pbkdf2';
const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

  return `${HASH_PREFIX}:${ITERATIONS}:${salt}:${hash}`;
};

export const verifyPassword = (password, storedHash) => {
  const [prefix, iterations, salt, hash] = String(storedHash).split(':');

  if (prefix !== HASH_PREFIX || !iterations || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = pbkdf2Sync(password, salt, Number(iterations), expected.length, DIGEST);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
