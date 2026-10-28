'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/fmt';
import Flash from './Flash';

// Receipts are documents in MongoDB (flexible: items, tax, tags vary per receipt)
export default function ReceiptPanel({ txn, onClose }) {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/receipts?transaction_id=' + txn.transaction_id).then(setList).catch(e => setMsg({ t: 'error', m: e.message }));
  useEffect(() => { load(); }, [txn.transaction_id]);

  async function save(e) {
    e.preventDefault();
    const form = e.target, f = Object.fromEntries(new FormData(form));
    const items = (f.items || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [name, qty, price] = l.split(',').map(x => x.trim());
      return { name, qty, price };
    });
    try {
      await api('/api/receipts', { method: 'POST', body: {
        transaction_id: txn.transaction_id, store: f.store, notes: f.notes, tax: f.tax, items,
        tags: (f.tags || '').split(',').map(t => t.trim()).filter(Boolean) } });
      setMsg({ t: 'ok', m: 'Receipt saved' }); form.reset(); load();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>Receipts for #{txn.transaction_id} ({txn.description || txn.category})</b>
        <button className="alt" onClick={onClose}>Close</button>
      </div>
      <Flash msg={msg} />
      {list.map(r => (
        <div key={r._id} style={{ margin: '10px 0', paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
          <b>{r.store || 'Receipt'}</b> <span className="mut">{r.notes} {r.tags?.map(t => '#' + t).join(' ')}</span>
          {r.items.map((i, k) => <div key={k} className="mut">{i.qty} × {i.name} — {inr(i.price)}</div>)}
          {r.tax > 0 && <div className="mut">Tax: {inr(r.tax)}</div>}
        </div>
      ))}
      {!list.length && <p className="mut">No receipts yet.</p>}
      <form className="row" onSubmit={save}>
        <label>Store<input name="store" /></label>
        <label>Tax<input name="tax" type="number" step="0.01" min="0" /></label>
        <label>Tags (comma separated)<input name="tags" /></label>
        <label>Notes<input name="notes" /></label>
        <label>Items (one per line: name, qty, price)<textarea name="items" rows="3" /></label>
        <button>Save receipt</button>
      </form>
    </div>
  );
}
