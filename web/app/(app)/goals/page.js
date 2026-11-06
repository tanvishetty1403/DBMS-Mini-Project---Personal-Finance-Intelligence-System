'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/fmt';
import Flash from '@/components/Flash';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/goals').then(setGoals).catch(e => setMsg({ t: 'error', m: e.message }));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/goals', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      setMsg({ t: 'ok', m: 'Goal added' }); form.reset(); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function contribute(g) {
    const v = prompt('Add how much to "' + g.goal_name + '"?');
    if (!v) return;
    try {
      const r = await api('/api/goals/' + g.goal_id + '/contribute', { method: 'POST', body: { amount: v } });
      setMsg({ t: 'ok', m: r.status === 'COMPLETED' ? '🎉 Goal completed: ' + g.goal_name : 'Money added' }); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function cancel(g) {
    try { await api('/api/goals/' + g.goal_id, { method: 'PUT' }); setMsg({ t: 'ok', m: 'Goal cancelled' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function del(g) {
    if (!confirm('Delete "' + g.goal_name + '"?')) return;
    try { await api('/api/goals/' + g.goal_id, { method: 'DELETE' }); setMsg({ t: 'ok', m: 'Goal deleted' }); load(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }

  return (<>
    <h1>Goals</h1><Flash msg={msg} />

    <div className="card"><b>Add goal</b><br /><br />
      <form className="row" onSubmit={add}>
        <label>Goal<input name="goal_name" placeholder="Laptop" required /></label>
        <label>Target amount<input name="target_amount" type="number" min="1" step="0.01" required /></label>
        <label>Already saved<input name="current_amount" type="number" min="0" step="0.01" defaultValue="0" /></label>
        <label>Deadline<input name="deadline" type="date" /></label>
        <button>Add</button>
      </form>
    </div>

    <div className="grid">
      {goals.map(g => (
        <div className="card" key={g.goal_id}>
          <div className="mut">{g.status.replace('_', ' ')}</div>
          <b>{g.goal_name}{g.status === 'COMPLETED' && ' ✅'}</b>
          <div style={{ background: '#e5e7ef', borderRadius: 99, height: 8, margin: '8px 0' }}>
            <div style={{ width: g.progress_pct + '%', height: 8, borderRadius: 99, background: g.status === 'COMPLETED' ? '#16a34a' : '#4f46e5' }} />
          </div>
          <div>{inr(g.current_amount)} of {inr(g.target_amount)} <span className="mut">({g.progress_pct}%)</span></div>
          <div className="mut">
            {g.deadline ? 'Deadline: ' + g.deadline : 'No deadline'}{g.completed_on ? ' · Completed on ' + g.completed_on : ''}
          </div>
          <div style={{ marginTop: 10 }}>
            {g.status === 'IN_PROGRESS' && <>
              <button className="alt" onClick={() => contribute(g)}>Add money</button>
              <button className="alt" onClick={() => cancel(g)}>Cancel goal</button>
            </>}
            <button className="link" onClick={() => del(g)}>Delete</button>
          </div>
        </div>))}
      {!goals.length && <p className="mut">No goals yet</p>}
    </div>
  </>);
}