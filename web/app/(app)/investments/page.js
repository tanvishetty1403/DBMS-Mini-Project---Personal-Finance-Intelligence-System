'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr, today } from '@/lib/fmt';
import Flash from '@/components/Flash';

const TYPES = ['STOCK', 'MUTUAL_FUND', 'CRYPTO', 'FD', 'GOLD', 'OTHER'];

export default function Investments() {
  const [data, setData] = useState({ rows: [], summary: [] });
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/investments').then(setData).catch(e => setMsg({ t: 'error', m: e.message }));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/investments', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      setMsg({ t: 'ok', m: 'Investment added' }); form.reset(); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function updatePrice(i) {
    const v = prompt('Current price of ' + i.asset_name, i.current_price);
    if (v === null || v === '') return;
    try { await api('/api/investments/' + i.investment_id, { method: 'PUT', body: { current_price: v } }); setMsg({ t: 'ok', m: 'Price updated' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function del(i) {
    if (!confirm('Delete ' + i.asset_name + '?')) return;
    try { await api('/api/investments/' + i.investment_id, { method: 'DELETE' }); setMsg({ t: 'ok', m: 'Investment deleted' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }

  const total = data.summary.find(x => x.asset_type === null);   // the grand-total row from ROLLUP
  const byType = data.summary.filter(x => x.asset_type !== null);

  return (<>
    <h1>Investments</h1><Flash msg={msg} />

    {total && <div className="grid">
      <div className="card"><div className="mut">Invested</div><div className="stat">{inr(total.invested)}</div></div>
      <div className="card"><div className="mut">Current value</div><div className="stat">{inr(total.current_value)}</div></div>
      <div className="card"><div className="mut">Profit / loss</div>
        <div className={'stat ' + (total.profit_loss >= 0 ? 'in' : 'out')}>{inr(total.profit_loss)} <span className="mut">({total.pnl_pct}%)</span></div></div>
    </div>}

    {byType.length > 0 && <div className="card"><b>Portfolio by asset type</b>
      <table>
        <thead><tr><th>Type</th><th className="right">Holdings</th><th className="right">Invested</th>
          <th className="right">Current</th><th className="right">P&amp;L</th><th className="right">%</th></tr></thead>
        <tbody>
          {byType.map(x => (
            <tr key={x.asset_type}>
              <td>{x.asset_type}</td><td className="right">{x.holdings}</td>
              <td className="right">{inr(x.invested)}</td><td className="right">{inr(x.current_value)}</td>
              <td className={'right ' + (x.profit_loss >= 0 ? 'in' : 'out')}>{inr(x.profit_loss)}</td>
              <td className={'right ' + (x.pnl_pct >= 0 ? 'in' : 'out')}>{x.pnl_pct}%</td>
            </tr>))}
        </tbody>
      </table>
    </div>}

    <div className="card"><b>Add investment</b><br /><br />
      <form className="row" onSubmit={add}>
        <label>Asset name<input name="asset_name" required /></label>
        <label>Type<select name="asset_type">{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label>Quantity<input name="quantity" type="number" min="0.0001" step="any" required /></label>
        <label>Buy price<input name="buy_price" type="number" min="0" step="0.01" required /></label>
        <label>Current price<input name="current_price" type="number" min="0" step="0.01" /></label>
        <label>Purchase date<input name="purchase_date" type="date" defaultValue={today()} required /></label>
        <button>Add</button>
      </form>
    </div>

    <div className="card"><b>Holdings</b>
      <table>
        <thead><tr><th>Asset</th><th>Type</th><th className="right">Qty</th><th className="right">Buy</th><th className="right">Now</th>
          <th className="right">Invested</th><th className="right">Value</th><th className="right">P&amp;L</th><th></th></tr></thead>
        <tbody>
          {data.rows.map(i => (
            <tr key={i.investment_id}>
              <td>{i.asset_name}</td><td>{i.asset_type}</td><td className="right">{i.quantity}</td>
              <td className="right">{inr(i.buy_price)}</td><td className="right">{inr(i.current_price)}</td>
              <td className="right">{inr(i.invested)}</td><td className="right">{inr(i.current_value)}</td>
              <td className={'right ' + (i.pnl >= 0 ? 'in' : 'out')}>{inr(i.pnl)} <span className="mut">({i.pnl_pct}%)</span></td>
              <td>
                <button className="alt" onClick={() => updatePrice(i)}>Update price</button>
                <button className="link" onClick={() => del(i)}>Delete</button>
              </td>
            </tr>))}
          {!data.rows.length && <tr><td colSpan="9" className="mut">No investments yet</td></tr>}
        </tbody>
      </table>
    </div>
  </>);
}