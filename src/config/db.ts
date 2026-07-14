import { Pool } from 'pg';
import logger from './logger';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  if (pool) return pool;

  const connStr = process.env.DATABASE_URL;
  if (!connStr || connStr.includes('your-db-password')) {
    logger.warn('[DB] DATABASE_URL not set or contains placeholder password. Direct SQL execution unavailable. Table auto-creation disabled.');
    return null;
  }

  pool = new Pool({
    connectionString: connStr,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error('[DB] Unexpected pool error:', err.message);
  });

  logger.info('[DB] Direct PostgreSQL pool created.');
  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function runSql(sql: string): Promise<{ success: boolean; error?: string }> {
  const p = getDbPool();
  if (!p) return { success: false, error: 'DATABASE_URL not configured' };

  try {
    await p.query(sql);
    return { success: true };
  } catch (err: any) {
    logger.error('[DB] SQL execution failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function tableExists(tableName: string): Promise<boolean> {
  const p = getDbPool();
  if (!p) return false;

  try {
    const result = await p.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}
