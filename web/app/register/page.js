'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Flash from '@/components/Flash';

export default function Register() {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  async function submit(e) {
    e.preventDefault();
    try { await api('/api/auth/register', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); router.push('/login'); }
    catch (err) { setMsg({ t: 'error', m: err.message }); }
  }
  return (
    <div className="card auth"><h1>Register</h1><Flash msg={msg} />
      <form onSubmit={submit}>
        <label>Name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required minLength={6} /></label>
        <button>Create account</button>
      </form>
      <p className="mut">Already registered? <Link href="/login">Log in</Link></p>
    </div>
  );
}
