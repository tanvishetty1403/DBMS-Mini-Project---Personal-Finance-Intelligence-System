'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Flash from '@/components/Flash';

// Audit trail stored in MongoDB (audit_log collection)
export default function Activity() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  useEffect(() => { api('/api/activity').then(setRows).catch(e => setMsg({ t: 'error', m: e.message })); }, []);
  return (<>
    <h1>Activity log</h1><Flash msg={msg} />
    <div className="card"><table>
      <thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
      <tbody>
        {rows.map(r => <tr key={r._id}><td>{new Date(r.ts).toLocaleString()}</td><td>{r.action}</td>
          <td>{r.entity} {r.entity_id ?? ''}</td><td><pre>{JSON.stringify(r.details)}</pre></td></tr>)}
        {!rows.length && <tr><td colSpan="4" className="mut">No activity yet</td></tr>}
      </tbody></table></div>
  </>);
}
