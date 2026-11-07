import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  try {
    // monthly_cost comes from the SQL view vw_subscription_cost (active subscriptions only)
    const subs = await query(
      `SELECT s.*, c.name AS category, v.monthly_cost
       FROM Subscription s
       LEFT JOIN Category c ON c.category_id = s.category_id
       LEFT JOIN vw_subscription_cost v ON v.subscription_id = s.subscription_id
       WHERE s.user_id=? ORDER BY s.status, s.next_payment_date`, [s.uid]);
    const [summary] = await query(
      `SELECT COUNT(*) AS active_count, COALESCE(SUM(monthly_cost),0) AS monthly_total,
              COALESCE(SUM(yearly_cost),0) AS yearly_total
       FROM vw_subscription_cost WHERE user_id=?`, [s.uid]);
    return ok({ subs, summary });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  // the account must be yours (same check Tanvi uses for transactions)
  const [acct] = await query('SELECT account_id FROM Account WHERE account_id=? AND user_id=?', [b.account_id, s.uid]);
  if (!acct) return fail({ message: 'Invalid account' });
  // a category is required: each payment becomes a Transaction, and Transaction.category_id cannot be NULL
  if (!b.category_id) return fail({ message: 'Choose a category' });
  try {
    const r = await query(
      `INSERT INTO Subscription (user_id, account_id, category_id, name, amount, billing_cycle, next_payment_date)
       VALUES (?,?,?,?,?,?,?)`,
      [s.uid, b.account_id, b.category_id, b.name, b.amount, b.billing_cycle || 'MONTHLY', b.next_payment_date]);
    audit(s.uid, 'add_subscription', 'subscription', r.insertId, { name: b.name, amount: Number(b.amount) });
    return ok({ subscription_id: r.insertId }, 201);
  } catch (e) { return fail(e); }
}