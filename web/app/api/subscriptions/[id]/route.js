import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

// PUT = pause or re-activate (body: { status: 'PAUSED' | 'ACTIVE' })
export async function PUT(req, { params }) {
  const s = await getSession();
  const b = await req.json();
  if (!['ACTIVE', 'PAUSED'].includes(b.status)) return fail({ message: 'Invalid status' });
  try {
    const r = await query('UPDATE Subscription SET status=? WHERE subscription_id=? AND user_id=?', [b.status, params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Subscription not found' }, 404);
    audit(s.uid, 'subscription_' + b.status.toLowerCase(), 'subscription', Number(params.id));
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}

export async function DELETE(req, { params }) {
  const s = await getSession();
  try {
    const r = await query('DELETE FROM Subscription WHERE subscription_id=? AND user_id=?', [params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Subscription not found' }, 404);
    audit(s.uid, 'delete_subscription', 'subscription', Number(params.id));
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}