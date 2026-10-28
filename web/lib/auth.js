import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2 = promisify(crypto.pbkdf2);
const KEY = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-change-me');
export const COOKIE = 'pfis_session';

// Stored format: pbkdf2:sha256:<iterations>$<salt>$<hex hash>
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(8).toString('hex');
  const iter = 600000;
  const dk = await pbkdf2(pw, salt, iter, 32, 'sha256');
  return `pbkdf2:sha256:${iter}$${salt}$${dk.toString('hex')}`;
}

export async function verifyPassword(pw, stored) {
  try {
    const [method, salt, hash] = stored.split('$');
    const [, algo, iter] = method.split(':');
    const expected = Buffer.from(hash, 'hex');
    const dk = await pbkdf2(pw, salt, Number(iter), expected.length, algo);
    return crypto.timingSafeEqual(expected, dk);
  } catch {
    return false;
  }
}

export async function createSession(u) {
  const token = await new SignJWT({ uid: u.user_id, name: u.name, role: u.role })
    .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(KEY);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 });
}

export async function getSession() {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, KEY);
    return { uid: payload.uid, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export function clearSession() { cookies().delete(COOKIE); }
