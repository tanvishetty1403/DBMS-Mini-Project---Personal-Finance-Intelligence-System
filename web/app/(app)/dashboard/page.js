'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/fmt';
import Flash from '@/components/Flash';

const COLOR = (pct) => (pct > 100 ? '#dc2626' : pct >= 80 ? '#f59e0b' : '#16a34a');

function Bar({ pct, color }) {
  return (
    <div style={{ background: '#e5e7ef', borderRadius: 99, height: 8, margin: '6px 0' }}>
      <div style={{ width: Math.min(pct, 100) + '%', height: 8, borderRadius: 99, background: color }} />
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);
  useEffect(() => { api('/api/dashboard').then(setD).catch(e => setMsg({ t: 'error', m: e.message })); }, []);

  if (!d) return (<><h1>Dashboard</h1><Flash msg={msg} />{!msg && <p className="mut">Loading…</p>}</>);

  return (<>
    <h1>Dashboard</h1><Flash msg={msg} />
    {d.unread_alerts > 0 && <Flash msg={{ t: 'error', m: `You have ${d.unread_alerts} unread budget alert(s). Open Budgets to read them.` }} />}

    <div className="grid">
      <div className="card"><div className="mut">Net worth</div><div className="stat">{inr(d.net_worth.net_worth)}</div></div>
      <div className="card"><div className="mut">Cash in accounts</div><div className="stat">{inr(d.net_worth.cash_balance)}</div></div>
      <div className="card"><div className="mut">Investments (current value)</div><div className="stat">{inr(d.net_worth.investment_value)}</div></div>
      <div className="card"><div className="mut">Investment profit / loss</div>
        <div className={'stat ' + (d.pnl >= 0 ? 'in' : 'out')}>{inr(d.pnl)}</div></div>
      <div className="card"><div className="mut">Subscriptions per month</div><div className="stat">{inr(d.monthly_subscriptions)}</div></div>
    </div>

    <div className="grid">
      <div className="card"><b>Budgets this month</b><br /><br />
        {d.budgets.map(b => (
          <div key={b.category} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{b.category}</span><span className="mut">{inr(b.spent)} / {inr(b.limit_amount)}</span>
            </div>
            <Bar pct={b.utilisation_pct} color={COLOR(b.utilisation_pct)} />
          </div>))}
        {!d.budgets.length && <p className="mut">No budgets set yet</p>}
      </div>

      <div className="card"><b>Goals</b><br /><br />
        {d.goals.map(g => (
          <div key={g.goal_name} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{g.goal_name}{g.status === 'COMPLETED' && ' ✅'}</span><span className="mut">{g.progress_pct}%</span>
            </div>
            <Bar pct={g.progress_pct} color={g.status === 'COMPLETED' ? '#16a34a' : '#4f46e5'} />
          </div>))}
        {!d.goals.length && <p className="mut">No goals yet</p>}
      </div>

      <div className="card"><b>Upcoming payments</b>
        <table><tbody>
          {d.upcoming.map(x => (
            <tr key={x.name}><td>{x.name}</td><td className="right">{inr(x.amount)}</td><td className="right mut">{x.next_payment_date}</td></tr>))}
          {!d.upcoming.length && <tr><td className="mut">No active subscriptions</td></tr>}
        </tbody></table>
      </div>
    </div>
  </>);
}