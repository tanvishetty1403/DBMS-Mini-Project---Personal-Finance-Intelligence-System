import { query, callProc } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  const mine = (await query('SELECT account_id FROM Account WHERE user_id=?', [s.uid])).map(a => String(a.account_id));
  if (!mine.includes(String(b.from_account)) || !mine.includes(String(b.to_account)))
    return fail({ message: 'You can only transfer between your own accounts' });
  try {
    await callProc('CALL sp_transfer(?,?,?,?,?)', [b.from_account, b.to_account, b.amount, b.date, b.description || null]);
    audit(s.uid, 'transfer', 'account', Number(b.from_account), { to: Number(b.to_account), amount: Number(b.amount) });
    return ok({ ok: true });
  } catch (e) { return fail(e); }   // procedure already rolled back
}
