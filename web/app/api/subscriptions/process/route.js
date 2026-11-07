import { query } from '@/lib/mysql';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/mongo';
import { ok, fail } from '@/lib/http';
export const dynamic = 'force-dynamic';

// Calls the stored procedure: for every due subscription of THIS user it inserts a
// Transaction and the trigger trg_subscription_next_payment moves the next date forward.
export async function POST() {
  const s = await getSession();
  try {
    const [res] = await query('CALL sp_process_due_subscriptions(?)', [s.uid]);   // res = [{ payments_processed, subscriptions_failed }]
    audit(s.uid, 'process_subscriptions', 'subscription', null, res[0]);
    return ok(res[0]);
  } catch (e) { return fail(e); }
}