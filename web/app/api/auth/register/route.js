import { query } from '@/lib/mysql';
import { hashPassword } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password || password.length < 6) return fail({ message: 'Name, email and a 6+ character password are required' });
  try {
    const r = await query("INSERT INTO User (name,email,password_hash,role) VALUES (?,?,?,'user')", [name, email, await hashPassword(password)]);
    audit(r.insertId, 'register', 'user', r.insertId);
    return ok({ ok: true }, 201);
  } catch (e) {
    return fail(e.errno === 1062 ? { message: 'Email already registered' } : e);
  }
}
