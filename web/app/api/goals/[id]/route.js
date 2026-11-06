import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

// PUT = cancel the goal (only your own, only while it is still in progress)
export async function PUT(req, { params }) {
  const s = await getSession();
  try {
    const r = await query(
      "UPDATE Goal SET status='CANCELLED' WHERE goal_id=? AND user_id=? AND status='IN_PROGRESS'", [params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Goal not found or already finished' }, 404);
    audit(s.uid, 'cancel_goal', 'goal', Number(params.id));
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}

export async function DELETE(req, { params }) {
  const s = await getSession();
  try {
    const r = await query('DELETE FROM Goal WHERE goal_id=? AND user_id=?', [params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Goal not found' }, 404);
    audit(s.uid, 'delete_goal', 'goal', Number(params.id));
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}