import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const KEY = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-change-me');
const PUBLIC = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  const t = req.cookies.get('pfis_session')?.value;
  if (t) {
    try { await jwtVerify(t, KEY); return NextResponse.next(); } catch {}
  }
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
