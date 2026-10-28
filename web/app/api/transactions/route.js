import { query, callProc } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const s = await getSession();
  const q = req.nextUrl.searchParams;
  let sql = 'SELECT * FROM v_transaction_details WHERE user_id=?';
  const p = [s.uid];
  if (q.get('account')) { sql += ' AND account_id=?'; p.push(q.get('account')); }
  if (q.get('category')) { sql += ' AND category=?'; p.push(q.get('category')); }
  if (q.get('month')) { sql += " AND DATE_FORMAT(txn_date,'%Y-%m')=?"; p.push(q.get('month')); }
  sql += ' ORDER BY txn_date DESC, transaction_id DESC LIMIT 200';
  return ok(await query(sql, p));
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  const [acct] = await query('SELECT account_id FROM Account WHERE account_id=? AND user_id=?', [b.account_id, s.uid]);
  if (!acct) return fail({ message: 'Invalid account' });
  try {
    // overdraft check + balance update are done by the SQL trigger inside this procedure
    const id = await callProc('CALL sp_add_transaction(?,?,?,?,?,?,?,@tid)',
      [b.account_id, b.category_id, b.merchant_id || null, b.amount, b.txn_type, b.txn_date, b.description || null], '@tid');
    audit(s.uid, 'add_transaction', 'transaction', id, { account_id: b.account_id, amount: Number(b.amount), type: b.txn_type });
    return ok({ transaction_id: id }, 201);
  } catch (e) { return fail(e); }
}
