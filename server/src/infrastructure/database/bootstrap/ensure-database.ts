import { Client } from 'pg';
import { getDatabaseRuntimeConfig } from '../config/database-env';

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function ensureDatabaseExists(): Promise<void> {
  const skip = ['1', 'true', 'yes', 'on'].includes(
    (process.env.DB_SKIP_ENSURE ?? '').toLowerCase(),
  );
  if (skip) {
    return;
  }

  const config = getDatabaseRuntimeConfig();
  const sslEnabled = ['1', 'true', 'yes', 'on'].includes(
    (process.env.DB_SSL ?? '').toLowerCase(),
  );

  const adminClient = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.adminDatabase,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    await adminClient.connect();

    const result = await adminClient.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [config.database],
    );

    if (!result.rows[0]?.exists) {
      await adminClient.query(
        `CREATE DATABASE ${quoteIdentifier(config.database)}`,
      );
    }
  } catch (error) {
    // Managed Postgres (Render/Supabase) often forbids CREATE DATABASE.
    console.warn(
      `ensureDatabaseExists skipped: ${(error as Error).message}`,
    );
  } finally {
    try {
      await adminClient.end();
    } catch {
      // ignore close errors when connect failed
    }
  }
}
