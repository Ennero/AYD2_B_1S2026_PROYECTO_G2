export interface DatabaseRuntimeConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  adminDatabase: string;
  logging: boolean;
  resetOnBoot: boolean;
  autoSeed: boolean;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function getDatabaseRuntimeConfig(): DatabaseRuntimeConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'logitrans_db',
    adminDatabase: process.env.DB_ADMIN_DATABASE || 'postgres',
    logging: parseBoolean(process.env.DB_LOGGING, true),
    resetOnBoot: parseBoolean(process.env.DB_RESET_ON_BOOT, false),
    autoSeed: parseBoolean(process.env.DB_AUTO_SEED, true),
  };
}