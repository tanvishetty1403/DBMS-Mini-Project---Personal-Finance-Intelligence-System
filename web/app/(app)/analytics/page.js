'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/fmt';
import Flash from '@/components/Flash';
import { CategoryChart, MerchantChart, MonthlyChart } from '@/components/Charts';

export default function Analytics() {
  const [d, setD] = useState(null);
  const [sel, setSel] = useState({ year: '', month: '' });
  const [msg, setMsg] = useState(null);
  const load = (s = sel) => {
    const qs = new URLSearchParams(Object.entries(s).filter(([, v]) => v)).toString();
    api('/api/analytics?' + qs).then(r => { setD(r); setSel({ year: r.year, month: r.month }); }).catch(e => setMsg({ t: 'error', m: e.message }));
  };
  useEffect(() => { load(); }, []);
  if (!d) return <><h1>Spending analytics</h1><Flash msg={msg} /></>;

  return (<>
    <h1>Spending analytics</h1><Flash msg={msg} />
    <form className="row card" onSubmit={e => { e.preventDefault(); load(); }}>
      <label>Year<select value={sel.year} onChange={e => setSel({ ...sel, year: e.target.value })}>{d.years.map(y => <option key={y}>{y}</option>)}</select></label>
      <label>Month<input type="number" min="1" max="12" value={sel.month} onChange={e => setSel({ ...sel, month: e.target.value })} /></label>
      <button>Apply</button>
    </form>
    <div className="grid">
      <div className="card"><div className="mut">Spent this month</div><div className="stat">{inr(d.kpi.spend)}</div></div>
      <div className="card"><div className="mut">Savings rate</div><div className="stat">{d.kpi.rate}%</div></div>
    </div>
    <div className="grid">
      <div className="card"><b>By category</b><CategoryChart data={d.categories} /></div>
      <div className="card"><b>Top merchants</b><MerchantChart data={d.merchants} /></div>
    </div>
    <div className="card"><b>Income vs expense by month</b><MonthlyChart data={d.monthly} /></div>
  </>);
}
