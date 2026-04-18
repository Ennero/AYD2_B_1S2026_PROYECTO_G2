import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { getDatabaseRuntimeConfig } from '../config/database-env';

interface SchemaState {
  tableCount: number;
  viewCount: number;
  hasPrimaryContactColumns: boolean;
  hasUserSessions: boolean;
  hasPaymentSupportField: boolean;
  hasCurrencyColumns: boolean;
  hasExchangeRatesTable: boolean;
  hasClientBalanceView: boolean;
}

async function getSchemaState(dataSource: DataSource): Promise<SchemaState> {
  const counts = await dataSource.query<{
    table_count: string;
    view_count: string;
  }>(
    `SELECT
        COUNT(*) FILTER (WHERE table_type = 'BASE TABLE')::text AS table_count,
        COUNT(*) FILTER (WHERE table_type = 'VIEW')::text AS view_count
      FROM information_schema.tables
      WHERE table_schema = 'public'`,
  );

  const columns = await dataSource.query<{
    has_primary_contact_columns: boolean;
    has_user_sessions: boolean;
    has_payment_support_field: boolean;
    has_currency_columns: boolean;
    has_exchange_rates_table: boolean;
    has_client_balance_view: boolean;
  }>(
    `SELECT
        EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clients'
            AND column_name = 'primary_contact_name'
        ) AS has_primary_contact_columns,
        EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_sessions'
            AND column_name = 'session_token'
        ) AS has_user_sessions,
        EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'payments'
            AND column_name = 'support_document_path'
        ) AS has_payment_support_field,
        EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clients'
            AND column_name = 'currency_code'
        ) AS has_currency_columns,
        EXISTS(
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'exchange_rates'
        ) AS has_exchange_rates_table,
        EXISTS(
          SELECT 1
          FROM information_schema.views
          WHERE table_schema = 'public'
            AND table_name = 'v_client_balances'
        ) AS has_client_balance_view`,
  );

  return {
    tableCount: parseInt(counts[0]?.table_count || '0', 10),
    viewCount: parseInt(counts[0]?.view_count || '0', 10),
    hasPrimaryContactColumns: Boolean(columns[0]?.has_primary_contact_columns),
    hasUserSessions: Boolean(columns[0]?.has_user_sessions),
    hasPaymentSupportField: Boolean(columns[0]?.has_payment_support_field),
    hasCurrencyColumns: Boolean(columns[0]?.has_currency_columns),
    hasExchangeRatesTable: Boolean(columns[0]?.has_exchange_rates_table),
    hasClientBalanceView: Boolean(columns[0]?.has_client_balance_view),
  };
}

function isCanonicalSchema(state: SchemaState): boolean {
  return (
    state.hasPrimaryContactColumns &&
    state.hasUserSessions &&
    state.hasPaymentSupportField &&
    state.hasCurrencyColumns &&
    state.hasExchangeRatesTable &&
    state.hasClientBalanceView
  );
}

async function resetPublicSchema(dataSource: DataSource): Promise<void> {
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
  await dataSource.query('GRANT ALL ON SCHEMA public TO public');
}

async function readCanonicalSql(): Promise<string> {
  const filePath = join(process.cwd(), '..', 'db', 'logitrans_postgresql.sql');
  return readFile(filePath, 'utf8');
}

function extractRoutine(sql: string, functionName: string): string {
  const pattern = new RegExp(
    `CREATE OR REPLACE FUNCTION ${functionName}\\([\\s\\S]*?\\$\\$;`,
    'i',
  );
  const match = sql.match(pattern);

  if (!match) {
    throw new Error(`No se pudo extraer la funcion ${functionName} del SQL canonico.`);
  }

  return match[0];
}

async function refreshCanonicalRoutines(dataSource: DataSource): Promise<void> {
  const sql = await readCanonicalSql();
  const routines = [
    'SYNC_CONTRACT_DEFAULTS',
    'VALIDATE_TRANSPORT_UNIT',
    'VALIDATE_ORDER_ASSIGNMENT',
    'VALIDATE_ORDER_COMMERCIAL_RULES',
    'POPULATE_INVOICE_FROM_ORDER',
    'AUTO_CREATE_DRAFT_INVOICE',
    'VALIDATE_PAYMENT_AMOUNT',
    'SYNC_INVOICE_PAYMENT',
  ];

  for (const name of routines) {
    try {
      const routineSql = extractRoutine(sql, name);
      await dataSource.query(routineSql);
    } catch (err) {
      console.warn(`No se pudo refrescar la rutina ${name}:`, (err as Error).message);
    }
  }
}

async function dropDeprecatedClientCommercialNameColumn(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    'ALTER TABLE public."clients" DROP COLUMN IF EXISTS "commercial_name"',
  );
}

async function dropDeprecatedClientCreditLimitColumn(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    'ALTER TABLE public."clients" DROP COLUMN IF EXISTS "credit_limit"',
  );
}

async function dropDeprecatedClientCardsTable(dataSource: DataSource): Promise<void> {
  await dataSource.query('DROP TABLE IF EXISTS public."client_cards" CASCADE');
}

async function dropDeprecatedPaymentCardIdColumn(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    'ALTER TABLE public."payments" DROP COLUMN IF EXISTS "card_id"',
  );
}

async function dropDeprecatedPaymentBankColumns(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    'ALTER TABLE public."payments" DROP COLUMN IF EXISTS "bank_name"',
  );
  await dataSource.query(
    'ALTER TABLE public."payments" DROP COLUMN IF EXISTS "bank_account_number"',
  );
  await dataSource.query(
    'ALTER TABLE public."payments" DROP COLUMN IF EXISTS "bank_reference"',
  );
  // Remove old constraint if it references bank columns
  await dataSource.query(
    'ALTER TABLE public."payments" DROP CONSTRAINT IF EXISTS "chk_payments_method_support"',
  );
}

async function ensurePaymentsMethodSupportConstraint(
  dataSource: DataSource,
): Promise<void> {
  const rows = await dataSource.query<{ exists: boolean }>(
    `SELECT EXISTS(
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'payments'
          AND c.conname = 'chk_payments_method_support'
      ) AS exists`,
  );

  if (rows[0]?.exists) {
    return;
  }

  await dataSource.query(
    `ALTER TABLE public."payments"
      ADD CONSTRAINT chk_payments_method_support CHECK (
        method IN ('TRANSFERENCIA', 'CHEQUE')
        AND support_document_path IS NOT NULL
      )`,
  );
}

async function ensureOrderRouteLogImageField(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    'ALTER TABLE public."order_route_logs" ADD COLUMN IF NOT EXISTS "image_path" TEXT',
  );
}

async function normalizeDraftInvoiceDescriptions(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    `UPDATE public."invoices"
      SET "service_description" = ''
      WHERE "status" = 'BORRADOR'
        AND "sent_at" IS NULL
        AND ("service_description" ILIKE 'SERVICIO LOGISTICO DE LA ORDEN %')`,
  );
}

async function normalizePrematurePaidInvoices(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(
    `UPDATE public."invoices"
      SET "status" = 'CERTIFICADA'
      WHERE "status" = 'PAGADA'
        AND "sent_at" IS NULL`,
  );
}

async function ensureInvoiceStatusEnEspera(dataSource: DataSource): Promise<void> {
  const rows = await dataSource.query<{ exists: boolean }>(
    `SELECT EXISTS(
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'invoice_status'
          AND e.enumlabel = 'EN_ESPERA'
      ) AS exists`,
  );
  if (rows[0]?.exists) return;
  // ALTER TYPE … ADD VALUE cannot run inside a transaction block in PostgreSQL.
  // dataSource.query() runs outside any explicit transaction here, so this is safe.
  await dataSource.query(
    `ALTER TYPE invoice_status ADD VALUE 'EN_ESPERA' BEFORE 'CERTIFICADA'`,
  );
}

type IdentityColumnRow = {
  table_name: string;
  column_name: string;
};

type IdentitySequenceRow = {
  table_name: string;
  column_name: string;
  sequence_name: string | null;
};

async function relaxIdentityColumnsToByDefault(dataSource: DataSource): Promise<void> {
  const rawRows = await dataSource.query(
    `SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND is_identity = 'YES'
        AND identity_generation = 'ALWAYS'
        AND column_name LIKE '%\_id' ESCAPE '\\'`, // eslint-disable-line no-useless-escape
  );

  if (!Array.isArray(rawRows)) {
    return;
  }

  const identityColumns = rawRows as IdentityColumnRow[];
  for (const row of identityColumns) {
    await dataSource.query(
      `ALTER TABLE public."${row.table_name}" ALTER COLUMN "${row.column_name}" SET GENERATED BY DEFAULT`,
    );
  }
}

export async function alignIdentitySequences(dataSource: DataSource): Promise<void> {
  const rawRows = await dataSource.query(
    `SELECT
        table_name,
        column_name,
        pg_get_serial_sequence(
          format('%I.%I', table_schema, table_name),
          column_name
        ) AS sequence_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND is_identity = 'YES'
        AND column_name LIKE '%\_id' ESCAPE '\\'`, // eslint-disable-line no-useless-escape
  );

  if (!Array.isArray(rawRows)) {
    return;
  }

  const identitySequences = rawRows as IdentitySequenceRow[];

  for (const row of identitySequences) {
    if (!row.sequence_name) {
      continue;
    }

    const maxIdRows = await dataSource.query<{ max_id: string | number | null }>(
      `SELECT COALESCE(MAX("${row.column_name}"), 0) AS max_id
        FROM public."${row.table_name}"`,
    );

    const maxIdRaw = maxIdRows[0]?.max_id;
    const maxId = Number(maxIdRaw ?? 0);

    if (maxId > 0) {
      await dataSource.query('SELECT setval($1::regclass, $2, true)', [
        row.sequence_name,
        maxId,
      ]);
      continue;
    }

    await dataSource.query('SELECT setval($1::regclass, 1, false)', [
      row.sequence_name,
    ]);
  }
}

export async function ensureCanonicalSchema(
  dataSource: DataSource,
): Promise<'created' | 'existing'> {
  const config = getDatabaseRuntimeConfig();
  let state = await getSchemaState(dataSource);

  if (config.resetOnBoot && (state.tableCount > 0 || state.viewCount > 0)) {
    await resetPublicSchema(dataSource);
    state = await getSchemaState(dataSource);
  }

  if (isCanonicalSchema(state)) {
    await dropDeprecatedClientCommercialNameColumn(dataSource);
    await dropDeprecatedClientCreditLimitColumn(dataSource);
    await dropDeprecatedClientCardsTable(dataSource);
    await dropDeprecatedPaymentCardIdColumn(dataSource);
    await dropDeprecatedPaymentBankColumns(dataSource);
    await ensurePaymentsMethodSupportConstraint(dataSource);
    await ensureOrderRouteLogImageField(dataSource);
    await ensureInvoiceStatusEnEspera(dataSource);
    await normalizeDraftInvoiceDescriptions(dataSource);
    await normalizePrematurePaidInvoices(dataSource);
    await relaxIdentityColumnsToByDefault(dataSource);
    await alignIdentitySequences(dataSource);
    await refreshCanonicalRoutines(dataSource);
    return 'existing';
  }

  if (state.tableCount > 0 || state.viewCount > 0) {
    throw new Error(
      'Se detecto un esquema PostgreSQL previo que no coincide con el modelo canonico. Elimine la base/volumen actual o arranque con DB_RESET_ON_BOOT=true para recrearla.',
    );
  }

  const sql = await readCanonicalSql();
  await dataSource.query(sql);
  await dropDeprecatedClientCommercialNameColumn(dataSource);
  await dropDeprecatedClientCreditLimitColumn(dataSource);
  await dropDeprecatedClientCardsTable(dataSource);
  await dropDeprecatedPaymentCardIdColumn(dataSource);
  await dropDeprecatedPaymentBankColumns(dataSource);
  await ensurePaymentsMethodSupportConstraint(dataSource);
  await ensureOrderRouteLogImageField(dataSource);
  await ensureInvoiceStatusEnEspera(dataSource);
  await normalizeDraftInvoiceDescriptions(dataSource);
  await normalizePrematurePaidInvoices(dataSource);
  await relaxIdentityColumnsToByDefault(dataSource);
  await alignIdentitySequences(dataSource);

  return 'created';
}