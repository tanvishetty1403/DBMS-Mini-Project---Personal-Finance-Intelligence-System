'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Flash from '@/components/Flash';

export default function Login() {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  async function submit(e) {
    e.preventDefault();
    try { await api('/api/auth/login', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); router.push('/accounts'); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  return (
    <div className="card auth"><h1>Log in</h1><Flash msg={msg} />
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        <button>Log in</button>
      </form>
      <p className="mut">No account? <Link href="/register">Register</Link></p>
    </div>
  );
}
