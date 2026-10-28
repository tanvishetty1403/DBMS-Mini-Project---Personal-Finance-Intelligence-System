// Run once:  npm run seed:mongo   (needs MONGODB_URI in .env.local)
const { MongoClient } = require('mongodb');

(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017').connect();
  const db = client.db(process.env.MONGODB_DB || 'pfis');
  await db.collection('receipts').deleteMany({});
  await db.collection('receipts').insertMany([
    { transaction_id: 3, user_id: 1, store: 'Swiggy', notes: 'Dinner order', tax: 22.5, tags: ['food', 'delivery'],
      items: [{ name: 'Paneer wrap', qty: 2, price: 180 }, { name: 'Cold coffee', qty: 1, price: 90 }], uploaded_at: new Date() },
    { transaction_id: 9, user_id: 1, store: 'Amazon', notes: 'Wireless headphones', tax: 350.7, tags: ['electronics'],
      items: [{ name: 'Headphones', qty: 1, price: 1948.3 }], uploaded_at: new Date() },
    { transaction_id: 25, user_id: 2, store: 'Amazon', notes: 'Home order', tax: 243.9, tags: ['shopping'],
      items: [{ name: 'Desk lamp', qty: 1, price: 1355.1 }], uploaded_at: new Date() },
  ]);
  await db.collection('receipts').createIndex({ transaction_id: 1 });
  await db.collection('audit_log').createIndex({ user_id: 1, ts: -1 });
  console.log('Seeded receipts + indexes in', db.databaseName);
  await client.close();
})().catch(e => { console.error(e.message); process.exit(1); });
