import { query } from '@/lib/mysql';
import { verifyPassword, createSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { email, password } = await req.json();
  const [u] = await query('SELECT * FROM User WHERE email=?', [email]);
  if (!u || !(await verifyPassword(password || '', u.password_hash))) return fail({ message: 'Invalid email or password' }, 401);
  await createSession(u);
  audit(u.user_id, 'login', 'user', u.user_id);
  return ok({ name: u.name });
}
