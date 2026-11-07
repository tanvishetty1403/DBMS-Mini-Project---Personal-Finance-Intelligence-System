import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  try {
    // fn_goal_progress is a SQL function: saved / target as a %, capped at 100
    return ok(await query(
      'SELECT g.*, fn_goal_progress(g.goal_id) AS progress_pct FROM Goal g WHERE g.user_id=? ORDER BY g.status, g.deadline',
      [s.uid]));
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  const target = Number(b.target_amount), saved = Number(b.current_amount || 0);
  if (!(target > 0)) return fail({ message: 'Target must be greater than 0' });
  if (saved < 0) return fail({ message: 'Already saved cannot be negative' });
  if (saved >= target) return fail({ message: 'Already saved must be less than the target' });
  try {
    const r = await query(
      'INSERT INTO Goal (user_id, goal_name, target_amount, current_amount, deadline) VALUES (?,?,?,?,?)',
      [s.uid, b.goal_name, target, saved, b.deadline || null]);
    audit(s.uid, 'add_goal', 'goal', r.insertId, { goal_name: b.goal_name, target });
    return ok({ goal_id: r.insertId }, 201);
  } catch (e) { return fail(e); }
}