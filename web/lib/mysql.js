import mysql from 'mysql2/promise';

const g = globalThis;
export const pool = g._pfisPool ?? (g._pfisPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_finance',
  decimalNumbers: true,   // DECIMAL columns come back as numbers
  dateStrings: true,      // DATE columns come back as 'YYYY-MM-DD'
  connectionLimit: 10,
}));

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Run a CALL on one connection and read back an OUT variable (e.g. '@tid').
export async function callProc(sql, params, outVar) {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql, params);
    if (!outVar) return null;
    const [r] = await conn.query(`SELECT ${outVar} AS v`);
    return r[0].v;
  } finally {
    conn.release();
  }
}
