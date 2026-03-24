#!/bin/bash
# =============================================================================
# init-replica.sh — Runs ONCE on replica first boot (docker-entrypoint-initdb.d)
# Seeds the replica via pg_basebackup from db-primary.
# PostgreSQL 15: the -R flag automatically creates standby.signal and writes
# primary_conninfo into postgresql.auto.conf — no manual recovery.conf needed.
# =============================================================================
set -e

PRIMARY_HOST="${DB_PRIMARY_HOST:-db-primary}"
PRIMARY_PORT="${DB_PRIMARY_PORT:-5432}"
REPLICATION_USER="${DB_REPLICATION_USER:-replicator}"

echo "[init-replica] Waiting for primary at ${PRIMARY_HOST}:${PRIMARY_PORT}..."
until pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U "$REPLICATION_USER" -d "replication"; do
  echo "[init-replica] Primary not ready yet, retrying in 2s..."
  sleep 2
done

echo "[init-replica] Primary is ready. Running pg_basebackup..."

# Clear PGDATA so pg_basebackup can populate it from scratch
rm -rf "${PGDATA:?}"/*

pg_basebackup \
  -h "$PRIMARY_HOST" \
  -p "$PRIMARY_PORT" \
  -U "$REPLICATION_USER" \
  -D "$PGDATA" \
  -Fp \
  -Xs \
  -P \
  -R

echo "[init-replica] Base backup complete. Replica will start streaming from primary."
