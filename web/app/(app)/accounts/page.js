'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/fmt';
import Flash from '@/components/Flash';

export default function Accounts() {
  const [accts, setAccts] = useState([]);
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/accounts').then(setAccts).catch(e => setMsg({ t: 'error', m: e.message }));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/accounts', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      setMsg({ t: 'ok', m: 'Account added' }); form.reset(); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  const total = accts.reduce((s, a) => s + a.balance, 0);

  return (<>
    <h1>Accounts</h1><Flash msg={msg} />
    <div className="grid">
      <div className="card"><div className="mut">Total balance</div><div className="stat">{inr(total)}</div></div>
      {accts.map(a => <div className="card" key={a.account_id}>
        <div className="mut">{a.account_type}</div><b>{a.account_name}</b><div className="stat">{inr(a.balance)}</div></div>)}
    </div>
    <div className="card"><b>Add account</b><br /><br />
      <form className="row" onSubmit={add}>
        <label>Name<input name="account_name" required /></label>
        <label>Type<select name="account_type"><option>savings</option><option>cash</option><option>credit</option><option>wallet</option></select></label>
        <label>Opening balance<input name="balance" type="number" step="0.01" min="0" defaultValue="0" /></label>
        <button>Add</button>
      </form>
    </div>
  </>);
}
