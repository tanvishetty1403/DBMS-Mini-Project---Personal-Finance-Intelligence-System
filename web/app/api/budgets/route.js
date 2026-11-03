import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

// first day of the month: '2026-11' -> '2026-11-01' (empty = this month)
function monthStart(m) {
  if (/^\d{4}-\d{2}$/.test(m || '')) return m + '-01';
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function GET(req) {
  const s = await getSession();
  const month = monthStart(req.nextUrl.searchParams.get('month'));
  try {
    // the stored procedure does all the maths (spent, remaining, %, status)
    const [rows] = await query('CALL sp_monthly_budget_report(?, ?)', [s.uid, month]);
    const alerts = await query(
      'SELECT alert_id, message FROM Budget_Alert WHERE user_id=? AND is_read=0 ORDER BY alert_id DESC', [s.uid]);
    return ok({ rows, alerts });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  try {
    const r = await query('INSERT INTO Budget (user_id, category_id, month_year, limit_amount) VALUES (?,?,?,?)',
      [s.uid, b.category_id, monthStart(b.month), b.limit_amount]);
    audit(s.uid, 'add_budget', 'budget', r.insertId, { category_id: Number(b.category_id), limit: Number(b.limit_amount) });
    return ok({ budget_id: r.insertId }, 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return fail({ message: 'You already have a budget for that category and month' });
    return fail(e);
  }
}