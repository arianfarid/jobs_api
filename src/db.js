import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 
 * @param {string} text Query string.
 * @param {Parameters} params 
 * @returns 
 */
export async function query(text, params) {
  return pool.query(text, params);
}