#!/bin/bash
set -e

echo "=== Configuring Database (Creating Tables) ==="

# Configurable port via environment variable
POSTGRES_PORT="${P_POSTGRES:-5432}"

# Wait for Postgres to be fully available
sleep 2

# SQL scripts directory
SQL_DIR="/app/db"

# Execute SQLs in order:
#   01_create_tables.sql  → core qa-track (public schema)
#   02_auth.sql           → auth schema (t_user, t_session)
#   03_device_farm.sql    → device_farm schema (nodes, devices, locks, audit)
for sql in 01_create_tables.sql 02_auth.sql 03_device_farm.sql; do
    if [ -f "$SQL_DIR/$sql" ]; then
        echo "--- Applying $sql ---"
        su - postgres -c "psql -p $POSTGRES_PORT -d qa_test_track -f $SQL_DIR/$sql"
    fi
done

echo "=== Database configured successfully ==="
