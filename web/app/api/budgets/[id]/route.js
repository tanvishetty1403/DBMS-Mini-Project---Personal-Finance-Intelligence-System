import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  const s = await getSession();
  const b = await req.json();
  try {
    // user_id in the WHERE: you can only change your own budget
    const r = await query('UPDATE Budget SET limit_amount=?, alert_sent=0 WHERE budget_id=? AND user_id=?',
      [b.limit_amount, params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Budget not found' }, 404);
    audit(s.uid, 'update_budget', 'budget', Number(params.id), { limit: Number(b.limit_amount) });
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}

export async function DELETE(req, { params }) {
  const s = await getSession();
  try {
    const r = await query('DELETE FROM Budget WHERE budget_id=? AND user_id=?', [params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Budget not found' }, 404);
    audit(s.uid, 'delete_budget', 'budget', Number(params.id));
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}