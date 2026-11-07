'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr, today } from '@/lib/fmt';
import Flash from '@/components/Flash';

export default function Subscriptions() {
  const [data, setData] = useState({ subs: [], summary: null });
  const [accts, setAccts] = useState([]);
  const [cats, setCats] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api('/api/subscriptions').then(setData).catch(e => setMsg({ t: 'error', m: e.message }));
  useEffect(() => {
    load();
    api('/api/accounts').then(setAccts);
    api('/api/meta').then(m => setCats(m.categories.filter(c => c.category_type === 'expense')));
  }, []);

  async function add(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/subscriptions', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      setMsg({ t: 'ok', m: 'Subscription added' }); form.reset(); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function processDue() {
    try {
      const r = await api('/api/subscriptions/process', { method: 'POST' });
      setMsg({ t: r.subscriptions_failed ? 'error' : 'ok', m: `Processed ${r.payments_processed} payment(s); ${r.subscriptions_failed} failed.` });
      load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function setStatus(x, status) {
    try { await api('/api/subscriptions/' + x.subscription_id, { method: 'PUT', body: { status } }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function del(x) {
    if (!confirm('Delete ' + x.name + '?')) return;
    try { await api('/api/subscriptions/' + x.subscription_id, { method: 'DELETE' }); setMsg({ t: 'ok', m: 'Subscription deleted' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }

  const sm = data.summary;
  return (<>
    <h1>Subscriptions</h1><Flash msg={msg} />

    {sm && <div className="grid">
      <div className="card"><div className="mut">Active subscriptions</div><div className="stat">{sm.active_count}</div></div>
      <div className="card"><div className="mut">Cost per month</div><div className="stat">{inr(sm.monthly_total)}</div></div>
      <div className="card"><div className="mut">Cost per year</div><div className="stat">{inr(sm.yearly_total)}</div></div>
    </div>}

    <div className="card"><b>Add subscription</b><br /><br />
      <form className="row" onSubmit={add}>
        <label>Name<input name="name" placeholder="Netflix" required /></label>
        <label>Amount<input name="amount" type="number" min="1" step="0.01" required /></label>
        <label>Billing cycle<select name="billing_cycle" defaultValue="MONTHLY">
          <option>WEEKLY</option><option>MONTHLY</option><option>YEARLY</option></select></label>
        <label>Next payment<input name="next_payment_date" type="date" defaultValue={today()} required /></label>
        <label>Pay from<select name="account_id" required>
          <option value="">Choose…</option>
          {accts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
        </select></label>
        <label>Category<select name="category_id" required>
          <option value="">Choose…</option>
          {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select></label>
        <button>Add</button>
      </form>
    </div>

    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <b>All subscriptions</b><button onClick={processDue}>Process due payments</button>
      </div>
      <table>
        <thead><tr><th>Name</th><th className="right">Amount</th><th>Cycle</th><th>Category</th><th className="right">Per month</th>
          <th>Next payment</th><th>Last paid</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {data.subs.map(x => (
            <tr key={x.subscription_id}>
              <td>{x.name}</td>
              <td className="right">{inr(x.amount)}</td>
              <td>{x.billing_cycle}</td>
              <td>{x.category || '-'}</td>
              <td className="right">{x.monthly_cost == null ? '-' : inr(x.monthly_cost)}</td>
              <td>{x.next_payment_date}</td>
              <td>{x.last_paid_date || '-'}</td>
              <td>{x.status}</td>
              <td>
                {x.status === 'ACTIVE'
                  ? <button className="alt" onClick={() => setStatus(x, 'PAUSED')}>Pause</button>
                  : <button className="alt" onClick={() => setStatus(x, 'ACTIVE')}>Activate</button>}
                <button className="link" onClick={() => del(x)}>Delete</button>
              </td>
            </tr>))}
          {!data.subs.length && <tr><td colSpan="9" className="mut">No subscriptions yet</td></tr>}
        </tbody>
      </table>
    </div>
  </>);
}