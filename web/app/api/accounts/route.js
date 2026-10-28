import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  return ok(await query('SELECT * FROM Account WHERE user_id=? ORDER BY account_id', [s.uid]));
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  try {
    const r = await query('INSERT INTO Account (user_id,account_name,account_type,balance) VALUES (?,?,?,?)',
      [s.uid, b.account_name, b.account_type, Number(b.balance) || 0]);
    audit(s.uid, 'create', 'account', r.insertId, { name: b.account_name, type: b.account_type });
    return ok({ account_id: r.insertId }, 201);
  } catch (e) { return fail(e); }
}
