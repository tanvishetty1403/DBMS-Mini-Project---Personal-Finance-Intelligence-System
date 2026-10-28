import { NextResponse } from 'next/server';
export const ok = (data, status = 200) => NextResponse.json(data, { status });
// sqlMessage carries the text from SQL SIGNAL (e.g. "Insufficient balance: transaction blocked")
export const fail = (e, status = 400) =>
  NextResponse.json({ error: e?.sqlMessage || e?.message || String(e) }, { status });
