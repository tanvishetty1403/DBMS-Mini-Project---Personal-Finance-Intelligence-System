import { getSession } from '@/lib/auth';
import { mongoDb } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  try {
    const db = await mongoDb();
    return ok(await db.collection('audit_log').find({ user_id: s.uid }).sort({ ts: -1 }).limit(50).toArray());
  } catch (e) { return fail({ message: 'MongoDB unavailable: ' + e.message }, 503); }
}
