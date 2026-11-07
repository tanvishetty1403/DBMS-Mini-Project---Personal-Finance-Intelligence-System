import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;   // first day of this month
  try {
    // net worth = cash in accounts + investments, from the SQL view vw_net_worth
    const [nw] = await query('SELECT cash_balance, investment_value, net_worth FROM vw_net_worth WHERE user_id=?', [s.uid]);
    // this month's budgets from the view vw_budget_vs_actual
    const budgets = await query(
      'SELECT category, limit_amount, spent, utilisation_pct FROM vw_budget_vs_actual WHERE user_id=? AND month_year=? ORDER BY utilisation_pct DESC',
      [s.uid, month]);
    // subscription cost from the view vw_subscription_cost
    const upcoming = await query(
      'SELECT name, amount, next_payment_date FROM vw_subscription_cost WHERE user_id=? ORDER BY next_payment_date LIMIT 5', [s.uid]);
    const [subs] = await query('SELECT COALESCE(SUM(monthly_cost),0) AS monthly_total FROM vw_subscription_cost WHERE user_id=?', [s.uid]);
    // goal progress from the SQL function fn_goal_progress
    const goals = await query(
      "SELECT goal_name, status, fn_goal_progress(goal_id) AS progress_pct FROM Goal WHERE user_id=? AND status<>'CANCELLED' ORDER BY status, deadline",
      [s.uid]);
    // total profit/loss from the SQL function fn_investment_pnl
    const [pnl] = await query('SELECT COALESCE(SUM(fn_investment_pnl(investment_id)),0) AS pnl FROM Investment WHERE user_id=?', [s.uid]);
    const [al] = await query('SELECT COUNT(*) AS n FROM Budget_Alert WHERE user_id=? AND is_read=0', [s.uid]);
    return ok({
      net_worth: nw || { cash_balance: 0, investment_value: 0, net_worth: 0 },
      budgets, upcoming, goals,
      monthly_subscriptions: subs.monthly_total,
      pnl: pnl.pnl,
      unread_alerts: al.n,
    });
  } catch (e) { return fail(e); }
}