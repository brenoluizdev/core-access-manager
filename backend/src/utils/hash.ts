import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keyLength: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const SCHEME = 'scrypt';

/**
 * Gera o hash no formato `scrypt$<salt>$<hash>`.
 * scrypt é nativo do Node, então não há dependência binária para compilar.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = await scryptAsync(plain, salt, KEY_LENGTH);

  return `${SCHEME}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split('$');

  if (scheme !== SCHEME || !salt || !hash) return false;

  const derived = await scryptAsync(plain, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');

  if (expected.length !== derived.length) return false;

  return timingSafeEqual(expected, derived);
}
