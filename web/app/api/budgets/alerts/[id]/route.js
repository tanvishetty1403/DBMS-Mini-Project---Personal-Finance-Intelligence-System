import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

// mark one alert (written by the trigger) as read, so it stops showing
export async function PUT(req, { params }) {
  const s = await getSession();
  try {
    await query('UPDATE Budget_Alert SET is_read=1 WHERE alert_id=? AND user_id=?', [params.id, s.uid]);
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}