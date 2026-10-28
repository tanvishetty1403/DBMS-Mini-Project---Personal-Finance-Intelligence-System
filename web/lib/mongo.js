import { MongoClient } from 'mongodb';

const g = globalThis;

export async function mongoDb() {
  if (!g._pfisMongo) {
    g._pfisMongo = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
      { serverSelectionTimeoutMS: 2500 }).connect();
  }
  try {
    return (await g._pfisMongo).db(process.env.MONGODB_DB || 'pfis');
  } catch (e) {
    g._pfisMongo = null;   // retry on next call
    throw e;
  }
}

// Audit trail. Never blocks or breaks the SQL operation if Mongo is down.
export async function audit(uid, action, entity, entityId, details = {}) {
  try {
    const db = await mongoDb();
    await db.collection('audit_log').insertOne({
      user_id: uid, action, entity, entity_id: entityId ?? null, details, ts: new Date(),
    });
  } catch (e) {
    console.error('audit log failed:', e.message);
  }
}
