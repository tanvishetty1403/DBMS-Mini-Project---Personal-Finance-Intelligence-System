'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Maansi: add { href: '/budgets', label: 'Budgets' }, goals, subscriptions, investments, dashboard here
const LINKS = [
  { href: '/accounts', label: 'Accounts' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/transfer', label: 'Transfer' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/activity', label: 'Activity' },
];

export default function Nav() {
  const path = usePathname(), router = useRouter();
  const [me, setMe] = useState(null);
  useEffect(() => { api('/api/auth/me').then(setMe).catch(() => {}); }, []);
  async function logout() { await api('/api/auth/logout', { method: 'POST' }); router.push('/login'); }
  return (
    <nav>
      <b>PFIS</b>
      {LINKS.map(l => <Link key={l.href} href={l.href} className={path === l.href ? 'on' : ''}>{l.label}</Link>)}
      <span className="mut">{me?.name}</span>
      <button className="nl" onClick={logout}>Logout</button>
    </nav>
  );
}
