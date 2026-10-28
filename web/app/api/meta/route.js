import { query } from '@/lib/mysql';
import { ok } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [categories, merchants] = await Promise.all([
    query("SELECT * FROM Category WHERE category_type<>'transfer' ORDER BY category_type, name"),
    query('SELECT * FROM Merchant ORDER BY name'),
  ]);
  return ok({ categories, merchants });
}
