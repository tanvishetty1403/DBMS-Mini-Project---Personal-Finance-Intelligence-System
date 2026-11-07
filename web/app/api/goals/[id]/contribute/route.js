import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
import { inr } from '@/lib/fmt';
export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const s = await getSession();
  const amount = Number((await req.json()).amount);
  if (!(amount > 0)) return fail({ message: 'Amount must be positive' });
  try {
    // how much is still missing? (only your own goal that is still in progress)
    const [goal] = await query(
      "SELECT target_amount - current_amount AS remaining FROM Goal WHERE goal_id=? AND user_id=? AND status='IN_PROGRESS'",
      [params.id, s.uid]);
    if (!goal) return fail({ message: 'Goal not found or already finished' }, 404);
    if (amount > goal.remaining)
      return fail({ message: `Only ${inr(goal.remaining)} left to reach this goal's target` });
    // the trigger trg_goal_progress flips the goal to COMPLETED when current_amount reaches target_amount
    await query('UPDATE Goal SET current_amount = current_amount + ? WHERE goal_id=? AND user_id=?', [amount, params.id, s.uid]);
    const [g] = await query('SELECT goal_name, current_amount, target_amount, status FROM Goal WHERE goal_id=?', [params.id]);
    audit(s.uid, 'goal_contribution', 'goal', Number(params.id), { amount, status: g.status });
    return ok(g);
  } catch (e) { return fail(e); }
}