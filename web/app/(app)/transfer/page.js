'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr, today } from '@/lib/fmt';
import Flash from '@/components/Flash';

export default function Transfer() {
  const [accts, setAccts] = useState([]);
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/accounts').then(setAccts);
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/transfer', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
      setMsg({ t: 'ok', m: 'Transfer complete' }); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  return (<>
    <h1>Transfer between accounts</h1><Flash msg={msg} />
    <div className="card">
      <form className="row" onSubmit={submit}>
        <label>From<select name="from_account">{accts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name} ({inr(a.balance)})</option>)}</select></label>
        <label>To<select name="to_account">{accts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}</select></label>
        <label>Amount<input name="amount" type="number" step="0.01" min="0.01" required /></label>
        <label>Date<input name="date" type="date" defaultValue={today()} required /></label>
        <label>Note<input name="description" /></label>
        <button>Transfer</button>
      </form>
      <p className="mut">Both legs are applied together. If either fails (e.g. insufficient balance), nothing changes.</p>
    </div>
  </>);
}
