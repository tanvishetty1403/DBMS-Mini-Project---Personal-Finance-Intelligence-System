import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit, mongoDb } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function DELETE(_req, { params }) {
  const s = await getSession();
  const [t] = await query('SELECT * FROM v_transaction_details WHERE transaction_id=? AND user_id=?', [params.id, s.uid]);
  if (!t) return fail({ message: 'Transaction not found' }, 404);
  try {
    await query('DELETE FROM Transaction WHERE transaction_id=?', [params.id]);   // trigger restores the balance
    audit(s.uid, 'delete_transaction', 'transaction', Number(params.id), { amount: t.amount, type: t.txn_type });
    mongoDb().then(db => db.collection('receipts').deleteMany({ transaction_id: Number(params.id) })).catch(() => {});
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}
