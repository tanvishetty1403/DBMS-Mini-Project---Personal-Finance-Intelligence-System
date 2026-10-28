import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { ok } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const s = await getSession();
  const q = req.nextUrl.searchParams;
  let y = Number(q.get('year')), m = Number(q.get('month'));
  if (!y || !m) {   // default to the user's latest month with data
    const [latest] = await query('SELECT yr, mo FROM v_monthly_summary WHERE user_id=? AND (income>0 OR expense>0) ORDER BY yr DESC, mo DESC LIMIT 1', [s.uid]);
    const d = new Date();
    y = latest?.yr ?? d.getFullYear(); m = latest?.mo ?? d.getMonth() + 1;
  }
  const [[kpi], categories, merchants, monthly, years] = await Promise.all([
    query('SELECT fn_monthly_spend(?,NULL,?,?) AS spend, fn_savings_rate(?,?,?) AS rate', [s.uid, y, m, s.uid, y, m]),
    query('SELECT category, total_spent FROM v_spending_by_category WHERE user_id=? AND yr=? AND mo=? ORDER BY total_spent DESC', [s.uid, y, m]),
    query('SELECT merchant, total_spent FROM v_spending_by_merchant WHERE user_id=? ORDER BY total_spent DESC LIMIT 8', [s.uid]),
    query("SELECT CONCAT(yr,'-',LPAD(mo,2,'0')) AS ym, income, expense FROM v_monthly_summary WHERE user_id=? ORDER BY yr, mo", [s.uid]),
    query('SELECT DISTINCT yr FROM v_monthly_summary WHERE user_id=? ORDER BY yr DESC', [s.uid]),
  ]);
  return ok({ year: y, month: m, kpi, categories, merchants, monthly, years: years.map(r => r.yr) });
}
