'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/fmt';
import Flash from '@/components/Flash';

const COLOR = { OK: '#16a34a', WARNING: '#f59e0b', EXCEEDED: '#dc2626' };

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Budgets() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState({ rows: [], alerts: [] });
  const [cats, setCats] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api('/api/budgets?month=' + month).then(setData).catch(e => setMsg({ t: 'error', m: e.message }));
  useEffect(() => { load(); }, [month]);
  useEffect(() => {
    api('/api/meta').then(m => setCats(m.categories.filter(c => c.category_type === 'expense')));
  }, []);

  async function add(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/budgets', { method: 'POST', body: { ...Object.fromEntries(new FormData(form)), month } });
      setMsg({ t: 'ok', m: 'Budget added' }); form.reset(); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function edit(b) {
    const v = prompt('New limit for ' + b.category, b.limit_amount);
    if (!v) return;
    try { await api('/api/budgets/' + b.budget_id, { method: 'PUT', body: { limit_amount: v } }); setMsg({ t: 'ok', m: 'Limit updated' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function del(b) {
    if (!confirm('Delete the ' + b.category + ' budget?')) return;
    try { await api('/api/budgets/' + b.budget_id, { method: 'DELETE' }); setMsg({ t: 'ok', m: 'Budget deleted' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function dismiss(id) {
    try { await api('/api/budgets/alerts/' + id, { method: 'PUT' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }

  return (<>
    <h1>Budgets</h1><Flash msg={msg} />
    {data.alerts.map(a => (
      <div key={a.alert_id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}><Flash msg={{ t: 'error', m: '⚠️ ' + a.message }} /></div>
        <button className="alt" onClick={() => dismiss(a.alert_id)}>Dismiss</button>
      </div>
    ))}

    <div className="card">
      <form className="row" onSubmit={e => e.preventDefault()}>
        <label>Month<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
      </form>
    </div>

    <div className="card"><b>Add budget</b><br /><br />
      <form className="row" onSubmit={add}>
        <label>Category<select name="category_id" required>
          <option value="">Choose…</option>
          {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select></label>
        <label>Monthly limit<input name="limit_amount" type="number" min="1" step="0.01" required /></label>
        <button>Add</button>
      </form>
    </div>

    <div className="card">
      <table>
        <thead><tr><th>Category</th><th className="right">Limit</th><th className="right">Spent</th>
          <th className="right">Remaining</th><th style={{ width: 160 }}>Used</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {data.rows.map(b => (
            <tr key={b.budget_id}>
              <td>{b.category}</td>
              <td className="right">{inr(b.limit_amount)}</td>
              <td className="right">{inr(b.spent)}</td>
              <td className={'right ' + (b.remaining < 0 ? 'out' : '')}>{inr(b.remaining)}</td>
              <td>
                <div style={{ background: '#e5e7ef', borderRadius: 99, height: 8 }}>
                  <div style={{ width: Math.min(b.utilisation_pct, 100) + '%', height: 8, borderRadius: 99, background: COLOR[b.status] }} />
                </div>
                <span className="mut">{b.utilisation_pct}%</span>
              </td>
              <td>{b.status}</td>
              <td><button className="alt" onClick={() => edit(b)}>Edit</button><button className="link" onClick={() => del(b)}>Delete</button></td>
            </tr>))}
          {!data.rows.length && <tr><td colSpan="7" className="mut">No budgets for this month</td></tr>}
        </tbody>
      </table>
    </div>
  </>);
}