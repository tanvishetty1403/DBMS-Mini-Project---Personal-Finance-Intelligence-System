import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

// PUT = update the current market price (body: { current_price })
export async function PUT(req, { params }) {
  const s = await getSession();
  const b = await req.json();
  try {
    const r = await query('UPDATE Investment SET current_price=? WHERE investment_id=? AND user_id=?',
      [b.current_price, params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Investment not found' }, 404);
    audit(s.uid, 'update_price', 'investment', Number(params.id), { current_price: Number(b.current_price) });
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}

export async function DELETE(req, { params }) {
  const s = await getSession();
  try {
    const r = await query('DELETE FROM Investment WHERE investment_id=? AND user_id=?', [params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Investment not found' }, 404);
    audit(s.uid, 'delete_investment', 'investment', Number(params.id));
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}