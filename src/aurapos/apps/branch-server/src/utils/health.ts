import { Pool } from 'pg';

export async function checkHealth(pool: Pool): Promise<{ status: string; database: string; error?: string }> {
  try {
    await pool.query('SELECT 1');
    return { status: 'OK', database: 'connected' };
  } catch (err) {
    const error = err as Error;
    return { status: 'ERROR', database: 'disconnected', error: error.message };
  }
}