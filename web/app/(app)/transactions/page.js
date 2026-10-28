'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr, today } from '@/lib/fmt';
import Flash from '@/components/Flash';
import ReceiptPanel from '@/components/ReceiptPanel';

const CREDIT = ['income', 'transfer_in'];

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [accts, setAccts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], merchants: [] });
  const [filters, setFilters] = useState({ account: '', category: '', month: '' });
  const [receiptFor, setReceiptFor] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadTxns = (f = filters) => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    api('/api/transactions?' + qs).then(setTxns).catch(e => setMsg({ t: 'error', m: e.message }));
  };
  useEffect(() => {
    api('/api/accounts').then(setAccts);
    api('/api/meta').then(setMeta);
    loadTxns();
  }, []);

  async function add(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/transactions', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      setMsg({ t: 'ok', m: 'Transaction added' }); form.reset(); loadTxns();
    } catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  async function del(id) {
    if (!confirm('Delete this transaction?')) return;
    try { await api('/api/transactions/' + id, { method: 'DELETE' }); setMsg({ t: 'ok', m: 'Deleted, balance restored' }); loadTxns(); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }

  return (<>
    <h1>Transactions</h1><Flash msg={msg} />
    <div className="card"><b>Add transaction</b><br /><br />
      <form className="row" onSubmit={add}>
        <label>Account<select name="account_id">{accts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}</select></label>
        <label>Type<select name="txn_type"><option>expense</option><option>income</option></select></label>
        <label>Category<select name="category_id">{meta.categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name} ({c.category_type})</option>)}</select></label>
        <label>Merchant<select name="merchant_id"><option value="">None</option>{meta.merchants.map(m => <option key={m.merchant_id} value={m.merchant_id}>{m.name}</option>)}</select></label>
        <label>Amount<input name="amount" type="number" step="0.01" min="0.01" required /></label>
        <label>Date<input name="txn_date" type="date" defaultValue={today()} required /></label>
        <label>Description<input name="description" /></label>
        <button>Add</button>
      </form>
    </div>

    {receiptFor && <ReceiptPanel txn={receiptFor} onClose={() => setReceiptFor(null)} />}

    <div className="card">
      <form className="row" style={{ marginBottom: 12 }} onSubmit={e => { e.preventDefault(); loadTxns(); }}>
        <label>Account<select value={filters.account} onChange={e => setFilters({ ...filters, account: e.target.value })}>
          <option value="">All</option>{accts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}</select></label>
        <label>Category<select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All</option>{meta.categories.map(c => <option key={c.category_id}>{c.name}</option>)}</select></label>
        <label>Month<input type="month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} /></label>
        <button>Filter</button>
      </form>
      <table>
        <thead><tr><th>Date</th><th>Account</th><th>Category</th><th>Merchant</th><th>Description</th><th className="right">Amount</th><th></th></tr></thead>
        <tbody>
          {txns.map(t => (
            <tr key={t.transaction_id}>
              <td>{t.txn_date}</td><td>{t.account_name}</td><td>{t.category}</td><td>{t.merchant || '-'}</td><td>{t.description || ''}</td>
              <td className={'right ' + (CREDIT.includes(t.txn_type) ? 'in' : 'out')}>{CREDIT.includes(t.txn_type) ? '+' : '-'}{inr(t.amount)}</td>
              <td><button className="alt" onClick={() => setReceiptFor(t)}>Receipt</button><button className="link" onClick={() => del(t.transaction_id)}>Delete</button></td>
            </tr>))}
          {!txns.length && <tr><td colSpan="7" className="mut">No transactions found</td></tr>}
        </tbody>
      </table>
    </div>
  </>);
}
