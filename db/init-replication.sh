#!/bin/bash
# =============================================================================
# init-replication.sh — Runs ONCE on primary first boot (docker-entrypoint-initdb.d)
# Creates the replication user and grants pg_hba access so the replica can connect.
# =============================================================================
set -e

REPLICATION_USER="${DB_REPLICATION_USER:-replicator}"
REPLICATION_PASSWORD="${DB_REPLICATION_PASSWORD:-replicator_pass}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${REPLICATION_USER}') THEN
      CREATE USER ${REPLICATION_USER} WITH REPLICATION ENCRYPTED PASSWORD '${REPLICATION_PASSWORD}';
    END IF;
  END
  \$\$;
EOSQL

# Allow the replication user to connect from any host inside the Docker network
echo "host replication ${REPLICATION_USER} all md5" >> "$PGDATA/pg_hba.conf"

echo "[init-replication] Replication user '${REPLICATION_USER}' created and pg_hba.conf updated."
