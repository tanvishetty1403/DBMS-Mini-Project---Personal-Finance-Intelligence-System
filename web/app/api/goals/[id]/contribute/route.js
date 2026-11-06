import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const s = await getSession();
  const amount = Number((await req.json()).amount);
  if (!(amount > 0)) return fail({ message: 'Amount must be positive' });
  try {
    // only your own goal that is still in progress. The trigger trg_goal_progress
    // flips it to COMPLETED by itself when current_amount reaches target_amount.
    const r = await query(
      "UPDATE Goal SET current_amount = current_amount + ? WHERE goal_id=? AND user_id=? AND status='IN_PROGRESS'",
      [amount, params.id, s.uid]);
    if (!r.affectedRows) return fail({ message: 'Goal not found or already finished' }, 404);
    const [g] = await query('SELECT goal_name, current_amount, target_amount, status FROM Goal WHERE goal_id=?', [params.id]);
    audit(s.uid, 'goal_contribution', 'goal', Number(params.id), { amount, status: g.status });
    return ok(g);
  } catch (e) { return fail(e); }
}