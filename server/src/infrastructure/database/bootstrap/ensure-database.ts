import { Client } from 'pg';
import { getDatabaseRuntimeConfig } from '../config/database-env';

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function ensureDatabaseExists(): Promise<void> {
  const config = getDatabaseRuntimeConfig();
  const adminClient = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.adminDatabase,
  });

  await adminClient.connect();

  try {
    const result = await adminClient.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [config.database],
    );

    if (!result.rows[0]?.exists) {
      await adminClient.query(
        `CREATE DATABASE ${quoteIdentifier(config.database)}`,
      );
    }
  } finally {
    await adminClient.end();
  }
}