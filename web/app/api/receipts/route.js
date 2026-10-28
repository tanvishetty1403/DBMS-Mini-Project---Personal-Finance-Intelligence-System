import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { mongoDb, audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

async function owns(uid, tid) {
  const [t] = await query('SELECT 1 AS x FROM v_transaction_details WHERE transaction_id=? AND user_id=?', [tid, uid]);
  return !!t;
}

export async function GET(req) {
  const s = await getSession();
  const tid = Number(req.nextUrl.searchParams.get('transaction_id'));
  if (!tid || !(await owns(s.uid, tid))) return fail({ message: 'Transaction not found' }, 404);
  try {
    const db = await mongoDb();
    return ok(await db.collection('receipts').find({ transaction_id: tid }).sort({ uploaded_at: -1 }).toArray());
  } catch (e) { return fail({ message: 'MongoDB unavailable: ' + e.message }, 503); }
}

export async function POST(req) {
  const s = await getSession();
  const b = await req.json();
  const tid = Number(b.transaction_id);
  if (!tid || !(await owns(s.uid, tid))) return fail({ message: 'Transaction not found' }, 404);
  const doc = {
    transaction_id: tid, user_id: s.uid,
    store: String(b.store || ''), notes: String(b.notes || ''),
    items: (b.items || []).map(i => ({ name: String(i.name), qty: Number(i.qty) || 1, price: Number(i.price) || 0 })),
    tax: Number(b.tax) || 0,
    tags: (b.tags || []).map(String),
    uploaded_at: new Date(),
  };
  try {
    const db = await mongoDb();
    const r = await db.collection('receipts').insertOne(doc);
    audit(s.uid, 'add_receipt', 'transaction', tid, { items: doc.items.length });
    return ok({ _id: r.insertedId }, 201);
  } catch (e) { return fail({ message: 'MongoDB unavailable: ' + e.message }, 503); }
}
