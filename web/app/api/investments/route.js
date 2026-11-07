import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  try {
    // profit/loss comes from the SQL function fn_investment_pnl
    const rows = await query(
      `SELECT i.*, i.quantity*i.buy_price AS invested, i.quantity*i.current_price AS current_value,
              fn_investment_pnl(i.investment_id) AS pnl,
              ROUND(fn_investment_pnl(i.investment_id) / NULLIF(i.quantity*i.buy_price, 0) * 100, 2) AS pnl_pct
       FROM Investment i WHERE i.user_id=? ORDER BY i.purchase_date DESC`, [s.uid]);
    // totals per asset type come from the stored procedure (the row with asset_type = null is the grand total)
    const [summary] = await query('CALL sp_portfolio_summary(?)', [s.uid]);
    return ok({ rows, summary });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  // friendly messages first; the database CHECK constraints are the safety net behind them
  if (!(Number(b.quantity) > 0)) return fail({ message: 'Quantity must be greater than 0' });
  if (!(Number(b.buy_price) >= 0)) return fail({ message: 'Buy price cannot be negative' });
  if (b.current_price && !(Number(b.current_price) >= 0)) return fail({ message: 'Current price cannot be negative' });
  try {
    const r = await query(
      `INSERT INTO Investment (user_id, asset_name, asset_type, quantity, buy_price, current_price, purchase_date)
       VALUES (?,?,?,?,?,?,?)`,
      [s.uid, b.asset_name, b.asset_type, b.quantity, b.buy_price, b.current_price || b.buy_price, b.purchase_date]);
    audit(s.uid, 'add_investment', 'investment', r.insertId, { asset_name: b.asset_name, asset_type: b.asset_type });
    return ok({ investment_id: r.insertId }, 201);
  } catch (e) { return fail(e); }
}