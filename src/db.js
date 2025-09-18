import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
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

